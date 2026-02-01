"""
FastAPI Application for EV Charging Optimization

Provides REST endpoints for running optimizations, simulations,
and retrieving results.
"""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..models.queueing import ErlangC, analyze_station
from ..simulation.engine import SimulationEngine, SimulationConfig, ZoneConfig
from ..simulation.station import create_station
from ..optimization.optimizer import (
    Optimizer, OptimizationConfig, CandidateLocation
)
from ..data.saskatchewan import load_saskatchewan_data, haversine_distance

# Create FastAPI app
app = FastAPI(
    title="EV Charging Optimization API",
    description="API for EV charging station placement optimization",
    version="1.0.0"
)

# CORS middleware for dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directory for storing results
DATA_DIR = Path(__file__).parent.parent.parent / "data"
SCENARIOS_DIR = DATA_DIR / "scenarios"
SCENARIOS_DIR.mkdir(parents=True, exist_ok=True)


# =============================================================================
# Request/Response Models
# =============================================================================

class ZoneInput(BaseModel):
    zone_id: str
    name: str
    base_arrival_rate: float
    lat: float
    lng: float


class CandidateInput(BaseModel):
    location_id: str
    name: str
    lat: float
    lng: float
    zone_id: str
    fixed_cost: float = 50000
    charger_cost: float = 30000
    max_chargers: int = 10


class StationInput(BaseModel):
    station_id: str
    name: str
    lat: float
    lng: float
    zone_id: str
    num_chargers: int
    charger_type: str = "dcfc_50"
    service_rate: float = 1.33


class OptimizeRequest(BaseModel):
    scenario_name: str
    zones: list[ZoneInput]
    candidates: list[CandidateInput]
    budget: float = 2_000_000
    min_coverage: float = 0.90
    max_utilization: float = 0.85


class SimulateRequest(BaseModel):
    scenario_name: str
    zones: list[ZoneInput]
    stations: list[StationInput]
    duration_hours: float = 168
    warmup_hours: float = 24


class CompareRequest(BaseModel):
    scenario_name: str
    zones: list[ZoneInput]
    baseline_stations: list[StationInput]
    optimized_stations: list[StationInput]
    duration_hours: float = 168


class QueueAnalysisRequest(BaseModel):
    arrival_rate: float
    num_chargers: int
    charger_type: str = "dcfc_50"


# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/")
async def root():
    """API health check."""
    return {"status": "ok", "service": "EV Charging Optimization API"}


