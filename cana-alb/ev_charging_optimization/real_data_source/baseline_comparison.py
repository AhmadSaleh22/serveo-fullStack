"""
Compare RL results with random baseline
"""
import numpy as np
import geopandas as gpd
from shapely.geometry import Point
from env import SaskatchewanChargingEnv

# Load RL results (from your training)
rl_stations = [(54.0, -107.0), (55.0, -108.0), (56.0, -109.0), (57.0, -109.5), 
               (58.0, -109.8), (49.5, -102.0), (50.5, -103.0), (51.5, -104.0),
               (52.5, -105.0), (53.5, -106.0)]

# Random baseline
env = SaskatchewanChargingEnv(max_stations=10)
env.reset()
random_stations = []
for _ in range(10):
    action = env.action_space.sample()
    env.step(action)
    random_stations.append((action[0], action[1]))

# Calculate coverage (simplified)
def calculate_coverage(stations):
    pop = gpd.read_file("saskatchewan_population.geojson")
    covered = 0
    for _, p in pop.iterrows():
        min_dist = min([Point(lon, lat).distance(Point(p['lon'], p['lat'])) * 111 
                       for lat, lon in stations])
        if min_dist <= 150:  # 150 km coverage radius
            covered += p['population']
    return (covered / pop['population'].sum()) * 100

rl_coverage = calculate_coverage(rl_stations)
random_coverage = calculate_coverage(random_stations)

print("📊 Baseline Comparison:")
print(f"   RL Agent Coverage:    {rl_coverage:.1f}%")
print(f"   Random Placement:     {random_coverage:.1f}%")
print(f"   Improvement:          +{rl_coverage - random_coverage:.1f}%")