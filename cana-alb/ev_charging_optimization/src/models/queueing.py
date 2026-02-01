"""
Queueing Theory Models for EV Charging Stations

Implements M/M/s queueing model calculations including Erlang-C formula
for multi-server queues commonly found in charging station scenarios.
"""

import math
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional


@dataclass
class QueueMetrics:
    """Results from queueing analysis."""

    arrival_rate: float          # λ - arrivals per hour
    service_rate: float          # μ - service completions per hour per server
    num_servers: int             # s - number of chargers
    utilization: float           # ρ - server utilization (λ / sμ)
    prob_wait: float             # P(W > 0) - probability of waiting
    avg_queue_length: float      # Lq - average number in queue
    avg_system_length: float     # L - average number in system
    avg_wait_time: float         # Wq - average wait time in queue (hours)
    avg_system_time: float       # W - average time in system (hours)
    avg_wait_minutes: float      # Wq in minutes (convenience)
    avg_system_minutes: float    # W in minutes (convenience)
    is_stable: bool              # Whether ρ < 1 (queue doesn't explode)


class ErlangC:
    """
    Erlang-C (M/M/s) queueing model calculator.

    This models a system where:
    - Arrivals follow a Poisson process (random, independent)
    - Service times are exponentially distributed
    - There are s identical servers (chargers)
    - Queue has infinite capacity
    - First-come, first-served discipline

    Example usage:
        >>> calc = ErlangC()
        >>> metrics = calc.calculate(arrival_rate=10, service_rate=4, num_servers=3)
        >>> print(f"Average wait: {metrics.avg_wait_minutes:.1f} minutes")
    """

    @staticmethod
    @lru_cache(maxsize=1000)
    def _factorial(n: int) -> int:
        """Cached factorial calculation."""
        return math.factorial(n)

    @staticmethod
    def _poisson_sum(s: int, a: float) -> float:
        """
        Calculate sum of (a^k / k!) for k = 0 to s-1.
        This is part of the Erlang-C denominator.

        Args:
            s: Number of servers
            a: Offered load (λ/μ)
        """
        total = 0.0
        for k in range(s):
            total += (a ** k) / math.factorial(k)
        return total

    def erlang_c_probability(
        self,
        arrival_rate: float,
        service_rate: float,
        num_servers: int
    ) -> float:
        """
        Calculate Erlang-C probability: P(W > 0).

        This is the probability that an arriving customer must wait
        because all servers are busy.

        Formula:
            P(W>0) = [(a^s / s!) × (s / (s-a))] /
                     [Σ(k=0 to s-1)(a^k / k!) + (a^s / s!) × (s / (s-a))]

        Where a = λ/μ (offered load)

        Args:
            arrival_rate: λ - arrivals per time unit
            service_rate: μ - service rate per server per time unit
            num_servers: s - number of servers

        Returns:
            Probability of waiting (0 to 1)
        """
        s = num_servers
        a = arrival_rate / service_rate  # Offered load
        rho = a / s  # Utilization

        # System is unstable if utilization >= 1
        if rho >= 1.0:
            return 1.0

        # Calculate components
        a_s_over_s_factorial = (a ** s) / self._factorial(s)
        s_over_s_minus_a = s / (s - a)

        numerator = a_s_over_s_factorial * s_over_s_minus_a
        denominator = self._poisson_sum(s, a) + numerator

        if denominator == 0:
            return 0.0

        return numerator / denominator

    def calculate(
        self,
        arrival_rate: float,
        service_rate: float,
        num_servers: int
    ) -> QueueMetrics:
        """
        Calculate all queueing metrics for an M/M/s system.

        Args:
            arrival_rate: λ - average arrivals per hour
            service_rate: μ - average service completions per hour per server
            num_servers: s - number of servers (chargers)

        Returns:
            QueueMetrics with all calculated values
        """
        s = num_servers
        lam = arrival_rate
        mu = service_rate

        # Utilization
        rho = lam / (s * mu)
        is_stable = rho < 1.0

        if not is_stable:
            # System is unstable - return infinite waits
            return QueueMetrics(
                arrival_rate=lam,
                service_rate=mu,
                num_servers=s,
                utilization=rho,
                prob_wait=1.0,
                avg_queue_length=float('inf'),
                avg_system_length=float('inf'),
                avg_wait_time=float('inf'),
                avg_system_time=float('inf'),
                avg_wait_minutes=float('inf'),
                avg_system_minutes=float('inf'),
                is_stable=False
            )

        # Probability of waiting (Erlang-C)
        p_wait = self.erlang_c_probability(lam, mu, s)

        # Average wait time in queue (Wq)
        # Wq = P(W>0) / (s×μ - λ)
        wq = p_wait / (s * mu - lam)

        # Average time in system (W)
        # W = Wq + 1/μ
        w = wq + (1 / mu)

        # Average queue length (Lq)
        # Lq = λ × Wq (Little's Law)
        lq = lam * wq

        # Average system length (L)
        # L = λ × W (Little's Law)
        l = lam * w

        return QueueMetrics(
            arrival_rate=lam,
            service_rate=mu,
            num_servers=s,
            utilization=rho,
            prob_wait=p_wait,
            avg_queue_length=lq,
            avg_system_length=l,
            avg_wait_time=wq,
            avg_system_time=w,
            avg_wait_minutes=wq * 60,
            avg_system_minutes=w * 60,
            is_stable=True
        )

    def find_min_servers(
        self,
        arrival_rate: float,
        service_rate: float,
        target_wait_minutes: float,
        max_servers: int = 50
    ) -> Optional[int]:
        """
        Find minimum number of servers to achieve target wait time.

        Args:
            arrival_rate: λ - arrivals per hour
            service_rate: μ - service rate per server per hour
            target_wait_minutes: Maximum acceptable average wait time
            max_servers: Upper bound on server count to try

        Returns:
            Minimum number of servers needed, or None if not achievable
        """
        # Minimum servers needed for stability
        min_stable = math.ceil(arrival_rate / service_rate)

        for s in range(min_stable, max_servers + 1):
            metrics = self.calculate(arrival_rate, service_rate, s)
            if metrics.is_stable and metrics.avg_wait_minutes <= target_wait_minutes:
                return s

        return None


