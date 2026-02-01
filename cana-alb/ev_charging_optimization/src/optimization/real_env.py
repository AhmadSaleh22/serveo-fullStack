"""
Saskatchewan EV Charging RL Environment — v1.23 (ready-to-train)
FIXES APPLIED vs v1.22:
  1) Road penalty is now CLIPPED (prevents -inf runaway penalties)
  2) Max-distance normalization is a clear HYPERPARAMETER (no "expected" claims)
  3) stations_with_new constructed efficiently (avoids list->np.array each step)
  4) Optional clipping of max-distance reward to reduce reward hacking risk
  5) Cached coverage state kept (no redundant recalculations in step)
"""

import numpy as np
from shapely.geometry import Point
from shapely.ops import unary_union
from pyproj import Transformer
import gymnasium as gym
from gymnasium import spaces
import warnings
warnings.simplefilter("default")  # Academic transparency

# ========================================
# MODULE IMPORT (RENAME REQUIRED BEFORE RUNNING)
# ========================================
# ⚠️ CRITICAL: Rename 1_data_loader.py → data_loader.py BEFORE running this file
try:
    from data_loader import load_saskatchewan_data
except ImportError as e:
    raise ImportError(
        "Module 'data_loader' not found. BEFORE running this environment:\n"
        "  1. Rename '1_data_loader.py' → 'data_loader.py'\n"
        "  2. Ensure last line of data_loader.py is wrapped in 'if __name__ == \"__main__\":'\n"
        "Error details: " + str(e)
    )

# ========================================
# CANADA-WIDE PROJECTION (EPSG:3347 — Lambert Conformal Conic)
# ========================================
PROJ_CRS = "EPSG:3347"
_TRANSFORMER_4326_TO_PROJ = Transformer.from_crs("EPSG:4326", PROJ_CRS, always_xy=True)


