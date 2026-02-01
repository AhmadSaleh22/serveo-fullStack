# EV Charging Station Optimization System
## Internal Prototype Design Document

**Version:** 1.0
**Status:** Pilot/Proof-of-Concept
**Scope:** Canadian Urban Environment (Calgary Pilot)
**Author:** Engineering Team
**Date:** February 2026

---

## Executive Summary

This document describes the technical design for an internal optimization system that determines optimal EV charging station locations to minimize waiting times while respecting capacity and demand constraints.

**Core Problem:** Unoptimized placement of EV charging stations leads to:
- Excessive waiting times at high-demand locations
- Underutilization at poorly-placed stations
- Poor user experience driving EV adoption resistance
- Inefficient capital allocation

**Solution Approach:** A queueing-theory-based optimization model combined with discrete-event simulation to evaluate and optimize station placement decisions.

---

## 1. Model Design

### 1.1 Queueing Model Foundation

We model each charging station as an **M/M/s queue** (multiple server queue):

| Symbol | Meaning | Plain English |
|--------|---------|---------------|
| λ (lambda) | Arrival rate | Average EVs arriving per hour at a location |
| μ (mu) | Service rate | Average EVs a single charger can serve per hour |
| s | Number of servers | Number of charging ports at a station |
| ρ (rho) | Utilization | How busy the station is (λ / sμ) |
| Wq | Wait time in queue | Time spent waiting before charging starts |
| Ws | Total system time | Wait time + charging time |
| Lq | Queue length | Average number of EVs waiting |

### 1.2 Key Formulas (Plain English Explanation)

**Utilization (ρ):**
```
ρ = λ / (s × μ)
```
- If arrival rate is 10 EVs/hour, each charger serves 4 EVs/hour, and we have 3 chargers:
- ρ = 10 / (3 × 4) = 0.83 (83% utilized)
- Must be < 1.0 or queue grows infinitely

**Average Wait Time in Queue (Wq):**

For M/M/s queues, we use the Erlang-C formula to calculate the probability of waiting, then derive Wq. The simplified result:

```
Wq = P(wait) × (1 / (s×μ - λ))
```

Where P(wait) is the probability an arriving EV must wait (computed via Erlang-C).

**Practical Interpretation:**
- Higher utilization (ρ) → exponentially longer wait times
- Adding one charger can dramatically reduce waits when ρ > 0.7
- Sweet spot is typically ρ between 0.5-0.7 for good service with reasonable utilization

### 1.3 Demand Modeling

**Arrival Rate (λ) Estimation:**

```
λ_zone = base_rate × population_factor × ev_penetration × time_of_day_factor × poi_factor
```

Components:
- **base_rate:** Regional baseline (EVs per 1000 residents per hour)
- **population_factor:** Zone population density relative to city average
- **ev_penetration:** Current and projected EV ownership rate (Canada: ~10% in 2026, growing)
- **time_of_day_factor:** Peak multipliers (morning commute, evening, etc.)
- **poi_factor:** Points of interest multiplier (shopping centers, workplaces, transit hubs)

**Service Rate (μ) by Charger Type:**

| Charger Type | Power (kW) | Avg Charge Time | Service Rate (μ) |
|--------------|------------|-----------------|------------------|
| Level 2 | 7-19 kW | 4-8 hours | 0.15-0.25 EVs/hour |
| DC Fast (Level 3) | 50-150 kW | 20-45 min | 1.3-3.0 EVs/hour |
| Ultra-Fast | 150-350 kW | 10-20 min | 3.0-6.0 EVs/hour |

### 1.4 Model Assumptions

1. **Poisson arrivals:** EV arrivals are random and independent (reasonable for public stations)
2. **Exponential service times:** Charging durations have natural variation (reasonable approximation)
3. **FIFO discipline:** First-come, first-served (standard practice)
4. **No balking/reneging:** In reality, some drivers leave if queue is long (can add later)
5. **Steady-state analysis:** Assumes stable demand patterns within time windows
6. **Zone-based demand:** City divided into zones with homogeneous demand characteristics

---

## 2. Optimization Approach

### 2.1 Decision Variables

| Variable | Type | Description |
|----------|------|-------------|
| x_i | Binary | Whether to place a station at candidate location i |
| s_i | Integer | Number of chargers at location i (if selected) |
| t_i | Categorical | Charger type at location i (L2, DCFC, Ultra) |

### 2.2 Objective Function

**Primary Objective:** Minimize weighted average waiting time across all zones

