"""
Station Placement Optimizer

Implements a hybrid greedy + local search optimization algorithm
to find optimal EV charging station placements.
"""

import math
import random
import copy
from dataclasses import dataclass, field
from typing import Optional

from ..models.queueing import ErlangC, ChargerTypes
from ..simulation.station import Station, create_station
from ..simulation.engine import SimulationEngine, SimulationConfig, ZoneConfig


@dataclass
class CandidateLocation:
    """A potential location for a charging station."""
    location_id: str
    name: str
    lat: float
    lng: float
    zone_id: str
    fixed_cost: float = 50000  # Base installation cost
    charger_cost: float = 30000  # Cost per charger
    max_chargers: int = 10
    power_available: bool = True  # Whether power infrastructure exists


@dataclass
class OptimizationConfig:
    """Configuration for the optimizer."""
    budget: float = 2_000_000
    min_chargers_per_station: int = 2
    max_chargers_per_station: int = 8
    default_charger_type: str = "dcfc_50"
    default_service_rate: float = 1.33

    # Coverage constraints
    coverage_radius_km: float = 5.0
    min_coverage_percent: float = 0.90

    # Utilization targets
    max_utilization: float = 0.85
    target_utilization: float = 0.65

    # Local search parameters
    max_iterations: int = 100
    no_improvement_limit: int = 20

    # Simulation for evaluation
    simulation_duration_hours: float = 72  # 3 days for quick evaluation
    simulation_warmup_hours: float = 12
    random_seed: int = 42


@dataclass
class PlacedStation:
    """A station in the solution."""
    location: CandidateLocation
    num_chargers: int
    charger_type: str
    service_rate: float
    estimated_demand: float  # EVs per hour
    estimated_utilization: float
    estimated_wait_minutes: float


@dataclass
class OptimizationResult:
    """Result of the optimization process."""
    stations: list[PlacedStation]
    total_cost: float
    total_chargers: int
    coverage_percent: float
    estimated_avg_wait: float
    estimated_max_wait: float
    iterations: int
    improvement_percent: float  # vs baseline


