"""
Station and EV Models for Simulation

Defines the core entities: Stations, Chargers, and Electric Vehicles.
"""

from dataclasses import dataclass, field
from typing import Optional
from collections import deque
import uuid


@dataclass
class EV:
    """Represents an electric vehicle in the simulation."""

    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    origin_zone: str = ""
    arrival_time: float = 0.0
    queue_entry_time: Optional[float] = None
    charge_start_time: Optional[float] = None
    charge_end_time: Optional[float] = None
    assigned_station: Optional[str] = None

    @property
    def wait_time(self) -> float:
        """Time spent waiting in queue (hours)."""
        if self.charge_start_time is None or self.queue_entry_time is None:
            return 0.0
        return self.charge_start_time - self.queue_entry_time

    @property
    def wait_time_minutes(self) -> float:
        """Time spent waiting in queue (minutes)."""
        return self.wait_time * 60

    @property
    def total_time(self) -> float:
        """Total time from arrival to departure (hours)."""
        if self.charge_end_time is None:
            return 0.0
        return self.charge_end_time - self.arrival_time

    @property
    def total_time_minutes(self) -> float:
        """Total time from arrival to departure (minutes)."""
        return self.total_time * 60


@dataclass
class Charger:
    """Represents a single charging port."""

    id: str
    station_id: str
    charger_type: str = "dcfc_50"
    service_rate: float = 1.33  # EVs per hour
    is_occupied: bool = False
    current_ev: Optional[EV] = None
    total_evs_served: int = 0
    total_busy_time: float = 0.0

    def assign(self, ev: EV, current_time: float) -> None:
        """Assign an EV to this charger."""
        self.is_occupied = True
        self.current_ev = ev
        ev.charge_start_time = current_time
        ev.assigned_station = self.station_id

    def release(self, current_time: float) -> Optional[EV]:
        """Release the current EV from this charger."""
        if self.current_ev is None:
            return None

        ev = self.current_ev
        ev.charge_end_time = current_time

        # Track metrics
        self.total_evs_served += 1
        charge_duration = current_time - ev.charge_start_time
        self.total_busy_time += charge_duration

        self.is_occupied = False
        self.current_ev = None

        return ev


@dataclass
class Station:
    """Represents a charging station with multiple chargers."""

    id: str
    name: str
    lat: float
    lng: float
    zone_id: str
    chargers: list[Charger] = field(default_factory=list)
    queue: deque = field(default_factory=deque)

    # Metrics
    total_arrivals: int = 0
    total_served: int = 0
    total_wait_time: float = 0.0
    max_wait_time: float = 0.0
    max_queue_length: int = 0

    @property
    def num_chargers(self) -> int:
        """Number of chargers at this station."""
        return len(self.chargers)

    @property
    def available_chargers(self) -> list[Charger]:
        """List of chargers that are currently available."""
        return [c for c in self.chargers if not c.is_occupied]

    @property
    def has_available_charger(self) -> bool:
        """Check if any charger is available."""
        return len(self.available_chargers) > 0

    @property
    def queue_length(self) -> int:
        """Current queue length."""
        return len(self.queue)

    @property
    def avg_wait_time(self) -> float:
        """Average wait time (hours) for served EVs."""
        if self.total_served == 0:
            return 0.0
        return self.total_wait_time / self.total_served

    @property
    def avg_wait_minutes(self) -> float:
        """Average wait time in minutes."""
        return self.avg_wait_time * 60

    @property
    def utilization(self) -> float:
        """Average utilization across all chargers."""
        if not self.chargers:
            return 0.0
        total_busy = sum(c.total_busy_time for c in self.chargers)
        # Note: This needs simulation end time to calculate properly
        # For now, return a placeholder based on served EVs
        return min(1.0, self.total_served / (len(self.chargers) * 100))

    def add_charger(self, charger_type: str = "dcfc_50", service_rate: float = 1.33) -> Charger:
        """Add a new charger to this station."""
        charger = Charger(
            id=f"{self.id}_c{len(self.chargers)}",
            station_id=self.id,
            charger_type=charger_type,
            service_rate=service_rate
        )
        self.chargers.append(charger)
        return charger

    def get_available_charger(self) -> Optional[Charger]:
        """Get first available charger, or None if all busy."""
        available = self.available_chargers
        return available[0] if available else None

    def add_to_queue(self, ev: EV, current_time: float) -> None:
        """Add an EV to the queue."""
        ev.queue_entry_time = current_time
        self.queue.append(ev)
        self.max_queue_length = max(self.max_queue_length, len(self.queue))

    def pop_from_queue(self) -> Optional[EV]:
        """Remove and return the next EV from the queue."""
        if not self.queue:
            return None
        return self.queue.popleft()

    def record_arrival(self) -> None:
        """Record an arrival at this station."""
        self.total_arrivals += 1

    def record_departure(self, ev: EV) -> None:
        """Record a departure from this station."""
        self.total_served += 1
        wait = ev.wait_time
        self.total_wait_time += wait
        self.max_wait_time = max(self.max_wait_time, wait)

    def get_metrics(self, simulation_duration: float) -> dict:
        """Get comprehensive metrics for this station."""
        total_busy_time = sum(c.total_busy_time for c in self.chargers)
        max_possible_busy = len(self.chargers) * simulation_duration

        return {
            "station_id": self.id,
            "name": self.name,
            "zone_id": self.zone_id,
            "num_chargers": self.num_chargers,
            "total_arrivals": self.total_arrivals,
            "total_served": self.total_served,
            "avg_wait_minutes": self.avg_wait_minutes,
            "max_wait_minutes": self.max_wait_time * 60,
            "max_queue_length": self.max_queue_length,
            "utilization": total_busy_time / max_possible_busy if max_possible_busy > 0 else 0,
            "throughput_per_hour": self.total_served / simulation_duration if simulation_duration > 0 else 0,
        }


def create_station(
    station_id: str,
    name: str,
    lat: float,
    lng: float,
    zone_id: str,
    num_chargers: int,
    charger_type: str = "dcfc_50",
    service_rate: float = 1.33
) -> Station:
    """
    Factory function to create a fully configured station.

    Args:
        station_id: Unique identifier
        name: Human-readable name
        lat: Latitude
        lng: Longitude
        zone_id: Zone this station serves
        num_chargers: Number of charging ports
        charger_type: Type of chargers
        service_rate: EVs per hour per charger

    Returns:
        Configured Station instance
    """
    station = Station(
        id=station_id,
        name=name,
        lat=lat,
        lng=lng,
        zone_id=zone_id
    )

    for _ in range(num_chargers):
        station.add_charger(charger_type, service_rate)

    return station