```
Minimize: Σ (λ_i × Wq_i) / Σ λ_i
```

This weights each station's wait time by its demand, giving higher priority to busy locations.

**Secondary Objectives (can be added as constraints or multi-objective):**
- Minimize maximum wait time at any station (equity)
- Minimize total infrastructure cost
- Maximize geographic coverage

### 2.3 Constraints

**Capacity Constraints:**
```
ρ_i = λ_i / (s_i × μ_i) < ρ_max    for all stations i
```
- ρ_max typically set to 0.85 to prevent queue instability

**Budget Constraint:**
```
Σ (fixed_cost_i × x_i + charger_cost × s_i) ≤ Budget
```

**Coverage Constraint:**
```
Every zone must have a station within D km (e.g., D = 5km)
```

**Minimum/Maximum Chargers:**
```
s_min ≤ s_i ≤ s_max    for all selected stations
```

**Demand Satisfaction:**
```
Σ (s_i × μ_i) ≥ Σ λ_i × safety_factor
```
- Ensures total system capacity exceeds total demand with margin

### 2.4 Solution Approach

**Chosen Method: Hybrid Heuristic + Simulation**

Given the non-linear relationship between chargers and wait time, we use:

1. **Greedy Construction:** Build initial solution by placing stations at highest-demand locations
2. **Local Search:** Improve by swapping locations, adjusting charger counts
3. **Simulation Validation:** Evaluate each candidate solution via discrete-event simulation
4. **Iterative Refinement:** Use simulation feedback to guide further optimization

**Why Not Pure Mathematical Optimization?**
- Erlang-C formulas are non-linear and complex
- Real-world factors (time-varying demand, driver behavior) hard to capture analytically
- Simulation provides more accurate evaluation

**Algorithm Outline:**

```
ALGORITHM: Station Placement Optimization

INPUT:
  - Candidate locations L = {l_1, l_2, ..., l_n}
  - Demand estimates per zone
  - Budget B
  - Constraints (coverage, capacity)

OUTPUT:
  - Selected stations with charger counts

PHASE 1: GREEDY CONSTRUCTION
  1. Rank candidate locations by demand density
  2. Select top locations ensuring coverage constraint
  3. Assign minimum chargers to each
  4. While budget remains:
       Add chargers to station with highest marginal benefit
       (highest wait time reduction per dollar)

PHASE 2: LOCAL SEARCH
  FOR iteration = 1 to MAX_ITERATIONS:
    1. Generate neighbor solutions:
       - Swap: Replace one station with unselected candidate
       - Resize: Add/remove charger at a station
       - Upgrade: Change charger type
    2. Evaluate each neighbor via quick simulation (1000 arrivals)
    3. Accept if improvement found
    4. If no improvement for K iterations, stop

PHASE 3: FINAL VALIDATION
  1. Run full simulation (100,000 arrivals)
  2. Report final metrics
  3. Compare to baseline
```

### 2.5 Computational Complexity

- Greedy phase: O(n × log n) where n = candidate locations
- Local search: O(iterations × neighbors × simulation_cost)
- For pilot (50 candidate locations, 10 zones): ~5-10 minutes on standard hardware

---

## 3. Simulation Design

### 3.1 Discrete-Event Simulation Overview

The simulation models the actual flow of EVs through the charging network over time, capturing dynamics that analytical models miss.

**Core Events:**
1. EV_ARRIVAL: An EV arrives at a station
2. CHARGE_START: An EV begins charging (charger becomes occupied)
3. CHARGE_END: An EV finishes charging (charger becomes free)

### 3.2 Simulation Flow

```
SIMULATION: EV Charging Network

INITIALIZATION:
  - Create stations with specified charger counts
  - Initialize event queue (empty)
  - Initialize metrics collectors
  - Set simulation_time = 0
  - Schedule initial arrivals for each zone

MAIN LOOP:
  WHILE simulation_time < END_TIME:

    event = pop_next_event()
    simulation_time = event.time

    SWITCH event.type:

      CASE EV_ARRIVAL:
        zone = event.zone
        ev = create_ev(zone)

        # Station selection (nearest with acceptable wait)
        station = select_station(ev, zone)

        IF station.has_available_charger():
          charger = station.assign_charger(ev)
          charge_duration = sample_service_time(station.charger_type)
          schedule_event(CHARGE_END, time + charge_duration, ev, charger)
          record_metric(wait_time = 0)
        ELSE:
          station.queue.add(ev)
          ev.queue_entry_time = simulation_time

        # Schedule next arrival for this zone
        inter_arrival = sample_exponential(1 / λ_zone)
        schedule_event(EV_ARRIVAL, time + inter_arrival, zone)

      CASE CHARGE_END:
        charger = event.charger
        station = charger.station
        charger.release()

        IF station.queue.not_empty():
          next_ev = station.queue.pop()
          wait_time = simulation_time - next_ev.queue_entry_time
          record_metric(wait_time)
          charger.assign(next_ev)
          charge_duration = sample_service_time(station.charger_type)
          schedule_event(CHARGE_END, time + charge_duration, next_ev, charger)

FINALIZATION:
  - Compute aggregate metrics
  - Return results
```