class Optimizer:
    """
    Station placement optimizer using greedy construction + local search.

    Algorithm:
    1. Greedy Construction: Select high-demand locations ensuring coverage
    2. Local Search: Iteratively improve by swapping/resizing
    3. Simulation Validation: Evaluate solutions via simulation

    Example:
        optimizer = Optimizer(candidates, zones)
        result = optimizer.optimize()
    """

    def __init__(
        self,
        candidate_locations: list[CandidateLocation],
        zones: list[ZoneConfig],
        config: Optional[OptimizationConfig] = None
    ):
        self.candidates = {c.location_id: c for c in candidate_locations}
        self.zones = {z.zone_id: z for z in zones}
        self.config = config or OptimizationConfig()

        self.erlang = ErlangC()
        random.seed(self.config.random_seed)

        # Precompute zone demands
        self._zone_demands = self._calculate_zone_demands()

    def _calculate_zone_demands(self) -> dict[str, float]:
        """Calculate average demand for each zone."""
        demands = {}
        for zone_id, zone in self.zones.items():
            # Average across all hours
            avg_rate = sum(zone.get_arrival_rate(h) for h in range(24)) / 24
            demands[zone_id] = avg_rate
        return demands

    def _haversine_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points in km."""
        R = 6371
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    def _calculate_coverage(self, placed: list[PlacedStation]) -> float:
        """Calculate fraction of zones covered by placed stations."""
        if not self.zones:
            return 1.0

        covered = 0
        for zone in self.zones.values():
            for ps in placed:
                dist = self._haversine_distance(
                    zone.lat, zone.lng,
                    ps.location.lat, ps.location.lng
                )
                if dist <= self.config.coverage_radius_km:
                    covered += 1
                    break

        return covered / len(self.zones)

    def _calculate_total_cost(self, placed: list[PlacedStation]) -> float:
        """Calculate total cost of placed stations."""
        total = 0
        for ps in placed:
            total += ps.location.fixed_cost + ps.num_chargers * ps.location.charger_cost
        return total

    def _estimate_station_demand(self, location: CandidateLocation) -> float:
        """Estimate demand for a station based on nearby zones."""
        total_demand = 0
        total_weight = 0

        for zone in self.zones.values():
            dist = self._haversine_distance(
                zone.lat, zone.lng,
                location.lat, location.lng
            )

            if dist <= self.config.coverage_radius_km:
                # Weight by inverse distance
                weight = 1 / (1 + dist)
                total_demand += self._zone_demands[zone.zone_id] * weight
                total_weight += weight

        if total_weight == 0:
            return 0

        return total_demand

    def _estimate_metrics(
        self,
        num_chargers: int,
        demand: float,
        service_rate: float
    ) -> tuple[float, float]:
        """Estimate utilization and wait time using queueing theory."""
        if num_chargers == 0 or demand == 0:
            return 0.0, 0.0

        metrics = self.erlang.calculate(
            arrival_rate=demand,
            service_rate=service_rate,
            num_servers=num_chargers
        )

        if not metrics.is_stable:
            return 1.0, float('inf')

        return metrics.utilization, metrics.avg_wait_minutes

    def _create_placed_station(
        self,
        location: CandidateLocation,
        num_chargers: int
    ) -> PlacedStation:
        """Create a PlacedStation with estimated metrics."""
        demand = self._estimate_station_demand(location)
        service_rate = self.config.default_service_rate
        utilization, wait = self._estimate_metrics(num_chargers, demand, service_rate)

        return PlacedStation(
            location=location,
            num_chargers=num_chargers,
            charger_type=self.config.default_charger_type,
            service_rate=service_rate,
            estimated_demand=demand,
            estimated_utilization=utilization,
            estimated_wait_minutes=wait
        )

    def _greedy_construction(self) -> list[PlacedStation]:
        """
        Phase 1: Greedy construction of initial solution.

        Strategy:
        1. Ensure coverage by placing stations at strategic locations
        2. Add stations at high-demand locations until capacity meets demand
        3. Add chargers based on marginal wait time benefit
        """
        placed: list[PlacedStation] = []
        used_locations: set[str] = set()
        remaining_budget = self.config.budget

        # Calculate total system demand
        total_demand = sum(self._zone_demands.values())
        required_capacity = total_demand / self.config.default_service_rate * 1.3  # 30% buffer

        # Rank candidates by demand
        ranked = sorted(
            self.candidates.values(),
            key=lambda c: self._estimate_station_demand(c),
            reverse=True
        )

        # Phase 1a: Place stations for coverage AND capacity
        uncovered_zones = set(self.zones.keys())

        for candidate in ranked:
            if candidate.location_id in used_locations:
                continue

            # Check if this location covers any uncovered zone
            covers_new = False
            for zone in self.zones.values():
                if zone.zone_id not in uncovered_zones:
                    continue
                dist = self._haversine_distance(
                    zone.lat, zone.lng,
                    candidate.lat, candidate.lng
                )
                if dist <= self.config.coverage_radius_km:
                    uncovered_zones.discard(zone.zone_id)
                    covers_new = True

            # Skip if doesn't cover new zones AND we have coverage AND enough capacity
            current_capacity = sum(ps.num_chargers for ps in placed)
            coverage_met = self._calculate_coverage(placed) >= self.config.min_coverage_percent
            capacity_met = current_capacity >= required_capacity

            if not covers_new and coverage_met and capacity_met:
                continue

            # Check budget
            cost = candidate.fixed_cost + self.config.min_chargers_per_station * candidate.charger_cost
            if cost > remaining_budget:
                continue

            # Add station with minimum chargers
            ps = self._create_placed_station(candidate, self.config.min_chargers_per_station)
            placed.append(ps)
            used_locations.add(candidate.location_id)
            remaining_budget -= cost

            # Check if both coverage AND capacity targets met
            current_capacity = sum(ps.num_chargers for ps in placed)
            if (self._calculate_coverage(placed) >= self.config.min_coverage_percent and
                current_capacity >= required_capacity):
                break

        # Phase 1b: Keep adding high-demand stations if budget allows
        for candidate in ranked:
            if candidate.location_id in used_locations:
                continue

            demand = self._estimate_station_demand(candidate)
            if demand < 2.0:  # Skip low-demand locations
                continue

            cost = candidate.fixed_cost + self.config.min_chargers_per_station * candidate.charger_cost
            if cost > remaining_budget:
                continue

            ps = self._create_placed_station(candidate, self.config.min_chargers_per_station)
            placed.append(ps)
            used_locations.add(candidate.location_id)
            remaining_budget -= cost

            # Stop when we've used 60% of budget on stations
            if remaining_budget < self.config.budget * 0.4:
                break

        # Phase 1b: Add chargers based on marginal benefit
        while remaining_budget > 0:
            best_benefit = 0
            best_station_idx = -1

            for i, ps in enumerate(placed):
                if ps.num_chargers >= self.config.max_chargers_per_station:
                    continue
                if ps.location.charger_cost > remaining_budget:
                    continue

                # Calculate benefit of adding one charger
                current_wait = ps.estimated_wait_minutes
                new_chargers = ps.num_chargers + 1
                _, new_wait = self._estimate_metrics(
                    new_chargers, ps.estimated_demand, ps.service_rate
                )

                # Benefit = wait reduction × demand (weighted by throughput)
                wait_reduction = current_wait - new_wait
                benefit = wait_reduction * ps.estimated_demand

                if benefit > best_benefit:
                    best_benefit = benefit
                    best_station_idx = i

            if best_station_idx < 0:
                break

            # Add charger to best station
            ps = placed[best_station_idx]
            new_ps = self._create_placed_station(ps.location, ps.num_chargers + 1)
            placed[best_station_idx] = new_ps
            remaining_budget -= ps.location.charger_cost

        return placed

    def _evaluate_solution(self, placed: list[PlacedStation]) -> float:
        """
        Evaluate solution quality via quick simulation.

        Returns: Average wait time (lower is better)
        """
        # Create stations for simulation
        stations = []
        for ps in placed:
            station = create_station(
                station_id=ps.location.location_id,
                name=ps.location.name,
                lat=ps.location.lat,
                lng=ps.location.lng,
                zone_id=ps.location.zone_id,
                num_chargers=ps.num_chargers,
                charger_type=ps.charger_type,
                service_rate=ps.service_rate
            )
            stations.append(station)

        # Quick simulation
        sim_config = SimulationConfig(
            duration_hours=self.config.simulation_duration_hours,
            warmup_hours=self.config.simulation_warmup_hours,
            random_seed=self.config.random_seed
        )

        sim = SimulationEngine(sim_config)
        for station in stations:
            sim.add_station(station)
        for zone in self.zones.values():
            sim.add_zone(zone)

        results = sim.run()
        return results.avg_wait_time

    def _local_search(self, initial: list[PlacedStation]) -> list[PlacedStation]:
        """
        Phase 2: Local search improvement.

        Moves:
        1. Swap: Replace a station with an unused candidate
        2. Resize: Add or remove a charger
        3. Relocate: Move chargers between stations
        """
        current = copy.deepcopy(initial)
        current_cost = self._evaluate_solution(current)
        best = copy.deepcopy(current)
        best_cost = current_cost

        no_improvement = 0

        for iteration in range(self.config.max_iterations):
            # Generate neighbor
            move_type = random.choice(["resize", "swap", "relocate"])
            neighbor = copy.deepcopy(current)
            modified = False

            if move_type == "resize":
                # Add or remove a charger
                if neighbor:
                    idx = random.randint(0, len(neighbor) - 1)
                    ps = neighbor[idx]

                    if random.random() < 0.6:  # More likely to add
                        if ps.num_chargers < self.config.max_chargers_per_station:
                            new_total_cost = self._calculate_total_cost(neighbor) + ps.location.charger_cost
                            if new_total_cost <= self.config.budget:
                                neighbor[idx] = self._create_placed_station(
                                    ps.location, ps.num_chargers + 1
                                )
                                modified = True
                    else:
                        if ps.num_chargers > self.config.min_chargers_per_station:
                            neighbor[idx] = self._create_placed_station(
                                ps.location, ps.num_chargers - 1
                            )
                            modified = True

            elif move_type == "swap":
                # Replace a station with an unused candidate
                if neighbor:
                    used_ids = {ps.location.location_id for ps in neighbor}
                    unused = [c for c in self.candidates.values()
                              if c.location_id not in used_ids]

                    if unused:
                        idx = random.randint(0, len(neighbor) - 1)
                        old_ps = neighbor[idx]
                        new_loc = random.choice(unused)

                        # Keep same number of chargers if budget allows
                        new_cost = (self._calculate_total_cost(neighbor)
                                    - old_ps.location.fixed_cost - old_ps.num_chargers * old_ps.location.charger_cost
                                    + new_loc.fixed_cost + old_ps.num_chargers * new_loc.charger_cost)

                        if new_cost <= self.config.budget:
                            neighbor[idx] = self._create_placed_station(new_loc, old_ps.num_chargers)
                            modified = True

            elif move_type == "relocate":
                # Move a charger from one station to another
                if len(neighbor) >= 2:
                    idxs = random.sample(range(len(neighbor)), 2)
                    from_idx, to_idx = idxs

                    if (neighbor[from_idx].num_chargers > self.config.min_chargers_per_station and
                        neighbor[to_idx].num_chargers < self.config.max_chargers_per_station):

                        neighbor[from_idx] = self._create_placed_station(
                            neighbor[from_idx].location,
                            neighbor[from_idx].num_chargers - 1
                        )
                        neighbor[to_idx] = self._create_placed_station(
                            neighbor[to_idx].location,
                            neighbor[to_idx].num_chargers + 1
                        )
                        modified = True

            if not modified:
                continue

            # Check coverage constraint
            if self._calculate_coverage(neighbor) < self.config.min_coverage_percent:
                continue

            # Evaluate neighbor
            neighbor_cost = self._evaluate_solution(neighbor)

            # Accept if better
            if neighbor_cost < current_cost:
                current = neighbor
                current_cost = neighbor_cost
                no_improvement = 0

                if current_cost < best_cost:
                    best = copy.deepcopy(current)
                    best_cost = current_cost
            else:
                no_improvement += 1

            if no_improvement >= self.config.no_improvement_limit:
                break

        return best

    def optimize(self) -> OptimizationResult:
        """
        Run the full optimization process.

        Returns:
            OptimizationResult with optimal station placements
        """
        # Phase 1: Greedy construction
        initial = self._greedy_construction()

        if not initial:
            return OptimizationResult(
                stations=[],
                total_cost=0,
                total_chargers=0,
                coverage_percent=0,
                estimated_avg_wait=float('inf'),
                estimated_max_wait=float('inf'),
                iterations=0,
                improvement_percent=0
            )

        initial_wait = self._evaluate_solution(initial)

        # Phase 2: Local search
        optimized = self._local_search(initial)

        # Final evaluation
        final_wait = self._evaluate_solution(optimized)

        # Calculate improvement
        improvement = (initial_wait - final_wait) / initial_wait * 100 if initial_wait > 0 else 0

        return OptimizationResult(
            stations=optimized,
            total_cost=self._calculate_total_cost(optimized),
            total_chargers=sum(ps.num_chargers for ps in optimized),
            coverage_percent=self._calculate_coverage(optimized),
            estimated_avg_wait=final_wait,
            estimated_max_wait=max((ps.estimated_wait_minutes for ps in optimized), default=0),
            iterations=self.config.max_iterations,
            improvement_percent=improvement
        )

    def create_stations_from_result(self, result: OptimizationResult) -> list[Station]:
        """Convert optimization result to Station objects for simulation."""
        stations = []
        for ps in result.stations:
            station = create_station(
                station_id=ps.location.location_id,
                name=ps.location.name,
                lat=ps.location.lat,
                lng=ps.location.lng,
                zone_id=ps.location.zone_id,
                num_chargers=ps.num_chargers,
                charger_type=ps.charger_type,
                service_rate=ps.service_rate
            )
            stations.append(station)
        return stations


if __name__ == "__main__":
    # Example optimization run
    print("EV Charging Station Placement Optimization")
    print("=" * 50)

    # Define zones (Calgary example)
    zones = [
        ZoneConfig(zone_id="downtown", name="Downtown", base_arrival_rate=10.0, lat=51.045, lng=-114.057),
        ZoneConfig(zone_id="beltline", name="Beltline", base_arrival_rate=7.0, lat=51.038, lng=-114.07),
        ZoneConfig(zone_id="kensington", name="Kensington", base_arrival_rate=5.0, lat=51.055, lng=-114.085),
        ZoneConfig(zone_id="bridgeland", name="Bridgeland", base_arrival_rate=4.0, lat=51.055, lng=-114.04),
        ZoneConfig(zone_id="mission", name="Mission", base_arrival_rate=6.0, lat=51.035, lng=-114.055),
    ]

    # Define candidate locations
    candidates = [
        CandidateLocation("loc1", "Downtown Central Parkade", 51.045, -114.058, "downtown"),
        CandidateLocation("loc2", "Beltline Mall", 51.038, -114.072, "beltline"),
        CandidateLocation("loc3", "Kensington Plaza", 51.055, -114.088, "kensington"),
        CandidateLocation("loc4", "Bridgeland Hub", 51.056, -114.042, "bridgeland"),
        CandidateLocation("loc5", "Mission Grocery", 51.034, -114.056, "mission"),
        CandidateLocation("loc6", "East Village Lot", 51.047, -114.048, "downtown"),
        CandidateLocation("loc7", "17th Ave Station", 51.037, -114.08, "beltline"),
        CandidateLocation("loc8", "Sunnyside Park", 51.058, -114.09, "kensington"),
    ]

    # Run optimization
    config = OptimizationConfig(
        budget=1_500_000,
        max_iterations=50,
        simulation_duration_hours=48,
        simulation_warmup_hours=8
    )

    optimizer = Optimizer(candidates, zones, config)

    print("\nRunning optimization...")
    result = optimizer.optimize()

    print("\nOptimization Results:")
    print(f"  Total stations: {len(result.stations)}")
    print(f"  Total chargers: {result.total_chargers}")
    print(f"  Total cost: ${result.total_cost:,.0f}")
    print(f"  Coverage: {result.coverage_percent:.1%}")
    print(f"  Estimated avg wait: {result.estimated_avg_wait:.1f} minutes")
    print(f"  Improvement: {result.improvement_percent:.1f}%")

    print("\nPlaced Stations:")
    for ps in result.stations:
        print(f"  {ps.location.name}: {ps.num_chargers} chargers, "
              f"~{ps.estimated_wait_minutes:.1f} min wait")