@app.get("/api/real-data")
async def get_real_data():
    """
    Get real Saskatchewan data from main22 repository.
    Returns population centers, existing stations, and optimization results.
    """
    try:
        # Load real data
        data = load_saskatchewan_data()
        
        # Load optimization results if available
        results_file = DATA_DIR / "output" / "optimization_results.json"
        optimization_results = None
        if results_file.exists():
            with open(results_file) as f:
                optimization_results = json.load(f)
        
        # Calculate coverage for existing stations
        existing_coverage = 0
        coverage_radius = 150.0
        for pop in data.population_centers:
            for station in data.existing_stations:
                dist = haversine_distance(pop.lat, pop.lon, station.lat, station.lon)
                if dist <= coverage_radius:
                    existing_coverage += pop.population
                    break
        
        return {
            "status": "ok",
            "data_source": "main22 (2021 Census + NRCan)",
            "population": {
                "total": data.total_population,
                "centers": [
                    {
                        "city": p.city,
                        "lat": p.lat,
                        "lon": p.lon,
                        "population": p.population
                    }
                    for p in data.population_centers
                ]
            },
            "existing_stations": [
                {
                    "station_id": s.station_id,
                    "lat": s.lat,
                    "lon": s.lon
                }
                for s in data.existing_stations
            ],
            "baseline_coverage_percent": round(existing_coverage / data.total_population * 100, 1),
            "optimization_results": optimization_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/run-optimization")
async def run_real_optimization():
    """
    Run optimization on real Saskatchewan data and return results.
    """
    try:
        # Load real data
        data = load_saskatchewan_data()
        
        # Create zones from population
        zones = []
        for pop in data.population_centers:
            ev_count = pop.population * 0.15
            daily_charges = ev_count / 3
            base_rate = max(0.5, daily_charges / 24)
            
            zones.append(ZoneConfig(
                zone_id=pop.city.lower().replace(" ", "_"),
                name=pop.city,
                base_arrival_rate=base_rate,
                lat=pop.lat,
                lng=pop.lon
            ))
        
        # Create baseline stations
        baseline_stations = []
        for i, existing in enumerate(data.existing_stations):
            nearest = min(
                data.population_centers,
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
            baseline_stations.append(station)
        
        # Find optimal new locations
        new_stations = []
        all_stations = list(baseline_stations)
        coverage_radius = 150.0
        
        for i in range(10):
            best_location = None
            best_score = -float('inf')
            
            for pop in data.population_centers:
                min_dist = min(
                    haversine_distance(pop.lat, pop.lon, s.lat, s.lng)
                    for s in all_stations
                )
                
                if min_dist <= coverage_radius:
                    continue
                
                score = pop.population * 0.001 + min_dist * 0.1
                if min_dist > 200:
                    score += 50
                
                if score > best_score:
                    best_score = score
                    best_location = pop
            
            if best_location:
                station = create_station(
                    station_id=f"new_{i+1}",
                    name=f"New Station ({best_location.city})",
                    lat=best_location.lat,
                    lng=best_location.lon,
                    zone_id=f"new_zone_{i+1}",
                    num_chargers=4,
                    charger_type="dcfc_50",
                    service_rate=1.33
                )
                new_stations.append(station)
                all_stations.append(station)
        
        # Calculate coverages
        def calc_coverage(stations):
            covered = 0
            max_dist = 0
            for pop in data.population_centers:
                min_dist = min(
                    haversine_distance(pop.lat, pop.lon, s.lat, s.lng)
                    for s in stations
                )
                max_dist = max(max_dist, min_dist)
                if min_dist <= coverage_radius:
                    covered += pop.population
            return covered / data.total_population * 100, max_dist
        
        baseline_cov, baseline_dist = calc_coverage(baseline_stations)
        optimized_cov, optimized_dist = calc_coverage(all_stations)
        
        return {
            "status": "ok",
            "baseline": {
                "stations": len(baseline_stations),
                "chargers": len(baseline_stations) * 4,
                "coverage_percent": round(baseline_cov, 1),
                "max_distance_km": round(baseline_dist, 0),
                "stations_list": [
                    {"name": s.name, "lat": s.lat, "lng": s.lng, "chargers": s.num_chargers, "type": "existing"}
                    for s in baseline_stations
                ]
            },
            "optimized": {
                "stations": len(all_stations),
                "chargers": len(all_stations) * 4,
                "new_stations": len(new_stations),
                "coverage_percent": round(optimized_cov, 1),
                "max_distance_km": round(optimized_dist, 0),
                "stations_list": [
                    {"name": s.name, "lat": s.lat, "lng": s.lng, "chargers": s.num_chargers, "type": "existing"}
                    for s in baseline_stations
                ] + [
                    {"name": s.name, "lat": s.lat, "lng": s.lng, "chargers": s.num_chargers, "type": "new"}
                    for s in new_stations
                ]
            },
            "improvement": {
                "coverage_increase": round(optimized_cov - baseline_cov, 1),
                "distance_reduction": round(baseline_dist - optimized_dist, 0)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/queue-analysis")
async def queue_analysis(request: QueueAnalysisRequest):
    """
    Analyze a single station using queueing theory.

    Returns expected wait times and utilization.
    """
    metrics = analyze_station(
        arrival_rate=request.arrival_rate,
        num_chargers=request.num_chargers,
        charger_type=request.charger_type
    )

    return {
        "arrival_rate": metrics.arrival_rate,
        "service_rate": metrics.service_rate,
        "num_chargers": metrics.num_servers,
        "utilization": round(metrics.utilization, 3),
        "probability_of_waiting": round(metrics.prob_wait, 3),
        "avg_wait_minutes": round(metrics.avg_wait_minutes, 1),
        "avg_system_minutes": round(metrics.avg_system_minutes, 1),
        "avg_queue_length": round(metrics.avg_queue_length, 2),
        "is_stable": metrics.is_stable
    }


@app.post("/api/optimize")
async def run_optimization(request: OptimizeRequest, background_tasks: BackgroundTasks):
    """
    Run station placement optimization.

    This is a long-running operation. Returns immediately with scenario ID,
    results will be saved to file.
    """
    scenario_id = f"scn_{uuid.uuid4().hex[:8]}"

    # Convert inputs
    zones = [
        ZoneConfig(
            zone_id=z.zone_id,
            name=z.name,
            base_arrival_rate=z.base_arrival_rate,
            lat=z.lat,
            lng=z.lng
        )
        for z in request.zones
    ]

    candidates = [
        CandidateLocation(
            location_id=c.location_id,
            name=c.name,
            lat=c.lat,
            lng=c.lng,
            zone_id=c.zone_id,
            fixed_cost=c.fixed_cost,
            charger_cost=c.charger_cost,
            max_chargers=c.max_chargers
        )
        for c in request.candidates
    ]

    config = OptimizationConfig(
        budget=request.budget,
        min_coverage_percent=request.min_coverage,
        max_utilization=request.max_utilization
    )

    # Run optimization in background
    def run_opt():
        optimizer = Optimizer(candidates, zones, config)
        result = optimizer.optimize()

        # Save results
        output = {
            "scenario_id": scenario_id,
            "scenario_name": request.scenario_name,
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "config": {
                "budget": request.budget,
                "min_coverage": request.min_coverage,
                "max_utilization": request.max_utilization
            },
            "results": {
                "total_stations": len(result.stations),
                "total_chargers": result.total_chargers,
                "total_cost": result.total_cost,
                "coverage_percent": result.coverage_percent,
                "estimated_avg_wait": result.estimated_avg_wait,
                "improvement_percent": result.improvement_percent,
                "stations": [
                    {
                        "location_id": ps.location.location_id,
                        "name": ps.location.name,
                        "lat": ps.location.lat,
                        "lng": ps.location.lng,
                        "zone_id": ps.location.zone_id,
                        "num_chargers": ps.num_chargers,
                        "charger_type": ps.charger_type,
                        "estimated_demand": ps.estimated_demand,
                        "estimated_utilization": ps.estimated_utilization,
                        "estimated_wait_minutes": ps.estimated_wait_minutes
                    }
                    for ps in result.stations
                ]
            }
        }

        with open(SCENARIOS_DIR / f"{scenario_id}.json", "w") as f:
            json.dump(output, f, indent=2)

    background_tasks.add_task(run_opt)

    return {
        "scenario_id": scenario_id,
        "status": "processing",
        "message": "Optimization started. Check /api/scenarios/{scenario_id} for results."
    }


@app.post("/api/simulate")
async def run_simulation(request: SimulateRequest):
    """
    Run a discrete-event simulation with given station layout.
    """
    # Create zones
    zones = [
        ZoneConfig(
            zone_id=z.zone_id,
            name=z.name,
            base_arrival_rate=z.base_arrival_rate,
            lat=z.lat,
            lng=z.lng
        )
        for z in request.zones
    ]

    # Create stations
    stations = [
        create_station(
            station_id=s.station_id,
            name=s.name,
            lat=s.lat,
            lng=s.lng,
            zone_id=s.zone_id,
            num_chargers=s.num_chargers,
            charger_type=s.charger_type,
            service_rate=s.service_rate
        )
        for s in request.stations
    ]

    # Run simulation
    config = SimulationConfig(
        duration_hours=request.duration_hours,
        warmup_hours=request.warmup_hours
    )

    sim = SimulationEngine(config)
    for station in stations:
        sim.add_station(station)
    for zone in zones:
        sim.add_zone(zone)

    results = sim.run()

    return {
        "scenario_name": request.scenario_name,
        "duration_hours": results.duration_hours,
        "total_arrivals": results.total_arrivals,
        "total_served": results.total_served,
        "total_balked": results.total_balked,
        "metrics": {
            "avg_wait_minutes": round(results.avg_wait_time, 1),
            "median_wait_minutes": round(results.median_wait_time, 1),
            "p95_wait_minutes": round(results.p95_wait_time, 1),
            "max_wait_minutes": round(results.max_wait_time, 1),
            "avg_utilization": round(results.avg_utilization, 3),
            "throughput_per_hour": round(results.total_throughput, 2)
        },
        "station_metrics": results.station_metrics
    }


@app.post("/api/compare")
async def run_comparison(request: CompareRequest):
    """
    Compare baseline vs optimized station layouts.
    """
    # Create zones
    zones = [
        ZoneConfig(
            zone_id=z.zone_id,
            name=z.name,
            base_arrival_rate=z.base_arrival_rate,
            lat=z.lat,
            lng=z.lng
        )
        for z in request.zones
    ]

    # Create baseline stations
    baseline_stations = [
        create_station(
            station_id=s.station_id,
            name=s.name,
            lat=s.lat,
            lng=s.lng,
            zone_id=s.zone_id,
            num_chargers=s.num_chargers,
            charger_type=s.charger_type,
            service_rate=s.service_rate
        )
        for s in request.baseline_stations
    ]

    # Create optimized stations
    optimized_stations = [
        create_station(
            station_id=s.station_id,
            name=s.name,
            lat=s.lat,
            lng=s.lng,
            zone_id=s.zone_id,
            num_chargers=s.num_chargers,
            charger_type=s.charger_type,
            service_rate=s.service_rate
        )
        for s in request.optimized_stations
    ]

    config = SimulationConfig(
        duration_hours=request.duration_hours,
        warmup_hours=24
    )

    # Run baseline simulation
    baseline_sim = SimulationEngine(config)
    for station in baseline_stations:
        baseline_sim.add_station(station)
    for zone in zones:
        baseline_sim.add_zone(zone)
    baseline_results = baseline_sim.run()

    # Run optimized simulation
    optimized_sim = SimulationEngine(config)
    for station in optimized_stations:
        optimized_sim.add_station(station)
    for zone in zones:
        optimized_sim.add_zone(zone)
    optimized_results = optimized_sim.run()

    # Calculate improvements
    wait_improvement = (
        (baseline_results.avg_wait_time - optimized_results.avg_wait_time)
        / baseline_results.avg_wait_time * 100
        if baseline_results.avg_wait_time > 0 else 0
    )

    return {
        "scenario_name": request.scenario_name,
        "baseline": {
            "total_chargers": sum(s.num_chargers for s in baseline_stations),
            "avg_wait_minutes": round(baseline_results.avg_wait_time, 1),
            "p95_wait_minutes": round(baseline_results.p95_wait_time, 1),
            "max_wait_minutes": round(baseline_results.max_wait_time, 1),
            "avg_utilization": round(baseline_results.avg_utilization, 3),
            "station_metrics": baseline_results.station_metrics
        },
        "optimized": {
            "total_chargers": sum(s.num_chargers for s in optimized_stations),
            "avg_wait_minutes": round(optimized_results.avg_wait_time, 1),
            "p95_wait_minutes": round(optimized_results.p95_wait_time, 1),
            "max_wait_minutes": round(optimized_results.max_wait_time, 1),
            "avg_utilization": round(optimized_results.avg_utilization, 3),
            "station_metrics": optimized_results.station_metrics
        },
        "improvement": {
            "wait_time_reduction_percent": round(wait_improvement, 1),
            "utilization_change": round(
                optimized_results.avg_utilization - baseline_results.avg_utilization, 3
            )
        }
    }


@app.get("/api/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str):
    """
    Get results for a specific scenario.
    """
    scenario_file = SCENARIOS_DIR / f"{scenario_id}.json"

    if not scenario_file.exists():
        raise HTTPException(status_code=404, detail="Scenario not found")

    with open(scenario_file) as f:
        return json.load(f)


@app.get("/api/scenarios")
async def list_scenarios():
    """
    List all saved scenarios.
    """
    scenarios = []
    for f in SCENARIOS_DIR.glob("*.json"):
        with open(f) as file:
            data = json.load(file)
            scenarios.append({
                "scenario_id": data.get("scenario_id"),
                "scenario_name": data.get("scenario_name"),
                "status": data.get("status"),
                "timestamp": data.get("timestamp")
            })

    return {"scenarios": sorted(scenarios, key=lambda x: x.get("timestamp", ""), reverse=True)}


# Serve dashboard static files if present
dashboard_path = Path(__file__).parent.parent.parent / "dashboard"
if dashboard_path.exists():
    app.mount("/dashboard", StaticFiles(directory=str(dashboard_path), html=True), name="dashboard")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
