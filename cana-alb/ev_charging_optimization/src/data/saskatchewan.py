"""
Saskatchewan Data Loader

Loads Saskatchewan GeoJSON data (population centers, highways, existing stations)
and converts them to simulation-ready objects (ZoneConfig, Station).
"""

import json
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

from ..simulation.engine import ZoneConfig
from ..simulation.station import Station, create_station


# Default data directory relative to this file
DEFAULT_DATA_DIR = Path(__file__).parent.parent.parent / "mainproject"

# Saskatchewan geographic bounds
SASKATCHEWAN_BOUNDS = {
    "lat_min": 49.0,
    "lat_max": 60.0,
    "lon_min": -110.0,
    "lon_max": -101.0,
}

# Default coverage radius for stations (km)
DEFAULT_COVERAGE_RADIUS_KM = 150.0


@dataclass
class PopulationCenter:
    """A population center in Saskatchewan."""
    city: str
    lat: float
    lon: float
    population: int

    @property
    def demand_rate(self) -> float:
        """
        Estimate EV charging demand based on population.
        
        Assumes:
        - 15% EV adoption rate
        - Average EV needs charging every 3 days
        - Converts to hourly rate
        """
        ev_count = self.population * 0.15
        daily_charges = ev_count / 3
        hourly_rate = daily_charges / 24
        return hourly_rate

    def to_zone_config(self) -> ZoneConfig:
        """Convert to simulation ZoneConfig."""
        zone_id = self.city.lower().replace(" ", "_").replace("_", "")
        return ZoneConfig(
            zone_id=zone_id,
            name=self.city,
            base_arrival_rate=max(0.5, self.demand_rate),
            lat=self.lat,
            lng=self.lon
        )


@dataclass
class ExistingStation:
    """An existing EV charging station in Saskatchewan."""
    station_id: int
    lat: float
    lon: float

    def to_station(
        self,
        num_chargers: int = 4,
        charger_type: str = "dcfc_50",
        service_rate: float = 1.33
    ) -> Station:
        """Convert to simulation Station."""
        return create_station(
            station_id=f"existing_{self.station_id}",
            name=f"Existing Station {self.station_id}",
            lat=self.lat,
            lng=self.lon,
            zone_id=f"zone_{self.station_id}",
            num_chargers=num_chargers,
            charger_type=charger_type,
            service_rate=service_rate
        )