### 3.3 Station Selection Logic

EVs don't always go to the nearest station. We model driver behavior:

```
FUNCTION select_station(ev, origin_zone):

  candidates = get_stations_within_range(origin_zone, max_distance=15km)

  FOR each station in candidates:
    # Estimate wait time based on current queue
    estimated_wait = estimate_wait_time(station)
    travel_time = distance(origin_zone, station) / avg_speed
    total_time = travel_time + estimated_wait
    station.score = -total_time  # Lower is better

  # Probabilistic selection (not always optimal, models human behavior)
  selected = weighted_random_choice(candidates, weights=softmax(scores))

  RETURN selected
```

### 3.4 Time-Varying Demand

Demand varies by hour. We model this with time-of-day multipliers:

```
Hour    Multiplier    Description
0-6     0.3           Night (minimal demand)
6-9     1.2           Morning commute
9-12    0.8           Late morning
12-14   1.0           Lunch
14-17   0.9           Afternoon
17-20   1.4           Evening peak
20-24   0.6           Evening decline
```

### 3.5 Metrics Collection

**Per-Station Metrics:**
- Average wait time (Wq)
- Maximum wait time
- Average queue length
- Utilization (fraction of time chargers busy)
- Throughput (EVs served per hour)

**System-Wide Metrics:**
- Demand-weighted average wait time
- 95th percentile wait time
- Total EVs served
- EVs that "balked" (left without charging, if modeled)

### 3.6 Baseline vs Optimized Comparison

```
COMPARISON WORKFLOW:

1. BASELINE SIMULATION:
   - Use current station layout (or naive uniform distribution)
   - Run simulation for 7 simulated days
   - Record all metrics

2. OPTIMIZED SIMULATION:
   - Use optimized station layout from Phase 2
   - Run simulation with identical demand patterns
   - Record all metrics

3. COMPARISON:
   - Compute percent improvement for each metric
   - Statistical significance test (t-test on wait times)
   - Generate comparison visualizations
```

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Zone Data    │  │ Candidate    │  │ Demand       │               │
│  │ (GeoJSON)    │  │ Locations    │  │ Parameters   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     CORE ENGINE                                      │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Optimization Module                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │   │
│  │  │ Greedy      │  │ Local       │  │ Solution    │           │   │
│  │  │ Constructor │─▶│ Search      │─▶│ Validator   │           │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Simulation Engine                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │   │
│  │  │ Event       │  │ Station     │  │ Metrics     │           │   │
│  │  │ Queue       │  │ Manager     │  │ Collector   │           │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Queueing Calculator                         │   │
│  │  ┌─────────────┐  ┌─────────────┐                            │   │
│  │  │ Erlang-C    │  │ Wait Time   │                            │   │
│  │  │ Functions   │  │ Estimator   │                            │   │
│  │  └─────────────┘  └─────────────┘                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API LAYER                                     │
├─────────────────────────────────────────────────────────────────────┤
│  POST /api/optimize         - Run optimization                       │
│  POST /api/simulate         - Run simulation only                    │
│  GET  /api/scenarios/{id}   - Get scenario results                   │
│  GET  /api/compare          - Compare baseline vs optimized          │
│  GET  /api/metrics          - Get current metrics                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DASHBOARD LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │ Comparison      │  │ Station         │  │ Time Series     │      │
│  │ Charts          │  │ Map View        │  │ Charts          │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Details

**Data Layer:**
- Zone definitions (GeoJSON polygons for city zones)
- Candidate location list (lat/lng, site characteristics)
- Demand parameters (population, POIs, EV registration data)
- All stored as JSON/CSV files for prototype simplicity

**Optimization Module:**
- Python-based
- Uses NumPy for numerical operations
- Implements greedy + local search algorithm
- Outputs station placement decisions

