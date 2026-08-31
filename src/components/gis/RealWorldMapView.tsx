import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { CityNode } from '../../types/graph.ts';
import { fetchOSRMRoute, searchAddressOSM } from '../../core/osrm.ts';
import { solveCVRP, VehicleTour } from '../../algorithms/heuristics/cvrpSolver.ts';
import { buildDistanceMatrix } from '../../core/matrix.ts';
import { solveNearestNeighbor } from '../../algorithms/heuristics/nearestNeighbor.ts';
import { Compass, Search, Truck, Flame, ShieldCheck, DollarSign, Plus, RotateCcw } from 'lucide-react';

// City Presets
const CITY_PRESETS: Record<string, { name: string; center: [number, number]; nodes: CityNode[] }> = {
  nyc: {
    name: 'New York City',
    center: [40.7580, -73.9855],
    nodes: [
      { id: 0, name: 'Times Square Depot', x: 0, y: 0, lat: 40.7580, lng: -73.9855, demand: 0 },
      { id: 1, name: 'Empire State Bldg', x: 0, y: 0, lat: 40.7484, lng: -73.9857, demand: 5 },
      { id: 2, name: 'Central Park South', x: 0, y: 0, lat: 40.7660, lng: -73.9772, demand: 4 },
      { id: 3, name: 'Grand Central', x: 0, y: 0, lat: 40.7527, lng: -73.9772, demand: 6 },
      { id: 4, name: 'Wall Street NYSE', x: 0, y: 0, lat: 40.7069, lng: -74.0090, demand: 8 },
      { id: 5, name: 'Brooklyn Bridge Park', x: 0, y: 0, lat: 40.7023, lng: -73.9964, demand: 5 },
    ],
  },
  paris: {
    name: 'Paris, France',
    center: [48.8566, 2.3522],
    nodes: [
      { id: 0, name: 'Louvre Hub Depot', x: 0, y: 0, lat: 48.8606, lng: 2.3376, demand: 0 },
      { id: 1, name: 'Eiffel Tower', x: 0, y: 0, lat: 48.8584, lng: 2.2945, demand: 7 },
      { id: 2, name: 'Arc de Triomphe', x: 0, y: 0, lat: 48.8738, lng: 2.2950, demand: 4 },
      { id: 3, name: 'Notre-Dame', x: 0, y: 0, lat: 48.8530, lng: 2.3499, demand: 6 },
      { id: 4, name: 'Montmartre Sacre-Coeur', x: 0, y: 0, lat: 48.8867, lng: 2.3431, demand: 5 },
      { id: 5, name: 'Panthéon', x: 0, y: 0, lat: 48.8462, lng: 2.3464, demand: 3 },
    ],
  },
  tokyo: {
    name: 'Tokyo, Japan',
    center: [35.6895, 139.6917],
    nodes: [
      { id: 0, name: 'Tokyo Station Depot', x: 0, y: 0, lat: 35.6812, lng: 139.7671, demand: 0 },
      { id: 1, name: 'Shibuya Crossing', x: 0, y: 0, lat: 35.6595, lng: 139.7004, demand: 8 },
      { id: 2, name: 'Shinjuku Gyoen', x: 0, y: 0, lat: 35.6852, lng: 139.7101, demand: 4 },
      { id: 3, name: 'Akihabara Tech City', x: 0, y: 0, lat: 35.6983, lng: 139.7731, demand: 9 },
      { id: 4, name: 'Tokyo Tower', x: 0, y: 0, lat: 35.6586, lng: 139.7454, demand: 5 },
      { id: 5, name: 'Asakusa Senso-ji', x: 0, y: 0, lat: 35.7148, lng: 139.7967, demand: 6 },
    ],
  },
  london: {
    name: 'London, UK',
    center: [51.5074, -0.1278],
    nodes: [
      { id: 0, name: 'Central Depot Soho', x: 0, y: 0, lat: 51.5136, lng: -0.1365, demand: 0 },
      { id: 1, name: 'Big Ben', x: 0, y: 0, lat: 51.5007, lng: -0.1246, demand: 6 },
      { id: 2, name: 'Tower of London', x: 0, y: 0, lat: 51.5081, lng: -0.0759, demand: 8 },
      { id: 3, name: 'Buckingham Palace', x: 0, y: 0, lat: 51.5014, lng: -0.1419, demand: 5 },
      { id: 4, name: 'The British Museum', x: 0, y: 0, lat: 51.5194, lng: -0.1270, demand: 4 },
    ],
  },
};