@dataclass
class SaskatchewanData:
    """Container for all Saskatchewan data."""
    population_centers: list[PopulationCenter]
    existing_stations: list[ExistingStation]
    highways: Optional[dict] = None

    @property
    def total_population(self) -> int:
        """Total population across all centers."""
        return sum(p.population for p in self.population_centers)

    @property
    def zones(self) -> list[ZoneConfig]:
        """Convert population centers to simulation zones."""
        return [p.to_zone_config() for p in self.population_centers]

    @property
    def baseline_stations(self) -> list[Station]:
        """Convert existing stations to simulation stations."""
        return [s.to_station() for s in self.existing_stations]

    def get_major_cities(self) -> list[PopulationCenter]:
        """Get major cities (population > 50,000)."""
        return [p for p in self.population_centers if p.population > 50000]

    def get_remote_areas(self, coverage_radius_km: float = 150.0) -> list[PopulationCenter]:
        """
        Get population centers not covered by existing stations.
        
        Args:
            coverage_radius_km: Coverage radius for stations
            
        Returns:
            List of uncovered population centers
        """
        uncovered = []
        for pop in self.population_centers:
            is_covered = False
            for station in self.existing_stations:
                dist = haversine_distance(pop.lat, pop.lon, station.lat, station.lon)
                if dist <= coverage_radius_km:
                    is_covered = True
                    break
            if not is_covered:
                uncovered.append(pop)
        return uncovered


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two points using Haversine formula.
    
    Args:
        lat1, lon1: First point coordinates
        lat2, lon2: Second point coordinates
        
    Returns:
        Distance in kilometers
    """
    import math
    R = 6371  # Earth radius in km
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


def load_population_geojson(filepath: Path) -> list[PopulationCenter]:
    """
    Load population centers from GeoJSON file.
    
    Args:
        filepath: Path to GeoJSON file
        
    Returns:
        List of PopulationCenter objects
    """
    with open(filepath, "r") as f:
        data = json.load(f)

    centers = []
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        centers.append(PopulationCenter(
            city=props.get("city", "Unknown"),
            lat=props.get("lat", 0.0),
            lon=props.get("lon", 0.0),
            population=props.get("population", 0)
        ))

    return centers


def load_stations_geojson(filepath: Path) -> list[ExistingStation]:
    """
    Load existing stations from GeoJSON file.
    
    Args:
        filepath: Path to GeoJSON file
        
    Returns:
        List of ExistingStation objects
    """
    with open(filepath, "r") as f:
        data = json.load(f)

    stations = []
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        stations.append(ExistingStation(
            station_id=props.get("station_id", 0),
            lat=props.get("lat", 0.0),
            lon=props.get("lon", 0.0)
        ))

    return stations


def load_saskatchewan_data(data_dir: Optional[Path] = None) -> SaskatchewanData:
    """
    Load all Saskatchewan data from GeoJSON files.
    
    Args:
        data_dir: Directory containing GeoJSON files
                  (defaults to mainproject/)
                  
    Returns:
        SaskatchewanData container with all loaded data
    """
    data_dir = data_dir or DEFAULT_DATA_DIR

    population_file = data_dir / "saskatchewan_population.geojson"
    stations_file = data_dir / "existing_stations.geojson"
    highways_file = data_dir / "saskatchewan_highways.geojson"

    population = load_population_geojson(population_file)
    stations = load_stations_geojson(stations_file)

    highways = None
    if highways_file.exists():
        with open(highways_file, "r") as f:
            highways = json.load(f)

    return SaskatchewanData(
        population_centers=population,
        existing_stations=stations,
        highways=highways
    )


def load_population_as_zones(data_dir: Optional[Path] = None) -> list[ZoneConfig]:
    """
    Convenience function to load population as ZoneConfigs.
    
    Args:
        data_dir: Directory containing GeoJSON files
        
    Returns:
        List of ZoneConfig objects for simulation
    """
    data = load_saskatchewan_data(data_dir)
    return data.zones


def load_existing_stations(
    data_dir: Optional[Path] = None,
    num_chargers: int = 4,
    service_rate: float = 1.33
) -> list[Station]:
    """
    Convenience function to load existing stations.
    
    Args:
        data_dir: Directory containing GeoJSON files
        num_chargers: Number of chargers per station
        service_rate: Service rate (EVs per hour)
        
    Returns:
        List of Station objects for simulation
    """
    data = load_saskatchewan_data(data_dir)
    return [s.to_station(num_chargers=num_chargers, service_rate=service_rate) 
            for s in data.existing_stations]


if __name__ == "__main__":
    # Test loading
    print("Loading Saskatchewan Data")
    print("=" * 50)

    data = load_saskatchewan_data()

    print(f"\nPopulation Centers: {len(data.population_centers)}")
    print(f"Total Population: {data.total_population:,}")

    print("\nMajor Cities:")
    for city in data.get_major_cities():
        print(f"  {city.city}: {city.population:,} (demand: {city.demand_rate:.2f} EVs/hr)")

    print(f"\nExisting Stations: {len(data.existing_stations)}")

    remote = data.get_remote_areas()
    print(f"\nRemote Areas (uncovered): {len(remote)}")
    for area in remote[:5]:
        print(f"  {area.city}: {area.population:,}")

    print("\nZones for simulation:")
    for zone in data.zones[:5]:
        print(f"  {zone.name}: rate={zone.base_arrival_rate:.2f}")