class ChargerTypes:
    """Standard charger type definitions with service rates."""

    # Service rates in EVs per hour (based on average charge time)
    LEVEL_2_SLOW = {
        "name": "Level 2 (7kW)",
        "power_kw": 7,
        "avg_charge_hours": 6.0,
        "service_rate": 1 / 6.0,  # ~0.17 EVs/hour
    }

    LEVEL_2_FAST = {
        "name": "Level 2 (19kW)",
        "power_kw": 19,
        "avg_charge_hours": 2.5,
        "service_rate": 1 / 2.5,  # 0.4 EVs/hour
    }

    DCFC_50 = {
        "name": "DC Fast (50kW)",
        "power_kw": 50,
        "avg_charge_hours": 0.75,  # 45 minutes
        "service_rate": 1 / 0.75,  # ~1.33 EVs/hour
    }

    DCFC_150 = {
        "name": "DC Fast (150kW)",
        "power_kw": 150,
        "avg_charge_hours": 0.33,  # 20 minutes
        "service_rate": 1 / 0.33,  # ~3.0 EVs/hour
    }

    ULTRA_FAST = {
        "name": "Ultra Fast (350kW)",
        "power_kw": 350,
        "avg_charge_hours": 0.17,  # 10 minutes
        "service_rate": 1 / 0.17,  # ~6.0 EVs/hour
    }

    @classmethod
    def get_by_name(cls, name: str) -> dict:
        """Get charger type by name."""
        types = {
            "level2_slow": cls.LEVEL_2_SLOW,
            "level2_fast": cls.LEVEL_2_FAST,
            "dcfc_50": cls.DCFC_50,
            "dcfc_150": cls.DCFC_150,
            "ultra_fast": cls.ULTRA_FAST,
        }
        return types.get(name.lower(), cls.DCFC_50)


def analyze_station(
    arrival_rate: float,
    num_chargers: int,
    charger_type: str = "dcfc_50"
) -> QueueMetrics:
    """
    Convenience function to analyze a single station.

    Args:
        arrival_rate: Expected EVs arriving per hour
        num_chargers: Number of charging ports
        charger_type: Type of charger (level2_slow, level2_fast, dcfc_50, dcfc_150, ultra_fast)

    Returns:
        QueueMetrics with analysis results
    """
    charger = ChargerTypes.get_by_name(charger_type)
    calc = ErlangC()
    return calc.calculate(
        arrival_rate=arrival_rate,
        service_rate=charger["service_rate"],
        num_servers=num_chargers
    )


if __name__ == "__main__":
    # Example: Analyze a station with 4 DCFC chargers and 8 arrivals/hour
    print("EV Charging Station Queueing Analysis")
    print("=" * 50)

    arrival_rate = 8  # EVs per hour
    num_chargers = 4
    charger_type = "dcfc_50"

    metrics = analyze_station(arrival_rate, num_chargers, charger_type)

    print(f"\nStation Configuration:")
    print(f"  Arrival rate: {arrival_rate} EVs/hour")
    print(f"  Chargers: {num_chargers}")
    print(f"  Charger type: {charger_type}")

    print(f"\nResults:")
    print(f"  Utilization: {metrics.utilization:.1%}")
    print(f"  Probability of waiting: {metrics.prob_wait:.1%}")
    print(f"  Average wait time: {metrics.avg_wait_minutes:.1f} minutes")
    print(f"  Average system time: {metrics.avg_system_minutes:.1f} minutes")
    print(f"  Average queue length: {metrics.avg_queue_length:.2f} EVs")
    print(f"  System stable: {metrics.is_stable}")

    # Find minimum chargers for target wait time
    calc = ErlangC()
    target_wait = 5  # minutes
    min_chargers = calc.find_min_servers(
        arrival_rate=arrival_rate,
        service_rate=ChargerTypes.DCFC_50["service_rate"],
        target_wait_minutes=target_wait
    )
    print(f"\n  Min chargers for ≤{target_wait}min wait: {min_chargers}")
