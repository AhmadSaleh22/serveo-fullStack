"""
Train Deep RL Agent for Saskatchewan EV Charging Station Placement
Using PPO (Proximal Policy Optimization) - v1.23 compatible (fixed)
"""

import os
import random
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from shapely.geometry import Point  # ✅ FIX: needed for plotting

from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv, VecMonitor
from stable_baselines3.common.callbacks import EvalCallback, CheckpointCallback
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.utils import set_random_seed

# ⚠️ IMPORTANT: Must have renamed 2_env.py → env.py BEFORE running
from env import SaskatchewanChargingEnv

# ============================
# 0) Reproducibility
# ============================
SEED = 42
set_random_seed(SEED)
random.seed(SEED)
np.random.seed(SEED)

# Create output directories
os.makedirs("models", exist_ok=True)
os.makedirs("logs", exist_ok=True)
os.makedirs("models/checkpoints", exist_ok=True)

# ============================
# 1) Configure Environment
# ============================
def make_env(seed=SEED):
    """Create environment instance"""
    def _init():
        env = SaskatchewanChargingEnv(max_stations=15)
        env = Monitor(env)           # ✅ IMPORTANT for SB3 logging/eval
        env.reset(seed=seed)         # ✅ seed env
        return env
    return _init

env = DummyVecEnv([make_env(SEED)])
env = VecMonitor(env, filename="logs/train_vec_monitor.csv")  # ✅ better logs

# ============================
# 2) Create RL Model (PPO)
# ============================
print("\n🧠 Building PPO model...")
model = PPO(
    "MlpPolicy",
    env,
    learning_rate=3e-4,
    n_steps=2048,
    batch_size=64,
    n_epochs=10,
    gamma=0.99,
    gae_lambda=0.95,
    clip_range=0.2,
    verbose=1,
    seed=SEED,
    tensorboard_log="logs/tensorboard"
)

# ============================
# 3) Train the Model
# ============================
print("\n🚀 Starting training (5,000 steps)...\n")
total_timesteps = 5_000

eval_env = DummyVecEnv([make_env(SEED)])
eval_env = VecMonitor(eval_env, filename="logs/eval_vec_monitor.csv")

eval_callback = EvalCallback(
    eval_env,
    best_model_save_path='./models/best/',
    log_path='./logs/eval/',
    eval_freq=5000,
    deterministic=True,
    render=False
)

checkpoint_callback = CheckpointCallback(
    save_freq=5000,
    save_path="models/checkpoints",
    name_prefix="ppo_saskatchewan"
)

model.learn(
    total_timesteps=total_timesteps,
    callback=[eval_callback, checkpoint_callback],
)

model.save("models/saskatchewan_charging_ppo")
print("\n✅ Model saved to 'models/saskatchewan_charging_ppo.zip'")

# ============================
# 4) Evaluate the Trained Agent
# ============================
print("\n🧪 Evaluating trained agent...")
obs = eval_env.reset()
total_reward = 0.0
stations_built = []

for _ in range(15):
    action, _states = model.predict(obs, deterministic=True)
    obs, reward, dones, infos = eval_env.step(action)

    total_reward += float(reward[0])

    lat, lon = float(action[0][0]), float(action[0][1])
    stations_built.append((lat, lon))

    if bool(dones[0]):
        break

final_obs = obs[0]
print(f"\n📊 Final Results:")
print(f"  • Stations built: {len(stations_built)}/15")
print(f"  • Population coverage: {final_obs[1]:.1f}%")
print(f"  • Max uncovered distance: {final_obs[2]:.1f} km")
print(f"  • Total reward: {total_reward:.2f}")

# ============================
# 5) Visualize Results
# ============================
def plot_results(stations_built):
    """Plot final results on map"""
    import geopandas as gpd

    try:
        population = gpd.read_file("data/saskatchewan_population_2021.geojson")
        roads = gpd.read_file("data/saskatchewan_roads_osm.geojson")
        existing = gpd.read_file("data/existing_stations.geojson")
    except FileNotFoundError as e:
        print(f"❌ Missing data files. Run data_loader.py first.")
        print(f"   Details: {e}")
        return False

    new_stations_gdf = gpd.GeoDataFrame(
        geometry=[Point(lon, lat) for (lat, lon) in stations_built],
        crs="EPSG:4326"
    )

    fig, ax = plt.subplots(figsize=(12, 10))
    roads.plot(ax=ax, linewidth=1.2, alpha=0.6, label='Roads (OSM)')
    population.plot(ax=ax, markersize=(population['population'].astype(float)/3000.0).clip(10, 400),
                    alpha=0.55, label='Population centers')
    existing.plot(ax=ax, marker='^', markersize=90, label='Existing stations')
    if len(new_stations_gdf) > 0:
        new_stations_gdf.plot(ax=ax, marker='*', markersize=160, label='Proposed stations (RL)')

    ax.set_title('Saskatchewan EV Charging Infrastructure — PPO Placement', fontsize=15, pad=15)
    ax.legend(loc='upper right', framealpha=0.9)
    ax.set_xlabel('Longitude')
    ax.set_ylabel('Latitude')
    ax.grid(True, alpha=0.25, linestyle='--', linewidth=0.6)
    plt.tight_layout()

    plt.savefig('final_results_map.png', dpi=200, bbox_inches='tight')
    plt.close()

    print("✅ Final map saved to 'final_results_map.png'")
    return True

success = plot_results(stations_built)

# ============================
# 6) Initial State Comparison
# ============================
if success:
    print("\n📈 Performance Comparison:")
    initial_env = SaskatchewanChargingEnv(max_stations=15)
    initial_obs, _ = initial_env.reset(seed=SEED)

    print(f"{'Metric':<28} {'Before RL':<15} {'After RL':<15}")
    print("-" * 58)
    print(f"{'Population coverage':<28} {initial_obs[1]:<15.1f} {final_obs[1]:<15.1f}")
    print(f"{'Max uncovered distance (km)':<28} {initial_obs[2]:<15.1f} {final_obs[2]:<15.1f}")
    print(f"{'Stations built':<28} {0:<15d} {len(stations_built):<15d}")
    print("\n✅ Training complete! Open 'final_results_map.png' to see the results.")
else:
    print("\n⚠️ Training completed but visualization failed (missing data files).")
