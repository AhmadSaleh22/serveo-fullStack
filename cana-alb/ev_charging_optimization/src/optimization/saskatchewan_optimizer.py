"""
Saskatchewan EV Charging Station Optimizer

Integrates the Saskatchewan-specific RL environment with the main simulation
framework. Uses PPO to optimize station placement for northern remote areas.
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
from ..simulation.station import Station, create_station
from ..data.saskatchewan import (
    SaskatchewanData,
    load_saskatchewan_data,
    haversine_distance,
)


@dataclass
class SaskatchewanOptimizerConfig:
    """Configuration for Saskatchewan RL optimization."""
    max_new_stations: int = 10
    training_timesteps: int = 100_000  # More training for better convergence
    coverage_radius_km: float = 150.0
    min_station_distance_km: float = 50.0
    chargers_per_station: int = 4
    charger_type: str = "dcfc_50"
    service_rate: float = 1.33
    verbose: bool = False
    exploration_fraction: float = 0.2  # More exploration


class SaskatchewanChargingEnv(gym.Env):
    """
    Saskatchewan-specific EV Charging Environment.
    
    Designed to optimize station placement for remote northern areas
    while considering existing infrastructure and population distribution.
    
    The agent learns to maximize:
    - Coverage of underserved populations
    - Reduction of maximum distance to nearest station
    - Service to remote areas (>150km from existing stations)
    
    While minimizing:
    - Redundant station placement
    - Infrastructure costs in remote areas
    """

    def __init__(
        self,
        data: SaskatchewanData,
        config: SaskatchewanOptimizerConfig
    ):
        super().__init__()
        
        self.data = data
        self.config = config
        
        # Extract population data
        self.pop_lats = np.array([p.lat for p in data.population_centers])
        self.pop_lons = np.array([p.lon for p in data.population_centers])
        self.pop_sizes = np.array([p.population for p in data.population_centers])
        self.total_population = self.pop_sizes.sum()
        
        # Extract existing station data
        self.existing_lats = np.array([s.lat for s in data.existing_stations])
        self.existing_lons = np.array([s.lon for s in data.existing_stations])
        
        # Geographic bounds (Saskatchewan)
        self.lat_min, self.lat_max = 49.0, 60.0
        self.lon_min, self.lon_max = -110.0, -101.0
        
        # Observation: [num_stations, coverage_pct, max_distance]
        self.observation_space = spaces.Box(
            low=np.array([0, 0, 0]),
            high=np.array([config.max_new_stations, 100, 500]),
            dtype=np.float32
        )
        
        # Action: [lat, lon] for new station
        self.action_space = spaces.Box(
            low=np.array([self.lat_min, self.lon_min]),
            high=np.array([self.lat_max, self.lon_max]),
            dtype=np.float32
        )
        
        # Compute existing coverage
        self.existing_coverage = self._compute_coverage(
            self.existing_lats, self.existing_lons
        )
        
        self.reset()

    def _haversine_distance(
        self,
        lat1: np.ndarray,
        lon1: np.ndarray,
        lat2: float,
        lon2: float
    ) -> np.ndarray:
        """Calculate distances from arrays of points to a single point."""
        R = 6371
        lat1_rad = np.radians(lat1)
        lat2_rad = np.radians(lat2)
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        a = np.sin(dlat/2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        return R * c

    def _compute_coverage(
        self,
        station_lats: np.ndarray,
        station_lons: np.ndarray
    ) -> np.ndarray:
        """Compute which population centers are covered by stations."""
        if len(station_lats) == 0:
            return np.zeros(len(self.pop_lats), dtype=bool)
        
        covered = np.zeros(len(self.pop_lats), dtype=bool)
        for lat, lon in zip(station_lats, station_lons):
            dists = self._haversine_distance(self.pop_lats, self.pop_lons, lat, lon)
            covered = covered | (dists <= self.config.coverage_radius_km)
        return covered

    def _get_max_distance_to_station(self) -> float:
        """Get maximum distance from any uncovered population to nearest station."""
        all_lats = np.concatenate([self.existing_lats, self.new_lats])
        all_lons = np.concatenate([self.existing_lons, self.new_lons])
        
        if len(all_lats) == 0:
            return 500.0
        
        max_dist = 0
        for i in range(len(self.pop_lats)):
            min_dist = float('inf')
            for lat, lon in zip(all_lats, all_lons):
                dist = haversine_distance(
                    self.pop_lats[i], self.pop_lons[i], lat, lon
                )
                min_dist = min(min_dist, dist)
            max_dist = max(max_dist, min_dist)
        return max_dist

    def _min_distance_to_existing(self, lat: float, lon: float) -> float:
        """Get minimum distance from a point to any existing station."""
        if len(self.existing_lats) == 0:
            return 500.0
        
        min_dist = float('inf')
        for ex_lat, ex_lon in zip(self.existing_lats, self.existing_lons):
            dist = haversine_distance(lat, lon, ex_lat, ex_lon)
            min_dist = min(min_dist, dist)
        return min_dist

    def _is_near_highway(self, lat: float, lon: float) -> bool:
        """Check if location is near major highway corridor."""
        # Major highways in Saskatchewan run between -104 and -107 longitude
        # This is a simplified check
        return -107 <= lon <= -104

    def reset(self, seed: Optional[int] = None, options: Optional[dict] = None):
        super().reset(seed=seed)
        self.new_lats = np.array([])
        self.new_lons = np.array([])
        return self._get_observation(), {}

    def step(self, action):
        lat, lon = action
        lat = np.clip(lat, self.lat_min, self.lat_max)
        lon = np.clip(lon, self.lon_min, self.lon_max)
        
        # Check for too-close placement
        too_close = False
        
        # Check against new stations
        if len(self.new_lats) > 0:
            dists = self._haversine_distance(self.new_lats, self.new_lons, lat, lon)
            if np.any(dists < self.config.min_station_distance_km):
                too_close = True
        
        # Check against existing stations
        dists_existing = self._haversine_distance(
            self.existing_lats, self.existing_lons, lat, lon
        )
        if np.any(dists_existing < self.config.min_station_distance_km):
            too_close = True
        
        if too_close:
            reward = -50  # Penalty for redundant placement
        else:
            # Add station
            self.new_lats = np.append(self.new_lats, lat)
            self.new_lons = np.append(self.new_lons, lon)
            
            # --- Calculate Reward ---
            
            # 1. Population coverage reward
            new_coverage = self._compute_coverage(self.new_lats, self.new_lons)
            total_coverage = self.existing_coverage | new_coverage
            
            # Calculate newly covered population
            if len(self.new_lats) > 1:
                prev_coverage = self._compute_coverage(
                    self.new_lats[:-1], self.new_lons[:-1]
                )
            else:
                prev_coverage = np.zeros(len(self.pop_lats), dtype=bool)
            
            newly_covered_mask = total_coverage & ~self.existing_coverage & ~prev_coverage
            newly_covered = self.pop_sizes[newly_covered_mask].sum() if newly_covered_mask.any() else 0
            population_reward = (newly_covered / self.total_population) * 1000
            
            # 2. Maximum distance reduction reward
            max_dist_before = self._get_max_distance_before_latest()
            max_dist_after = self._get_max_distance_to_station()
            max_dist_reduction = max_dist_before - max_dist_after
            distance_reward = max_dist_reduction * 2
            
            # 3. Remote area bonus (reward for serving underserved areas)
            min_dist_to_existing = self._min_distance_to_existing(lat, lon)
            remote_bonus = 20 if min_dist_to_existing > 150 else 0
            
            # 4. Infrastructure cost (penalty for remote locations)
            if self._is_near_highway(lat, lon):
                cost_penalty = -10
            else:
                # Higher cost for off-highway locations
                cost_penalty = -25
            
            reward = population_reward + distance_reward + remote_bonus + cost_penalty + 0.5
        
        obs = self._get_observation()
        done = len(self.new_lats) >= self.config.max_new_stations
        
        return obs, reward, done, False, {}

    def _get_max_distance_before_latest(self) -> float:
        """Get max distance before the latest station was added."""
        if len(self.new_lats) <= 1:
            # Only existing stations
            if len(self.existing_lats) == 0:
                return 500.0
            return self._compute_max_distance(self.existing_lats, self.existing_lons)
        else:
            all_lats = np.concatenate([self.existing_lats, self.new_lats[:-1]])
            all_lons = np.concatenate([self.existing_lons, self.new_lons[:-1]])
            return self._compute_max_distance(all_lats, all_lons)

    def _compute_max_distance(self, lats: np.ndarray, lons: np.ndarray) -> float:
        """Compute maximum distance from any population to nearest station."""
        max_dist = 0
        for i in range(len(self.pop_lats)):
            min_dist = float('inf')
            for lat, lon in zip(lats, lons):
                dist = haversine_distance(self.pop_lats[i], self.pop_lons[i], lat, lon)
                min_dist = min(min_dist, dist)
            max_dist = max(max_dist, min_dist)
        return max_dist

    def _get_observation(self) -> np.ndarray:
        if len(self.new_lats) > 0:
            new_coverage = self._compute_coverage(self.new_lats, self.new_lons)
            total_coverage = self.existing_coverage | new_coverage
            covered_pop = self.pop_sizes[total_coverage].sum()
        else:
            covered_pop = self.pop_sizes[self.existing_coverage].sum()
        
        coverage_pct = (covered_pop / self.total_population) * 100
        max_distance = self._get_max_distance_to_station()
        
        return np.array([
            len(self.new_lats),
            coverage_pct,
            max_distance
        ], dtype=np.float32)

    def get_placed_stations(self) -> list[tuple[float, float]]:
        """Get list of (lat, lon) for newly placed stations."""
        return list(zip(self.new_lats, self.new_lons))


class SaskatchewanOptimizer:
    """
    Saskatchewan-specific RL Optimizer.
    
    Uses PPO to learn optimal station placement policy that:
    - Maximizes coverage of remote northern communities
    - Reduces maximum travel distance to charging
    - Balances infrastructure costs
    """

    def __init__(
        self,
        data: Optional[SaskatchewanData] = None,
        config: Optional[SaskatchewanOptimizerConfig] = None
    ):
        if not HAS_SB3:
            raise ImportError(
                "stable-baselines3 required. Install with: pip install stable-baselines3"
            )
        
        self.data = data or load_saskatchewan_data()
        self.config = config or SaskatchewanOptimizerConfig()
        self.model = None
        self.env = None
        self.trained = False

    def train(self) -> None:
        """Train the RL agent."""
        def make_env():
            return SaskatchewanChargingEnv(self.data, self.config)
        
        self.env = DummyVecEnv([make_env])
        
        self.model = PPO(
            "MlpPolicy",
            self.env,
            verbose=1 if self.config.verbose else 0,
            learning_rate=1e-3,  # Higher learning rate
            n_steps=1024,
            batch_size=128,
            n_epochs=10,
            ent_coef=0.1,  # Encourage exploration
            clip_range=0.3,
        )
        
        self.model.learn(total_timesteps=self.config.training_timesteps)
        self.trained = True

    def optimize(self) -> list[Station]:
        """
        Run optimization and return new stations.
        
        Returns:
            List of Station objects for optimal new locations
        """
        if not self.trained:
            self.train()
        
        # Reset environment and run trained policy
        obs = self.env.reset()
        station_coords = []
        
        for i in range(self.config.max_new_stations):
            # Use stochastic actions for diversity
            action, _ = self.model.predict(obs, deterministic=False)
            
            # Add small noise for exploration
            noise = np.random.normal(0, 0.5, size=action.shape)
            action = action + noise
            
            obs, reward, done, _ = self.env.step(action)
            station_coords.append((action[0][0], action[0][1]))
            
            if done[0]:
                break
        
        # Convert to Station objects
        stations = []
        for i, (lat, lon) in enumerate(station_coords):
            # Find nearest population center for naming
            min_dist = float('inf')
            nearest_city = "Remote"
            for pop in self.data.population_centers:
                dist = haversine_distance(lat, lon, pop.lat, pop.lon)
                if dist < min_dist:
                    min_dist = dist
                    nearest_city = pop.city
            
            station = create_station(
                station_id=f"rl_sask_{i+1}",
                name=f"RL Station {i+1} (near {nearest_city})",
                lat=float(lat),
                lng=float(lon),
                zone_id=f"rl_zone_{i+1}",
                num_chargers=self.config.chargers_per_station,
                charger_type=self.config.charger_type,
                service_rate=self.config.service_rate
            )
            stations.append(station)
        
        return stations

    def get_coverage_stats(self) -> dict:
        """Get coverage statistics after optimization."""
        if self.env is None:
            return {"error": "Not trained yet"}
        
        obs = self.env.envs[0]._get_observation()
        
        # Get remote areas analysis
        remote_areas = self.data.get_remote_areas(self.config.coverage_radius_km)
        
        return {
            "stations_placed": int(obs[0]),
            "coverage_percent": float(obs[1]),
            "max_distance_km": float(obs[2]),
            "remote_areas_before": len(remote_areas),
            "total_population": self.data.total_population,
        }


if __name__ == "__main__":
    print("Saskatchewan EV Charging Optimizer")
    print("=" * 50)
    
    # Load data
    data = load_saskatchewan_data()
    print(f"\nLoaded: {len(data.population_centers)} population centers")
    print(f"Existing stations: {len(data.existing_stations)}")
    
    # Configure optimizer
    config = SaskatchewanOptimizerConfig(
        max_new_stations=10,
        training_timesteps=20_000,  # Faster for testing
        verbose=True
    )
    
    # Run optimization
    optimizer = SaskatchewanOptimizer(data, config)
    print("\nTraining RL agent...")
    stations = optimizer.optimize()
    
    print(f"\nOptimized {len(stations)} new station locations:")
    for s in stations:
        print(f"  {s.name}: ({s.lat:.4f}, {s.lng:.4f})")
    
    stats = optimizer.get_coverage_stats()
    print(f"\nCoverage: {stats['coverage_percent']:.1f}%")
    print(f"Max distance to station: {stats['max_distance_km']:.0f} km")
