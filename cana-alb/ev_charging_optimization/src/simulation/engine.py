"""
Discrete-Event Simulation Engine for EV Charging Networks

Simulates the flow of EVs through a network of charging stations,
measuring wait times, utilization, and other key metrics.
"""

import heapq
import random
import math
from dataclasses import dataclass, field
from typing import Optional, Callable
from enum import Enum

from .station import Station, EV, create_station


class EventType(Enum):
    """Types of simulation events."""
    EV_ARRIVAL = "arrival"
    CHARGE_END = "charge_end"


@dataclass(order=True)
class Event:
    """A simulation event."""
    time: float
    event_type: EventType = field(compare=False)
    data: dict = field(compare=False, default_factory=dict)


@dataclass
class ZoneConfig:
    """Configuration for a demand zone."""
    zone_id: str
    name: str
    base_arrival_rate: float  # EVs per hour (base rate)
    lat: float  # Center latitude
    lng: float  # Center longitude

    # Time-of-day multipliers (24 hours)
    hourly_multipliers: list[float] = field(default_factory=lambda: [
        0.3, 0.2, 0.2, 0.2, 0.3, 0.5,  # 0-5 (night)
        0.8, 1.2, 1.3, 1.0, 0.9, 1.0,  # 6-11 (morning)
        1.1, 1.0, 0.9, 0.9, 1.0, 1.3,  # 12-17 (afternoon)
        1.4, 1.2, 1.0, 0.8, 0.6, 0.4,  # 18-23 (evening)
    ])

    def get_arrival_rate(self, hour: int) -> float:
        """Get arrival rate for a specific hour."""
        hour = int(hour) % 24
        return self.base_arrival_rate * self.hourly_multipliers[hour]


@dataclass
class SimulationConfig:
    """Configuration for the simulation."""
    duration_hours: float = 168.0  # 1 week
    warmup_hours: float = 24.0     # Discard first day metrics
    random_seed: Optional[int] = 42
    max_travel_distance_km: float = 15.0
    avg_travel_speed_kmh: float = 30.0


@dataclass
class SimulationResults:
    """Results from a simulation run."""
    config: SimulationConfig
    duration_hours: float
    total_arrivals: int
    total_served: int
    total_balked: int  # EVs that left without charging

    # Wait time metrics (minutes)
    avg_wait_time: float
    median_wait_time: float
    p95_wait_time: float
    max_wait_time: float

    # System metrics
    avg_utilization: float
    total_throughput: float

    # Per-station metrics
    station_metrics: list[dict]

    # Per-zone metrics
    zone_metrics: list[dict]

    # Raw wait times for further analysis
    wait_times: list[float] = field(default_factory=list)