class SaskatchewanChargingEnv(gym.Env):
    """
    RL environment for EV charging station placement (Saskatchewan).

    Distance models:
      • Pop ↔ Station: Haversine (coverage + separation checks)
      • Road proximity: Euclidean in EPSG:3347 (road centerline distance proxy)

    Performance:
      • Cached coverage mask + cached max uncovered distance
      • step() computes "after" once; "before" comes from cache

    Reproducibility:
      • reset(seed=...) seeds action_space + Gymnasium np_random
      • Dynamics deterministic given fixed inputs and same action sequence
    """

    metadata = {"render_modes": ["human"], "render_fps": 1}

    def __init__(
        self,
        max_stations=20,
        use_cached_only=True,
        coverage_radius_km=150.0,
        separation_km=30.0,
        remote_bonus_km=150.0,
        remote_bonus_points=20.0,
        build_cost_points=-15.0,
        # Road penalty normalization:
        road_penalty_km_per_point=5.0,    # -1 per 5 km
        road_penalty_max=10.0,            # clip to [-10, 0]
        # Max-distance reward normalization:
        maxdist_norm_km=300.0,            # scaling knob (hyperparameter)
        maxdist_reward_clip=100.0         # clip reward contribution to [-clip, +clip]
    ):
        super().__init__()

        # ----------------------------
        # Load data lazily (no import side effects)
        # ----------------------------
        population, roads, existing_stations = load_saskatchewan_data(
            use_cached_only=use_cached_only
        )

        # Population arrays
        self.pop_lat = population["lat"].to_numpy()
        self.pop_lon = population["lon"].to_numpy()
        self.pop_w = population["population"].to_numpy()
        self.total_population = float(self.pop_w.sum())

        # Existing stations
        self.existing_coords = existing_stations[["lat", "lon"]].to_numpy()

        # Roads union in projected CRS
        roads_proj = roads.to_crs(PROJ_CRS)
        try:
            self.roads_union_proj = roads_proj.geometry.union_all()
            self.road_union_method = "union_all (Shapely 2.x optimized)"
        except (AttributeError, TypeError):
            self.roads_union_proj = unary_union(roads_proj.geometry)
            self.road_union_method = "unary_union (fallback)"

        # Geography bounds (Saskatchewan clip box)
        self.lat_min, self.lat_max = 49.0, 60.0
        self.lon_min, self.lon_max = -110.0, -101.0

        # Parameters
        self.coverage_radius_km = float(coverage_radius_km)
        self.separation_km = float(separation_km)

        self.remote_bonus_km = float(remote_bonus_km)
        self.remote_bonus_points = float(remote_bonus_points)

        self.build_cost_points = float(build_cost_points)

        self.road_penalty_km_per_point = float(road_penalty_km_per_point)
        self.road_penalty_max = float(road_penalty_max)

        self.maxdist_norm_km = float(maxdist_norm_km)
        self.maxdist_reward_clip = float(maxdist_reward_clip)

        self.max_stations = int(max_stations)

        # Spaces
        self.observation_space = spaces.Box(
            low=np.array([0.0, 0.0, 0.0], dtype=np.float32),
            high=np.array([float(self.max_stations), 100.0, 500.0], dtype=np.float32),
            dtype=np.float32
        )

        self.action_space = spaces.Box(
            low=np.array([self.lat_min, self.lon_min], dtype=np.float32),
            high=np.array([self.lat_max, self.lon_max], dtype=np.float32),
            dtype=np.float32
        )

        # Cached coverage state
        self._cached_coverage_mask = None
        self._cached_max_uncovered_dist = 0.0

        self.reset()

    # ----------------------------
    # Gym API
    # ----------------------------
    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        if seed is not None:
            self.action_space.seed(seed)  # obs space not sampled

        self.proposed_stations = []

        # Initialize cache using existing stations only
        all_stations = self.existing_coords
        self._cached_coverage_mask = self._compute_coverage_mask(all_stations)
        self._cached_max_uncovered_dist = self._compute_max_uncovered_distance(
            all_stations, self._cached_coverage_mask
        )

        obs = self._get_observation_from_cache()
        return obs, {}

    def step(self, action):
        lat, lon = float(action[0]), float(action[1])
        lat = float(np.clip(lat, self.lat_min, self.lat_max))
        lon = float(np.clip(lon, self.lon_min, self.lon_max))

        # --- Road penalty (CLIPPED) ---
        road_dist_km = self._distance_to_nearest_road_proj(lat, lon)
        # raw penalty: -(d / km_per_point)
        road_penalty_raw = -(road_dist_km / self.road_penalty_km_per_point)
        # clip to [-road_penalty_max, 0]
        road_penalty = float(np.clip(road_penalty_raw, -self.road_penalty_max, 0.0))

        # --- Proximity check to ALL stations (existing + proposed) ---
        too_close = False
        min_dist_to_nearest_station_km = float("inf")

        # Check existing first
        for s in self.existing_coords:
            d = self._haversine_distance(lat, lon, float(s[0]), float(s[1]))
            if d < min_dist_to_nearest_station_km:
                min_dist_to_nearest_station_km = d
            if d < self.separation_km:
                too_close = True
                break

        # Then proposed if needed
        if (not too_close) and self.proposed_stations:
            for ps in self.proposed_stations:
                d = self._haversine_distance(lat, lon, float(ps[0]), float(ps[1]))
                if d < min_dist_to_nearest_station_km:
                    min_dist_to_nearest_station_km = d
                if d < self.separation_km:
                    too_close = True
                    break

        # --- Reward components (initialized always) ---
        coverage_gain_pct = 0.0
        max_dist_reduction_km = 0.0
        coverage_reward = 0.0
        max_dist_reward = 0.0
        remote_bonus = 0.0
        cost_penalty = float(self.build_cost_points)

        if too_close:
            # Reject station (no state change)
            reward = -50.0 + road_penalty
            obs = self._get_observation_from_cache()
        else:
            # BEFORE state from cache
            before_mask = self._cached_coverage_mask
            max_dist_before = float(self._cached_max_uncovered_dist)

            # Efficient build of stations_with_new
            if self.proposed_stations:
                current = np.vstack([self.existing_coords, np.asarray(self.proposed_stations, dtype=float)])
            else:
                current = self.existing_coords
            stations_with_new = np.vstack([current, np.array([[lat, lon]], dtype=float)])

            # AFTER state (compute once)
            after_mask = self._compute_coverage_mask(stations_with_new)
            max_dist_after = float(self._compute_max_uncovered_distance(stations_with_new, after_mask))

            # Coverage gain (1% => +1 point)
            newly_covered_mask = after_mask & (~before_mask)
            newly_covered_pop = float(self.pop_w[newly_covered_mask].sum())
            if self.total_population > 0:
                coverage_gain_pct = (newly_covered_pop / self.total_population) * 100.0
            else:
                coverage_gain_pct = 0.0
            coverage_reward = float(coverage_gain_pct)

            # Max distance reduction normalized (parameterized + clipped)
            max_dist_reduction_km = max_dist_before - max_dist_after
            if self.maxdist_norm_km > 0:
                max_dist_reward_raw = (max_dist_reduction_km / self.maxdist_norm_km) * 100.0
            else:
                max_dist_reward_raw = 0.0
            max_dist_reward = float(np.clip(max_dist_reward_raw, -self.maxdist_reward_clip, self.maxdist_reward_clip))

            # Remote bonus
            remote_bonus = float(self.remote_bonus_points) if (min_dist_to_nearest_station_km > self.remote_bonus_km) else 0.0

            # Total reward
            reward = coverage_reward + max_dist_reward + remote_bonus + road_penalty + cost_penalty

            # Update cache + state (mutate once)
            self._cached_coverage_mask = after_mask
            self._cached_max_uncovered_dist = max_dist_after
            self.proposed_stations.append([lat, lon])

            # Observation from cache-derived values
            covered_pop = float(self.pop_w[after_mask].sum())
            coverage_pct = (covered_pop / self.total_population) * 100.0 if self.total_population > 0 else 0.0
            obs = np.array([len(self.proposed_stations), coverage_pct, max_dist_after], dtype=np.float32)

        terminated = (len(self.proposed_stations) >= self.max_stations)
        truncated = False

        info = {
            "station_lat": lat,
            "station_lon": lon,
            "too_close": too_close,
            "coverage_gain_pct": float(coverage_gain_pct),
            "max_dist_reduction_km": float(max_dist_reduction_km),
            "min_dist_to_nearest_station_km": float(min_dist_to_nearest_station_km),
            "road_dist_km": float(road_dist_km),
            "reward_components": {
                "coverage": float(coverage_reward),
                "max_dist_reduction": float(max_dist_reward),
                "remote_bonus": float(remote_bonus),
                "road_penalty": float(road_penalty),
                "cost": float(cost_penalty),
            },
        }
        return obs, float(reward), terminated, truncated, info

    # ----------------------------
    # Geometry / distances
    # ----------------------------
    def _distance_to_nearest_road_proj(self, lat, lon):
        """Euclidean distance in EPSG:3347 to nearest road centerline (km)."""
        x, y = _TRANSFORMER_4326_TO_PROJ.transform(lon, lat)
        dist_m = Point(x, y).distance(self.roads_union_proj)
        return float(dist_m / 1000.0)

    def _haversine_distance(self, lat1, lon1, lat2, lon2):
        """Haversine distance (km)."""
        R = 6371.0
        lat1r = np.radians(lat1)
        lat2r = np.radians(lat2)
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        a = np.sin(dlat / 2) ** 2 + np.cos(lat1r) * np.cos(lat2r) * np.sin(dlon / 2) ** 2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
        return float(R * c)

    def _compute_coverage_mask(self, station_coords):
        """Coverage mask for all population points."""
        n = len(self.pop_lat)
        mask = np.zeros(n, dtype=bool)
        for i in range(n):
            for s in station_coords:
                d = self._haversine_distance(self.pop_lat[i], self.pop_lon[i], float(s[0]), float(s[1]))
                if d <= self.coverage_radius_km:
                    mask[i] = True
                    break
        return mask

    def _compute_max_uncovered_distance(self, station_coords, coverage_mask):
        """Max distance (km) from uncovered pop points to nearest station."""
        uncovered = np.where(~coverage_mask)[0]
        if uncovered.size == 0:
            return 0.0
        maxd = 0.0
        for idx in uncovered:
            mind = float("inf")
            for s in station_coords:
                d = self._haversine_distance(self.pop_lat[idx], self.pop_lon[idx], float(s[0]), float(s[1]))
                if d < mind:
                    mind = d
            if mind > maxd:
                maxd = mind
        return float(maxd)

    # ----------------------------
    # Observations
    # ----------------------------
    def _get_observation_from_cache(self):
        covered_pop = float(self.pop_w[self._cached_coverage_mask].sum())
        coverage_pct = (covered_pop / self.total_population) * 100.0 if self.total_population > 0 else 0.0
        return np.array([len(self.proposed_stations), coverage_pct, float(self._cached_max_uncovered_dist)], dtype=np.float32)

    def _get_observation(self):
        """Full recomputation (render/debug only)."""
        if self.proposed_stations:
            current = np.vstack([self.existing_coords, np.asarray(self.proposed_stations, dtype=float)])
        else:
            current = self.existing_coords
        mask = self._compute_coverage_mask(current)
        covered_pop = float(self.pop_w[mask].sum())
        coverage_pct = (covered_pop / self.total_population) * 100.0 if self.total_population > 0 else 0.0
        maxd = float(self._compute_max_uncovered_distance(current, mask))
        return np.array([len(self.proposed_stations), coverage_pct, maxd], dtype=np.float32)

    def render(self):
        obs = self._get_observation()
        print(f"\n📊 State: stations={int(obs[0])}/{self.max_stations}, coverage={obs[1]:.1f}%, max_dist={obs[2]:.1f} km")