**Simulation Engine:**
- Discrete-event simulation in Python
- Heap-based priority queue for events
- Configurable run duration and parameters
- Outputs detailed metrics

**Queueing Calculator:**
- Erlang-C implementation for analytical estimates
- Used for quick evaluations during optimization
- Validated against simulation results

**API Layer:**
- FastAPI (Python)
- Simple REST endpoints
- JSON request/response
- Runs optimization/simulation as background tasks

**Dashboard Layer:**
- Lightweight HTML/JavaScript
- Chart.js for visualizations
- Leaflet.js for maps
- No framework overhead (vanilla JS sufficient for prototype)

### 4.3 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Core Engine | Python 3.11+ | Scientific computing ecosystem |
| Numerical | NumPy, SciPy | Standard for optimization |
| API | FastAPI | Simple, fast, modern |
| Data Storage | JSON/CSV files | No DB overhead for prototype |
| Dashboard | HTML + Chart.js + Leaflet | Minimal, effective |
| Containerization | Docker | Easy deployment |

### 4.4 File Structure

```
ev_charging_optimization/
├── src/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── queueing.py        # Erlang-C calculations
│   │   ├── station.py         # Station/charger models
│   │   └── zone.py            # Zone definitions
│   ├── optimization/
│   │   ├── __init__.py
│   │   ├── greedy.py          # Greedy construction
│   │   ├── local_search.py    # Local search improvement
│   │   └── optimizer.py       # Main optimization orchestrator
│   ├── simulation/
│   │   ├── __init__.py
│   │   ├── events.py          # Event types
│   │   ├── engine.py          # Main simulation loop
│   │   └── metrics.py         # Metrics collection
│   └── api/
│       ├── __init__.py
│       ├── main.py            # FastAPI app
│       └── routes.py          # API endpoints
├── data/
│   ├── zones/                 # Zone GeoJSON files
│   ├── candidates/            # Candidate location data
│   └── scenarios/             # Saved scenario results
├── dashboard/
│   ├── index.html
│   ├── js/
│   │   ├── charts.js
│   │   └── map.js
│   └── css/
│       └── styles.css
├── tests/
│   ├── test_queueing.py
│   ├── test_simulation.py
│   └── test_optimization.py
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## 5. Demo Dashboard Specification

### 5.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  EV Charging Optimization - Pilot Dashboard                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    KEY METRICS SUMMARY                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │
│  │  │ Avg Wait │  │ Peak Wait│  │ Util Rate│  │ Coverage │     │    │
│  │  │  Before  │  │  Before  │  │  Before  │  │  Before  │     │    │
│  │  │  18 min  │  │  45 min  │  │   92%    │  │   75%    │     │    │
│  │  │    ↓     │  │    ↓     │  │    ↓     │  │    ↓     │     │    │
│  │  │  After   │  │  After   │  │  After   │  │  After   │     │    │
│  │  │  6 min   │  │  15 min  │  │   68%    │  │   95%    │     │    │
│  │  │  -67%    │  │  -67%    │  │  -24pts  │  │  +20pts  │     │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────┐     │
│  │     WAIT TIME COMPARISON   │  │     STATION MAP            │     │
│  │                            │  │                            │     │
│  │    ▓▓▓▓▓▓▓▓▓▓ Baseline    │  │    [Interactive map        │     │
│  │    ▒▒▒▒ Optimized         │  │     showing station        │     │
│  │                            │  │     locations with         │     │
│  │   Bar chart showing wait   │  │     size = # chargers      │     │
│  │   time by zone/station     │  │     color = utilization]   │     │
│  │                            │  │                            │     │
│  └────────────────────────────┘  └────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────┐  ┌────────────────────────────┐     │
│  │   UTILIZATION BY STATION   │  │   WAIT TIME BY HOUR        │     │
│  │                            │  │                            │     │
│  │   Horizontal bar chart     │  │   Line chart showing       │     │
│  │   showing utilization %    │  │   avg wait time across     │     │
│  │   for each station         │  │   24-hour period           │     │
│  │   (target zone: 50-70%)    │  │   Baseline vs Optimized    │     │
│  │                            │  │                            │     │
│  └────────────────────────────┘  └────────────────────────────┘     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    SCENARIO CONTROLS                         │    │
│  │  [Run Baseline]  [Run Optimization]  [Compare]  [Export]    │    │
│  │                                                              │    │
│  │  Demand Growth: [slider 0-50%]   Budget: [input $500K-$5M]  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Dashboard Components

**1. Key Metrics Summary (Top Cards)**

| Metric | Before | After | Interpretation |
|--------|--------|-------|----------------|
| Average Wait Time | 18 min | 6 min | Time from arrival to charging start |
| Peak Wait Time | 45 min | 15 min | 95th percentile wait during rush hour |
| Avg Utilization | 92% | 68% | Higher isn't better—causes queues |
| Coverage | 75% | 95% | % of zones within 5km of a station |

**2. Wait Time Comparison Chart**

- Grouped bar chart
- X-axis: Station or zone names
- Y-axis: Average wait time (minutes)
- Two bars per group: Baseline (red) vs Optimized (green)
- Clearly shows which locations improved most

**3. Station Map**

- Interactive map (Leaflet.js)
- Markers at each station location
- Marker size proportional to number of chargers
- Marker color indicates utilization:
  - Green: 40-60% (healthy)
  - Yellow: 60-80% (busy but ok)
  - Red: 80%+ (congested)
- Click marker to see station details

**4. Utilization by Station**

- Horizontal bar chart
- Shows each station's utilization percentage
- Reference band at 50-70% (optimal range)
- Helps identify over/under-provisioned stations

**5. Wait Time by Hour**

- Line chart with 24-hour x-axis
- Two lines: Baseline and Optimized
- Shows how wait times vary throughout day
- Highlights peak periods (morning, evening)

**6. Scenario Controls**

- Buttons to trigger optimization runs
- Sliders for key parameters:
  - Demand growth projection (0-50%)
  - Budget constraint
  - Target coverage %

### 5.3 Data Refresh

- Results cached after each optimization run
- Dashboard reads from cached JSON files
- No real-time updates needed for pilot (batch analysis)

---

## 6. Business Translation

### 6.1 Technical-to-Business Mapping

| Technical Metric | Business Impact |
|------------------|-----------------|
| Wait time reduction | Better user experience, higher EV adoption |
| Improved utilization | More efficient capital deployment |
| Increased coverage | Reduced range anxiety, broader service area |
| Lower peak congestion | Predictable service, happier customers |

### 6.2 Key Talking Points for Management

**1. Cost Efficiency**
> "Our optimization shows we can achieve the same service quality with 15-20% fewer chargers by placing them more strategically. For a $2M infrastructure budget, that's $300-400K in savings—or we can serve 20% more demand with the same budget."

**2. User Experience**
> "Average wait times drop from 18 minutes to 6 minutes. Peak wait times drop from 45 minutes to 15 minutes. This directly impacts EV adoption—drivers who experience long waits are less likely to stay with EVs or recommend them."

**3. Data-Driven Planning**
> "Instead of placing stations based on intuition or requests, we now have a model that incorporates actual demand patterns, traffic flow, and capacity constraints. Every placement decision is backed by simulation results."

**4. Scalability for Growth**
> "The model can project forward. If EV penetration doubles in 3 years, we can simulate that scenario today and plan infrastructure that's ready, rather than playing catch-up with congestion."

### 6.3 ROI Framework

```
INVESTMENT:
- Development cost (one-time): ~$50-80K (2-3 months, 2 engineers)
- Data acquisition: ~$10K (if needed)
- Infrastructure: Minimal (runs on standard compute)

