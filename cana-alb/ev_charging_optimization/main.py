#!/usr/bin/env python3
"""
Saskatchewan EV Charging Optimization System - Main Entry Point

This is the unified entry point that integrates:
- Real data from main22 repository (2021 Census + NRCan stations)
- Discrete-event simulation engine
- Optimization algorithms (greedy + RL)
- Results visualization and export

Usage:
    python main.py                    # Run full optimization
    python main.py --mode baseline    # Run baseline only
    python main.py --mode simulate    # Run simulation only
    python main.py --api              # Start API server

Author: EV Charging Optimization Team
Data Sources: 2021 Census, NRCan, OpenStreetMap
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Ensure src is in path
sys.path.insert(0, str(Path(__file__).parent))

from src.data.saskatchewan import load_saskatchewan_data, SaskatchewanData, haversine_distance
from src.simulation.engine import SimulationEngine, SimulationConfig, ZoneConfig
from src.simulation.station import create_station, Station


class EVChargingOptimizer:
    """
    Main optimizer class that integrates all components.
    """
    
    def __init__(self, coverage_radius_km: float = 150.0):
        self.coverage_radius_km = coverage_radius_km
        self.data: SaskatchewanData = None
        self.zones: list[ZoneConfig] = []
        self.baseline_stations: list[Station] = []
        self.optimized_stations: list[Station] = []
        self.new_stations: list[Station] = []
        
    def load_data(self) -> None:
        """Load real Saskatchewan data."""
        print("\n" + "=" * 70)
        print("LOADING REAL SASKATCHEWAN DATA")
        print("=" * 70)
        
        self.data = load_saskatchewan_data()
        
        print(f"\n  Population centers: {len(self.data.population_centers)}")
        print(f"  Total population: {self.data.total_population:,}")
        print(f"  Existing stations: {len(self.data.existing_stations)}")
        
        # Create simulation zones from population
        self._create_zones()
        
        # Create baseline stations
        self._create_baseline_stations()
        
    def _create_zones(self) -> None:
        """Convert population data to simulation zones."""
        self.zones = []
        for pop in self.data.population_centers:
            # Demand based on population (15% EV adoption, charge every 3 days)
            ev_count = pop.population * 0.15
            daily_charges = ev_count / 3
            base_rate = max(0.5, daily_charges / 24)
            
            zone = ZoneConfig(
                zone_id=pop.city.lower().replace(" ", "_"),
                name=pop.city,
                base_arrival_rate=base_rate,
                lat=pop.lat,
                lng=pop.lon
            )
            self.zones.append(zone)
            
        print(f"  Created {len(self.zones)} demand zones")
        print(f"  Total demand: {sum(z.base_arrival_rate for z in self.zones):.1f} EVs/hour")
        
    def _create_baseline_stations(self) -> None:
        """Create baseline stations from existing data."""
        self.baseline_stations = []
        for i, existing in enumerate(self.data.existing_stations):
            # Find nearest city
            nearest = min(
                self.data.population_centers,
                key=lambda p: haversine_distance(existing.lat, existing.lon, p.lat, p.lon)
            )
            
            station = create_station(
                station_id=f"existing_{i+1}",
                name=f"Station {i+1} ({nearest.city})",
                lat=existing.lat,
                lng=existing.lon,
                zone_id=f"zone_{i+1}",
                num_chargers=4,
                charger_type="dcfc_50",
                service_rate=1.33
            )
            self.baseline_stations.append(station)
            
    def calculate_coverage(self, stations: list[Station]) -> dict:
        """Calculate coverage statistics for stations."""
        covered_pop = 0
        covered_centers = 0
        max_distance = 0
        
        for pop in self.data.population_centers:
            min_dist = min(
                haversine_distance(pop.lat, pop.lon, s.lat, s.lng)
                for s in stations
            )
            max_distance = max(max_distance, min_dist)
            
            if min_dist <= self.coverage_radius_km:
                covered_pop += pop.population
                covered_centers += 1
                
        return {
            "covered_population": covered_pop,
            "coverage_percent": covered_pop / self.data.total_population * 100,
            "covered_centers": covered_centers,
            "total_centers": len(self.data.population_centers),
            "max_distance_km": max_distance,
        }
        
    def run_simulation(self, stations: list[Station], name: str = "Simulation") -> dict:
        """Run discrete-event simulation."""
        print(f"\n  Running {name} (1 week)...")
        
        config = SimulationConfig(
            duration_hours=168,
            warmup_hours=24,
            random_seed=42,
            max_travel_distance_km=200.0,
        )
        
        sim = SimulationEngine(config)
        for station in stations:
            sim.add_station(station)
        for zone in self.zones:
            sim.add_zone(zone)
            
        results = sim.run()
        
        print(f"    EVs served: {results.total_served}")
        print(f"    Avg wait: {results.avg_wait_time:.1f} min")
        print(f"    Utilization: {results.avg_utilization:.1%}")
        
        return {
            "total_served": results.total_served,
            "avg_wait_time": results.avg_wait_time,
            "p95_wait_time": results.p95_wait_time,
            "avg_utilization": results.avg_utilization,
            "total_balked": results.total_balked,
        }
        
    def find_optimal_locations(self, num_new: int = 10) -> list[Station]:
        """Find optimal locations for new stations using greedy algorithm."""
        print(f"\n  Finding optimal locations for up to {num_new} new stations...")
        
        new_stations = []
        current_stations = list(self.baseline_stations)
        
        for i in range(num_new):
            best_location = None
            best_score = -float('inf')
            
            for pop in self.data.population_centers:
                # Check if already covered
                min_dist = min(
                    haversine_distance(pop.lat, pop.lon, s.lat, s.lng)
                    for s in current_stations
                ) if current_stations else float('inf')
                
                if min_dist <= self.coverage_radius_km:
                    continue  # Already covered
                    
                # Score: population + distance bonus
                score = pop.population * 0.001 + min_dist * 0.1
                if min_dist > 200:
                    score += 50  # Remote area bonus
                    
                if score > best_score:
                    best_score = score
                    best_location = pop
                    
            if best_location:
                station = create_station(
                    station_id=f"optimized_{i+1}",
                    name=f"New Station {i+1} ({best_location.city})",
                    lat=best_location.lat,
                    lng=best_location.lon,
                    zone_id=f"new_zone_{i+1}",
                    num_chargers=4,
                    charger_type="dcfc_50",
                    service_rate=1.33
                )
                new_stations.append(station)
                current_stations.append(station)
                print(f"    + {station.name}")
            else:
                break  # No more uncovered areas
                
        return new_stations
        
    def optimize(self) -> dict:
        """Run full optimization pipeline."""
        print("\n" + "=" * 70)
        print("RUNNING OPTIMIZATION")
        print("=" * 70)
        
        # Baseline analysis
        print("\n[BASELINE ANALYSIS]")
        baseline_coverage = self.calculate_coverage(self.baseline_stations)
        print(f"  Stations: {len(self.baseline_stations)}")
        print(f"  Coverage: {baseline_coverage['coverage_percent']:.1f}%")
        print(f"  Max distance: {baseline_coverage['max_distance_km']:.0f} km")
        
        baseline_sim = self.run_simulation(self.baseline_stations, "Baseline Simulation")
        
        # Find optimal new locations
        print("\n[OPTIMIZATION]")
        self.new_stations = self.find_optimal_locations(num_new=10)
        
        # Optimized analysis
        print("\n[OPTIMIZED ANALYSIS]")
        self.optimized_stations = self.baseline_stations + self.new_stations
        optimized_coverage = self.calculate_coverage(self.optimized_stations)
        print(f"  Total stations: {len(self.optimized_stations)}")
        print(f"  New stations: {len(self.new_stations)}")
        print(f"  Coverage: {optimized_coverage['coverage_percent']:.1f}%")
        print(f"  Max distance: {optimized_coverage['max_distance_km']:.0f} km")
        
        optimized_sim = self.run_simulation(self.optimized_stations, "Optimized Simulation")
        
        return {
            "baseline": {
                "stations": len(self.baseline_stations),
                "coverage": baseline_coverage,
                "simulation": baseline_sim,
            },
            "optimized": {
                "stations": len(self.optimized_stations),
                "new_stations": len(self.new_stations),
                "coverage": optimized_coverage,
                "simulation": optimized_sim,
                "new_station_details": [
                    {"name": s.name, "lat": s.lat, "lng": s.lng, "chargers": s.num_chargers}
                    for s in self.new_stations
                ],
            },
        }
        
    def print_results(self, results: dict) -> None:
        """Print comparison results."""
        b = results["baseline"]
        o = results["optimized"]
        
        print("\n" + "=" * 70)
        print("RESULTS COMPARISON")
        print("=" * 70)
        
        print(f"""
    Metric                      Baseline        Optimized       Change
    ─────────────────────────────────────────────────────────────────────
    Stations                    {b['stations']:>8}        {o['stations']:>8}        +{o['new_stations']}
    Coverage                    {b['coverage']['coverage_percent']:>7.1f}%        {o['coverage']['coverage_percent']:>7.1f}%        +{o['coverage']['coverage_percent'] - b['coverage']['coverage_percent']:.1f}%
    Max Distance (km)           {b['coverage']['max_distance_km']:>8.0f}        {o['coverage']['max_distance_km']:>8.0f}        -{b['coverage']['max_distance_km'] - o['coverage']['max_distance_km']:.0f}
    EVs Served                  {b['simulation']['total_served']:>8}        {o['simulation']['total_served']:>8}        +{o['simulation']['total_served'] - b['simulation']['total_served']}
    EVs Balked                  {b['simulation']['total_balked']:>8}        {o['simulation']['total_balked']:>8}        -{b['simulation']['total_balked'] - o['simulation']['total_balked']}
        """)
        
        print("New Station Locations:")
        print("-" * 70)
        for s in o["new_station_details"]:
            print(f"  {s['name']:40} ({s['lat']:.3f}, {s['lng']:.3f})")
            
    def save_results(self, results: dict, output_dir: Path = None) -> None:
        """Save results to files."""
        output_dir = output_dir or Path(__file__).parent / "data" / "output"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save JSON results
        results_file = output_dir / "optimization_results.json"
        output = {
            "generated_at": datetime.now().isoformat(),
            "data_source": "main22 (2021 Census + NRCan)",
            "population": self.data.total_population,
            **results,
        }
        with open(results_file, "w") as f:
            json.dump(output, f, indent=2, default=str)
        print(f"\n  Results saved: {results_file}")
        
        # Save GeoJSON for new stations
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"name": s.name, "chargers": s.num_chargers, "type": "new"},
                    "geometry": {"type": "Point", "coordinates": [s.lng, s.lat]}
                }
                for s in self.new_stations
            ]
        }
        geojson_file = output_dir / "new_stations.geojson"
        with open(geojson_file, "w") as f:
            json.dump(geojson, f, indent=2)
        print(f"  GeoJSON saved: {geojson_file}")


def main():
    parser = argparse.ArgumentParser(description="Saskatchewan EV Charging Optimization")
    parser.add_argument("--mode", choices=["full", "baseline", "optimize"], default="full",
                        help="Run mode: full (default), baseline only, or optimize only")
    parser.add_argument("--api", action="store_true", help="Start API server")
    args = parser.parse_args()
    
    if args.api:
        import uvicorn
        print("Starting API server...")
        uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=True)
        return
        
    print("=" * 70)
    print("SASKATCHEWAN EV CHARGING OPTIMIZATION SYSTEM")
    print("Using Real Data from main22 Repository")
    print("=" * 70)
    
    optimizer = EVChargingOptimizer(coverage_radius_km=150.0)
    optimizer.load_data()
    
    if args.mode == "baseline":
        coverage = optimizer.calculate_coverage(optimizer.baseline_stations)
        print(f"\nBaseline Coverage: {coverage['coverage_percent']:.1f}%")
        results = optimizer.run_simulation(optimizer.baseline_stations, "Baseline")
    else:
        results = optimizer.optimize()
        optimizer.print_results(results)
        optimizer.save_results(results)
        
    print("\n" + "=" * 70)
    print("COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