class SimulationEngine:
    """
    Discrete-event simulation engine for EV charging networks.

    Simulates:
    - Random EV arrivals at zones
    - Station selection by drivers
    - Queueing at stations
    - Charging service
    - Departure

    Collects metrics on wait times, utilization, throughput.
    """

    def __init__(self, config: Optional[SimulationConfig] = None):
        self.config = config or SimulationConfig()
        self.stations: dict[str, Station] = {}
        self.zones: dict[str, ZoneConfig] = {}

        # Event queue (min-heap by time)
        self.event_queue: list[Event] = []

        # Simulation state
        self.current_time: float = 0.0
        self.is_warmup: bool = True

        # Metrics collection
        self.wait_times: list[float] = []
        self.total_arrivals: int = 0
        self.total_served: int = 0
        self.total_balked: int = 0

        # Random generator
        if self.config.random_seed is not None:
            random.seed(self.config.random_seed)

    def add_station(self, station: Station) -> None:
        """Add a station to the simulation."""
        self.stations[station.id] = station

    def add_zone(self, zone: ZoneConfig) -> None:
        """Add a demand zone to the simulation."""
        self.zones[zone.zone_id] = zone

    def _schedule_event(self, event: Event) -> None:
        """Schedule an event."""
        heapq.heappush(self.event_queue, event)

    def _next_event(self) -> Optional[Event]:
        """Get next event from queue."""
        if not self.event_queue:
            return None
        return heapq.heappop(self.event_queue)

    def _sample_exponential(self, rate: float) -> float:
        """Sample from exponential distribution."""
        if rate <= 0:
            return float('inf')
        return random.expovariate(rate)

    def _haversine_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points in km."""
        R = 6371  # Earth radius in km

        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])

        dlat = lat2 - lat1
        dlng = lng2 - lng1

        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))

        return R * c

    def _select_station(self, zone: ZoneConfig) -> Optional[Station]:
        """
        Select a station for an EV from a zone.

        Uses a probabilistic model where stations with shorter expected
        total time (travel + wait) are more likely to be chosen.
        """
        candidates = []

        for station in self.stations.values():
            distance = self._haversine_distance(
                zone.lat, zone.lng,
                station.lat, station.lng
            )

            if distance > self.config.max_travel_distance_km:
                continue

            # Estimate wait time based on current queue
            if station.num_chargers == 0:
                continue

            queue_ahead = station.queue_length
            avg_service_time = 1.0 / station.chargers[0].service_rate if station.chargers else 0.5
            estimated_wait = queue_ahead * avg_service_time / station.num_chargers

            travel_time = distance / self.config.avg_travel_speed_kmh
            total_time = travel_time + estimated_wait

            # Score: lower is better, will be inverted for probability
            candidates.append((station, total_time))

        if not candidates:
            return None

        # Softmax selection (preference for lower total time)
        # Using negative because lower time is better
        min_time = min(t for _, t in candidates)
        weights = [math.exp(-(t - min_time) * 2) for _, t in candidates]  # Temperature = 0.5
        total_weight = sum(weights)
        weights = [w / total_weight for w in weights]

        # Weighted random choice
        r = random.random()
        cumsum = 0
        for (station, _), w in zip(candidates, weights):
            cumsum += w
            if r <= cumsum:
                return station

        return candidates[-1][0]

    def _handle_arrival(self, event: Event) -> None:
        """Handle an EV arrival event."""
        zone_id = event.data["zone_id"]
        zone = self.zones.get(zone_id)

        if zone is None:
            return

        self.total_arrivals += 1

        # Create EV
        ev = EV(origin_zone=zone_id, arrival_time=self.current_time)

        # Select station
        station = self._select_station(zone)

        if station is None:
            # No available station in range - EV balks
            self.total_balked += 1
            return

        station.record_arrival()

        if station.has_available_charger:
            # Start charging immediately
            charger = station.get_available_charger()
            ev.queue_entry_time = self.current_time  # No actual wait
            charger.assign(ev, self.current_time)

            # Schedule charge end
            charge_duration = self._sample_exponential(charger.service_rate)
            end_event = Event(
                time=self.current_time + charge_duration,
                event_type=EventType.CHARGE_END,
                data={"station_id": station.id, "charger_id": charger.id}
            )
            self._schedule_event(end_event)

            # Record zero wait time
            if not self.is_warmup:
                self.wait_times.append(0.0)

        else:
            # Join queue
            station.add_to_queue(ev, self.current_time)

        # Schedule next arrival for this zone
        hour = int(self.current_time) % 24
        arrival_rate = zone.get_arrival_rate(hour)
        inter_arrival = self._sample_exponential(arrival_rate)

        next_arrival = Event(
            time=self.current_time + inter_arrival,
            event_type=EventType.EV_ARRIVAL,
            data={"zone_id": zone_id}
        )
        self._schedule_event(next_arrival)

    def _handle_charge_end(self, event: Event) -> None:
        """Handle a charge completion event."""
        station_id = event.data["station_id"]
        charger_id = event.data["charger_id"]

        station = self.stations.get(station_id)
        if station is None:
            return

        charger = next((c for c in station.chargers if c.id == charger_id), None)
        if charger is None:
            return

        # Release current EV
        ev = charger.release(self.current_time)
        if ev:
            station.record_departure(ev)
            self.total_served += 1

            # Record wait time (if past warmup)
            if not self.is_warmup:
                self.wait_times.append(ev.wait_time_minutes)

        # Check queue
        next_ev = station.pop_from_queue()
        if next_ev:
            # Start charging next EV
            charger.assign(next_ev, self.current_time)

            # Record wait time
            wait = next_ev.wait_time_minutes
            if not self.is_warmup:
                self.wait_times.append(wait)

            # Schedule charge end
            charge_duration = self._sample_exponential(charger.service_rate)
            end_event = Event(
                time=self.current_time + charge_duration,
                event_type=EventType.CHARGE_END,
                data={"station_id": station.id, "charger_id": charger.id}
            )
            self._schedule_event(end_event)

    def _initialize(self) -> None:
        """Initialize simulation state and schedule initial events."""
        self.event_queue = []
        self.current_time = 0.0
        self.is_warmup = True
        self.wait_times = []
        self.total_arrivals = 0
        self.total_served = 0
        self.total_balked = 0

        # Reset station states
        for station in self.stations.values():
            station.queue.clear()
            station.total_arrivals = 0
            station.total_served = 0
            station.total_wait_time = 0.0
            station.max_wait_time = 0.0
            station.max_queue_length = 0
            for charger in station.chargers:
                charger.is_occupied = False
                charger.current_ev = None
                charger.total_evs_served = 0
                charger.total_busy_time = 0.0

        # Schedule initial arrivals for each zone
        for zone in self.zones.values():
            arrival_rate = zone.get_arrival_rate(0)
            inter_arrival = self._sample_exponential(arrival_rate)
            event = Event(
                time=inter_arrival,
                event_type=EventType.EV_ARRIVAL,
                data={"zone_id": zone.zone_id}
            )
            self._schedule_event(event)

    def run(self) -> SimulationResults:
        """
        Run the simulation.

        Returns:
            SimulationResults with all collected metrics
        """
        self._initialize()

        end_time = self.config.duration_hours
        warmup_end = self.config.warmup_hours

        while self.event_queue:
            event = self._next_event()

            if event.time > end_time:
                break

            self.current_time = event.time

            # Check warmup period
            if self.is_warmup and self.current_time >= warmup_end:
                self.is_warmup = False
                self.wait_times = []  # Reset metrics after warmup

            # Handle event
            if event.event_type == EventType.EV_ARRIVAL:
                self._handle_arrival(event)
            elif event.event_type == EventType.CHARGE_END:
                self._handle_charge_end(event)

        # Calculate results
        return self._calculate_results()

    def _calculate_results(self) -> SimulationResults:
        """Calculate final simulation results."""
        effective_duration = self.config.duration_hours - self.config.warmup_hours

        # Wait time statistics
        if self.wait_times:
            sorted_waits = sorted(self.wait_times)
            avg_wait = sum(sorted_waits) / len(sorted_waits)
            median_wait = sorted_waits[len(sorted_waits) // 2]
            p95_idx = int(len(sorted_waits) * 0.95)
            p95_wait = sorted_waits[min(p95_idx, len(sorted_waits) - 1)]
            max_wait = max(sorted_waits)
        else:
            avg_wait = median_wait = p95_wait = max_wait = 0.0

        # Station metrics
        station_metrics = []
        total_utilization = 0.0

        for station in self.stations.values():
            metrics = station.get_metrics(effective_duration)
            station_metrics.append(metrics)
            total_utilization += metrics["utilization"]

        avg_utilization = total_utilization / len(self.stations) if self.stations else 0.0

        # Zone metrics (placeholder - could track per-zone stats)
        zone_metrics = [{"zone_id": z.zone_id, "name": z.name} for z in self.zones.values()]

        return SimulationResults(
            config=self.config,
            duration_hours=effective_duration,
            total_arrivals=self.total_arrivals,
            total_served=self.total_served,
            total_balked=self.total_balked,
            avg_wait_time=avg_wait,
            median_wait_time=median_wait,
            p95_wait_time=p95_wait,
            max_wait_time=max_wait,
            avg_utilization=avg_utilization,
            total_throughput=self.total_served / effective_duration if effective_duration > 0 else 0,
            station_metrics=station_metrics,
            zone_metrics=zone_metrics,
            wait_times=self.wait_times
        )


def run_comparison(
    baseline_stations: list[Station],
    optimized_stations: list[Station],
    zones: list[ZoneConfig],
    config: Optional[SimulationConfig] = None
) -> tuple[SimulationResults, SimulationResults]:
    """
    Run comparison between baseline and optimized layouts.

    Args:
        baseline_stations: Stations in baseline configuration
        optimized_stations: Stations in optimized configuration
        zones: Demand zones (same for both)
        config: Simulation configuration

    Returns:
        Tuple of (baseline_results, optimized_results)
    """
    config = config or SimulationConfig()

    # Run baseline
    baseline_sim = SimulationEngine(config)
    for station in baseline_stations:
        baseline_sim.add_station(station)
    for zone in zones:
        baseline_sim.add_zone(zone)
    baseline_results = baseline_sim.run()

    # Run optimized (same random seed for fair comparison)
    optimized_sim = SimulationEngine(config)
    for station in optimized_stations:
        optimized_sim.add_station(station)
    for zone in zones:
        optimized_sim.add_zone(zone)
    optimized_results = optimized_sim.run()

    return baseline_results, optimized_results


if __name__ == "__main__":
    # Example: Run a simple simulation
    print("EV Charging Network Simulation")
    print("=" * 50)

    # Create zones
    zones = [
        ZoneConfig(zone_id="downtown", name="Downtown", base_arrival_rate=8.0, lat=51.045, lng=-114.057),
        ZoneConfig(zone_id="north", name="North", base_arrival_rate=5.0, lat=51.10, lng=-114.05),
        ZoneConfig(zone_id="south", name="South", base_arrival_rate=6.0, lat=50.99, lng=-114.06),
    ]

    # Create stations
    stations = [
        create_station("s1", "Downtown Central", 51.045, -114.058, "downtown", num_chargers=4),
        create_station("s2", "North Mall", 51.10, -114.04, "north", num_chargers=3),
        create_station("s3", "South Center", 50.99, -114.07, "south", num_chargers=3),
    ]

    # Run simulation
    config = SimulationConfig(duration_hours=168, warmup_hours=24, random_seed=42)
    sim = SimulationEngine(config)

    for station in stations:
        sim.add_station(station)
    for zone in zones:
        sim.add_zone(zone)

    print("\nRunning simulation (1 week)...")
    results = sim.run()

    print("\nResults:")
    print(f"  Total arrivals: {results.total_arrivals}")
    print(f"  Total served: {results.total_served}")
    print(f"  Total balked: {results.total_balked}")
    print(f"  Average wait time: {results.avg_wait_time:.1f} minutes")
    print(f"  95th percentile wait: {results.p95_wait_time:.1f} minutes")
    print(f"  Max wait time: {results.max_wait_time:.1f} minutes")
    print(f"  Average utilization: {results.avg_utilization:.1%}")

    print("\nStation Metrics:")
    for sm in results.station_metrics:
        print(f"  {sm['name']}: {sm['avg_wait_minutes']:.1f} min avg wait, "
              f"{sm['utilization']:.1%} utilization")