// Custom Leaflet Pin Icons
const createPinIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${color};
      width: 24px; height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 10px ${color};
      display: flex; align-items: center; justify-content: center;
      color: black; font-weight: bold; font-size: 10px; font-family: monospace;
    ">${label}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const RealWorldMapView: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>('nyc');
  const [nodes, setNodes] = useState<CityNode[]>(CITY_PRESETS.nyc.nodes);
  const [mapCenter, setMapCenter] = useState<[number, number]>(CITY_PRESETS.nyc.center);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [fleetMode, setFleetMode] = useState<'single' | 'cvrp'>('cvrp');
  const [vehicleCount, setVehicleCount] = useState<number>(2);
  const [vehicleCapacity, setVehicleCapacity] = useState<number>(18);

  const [roadPolylines, setRoadPolylines] = useState<{ color: string; path: [number, number][] }[]>([]);
  const [totalRoadKm, setTotalRoadKm] = useState<number>(0);
  const [totalDurationMin, setTotalDurationMin] = useState<number>(0);
  const [vehicleTours, setVehicleTours] = useState<VehicleTour[]>([]);

  // Compute Real Street Routes via OSRM
  const calculateRealRoutes = useCallback(async () => {
    if (nodes.length < 2) return;

    const matrix = buildDistanceMatrix(nodes, 'haversine');
    let toursToRender: { tour: number[]; color: string }[] = [];

    if (fleetMode === 'cvrp') {
      const cvrp = solveCVRP(nodes, matrix, vehicleCount, vehicleCapacity);
      setVehicleTours(cvrp.vehicles);
      toursToRender = cvrp.vehicles.map((v) => ({ tour: v.tour, color: v.color }));
    } else {
      const nn = solveNearestNeighbor(matrix, 0);
      toursToRender = [{ tour: nn.tour, color: '#00e5ff' }];
      setVehicleTours([]);
    }

    // Fetch OSRM turn-by-turn road polylines for each segment
    const allSegments: { color: string; path: [number, number][] }[] = [];
    let cumulativeMeters = 0;
    let cumulativeSeconds = 0;

    for (const v of toursToRender) {
      for (let i = 0; i < v.tour.length - 1; i++) {
        const fromNode = nodes[v.tour[i]];
        const toNode = nodes[v.tour[i + 1]];
        if (fromNode && toNode) {
          const res = await fetchOSRMRoute(fromNode, toNode);
          allSegments.push({ color: v.color, path: res.polyline });
          cumulativeMeters += res.distanceMeters;
          cumulativeSeconds += res.durationSeconds;
        }
      }
    }

    setRoadPolylines(allSegments);
    setTotalRoadKm(cumulativeMeters / 1000);
    setTotalDurationMin(cumulativeSeconds / 60);
  }, [nodes, fleetMode, vehicleCount, vehicleCapacity]);

  useEffect(() => {
    calculateRealRoutes();
  }, [calculateRealRoutes]);

  // Handle City Preset Change
  const handleCityChange = (cityKey: string) => {
    setSelectedCity(cityKey);
    const preset = CITY_PRESETS[cityKey];
    if (preset) {
      setNodes(preset.nodes);
      setMapCenter(preset.center);
    }
  };

  // Address Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchAddressOSM(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSearchResult = (res: { name: string; lat: number; lng: number }) => {
    const newId = nodes.length;
    const newNode: CityNode = {
      id: newId,
      name: res.name,
      x: 0,
      y: 0,
      lat: res.lat,
      lng: res.lng,
      demand: Math.floor(Math.random() * 6) + 2,
    };
    setNodes((prev) => [...prev, newNode]);
    setMapCenter([res.lat, res.lng]);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Map Click Listener to add custom delivery pin
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const newId = nodes.length;
        const newNode: CityNode = {
          id: newId,
          name: `Stop #${newId}`,
          x: 0,
          y: 0,
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          demand: Math.floor(Math.random() * 6) + 2,
        };
        setNodes((prev) => [...prev, newNode]);
      },
    });
    return null;
  };

  // Logistics Impact Estimates
  const fuelLiters = (totalRoadKm * 0.11).toFixed(1); // 11L / 100km delivery diesel
  const co2Kg = (totalRoadKm * 0.27).toFixed(1);      // 270g CO2 / km
  const driverCost = ((totalDurationMin / 60) * 32).toFixed(1); // $32/hr wage

  return (
    <div className="flex-1 flex flex-col h-full bg-background select-none overflow-hidden">
      {/* Top Header & Search Bar */}
      <div className="h-14 border-b border-border bg-panel px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-neon-amber/10 border border-neon-amber flex items-center justify-center shadow-lg">
            <Compass size={16} className="text-neon-amber" />
          </div>
          <div>
            <div className="font-display font-extrabold text-sm text-slate-100 flex items-center gap-2">
              REAL-WORLD GIS <span className="text-neon-amber font-bold">OSM ROUTING</span>
            </div>
            <div className="text-[10px] text-muted">OpenStreetMap + OSRM Real Road Matrix & Multi-Van CVRP</div>
          </div>
        </div>

        {/* City Presets & Search */}
        <div className="flex items-center gap-3">
          {/* Preset Buttons */}
          <div className="flex bg-surface border border-border rounded p-0.5">
            {Object.keys(CITY_PRESETS).map((k) => (
              <button
                key={k}
                onClick={() => handleCityChange(k)}
                className={`px-2.5 py-1 text-xs font-bold rounded uppercase ${
                  selectedCity === k ? 'bg-neon-amber text-black font-bold' : 'text-muted hover:text-slate-200'
                }`}
              >
                {CITY_PRESETS[k].name.split(',')[0]}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center bg-surface border border-border rounded px-2.5 py-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search global address..."
                className="bg-transparent text-xs text-slate-200 placeholder-muted outline-none w-44"
              />
              <button type="submit" className="text-muted hover:text-slate-200 p-0.5" title="Search address">
                {isSearching ? <span className="text-[10px] text-neon-cyan animate-spin">⏳</span> : <Search size={13} />}
              </button>
            </div>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-panel border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-surface hover:text-neon-cyan border-b border-border/50 last:border-none flex items-center gap-1.5"
                  >
                    <Plus size={12} className="text-neon-cyan flex-shrink-0" />
                    <span className="truncate">{res.name}</span>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Main Map View & Side Telemetry */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leaflet Map */}
        <div className="flex-1 h-full relative z-0">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ width: '100%', height: '100%', backgroundColor: '#0a0c10' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapClickHandler />

            {/* Render OSRM Road Polylines */}
            {roadPolylines.map((seg, i) => (
              <Polyline
                key={i}
                positions={seg.path}
                pathOptions={{
                  color: seg.color,
                  weight: 3.5,
                  opacity: 0.85,
                  dashArray: undefined,
                }}
              />
            ))}

            {/* Render City / Depot Markers */}
            {nodes.map((node, i) => {
              const isDepot = i === 0;
              const color = isDepot ? '#39ff14' : '#ff3d71';
              const label = isDepot ? '★' : String(node.id);

              return (
                <Marker
                  key={node.id}
                  position={[node.lat ?? 0, node.lng ?? 0]}
                  icon={createPinIcon(color, label)}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 text-xs">
                      <div className="font-bold text-slate-900">{node.name}</div>
                      <div className="text-slate-600">{isDepot ? 'Warehouse Depot' : `Cargo Demand: ${node.demand ?? 4} pkgs`}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          <div className="absolute top-4 left-4 z-[400] pointer-events-none text-[11px] text-muted tracking-wider uppercase bg-panel/90 border border-border px-3 py-1.5 rounded backdrop-blur">
            Click anywhere on the map to add delivery stops · OSRM Road Network
          </div>
        </div>

        {/* Fleet & Logistics Telemetry Sidebar */}
        <div className="w-80 h-full bg-panel border-l border-border flex flex-col p-4 overflow-y-auto">
          {/* Mode Switcher (Single Van TSP vs Multi-Van CVRP) */}
          <div className="bg-surface border border-border rounded-lg p-2 mb-4">
            <div className="text-[10px] text-muted uppercase font-bold mb-2">Fleet Dispatch Mode</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setFleetMode('single')}
                className={`py-1.5 text-xs font-bold rounded uppercase ${
                  fleetMode === 'single' ? 'bg-neon-cyan text-black' : 'text-muted hover:text-slate-200'
                }`}
              >
                Single Van (TSP)
              </button>
              <button
                onClick={() => setFleetMode('cvrp')}
                className={`py-1.5 text-xs font-bold rounded uppercase ${
                  fleetMode === 'cvrp' ? 'bg-neon-amber text-black' : 'text-muted hover:text-slate-200'
                }`}
              >
                Multi-Van (CVRP)
              </button>
            </div>
          </div>

          {/* Fleet Controls */}
          {fleetMode === 'cvrp' && (
            <div className="grid grid-cols-2 gap-2 bg-surface border border-border rounded-lg p-3 mb-4">
              <div>
                <div className="text-[9px] text-muted uppercase font-bold mb-1">Fleet Vans</div>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={vehicleCount}
                  onChange={(e) => setVehicleCount(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))}
                  className="w-full bg-background border border-border text-center text-xs py-1 rounded text-neon-amber font-bold outline-none"
                />
              </div>

              <div>
                <div className="text-[9px] text-muted uppercase font-bold mb-1">Van Capacity</div>
                <input
                  type="number"
                  min={10}
                  max={50}
                  value={vehicleCapacity}
                  onChange={(e) => setVehicleCapacity(Math.max(10, Math.min(50, parseInt(e.target.value) || 10)))}
                  className="w-full bg-background border border-border text-center text-xs py-1 rounded text-neon-amber font-bold outline-none"
                />
              </div>
            </div>
          )}

          {/* Primary Road Stats */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="bg-surface p-3 rounded-lg border border-border">
              <div className="text-[10px] text-muted uppercase font-bold mb-1">Road Distance</div>
              <div className="text-xl font-bold font-display text-neon-amber leading-none">
                {totalRoadKm.toFixed(1)} <span className="text-xs text-muted font-normal">km</span>
              </div>
            </div>

            <div className="bg-surface p-3 rounded-lg border border-border">
              <div className="text-[10px] text-muted uppercase font-bold mb-1">Drive Time</div>
              <div className="text-xl font-bold font-display text-neon-cyan leading-none">
                {Math.round(totalDurationMin)} <span className="text-xs text-muted font-normal">min</span>
              </div>
            </div>
          </div>

          {/* ESG & Cost Telemetry */}
          <div className="bg-surface border border-border rounded-lg p-3 mb-4 space-y-2 text-xs">
            <div className="text-[10px] text-muted uppercase font-bold mb-1">Real-World Fleet Impact</div>

            <div className="flex justify-between items-center">
              <span className="text-muted flex items-center gap-1">
                <Flame size={12} className="text-neon-amber" />
                <span>Diesel Consumption:</span>
              </span>
              <span className="font-mono font-bold text-slate-200">{fuelLiters} Liters</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted flex items-center gap-1">
                <ShieldCheck size={12} className="text-neon-green" />
                <span>Carbon Emissions:</span>
              </span>
              <span className="font-mono font-bold text-neon-green">{co2Kg} kg CO₂</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted flex items-center gap-1">
                <DollarSign size={12} className="text-neon-cyan" />
                <span>Driver Payroll:</span>
              </span>
              <span className="font-mono font-bold text-neon-cyan">${driverCost}</span>
            </div>
          </div>

          {/* Van Fleet Itineraries */}
          <div className="flex-1 flex flex-col min-h-0">
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider mb-2 block">
              Fleet Dispatches ({vehicleTours.length} Vehicles)
            </span>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {vehicleTours.map((v) => (
                <div key={v.vehicleId} className="bg-surface p-2.5 rounded border border-border text-xs">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5" style={{ color: v.color }}>
                      <Truck size={13} />
                      <span>{v.vehicleName}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-300">
                      {v.totalDemand} / {v.capacity} pkgs
                    </span>
                  </div>
                  <div className="text-[10px] text-muted truncate">
                    {v.tour.map((id) => nodes[id]?.name.split(' ')[0] || `Node ${id}`).join(' → ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Map Stops */}
          <button
            onClick={() => handleCityChange(selectedCity)}
            className="mt-3 flex items-center justify-center gap-1.5 py-2 bg-surface border border-border text-xs text-muted hover:text-slate-200 rounded"
          >
            <RotateCcw size={12} />
            <span>Reset City Stops</span>
          </button>
        </div>
      </div>
    </div>
  );
};
