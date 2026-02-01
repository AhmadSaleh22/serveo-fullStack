#!/usr/bin/env python3
"""
Compare Optimization Algorithms: Greedy+LocalSearch vs Reinforcement Learning

This script runs both optimization approaches on the same problem and
compares their performance using simulation.
"""

import time
import json
from pathlib import Path

from src.simulation.engine import SimulationEngine, SimulationConfig, ZoneConfig
from src.simulation.station import create_station
from src.optimization.optimizer import Optimizer, OptimizationConfig, CandidateLocation
from src.optimization.rl_optimizer import RLOptimizer, RLOptimizerConfig


def main():
    print("=" * 70)
    print("OPTIMIZER COMPARISON: Greedy+LocalSearch vs Reinforcement Learning")
    print("=" * 70)

    # =========================================================================
    # Define Calgary zones (same for both optimizers)
    # =========================================================================
    print("\n[1/5] Defining Calgary zones...")

    zones = [
        ZoneConfig(zone_id="downtown", name="Downtown Core", base_arrival_rate=5.0, lat=51.045, lng=-114.057),
        ZoneConfig(zone_id="beltline", name="Beltline", base_arrival_rate=3.5, lat=51.038, lng=-114.070),
        ZoneConfig(zone_id="kensington", name="Kensington", base_arrival_rate=2.0, lat=51.055, lng=-114.088),
        ZoneConfig(zone_id="bridgeland", name="Bridgeland", base_arrival_rate=1.5, lat=51.055, lng=-114.042),
        ZoneConfig(zone_id="mission", name="Mission", base_arrival_rate=2.5, lat=51.035, lng=-114.056),
        ZoneConfig(zone_id="inglewood", name="Inglewood", base_arrival_rate=1.5, lat=51.035, lng=-114.030),
        ZoneConfig(zone_id="sunnyside", name="Sunnyside", base_arrival_rate=1.5, lat=51.058, lng=-114.090),
        ZoneConfig(zone_id="hillhurst", name="Hillhurst", base_arrival_rate=1.5, lat=51.058, lng=-114.100),
    ]

    total_demand = sum(z.base_arrival_rate for z in zones)
    print(f"    {len(zones)} zones, {total_demand:.1f} EVs/hour total demand")

    # Candidate locations for Greedy optimizer
    candidates = [
        CandidateLocation("loc01", "Downtown Central", 51.045, -114.058, "downtown"),
        CandidateLocation("loc02", "East Village", 51.047, -114.048, "downtown"),
        CandidateLocation("loc03", "Beltline Mall", 51.038, -114.072, "beltline"),
        CandidateLocation("loc04", "17th Ave", 51.037, -114.080, "beltline"),
        CandidateLocation("loc05", "Kensington Plaza", 51.055, -114.088, "kensington"),
        CandidateLocation("loc06", "Bridgeland Hub", 51.056, -114.042, "bridgeland"),
        CandidateLocation("loc07", "Mission Grocery", 51.034, -114.056, "mission"),
        CandidateLocation("loc08", "4th Street", 51.036, -114.064, "mission"),
        CandidateLocation("loc09", "Inglewood Center", 51.036, -114.032, "inglewood"),
        CandidateLocation("loc10", "Sunnyside Park", 51.058, -114.092, "sunnyside"),
        CandidateLocation("loc11", "Hillhurst Community", 51.058, -114.102, "hillhurst"),
        CandidateLocation("loc12", "Eau Claire", 51.053, -114.068, "downtown"),
    ]

    # =========================================================================
    # Run Greedy + Local Search Optimizer
    # =========================================================================
    print("\n[2/5] Running Greedy + Local Search optimizer...")

    greedy_config = OptimizationConfig(
        budget=1_500_000,
        min_chargers_per_station=2,
        max_chargers_per_station=6,
        min_coverage_percent=0.90,
        max_iterations=30,
        simulation_duration_hours=48,
        simulation_warmup_hours=8,
    )

    greedy_start = time.time()
    greedy_optimizer = Optimizer(candidates, zones, greedy_config)
    greedy_result = greedy_optimizer.optimize()
    greedy_time = time.time() - greedy_start

    greedy_stations = greedy_optimizer.create_stations_from_result(greedy_result)
    print(f"    Completed in {greedy_time:.1f}s")
    print(f"    Placed {len(greedy_stations)} stations, {sum(s.num_chargers for s in greedy_stations)} chargers")

    # =========================================================================
    # Run RL (PPO) Optimizer
    # =========================================================================
    print("\n[3/5] Running Reinforcement Learning (PPO) optimizer...")

    rl_config = RLOptimizerConfig(
        max_stations=10,
        training_timesteps=20_000,  # Faster training for comparison
        coverage_radius_km=5.0,
        chargers_per_station=3,
        verbose=False
    )

    rl_start = time.time()
    rl_optimizer = RLOptimizer(zones, rl_config)
    rl_stations = rl_optimizer.optimize()
    rl_time = time.time() - rl_start

    print(f"    Completed in {rl_time:.1f}s")
    print(f"    Placed {len(rl_stations)} stations, {sum(s.num_chargers for s in rl_stations)} chargers")

    # =========================================================================
    # Simulate both solutions
    # =========================================================================
    print("\n[4/5] Running simulations (1 week each)...")

    sim_config = SimulationConfig(
        duration_hours=168,
        warmup_hours=24,
        random_seed=42
    )

    # Simulate Greedy solution
    greedy_sim = SimulationEngine(sim_config)
    for station in greedy_stations:
        greedy_sim.add_station(station)
    for zone in zones:
        greedy_sim.add_zone(zone)
    greedy_results = greedy_sim.run()

    # Simulate RL solution
    rl_sim = SimulationEngine(sim_config)
    for station in rl_stations:
        rl_sim.add_station(station)
    for zone in zones:
        rl_sim.add_zone(zone)
    rl_results = rl_sim.run()

    print("    Simulations complete")

    # =========================================================================
    # Compare results
    # =========================================================================
    print("\n" + "=" * 70)
    print("COMPARISON RESULTS")
    print("=" * 70)

    print(f"""
    Metric                    Greedy+LS       RL (PPO)        Winner
    ────────────────────────────────────────────────────────────────────
    Optimization Time         {greedy_time:>8.1f}s       {rl_time:>8.1f}s       {"Greedy" if greedy_time < rl_time else "RL"}
    Stations Placed           {len(greedy_stations):>8}        {len(rl_stations):>8}        -
    Total Chargers            {sum(s.num_chargers for s in greedy_stations):>8}        {sum(s.num_chargers for s in rl_stations):>8}        -

    Avg Wait Time (min)       {greedy_results.avg_wait_time:>8.1f}        {rl_results.avg_wait_time:>8.1f}        {"Greedy" if greedy_results.avg_wait_time < rl_results.avg_wait_time else "RL"}
    P95 Wait Time (min)       {greedy_results.p95_wait_time:>8.1f}        {rl_results.p95_wait_time:>8.1f}        {"Greedy" if greedy_results.p95_wait_time < rl_results.p95_wait_time else "RL"}
    Max Wait Time (min)       {greedy_results.max_wait_time:>8.1f}        {rl_results.max_wait_time:>8.1f}        {"Greedy" if greedy_results.max_wait_time < rl_results.max_wait_time else "RL"}

    Avg Utilization           {greedy_results.avg_utilization:>7.0%}        {rl_results.avg_utilization:>7.0%}        {"Greedy" if 0.5 < greedy_results.avg_utilization < 0.75 else "RL" if 0.5 < rl_results.avg_utilization < 0.75 else "Tie"}
    EVs Served (week)         {greedy_results.total_served:>8}        {rl_results.total_served:>8}        {"Greedy" if greedy_results.total_served > rl_results.total_served else "RL"}
    """)

    # Determine overall winner
    greedy_score = 0
    rl_score = 0

    # Wait time (lower is better)
    if greedy_results.avg_wait_time < rl_results.avg_wait_time:
        greedy_score += 3
    else:
        rl_score += 3

    # Utilization (50-70% is optimal)
    greedy_util_score = abs(greedy_results.avg_utilization - 0.6)
    rl_util_score = abs(rl_results.avg_utilization - 0.6)
    if greedy_util_score < rl_util_score:
        greedy_score += 2
    else:
        rl_score += 2

    # EVs served (higher is better)
    if greedy_results.total_served > rl_results.total_served:
        greedy_score += 1
    else:
        rl_score += 1

    # Optimization time (faster is better for prototyping)
    if greedy_time < rl_time:
        greedy_score += 1
    else:
        rl_score += 1

    print(f"    OVERALL SCORE:        {greedy_score:>8}        {rl_score:>8}        {'GREEDY+LS WINS!' if greedy_score > rl_score else 'RL WINS!' if rl_score > greedy_score else 'TIE!'}")

    # =========================================================================
    # Show station details
    # =========================================================================
    print("\n" + "=" * 70)
    print("STATION PLACEMENTS")
    print("=" * 70)

    print("\nGreedy + Local Search Stations:")
    for s in greedy_stations:
        print(f"    {s.name:30} {s.num_chargers} chargers at ({s.lat:.4f}, {s.lng:.4f})")

    print("\nRL (PPO) Stations:")
    for s in rl_stations:
        print(f"    {s.name:30} {s.num_chargers} chargers at ({s.lat:.4f}, {s.lng:.4f})")

    # =========================================================================
    # Analysis
    # =========================================================================
    print("\n" + "=" * 70)
    print("ANALYSIS")
    print("=" * 70)

    print("""
    Key Observations:

    1. GREEDY + LOCAL SEARCH:
       - Uses predefined candidate locations (real-world constraints)
       - Optimizes charger counts based on demand estimates
       - Fast and deterministic
       - Good for operational planning

    2. REINFORCEMENT LEARNING (PPO):
       - Learns placement policy through trial and error
       - Can discover non-obvious locations
       - Requires training time
       - Good for strategic exploration

    3. RECOMMENDATION:
       - Use Greedy+LS for production deployment (faster, predictable)
       - Use RL for exploring new regions or validating decisions
       - Hybrid approach: RL suggests locations, Greedy optimizes charger counts
    """)

    # Save results
    output_dir = Path("data/comparison_output")
    output_dir.mkdir(parents=True, exist_ok=True)

    results = {
        "greedy": {
            "time_seconds": greedy_time,
            "stations": len(greedy_stations),
            "chargers": sum(s.num_chargers for s in greedy_stations),
            "avg_wait_minutes": greedy_results.avg_wait_time,
            "p95_wait_minutes": greedy_results.p95_wait_time,
            "utilization": greedy_results.avg_utilization,
            "evs_served": greedy_results.total_served,
            "score": greedy_score
        },
        "rl": {
            "time_seconds": rl_time,
            "stations": len(rl_stations),
            "chargers": sum(s.num_chargers for s in rl_stations),
            "avg_wait_minutes": rl_results.avg_wait_time,
            "p95_wait_minutes": rl_results.p95_wait_time,
            "utilization": rl_results.avg_utilization,
            "evs_served": rl_results.total_served,
            "score": rl_score
        },
        "winner": "greedy" if greedy_score > rl_score else "rl" if rl_score > greedy_score else "tie"
    }

    with open(output_dir / "comparison_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nResults saved to {output_dir / 'comparison_results.json'}")


if __name__ == "__main__":
    main()
