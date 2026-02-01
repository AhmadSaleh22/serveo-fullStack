"""
Reinforcement Learning Optimizer for EV Charging Stations

Uses PPO (Proximal Policy Optimization) to learn optimal station placement
by maximizing population coverage and minimizing wait times.
"""

import numpy as np
import gymnasium as gym
from gymnasium import spaces
from dataclasses import dataclass
from typing import Optional
import warnings
warnings.filterwarnings('ignore')

try:
    from stable_baselines3 import PPO
    from stable_baselines3.common.vec_env import DummyVecEnv
    HAS_SB3 = True
except ImportError:
    HAS_SB3 = False
    print("Warning: stable-baselines3 not installed. RL optimizer unavailable.")

from ..simulation.engine import ZoneConfig
from ..simulation.station import create_station, Station


@dataclass
class RLOptimizerConfig:
    """Configuration for RL-based optimization."""
    max_stations: int = 10
    training_timesteps: int = 40_000
    coverage_radius_km: float = 5.0
    min_station_distance_km: float = 1.0
    chargers_per_station: int = 3
    charger_type: str = "dcfc_50"
    service_rate: float = 1.33
    verbose: bool = False


class EVChargingEnv(gym.Env):
    """
    Gymnasium environment for EV charging station placement.

    The agent learns to place stations to maximize:
    - Population/demand coverage
    - Wait time reduction (via queueing theory estimates)
    - Service quality

    While minimizing:
    - Redundant station placement
    - Infrastructure costs
    """

    def __init__(
        self,
        zones: list[ZoneConfig],
        config: RLOptimizerConfig
    ):
        super().__init__()

        self.zones = zones
        self.config = config

        # Extract zone data
        self.zone_lats = np.array([z.lat for z in zones])
        self.zone_lons = np.array([z.lng for z in zones])
        self.zone_demands = np.array([z.base_arrival_rate for z in zones])
        self.total_demand = self.zone_demands.sum()

        # Geographic bounds (with padding)
        self.lat_min = min(self.zone_lats) - 0.05
        self.lat_max = max(self.zone_lats) + 0.05
        self.lon_min = min(self.zone_lons) - 0.05
        self.lon_max = max(self.zone_lons) + 0.05

        # Observation: [num_stations, coverage_pct, avg_demand_served]
        self.observation_space = spaces.Box(
            low=np.array([0, 0, 0]),
            high=np.array([config.max_stations, 100, 100]),
            dtype=np.float32
        )

        # Action: [lat, lon] for new station
        self.action_space = spaces.Box(
            low=np.array([self.lat_min, self.lon_min]),
            high=np.array([self.lat_max, self.lon_max]),
            dtype=np.float32
        )

        self.reset()

    def _haversine_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between points in km."""
        R = 6371
        lat1_rad, lat2_rad = np.radians(lat1), np.radians(lat2)
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        a = np.sin(dlat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        return R * c

    def _compute_coverage(self):
        """Compute which zones are covered by current stations."""
        if len(self.station_lats) == 0:
            return np.zeros(len(self.zones), dtype=bool)

        covered = np.zeros(len(self.zones), dtype=bool)
        for lat, lon in zip(self.station_lats, self.station_lons):
            dists = self._haversine_distance(self.zone_lats, self.zone_lons, lat, lon)
            covered = covered | (dists <= self.config.coverage_radius_km)
        return covered

    def _estimate_wait_reduction(self, new_lat, new_lon):
        """Estimate wait time reduction from adding a station."""
        # Find zones that would be served by this station
        dists = self._haversine_distance(self.zone_lats, self.zone_lons, new_lat, new_lon)
        nearby_mask = dists <= self.config.coverage_radius_km

        if not nearby_mask.any():
            return 0

        # Demand that would be served
        nearby_demand = self.zone_demands[nearby_mask].sum()

        # Estimate wait time reduction using M/M/s approximation
        # More chargers at high-demand locations = lower wait
        chargers = self.config.chargers_per_station
        service_rate = self.config.service_rate

        utilization = nearby_demand / (chargers * service_rate)
        if utilization >= 1:
            return 0  # Overloaded, no benefit

        # Simplified wait time estimate (lower is better)
        wait_factor = utilization / (1 - utilization) if utilization < 0.95 else 10
        wait_reduction = 1 / (1 + wait_factor)

        return wait_reduction * nearby_demand

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.station_lats = np.array([])
        self.station_lons = np.array([])
        return self._get_observation(), {}

    def step(self, action):
        lat, lon = action
        lat = np.clip(lat, self.lat_min, self.lat_max)
        lon = np.clip(lon, self.lon_min, self.lon_max)

        # Check if too close to existing station
        too_close = False
        if len(self.station_lats) > 0:
            dists = self._haversine_distance(self.station_lats, self.station_lons, lat, lon)
            if np.any(dists < self.config.min_station_distance_km):
                too_close = True

        if too_close:
            reward = -50  # Penalty for redundant placement
        else:
            # Add station
            self.station_lats = np.append(self.station_lats, lat)
            self.station_lons = np.append(self.station_lons, lon)

            # Calculate reward components

            # 1. Coverage reward
            coverage = self._compute_coverage()
            prev_coverage = self._compute_coverage() if len(self.station_lats) > 1 else np.zeros(len(self.zones), dtype=bool)

            # Use demand-weighted coverage
            covered_demand = self.zone_demands[coverage].sum()
            coverage_pct = covered_demand / self.total_demand
            coverage_reward = coverage_pct * 100

            # 2. Wait time reduction reward
            wait_reward = self._estimate_wait_reduction(lat, lon) * 10

            # 3. Demand proximity reward (stations should be near high-demand zones)
            dists = self._haversine_distance(self.zone_lats, self.zone_lons, lat, lon)
            nearest_zone_idx = np.argmin(dists)
            demand_proximity = self.zone_demands[nearest_zone_idx] / self.total_demand
            proximity_reward = demand_proximity * 50

            # 4. Small cost penalty
            cost_penalty = -5

            reward = coverage_reward + wait_reward + proximity_reward + cost_penalty

        obs = self._get_observation()
        done = len(self.station_lats) >= self.config.max_stations

        return obs, reward, done, False, {}

    def _get_observation(self):
        coverage = self._compute_coverage()
        covered_demand = self.zone_demands[coverage].sum() if coverage.any() else 0
        coverage_pct = (covered_demand / self.total_demand) * 100
        demand_served = (covered_demand / self.total_demand) * 100

        return np.array([
            len(self.station_lats),
            coverage_pct,
            demand_served
        ], dtype=np.float32)

    def get_placed_stations(self) -> list[tuple[float, float]]:
        """Get list of (lat, lon) for placed stations."""
        return list(zip(self.station_lats, self.station_lons))


class RLOptimizer:
    """
    Reinforcement Learning optimizer using PPO.

    Trains an agent to learn optimal station placement policies.
    """

    def __init__(
        self,
        zones: list[ZoneConfig],
        config: Optional[RLOptimizerConfig] = None
    ):
        if not HAS_SB3:
            raise ImportError("stable-baselines3 required. Install with: pip install stable-baselines3")

        self.zones = zones
        self.config = config or RLOptimizerConfig()
        self.model = None
        self.env = None

    def train(self) -> None:
        """Train the RL agent."""
        def make_env():
            return EVChargingEnv(self.zones, self.config)

        self.env = DummyVecEnv([make_env])

        self.model = PPO(
            "MlpPolicy",
            self.env,
            verbose=1 if self.config.verbose else 0,
            learning_rate=3e-4,
            n_steps=2048,
            batch_size=64,
            n_epochs=10,
        )

        self.model.learn(total_timesteps=self.config.training_timesteps)

    def optimize(self) -> list[Station]:
        """
        Run optimization and return placed stations.

        Returns:
            List of Station objects at optimal locations
        """
        if self.model is None:
            self.train()

        # Reset environment and run trained policy
        obs = self.env.reset()
        stations_coords = []

        for i in range(self.config.max_stations):
            action, _ = self.model.predict(obs, deterministic=True)
            obs, reward, done, _ = self.env.step(action)
            stations_coords.append((action[0][0], action[0][1]))

            if done[0]:
                break

        # Convert to Station objects
        stations = []
        for i, (lat, lon) in enumerate(stations_coords):
            # Find nearest zone for naming
            dists = [
                self._haversine_distance(lat, lon, z.lat, z.lng)
                for z in self.zones
            ]
            nearest_zone = self.zones[np.argmin(dists)]

            station = create_station(
                station_id=f"rl_s{i+1}",
                name=f"RL Station {i+1} ({nearest_zone.name})",
                lat=float(lat),
                lng=float(lon),
                zone_id=nearest_zone.zone_id,
                num_chargers=self.config.chargers_per_station,
                charger_type=self.config.charger_type,
                service_rate=self.config.service_rate
            )
            stations.append(station)

        return stations

    def _haversine_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between points in km."""
        R = 6371
        lat1_rad, lat2_rad = np.radians(lat1), np.radians(lat2)
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        a = np.sin(dlat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        return R * c

    def get_coverage(self) -> float:
        """Get final coverage percentage."""
        if self.env is None:
            return 0.0
        obs = self.env.envs[0]._get_observation()
        return obs[1]


if __name__ == "__main__":
    # Test the RL optimizer
    print("Testing RL Optimizer")
    print("=" * 50)

    zones = [
        ZoneConfig(zone_id="downtown", name="Downtown", base_arrival_rate=5.0, lat=51.045, lng=-114.057),
        ZoneConfig(zone_id="beltline", name="Beltline", base_arrival_rate=3.5, lat=51.038, lng=-114.070),
        ZoneConfig(zone_id="kensington", name="Kensington", base_arrival_rate=2.0, lat=51.055, lng=-114.088),
        ZoneConfig(zone_id="mission", name="Mission", base_arrival_rate=2.5, lat=51.035, lng=-114.056),
    ]

    config = RLOptimizerConfig(
        max_stations=5,
        training_timesteps=10_000,
        verbose=True
    )

    optimizer = RLOptimizer(zones, config)
    stations = optimizer.optimize()

    print(f"\nRL placed {len(stations)} stations:")
    for s in stations:
        print(f"  {s.name}: ({s.lat:.4f}, {s.lng:.4f}) - {s.num_chargers} chargers")

    print(f"\nCoverage: {optimizer.get_coverage():.1f}%")
