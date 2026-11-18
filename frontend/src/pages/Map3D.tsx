import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl, useMap } from 'react-leaflet';
import { Map as MapIcon, Layers, AlertTriangle, Navigation, Compass, Search, Filter } from 'lucide-react';
import { hotspotsApi, analyticsApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';
import 'leaflet/dist/leaflet.css';

const congestionColors: Record<string, string> = {
  'Free Flow': '#22C55E',
  'Low': '#84CC16',
  'Moderate': '#FACC15',
  'High': '#F97316',
  'Severe': '#EF4444'
};

// Component to handle map camera animation
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

export default function Map3D() {
  const [mapData, setMapData] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedCorridor, setSelectedCorridor] = useState<any | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [hotRes, locRes] = await Promise.all([
          hotspotsApi.getMapData(),
          analyticsApi.getLocations()
        ]);
        if (hotRes.data.success) setMapData(hotRes.data.map_data || []);
        if (locRes.data.success) setLocations(locRes.data.locations || []);
      } catch (e: any) {
        setError('Map telemetry data temporarily unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const areas = Array.from(new Set(mapData.map(d => d.area))).sort();

  const filteredData = selectedArea === 'all'
    ? mapData
    : mapData.filter(d => d.area === selectedArea);

  const handleSelectLocation = (loc: any) => {
    setSelectedCorridor(loc);
    setMapCenter([loc.lat, loc.lng]);
    setMapZoom(14);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <MapIcon size={18} className="text-sky-400" />
            3D Bangalore Traffic Map & Corridor Network
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time geospatial visualization covering 45 arterial corridors and key Bangalore junctions.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap bg-[#14243A] px-3 py-1.5 rounded-xl border border-[#1E3A5F]">
          {['Free Flow', 'Low', 'Moderate', 'High', 'Severe'].map(l => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: congestionColors[l], boxShadow: `0 0 6px ${congestionColors[l]}` }} />
              <span className="text-[11px] text-slate-300 font-medium">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Area Quick Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => { setSelectedArea('all'); setMapCenter([12.9716, 77.5946]); setMapZoom(12); }}
          className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-colors border ${
            selectedArea === 'all'
              ? 'bg-sky-500/20 text-sky-400 border-sky-400/40 shadow-sm'
              : 'bg-[#14243A] text-slate-400 border-[#1E3A5F] hover:text-slate-200'
          }`}
        >
          All Bangalore Corridors ({mapData.length})
        </button>
        {areas.map(area => {
          const areaPoints = mapData.filter(d => d.area === area);
          return (
            <button
              key={area}
              onClick={() => {
                setSelectedArea(area);
                if (areaPoints.length > 0) {
                  setMapCenter([areaPoints[0].lat, areaPoints[0].lng]);
                  setMapZoom(13);
                }
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-colors border ${
                selectedArea === area
                  ? 'bg-sky-500/20 text-sky-400 border-sky-400/40 shadow-sm'
                  : 'bg-[#14243A] text-slate-400 border-[#1E3A5F] hover:text-slate-200'
              }`}
            >
              {area} ({areaPoints.length})
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner fullPage text="Synchronizing GIS telemetry layers..." />
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
          <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : (
        <div className="bg-[#07111F] border border-[#1E3A5F] rounded-2xl overflow-hidden shadow-2xl relative" style={{ height: 560 }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%', background: '#07111F' }}
          >
            <MapController center={mapCenter} zoom={mapZoom} />

            <LayersControl position="topright">
              {/* 1. Dark Enterprise Basemap (Watermark Free) */}
              <LayersControl.BaseLayer checked name="Dark Command View (Default)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
                  maxZoom={16}
                />
              </LayersControl.BaseLayer>

              {/* 2. OpenStreetMap Standard (Free, Public) */}
              <LayersControl.BaseLayer name="OpenStreetMap Streets">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>

              {/* 3. Satellite Imagery */}
              <LayersControl.BaseLayer name="Satellite Aerial">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution='&copy; Esri, Maxar, Earthstar Geographics'
                  maxZoom={18}
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {/* Render 45 distinct Bangalore arterial road corridor stations */}
            {filteredData.map((loc, i) => {
              const markerColor = loc.color || congestionColors[loc.congestion] || '#FACC15';
              const radius = Math.max(9, Math.min(18, 8 + (loc.intensity || 2) * 2.5));

              return (
                <React.Fragment key={`${loc.area}-${loc.road}-${i}`}>
                  {/* Subtle outer pulse halo */}
                  <CircleMarker
                    center={[loc.lat, loc.lng]}
                    radius={radius + 6}
                    pathOptions={{
                      color: markerColor,
                      fillColor: markerColor,
                      fillOpacity: 0.15,
                      weight: 1,
                      dashArray: '2 4'
                    }}
                  />

                  {/* Core interactive corridor marker */}
                  <CircleMarker
                    center={[loc.lat, loc.lng]}
                    radius={radius}
                    pathOptions={{
                      color: '#FFFFFF',
                      fillColor: markerColor,
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => handleSelectLocation(loc)
                    }}
                  >
                    <Popup className="traffic-custom-popup">
                      <div className="bg-[#0D1B2E] text-slate-100 p-3 rounded-xl border border-sky-400/30 shadow-2xl min-w-56 font-sans">
                        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-[#1E3A5F]">
                          <span className="text-xs font-bold text-sky-400 font-mono">{loc.area}</span>
                          <StatusBadge level={loc.congestion || 'Moderate'} />
                        </div>
                        <div className="font-semibold text-xs text-slate-100 mb-2">{loc.road}</div>
                        <div className="space-y-1.5 text-[11px] font-mono">
                          <div className="flex justify-between items-center text-slate-400">
                            <span>Traffic Flow:</span>
                            <span className="text-slate-100 font-bold">{loc.traffic_volume?.toLocaleString()} veh/h</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-400">
                            <span>Corridor Speed:</span>
                            <span className="text-cyan-400 font-bold">{loc.avg_speed} km/h</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-400">
                            <span>Congestion Level:</span>
                            <span style={{ color: markerColor }} className="font-bold">{loc.congestion}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-500 text-[10px] pt-1 border-t border-[#1E3A5F]">
                            <span>GPS:</span>
                            <span>{loc.lat.toFixed(4)}° N, {loc.lng.toFixed(4)}° E</span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            })}
          </MapContainer>

          {/* Floating Map Legend & Stats Overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-[#0D1B2E]/90 backdrop-blur-md border border-[#1E3A5F] rounded-xl p-3 shadow-xl text-xs space-y-1">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Bangalore Metro Grid</div>
            <div className="flex items-center gap-3 text-slate-300 font-mono text-[11px]">
              <span>Active Corridors: <strong className="text-sky-400">{filteredData.length}</strong></span>
              <span>•</span>
              <span>Zones: <strong className="text-emerald-400">{selectedArea === 'all' ? '15' : '1'}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Corridors Overview Table */}
      {locations.length > 0 && (
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-[#1E3A5F] flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Bangalore Road Corridors Telemetry</h3>
              <p className="text-xs text-slate-500">Click any corridor row to center and zoom in on the interactive map</p>
            </div>
            <span className="text-xs text-slate-400 font-mono bg-[#0D1B2E] px-2.5 py-1 rounded-lg border border-[#1E3A5F]">
              Showing {filteredData.length} corridor junctions
            </span>
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-xs data-table">
              <thead className="sticky top-0 bg-[#0D1B2E] z-10">
                <tr>
                  <th className="text-left text-slate-400 font-medium">Urban Area</th>
                  <th className="text-left text-slate-400 font-medium">Road / Corridor</th>
                  <th className="text-right text-slate-400 font-medium">Avg Volume (veh/hr)</th>
                  <th className="text-right text-slate-400 font-medium">Avg Speed</th>
                  <th className="text-center text-slate-400 font-medium">Congestion</th>
                  <th className="text-center text-slate-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((loc, i) => (
                  <tr
                    key={i}
                    onClick={() => handleSelectLocation(loc)}
                    className="cursor-pointer hover:bg-[#16273D] transition-colors"
                  >
                    <td className="text-slate-200 font-medium">{loc.area}</td>
                    <td className="text-slate-400 font-mono">{loc.road}</td>
                    <td className="text-right text-sky-400 font-mono font-medium">{loc.traffic_volume?.toLocaleString()}</td>
                    <td className="text-right text-cyan-400 font-mono">{loc.avg_speed} km/h</td>
                    <td className="text-center"><StatusBadge level={loc.congestion} /></td>
                    <td className="text-center">
                      <button className="text-[11px] text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1 mx-auto">
                        <Navigation size={11} /> Locate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
