#!/usr/bin/env python3
"""
EV Charging Optimization - Demo Script

Runs a complete demonstration of the optimization system:
1. Defines Calgary zones and candidate locations
2. Runs baseline simulation
3. Runs optimization
4. Compares baseline vs optimized
5. Outputs results

Usage:
    python run_demo.py
"""

import json
from datetime import datetime
from pathlib import Path

from src.models.queueing import ErlangC, ChargerTypes
from src.simulation.engine import SimulationEngine, SimulationConfig, ZoneConfig
from src.simulation.station import create_station
from src.optimization.optimizer import (
    Optimizer, OptimizationConfig, CandidateLocation
)


def main():
    print("=" * 70)
    print("EV CHARGING STATION OPTIMIZATION - CALGARY PILOT DEMO")
    print("=" * 70)
    print()

    # =========================================================================
    # Step 1: Define Calgary zones
    # =========================================================================
    print("Step 1: Defining Calgary zones...")

    # Demand rates calibrated for 2027 EV adoption (~15% penetration)
    # Base rates represent peak-hour demand
    zones = [
        ZoneConfig(
            zone_id="downtown",
            name="Downtown Core",
            base_arrival_rate=5.0,  # High-density commercial
            lat=51.045,
            lng=-114.057
        ),
        ZoneConfig(
            zone_id="beltline",
            name="Beltline",
            base_arrival_rate=3.5,  # Mixed residential/commercial
            lat=51.038,
            lng=-114.070
        ),
        ZoneConfig(
            zone_id="kensington",
            name="Kensington",
            base_arrival_rate=2.0,  # Residential/retail
            lat=51.055,
            lng=-114.088
        ),
        ZoneConfig(
            zone_id="bridgeland",
            name="Bridgeland",
            base_arrival_rate=1.5,  # Residential
            lat=51.055,
            lng=-114.042
        ),
        ZoneConfig(
            zone_id="mission",
            name="Mission",
            base_arrival_rate=2.5,  # Residential/retail
            lat=51.035,
            lng=-114.056
        ),
        ZoneConfig(
            zone_id="inglewood",
            name="Inglewood",
            base_arrival_rate=1.5,  # Residential/artisan
            lat=51.035,
            lng=-114.030
        ),
        ZoneConfig(
            zone_id="sunnyside",
            name="Sunnyside",
            base_arrival_rate=1.5,  # Residential
            lat=51.058,
            lng=-114.090
        ),
        ZoneConfig(
            zone_id="hillhurst",
            name="Hillhurst",
            base_arrival_rate=1.5,  # Residential
            lat=51.058,
            lng=-114.100
        ),
    ]

    print(f"  Defined {len(zones)} demand zones")
    total_demand = sum(z.base_arrival_rate for z in zones)
    print(f"  Total base demand: {total_demand:.1f} EVs/hour")

    # =========================================================================
    # Step 2: Define candidate locations
    # =========================================================================
    print("\nStep 2: Defining candidate locations...")

    candidates = [
        CandidateLocation("loc01", "Downtown Central Parkade", 51.045, -114.058, "downtown"),
        CandidateLocation("loc02", "East Village Lot", 51.047, -114.048, "downtown"),
        CandidateLocation("loc03", "Beltline Mall", 51.038, -114.072, "beltline"),
        CandidateLocation("loc04", "17th Ave Station", 51.037, -114.080, "beltline"),
        CandidateLocation("loc05", "Kensington Plaza", 51.055, -114.088, "kensington"),
        CandidateLocation("loc06", "Bridgeland Hub", 51.056, -114.042, "bridgeland"),
        CandidateLocation("loc07", "Mission Grocery", 51.034, -114.056, "mission"),
        CandidateLocation("loc08", "4th Street Station", 51.036, -114.064, "mission"),
        CandidateLocation("loc09", "Inglewood Center", 51.036, -114.032, "inglewood"),
        CandidateLocation("loc10", "Sunnyside Park", 51.058, -114.092, "sunnyside"),
        CandidateLocation("loc11", "Hillhurst Community", 51.058, -114.102, "hillhurst"),
        CandidateLocation("loc12", "Eau Claire Market", 51.053, -114.068, "downtown"),
    ]

    print(f"  Defined {len(candidates)} candidate locations")

    # =========================================================================
    # Step 3: Create baseline (naive) station layout
    # =========================================================================
    print("\nStep 3: Creating baseline station layout...")

    # Baseline: Current state with suboptimal placement and sizing
    # Represents typical "first wave" infrastructure that wasn't fully optimized
    baseline_stations = [
        create_station("bs1", "Downtown Central", 51.045, -114.058, "downtown",
                       num_chargers=4, service_rate=1.33),
        create_station("bs2", "Beltline Mall", 51.038, -114.072, "beltline",
                       num_chargers=3, service_rate=1.33),
        create_station("bs3", "Bridgeland Hub", 51.056, -114.042, "bridgeland",
                       num_chargers=2, service_rate=1.33),
        create_station("bs4", "South Location", 51.030, -114.070, "mission",
                       num_chargers=2, service_rate=1.33),
    ]

    baseline_chargers = sum(s.num_chargers for s in baseline_stations)
    print(f"  Baseline: {len(baseline_stations)} stations, {baseline_chargers} chargers")

    # =========================================================================
    # Step 4: Run baseline simulation
    # =========================================================================
    print("\nStep 4: Running baseline simulation (1 week)...")

    sim_config = SimulationConfig(
        duration_hours=168,  # 1 week
        warmup_hours=24,
        random_seed=42
    )

    baseline_sim = SimulationEngine(sim_config)
    for station in baseline_stations:
        baseline_sim.add_station(station)
    for zone in zones:
        baseline_sim.add_zone(zone)

    baseline_results = baseline_sim.run()

    print(f"  Completed: {baseline_results.total_served} EVs served")
    print(f"  Average wait time: {baseline_results.avg_wait_time:.1f} minutes")
    print(f"  95th percentile wait: {baseline_results.p95_wait_time:.1f} minutes")
    print(f"  Average utilization: {baseline_results.avg_utilization:.1%}")

    # =========================================================================
    # Step 5: Run optimization
    # =========================================================================
    print("\nStep 5: Running station placement optimization...")

    opt_config = OptimizationConfig(
        budget=2_000_000,
        min_chargers_per_station=2,
        max_chargers_per_station=8,
        min_coverage_percent=0.90,
        max_utilization=0.85,
        max_iterations=50,
        simulation_duration_hours=72,
        simulation_warmup_hours=12,
        random_seed=42
    )

    optimizer = Optimizer(candidates, zones, opt_config)
    opt_result = optimizer.optimize()

    print(f"  Optimization complete")
    print(f"  Placed {len(opt_result.stations)} stations, {opt_result.total_chargers} chargers")
    print(f"  Total cost: ${opt_result.total_cost:,.0f}")
    print(f"  Coverage: {opt_result.coverage_percent:.1%}")

    # =========================================================================
    # Step 6: Run optimized simulation
    # =========================================================================
    print("\nStep 6: Running optimized simulation (1 week)...")

    optimized_stations = optimizer.create_stations_from_result(opt_result)

    optimized_sim = SimulationEngine(sim_config)
    for station in optimized_stations:
        optimized_sim.add_station(station)
    for zone in zones:
        optimized_sim.add_zone(zone)

    optimized_results = optimized_sim.run()

    print(f"  Completed: {optimized_results.total_served} EVs served")
    print(f"  Average wait time: {optimized_results.avg_wait_time:.1f} minutes")
    print(f"  95th percentile wait: {optimized_results.p95_wait_time:.1f} minutes")
    print(f"  Average utilization: {optimized_results.avg_utilization:.1%}")

    # =========================================================================
    # Step 7: Compare results
    # =========================================================================
    print("\n" + "=" * 70)
    print("COMPARISON: BASELINE vs OPTIMIZED")
    print("=" * 70)

    wait_improvement = ((baseline_results.avg_wait_time - optimized_results.avg_wait_time)
                        / baseline_results.avg_wait_time * 100)
    peak_improvement = ((baseline_results.p95_wait_time - optimized_results.p95_wait_time)
                        / baseline_results.p95_wait_time * 100)

    print(f"""
    Metric                  Baseline        Optimized       Change
    ─────────────────────────────────────────────────────────────────
    Stations                {len(baseline_stations):>8}        {len(opt_result.stations):>8}        +{len(opt_result.stations) - len(baseline_stations)}
    Total Chargers          {baseline_chargers:>8}        {opt_result.total_chargers:>8}        +{opt_result.total_chargers - baseline_chargers}
    Avg Wait Time (min)     {baseline_results.avg_wait_time:>8.1f}        {optimized_results.avg_wait_time:>8.1f}        -{wait_improvement:.0f}%
    P95 Wait Time (min)     {baseline_results.p95_wait_time:>8.1f}        {optimized_results.p95_wait_time:>8.1f}        -{peak_improvement:.0f}%
    Avg Utilization         {baseline_results.avg_utilization:>7.0%}        {optimized_results.avg_utilization:>7.0%}        {(optimized_results.avg_utilization - baseline_results.avg_utilization)*100:+.0f}pts
    EVs Served              {baseline_results.total_served:>8}        {optimized_results.total_served:>8}        +{optimized_results.total_served - baseline_results.total_served}
    """)

    print("Optimized Station Configuration:")
    print("-" * 70)
    for ps in opt_result.stations:
        print(f"  {ps.location.name:30} {ps.num_chargers} chargers  "
              f"~{ps.estimated_wait_minutes:.1f} min wait  "
              f"~{ps.estimated_utilization:.0%} util")

    # =========================================================================
    # Step 8: Save results
    # =========================================================================
    print("\nStep 8: Saving results...")

    output_dir = Path(__file__).parent / "data" / "demo_output"
    output_dir.mkdir(parents=True, exist_ok=True)

    results = {
        "generated_at": datetime.now().isoformat(),
        "scenario": "Calgary 2027 Pilot Demo",
        "zones": len(zones),
        "total_demand_evs_per_hour": total_demand,
        "baseline": {
            "stations": len(baseline_stations),
            "chargers": baseline_chargers,
            "avg_wait_minutes": round(baseline_results.avg_wait_time, 1),
            "p95_wait_minutes": round(baseline_results.p95_wait_time, 1),
            "utilization": round(baseline_results.avg_utilization, 3),
            "evs_served": baseline_results.total_served
        },
        "optimized": {
            "stations": len(opt_result.stations),
            "chargers": opt_result.total_chargers,
            "total_cost": opt_result.total_cost,
            "coverage": round(opt_result.coverage_percent, 3),
            "avg_wait_minutes": round(optimized_results.avg_wait_time, 1),
            "p95_wait_minutes": round(optimized_results.p95_wait_time, 1),
            "utilization": round(optimized_results.avg_utilization, 3),
            "evs_served": optimized_results.total_served,
            "station_details": [
                {
                    "name": ps.location.name,
                    "lat": ps.location.lat,
                    "lng": ps.location.lng,
                    "zone": ps.location.zone_id,
                    "chargers": ps.num_chargers,
                    "estimated_wait": round(ps.estimated_wait_minutes, 1),
                    "estimated_utilization": round(ps.estimated_utilization, 3)
                }
                for ps in opt_result.stations
            ]
        },
        "improvement": {
            "wait_time_reduction_percent": round(wait_improvement, 1),
            "peak_wait_reduction_percent": round(peak_improvement, 1)
        }
    }

    output_file = output_dir / "demo_results.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)

    print(f"  Results saved to: {output_file}")

    print("\n" + "=" * 70)
    print("DEMO COMPLETE")
    print("=" * 70)
    print(f"""
Key Takeaways:
  - Wait time reduced by {wait_improvement:.0f}% (from {baseline_results.avg_wait_time:.0f} to {optimized_results.avg_wait_time:.0f} minutes)
  - Coverage increased to {opt_result.coverage_percent:.0%} of zones
  - Utilization optimized to {optimized_results.avg_utilization:.0%} (healthy range)
  - Budget used: ${opt_result.total_cost:,.0f} of $2,000,000

To view the dashboard:
  1. Install requirements: pip install -r requirements.txt
  2. Run API: python -m uvicorn src.api.main:app --reload
  3. Open: http://localhost:8000/dashboard/
    """)


if __name__ == "__main__":
    main()