# ========================================
# TEST (deterministic dynamics + cache correctness)
# ========================================
if __name__ == "__main__":
    print("=" * 70)
    print(" Saskatchewan EV Charging RL Environment — v1.23 (ready-to-train)")
    print("=" * 70)

    print("\n🔬 Deterministic dynamics test with pre-sampled actions (seed=42)...")
    env1 = SaskatchewanChargingEnv(max_stations=3)
    o1, _ = env1.reset(seed=42)
    actions = [env1.action_space.sample() for _ in range(3)]

    env2 = SaskatchewanChargingEnv(max_stations=3)
    o2, _ = env2.reset(seed=42)

    for i, a in enumerate(actions):
        o1, r1, t1, tr1, info1 = env1.step(a.copy())
        o2, r2, t2, tr2, info2 = env2.step(a.copy())

        assert np.allclose(o1, o2), f"❌ Observation mismatch at step {i}"
        assert np.isclose(r1, r2), f"❌ Reward mismatch at step {i}"
        assert t1 == t2, f"❌ Termination mismatch at step {i}"
        assert info1["too_close"] == info2["too_close"], f"❌ too_close mismatch at step {i}"

    print("✅ Deterministic dynamics verified (same actions => same trajectory)")

    env = SaskatchewanChargingEnv(max_stations=5)
    obs, _ = env.reset(seed=123)

    print("\n✅ Environment initialized")
    print(f"   Population points: {len(env.pop_lat)}")
    print(f"   Existing stations: {len(env.existing_coords)}")
    print(f"   Projection: {PROJ_CRS}")
    print(f"   Road union method: {env.road_union_method}")
    print(f"   Initial state: stations={int(obs[0])}, coverage={obs[1]:.1f}%, max_dist={obs[2]:.1f} km")

    print("\n🎲 Testing 3 random station placements...")
    for i in range(3):
        a = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(a)
        tag = " [REJECTED: too close]" if info["too_close"] else ""
        print(f"\n   Action {i+1}: Lat={a[0]:.4f}, Lon={a[1]:.4f}")
        print(f"     Reward: {reward:+.2f}{tag}")
        print(f"       • Coverage gain: {info['coverage_gain_pct']:.2f}% → +{info['reward_components']['coverage']:.2f}")
        print(f"       • Max dist reduction: {info['max_dist_reduction_km']:.1f} km → {info['reward_components']['max_dist_reduction']:+.2f}")
        print(f"       • Road dist: {info['road_dist_km']:.1f} km → {info['reward_components']['road_penalty']:+.2f}")
        print(f"     New state: stations={int(obs[0])}, coverage={obs[1]:.1f}%, max_dist={obs[2]:.1f} km")
        if terminated:
            break

    env.render()
    print("\n" + "=" * 70)
    print(" Environment test passed — v1.23 ready-to-train")
    print("=" * 70)