RETURNS:
- Capital efficiency gains: 15-20% of infrastructure budget
- If annual infrastructure spend is $5M: ~$750K-$1M saved per year
- Reduced customer churn from poor experience: Hard to quantify but significant
- Faster permitting with data-backed site selection

PAYBACK: < 1 year even with conservative assumptions
```

### 6.4 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Model doesn't match reality | Pilot in single city, validate against actual data before scaling |
| Demand forecasting inaccurate | Use conservative growth estimates, run sensitivity analysis |
| Optimization over-fits to current demand | Include growth scenarios, validate with future projections |
| Stakeholder buy-in | Start with internal pilot, demonstrate value before asking for larger investment |

---

## 7. Pilot Scope

### 7.1 Geographic Scope

**City:** Calgary, Alberta, Canada

**Rationale:**
- Growing EV market (cold climate creates charging challenges)
- Reasonable urban density
- Available data on traffic patterns and demographics
- Existing charging infrastructure to validate against

### 7.2 Zone Definition

Calgary divided into 10-15 zones based on:
- Neighborhoods/districts
- Similar demand characteristics
- Manageable granularity for pilot

### 7.3 Candidate Locations

- 30-50 candidate locations identified
- Based on: existing stations, parking facilities, retail centers, transit hubs
- Each location has attributes: land cost estimate, power availability, accessibility

### 7.4 Scenario Definition

**Single Scenario:** "2027 Network Optimization"

Assumptions:
- 15% EV penetration (projected for 2027)
- Current driving patterns maintained
- Budget: $2M for new infrastructure
- Charger mix: 70% DCFC, 30% Level 2

### 7.5 Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Model runs successfully | Optimization completes without errors | Technical validation |
| Wait time improvement | ≥ 40% reduction vs baseline | Simulation metrics |
| Coverage improvement | ≥ 90% of zones within 5km | Simulation metrics |
| Stakeholder acceptance | Positive feedback from 3+ stakeholders | Presentation feedback |
| Documentation complete | Design doc + code + demo | Deliverable review |

### 7.6 Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Design & Planning | 2 weeks | This document |
| Core Implementation | 4 weeks | Optimization + simulation engine |
| Dashboard & Integration | 2 weeks | API + dashboard |
| Validation & Testing | 1 week | Test results, bug fixes |
| Stakeholder Demo | 1 week | Presentation, feedback collection |
| **Total** | **10 weeks** | |

### 7.7 Out of Scope for Pilot

- Real-time demand prediction
- Driver routing/navigation
- Pricing optimization
- Multi-city scaling
- Mobile app integration
- Integration with existing systems (OCPP, billing)

These can be added in future phases if pilot demonstrates value.

---

## 8. Next Steps

### 8.1 Immediate Actions

1. **Data Collection**
   - Gather Calgary zone definitions (census tracts or custom)
   - Compile candidate location list
   - Obtain EV registration data for demand estimation

2. **Development Kickoff**
   - Set up repository and development environment
   - Implement queueing model functions (Erlang-C)
   - Build basic simulation engine

3. **Stakeholder Alignment**
   - Share this design document
   - Confirm scope and success criteria
   - Identify pilot reviewers

### 8.2 Phase 2 (Post-Pilot)

If pilot is successful:
- Scale to additional cities
- Add real-time data integration
- Develop more sophisticated demand forecasting
- Build integration with infrastructure planning tools

---

## Appendix A: Erlang-C Formula Reference

For completeness, the Erlang-C probability of waiting:

```
P(W > 0) = [1 + (1-ρ) × (s!/((sρ)^s)) × Σ(k=0 to s-1)((sρ)^k / k!)]^(-1)
```

Where:
- s = number of servers (chargers)
- ρ = λ/(sμ) = utilization
- λ = arrival rate
- μ = service rate per charger

Average wait time in queue:
```
Wq = P(W > 0) / (s × μ × (1 - ρ))
```

---

## Appendix B: Sample API Responses

**POST /api/optimize**

Request:
```json
{
  "scenario_name": "calgary_2027",
  "budget": 2000000,
  "demand_growth_factor": 1.15,
  "coverage_target": 0.90,
  "max_utilization": 0.85
}
```

Response:
```json
{
  "scenario_id": "scn_abc123",
  "status": "completed",
  "runtime_seconds": 342,
  "solution": {
    "total_stations": 12,
    "total_chargers": 48,
    "total_cost": 1850000,
    "stations": [
      {
        "location_id": "loc_001",
        "name": "Downtown Central",
        "lat": 51.0447,
        "lng": -114.0719,
        "chargers": 6,
        "charger_type": "DCFC",
        "expected_utilization": 0.72,
        "expected_wait_minutes": 4.2
      }
    ]
  },
  "metrics": {
    "avg_wait_minutes": 5.8,
    "peak_wait_minutes": 14.2,
    "avg_utilization": 0.68,
    "coverage_percent": 0.94
  }
}
```

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| M/M/s Queue | Queueing model with Markovian (random) arrivals, Markovian service times, s servers |
| Arrival Rate (λ) | Average number of EVs arriving per unit time |
| Service Rate (μ) | Average number of EVs a single charger can serve per unit time |
| Utilization (ρ) | Fraction of time servers are busy; λ/(sμ) |
| DCFC | DC Fast Charger (high-power, quick charging) |
| Level 2 | Standard AC charger (slower, typically for longer stays) |
| Erlang-C | Formula for calculating probability of waiting in multi-server queue |
| FIFO | First-In-First-Out queue discipline |

---

*End of Design Document*
