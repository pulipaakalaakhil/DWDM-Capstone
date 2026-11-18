import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl } from 'react-leaflet';
import { Flame, MapPin, AlertTriangle, Navigation } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { hotspotsApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';
import 'leaflet/dist/leaflet.css';

const severityColor: Record<string, string> = { Severe: '#EF4444', High: '#F97316', Moderate: '#FACC15' };

export default function HotspotDetection() {
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [mapData, setMapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'table' | 'map' | 'chart'>('table');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [hRes, mRes] = await Promise.all([hotspotsApi.getHotspots(), hotspotsApi.getMapData()]);
        if (hRes.data.success) setHotspots(hRes.data.hotspots || []);
        if (mRes.data.success) setMapData(mRes.data.map_data || []);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const chartData = hotspots.slice(0, 10).map(h => ({
    area: h.area.slice(0, 12),
    score: +(h.congestion_score * 100).toFixed(1),
    volume: Math.round(h.avg_traffic)
  }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Flame size={18} className="text-red-400" />
          Traffic Hotspot Detection & Critical Junctions
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Top congested locations ranked via multi-factor density scoring</p>
      </div>

      {loading ? <LoadingSpinner fullPage text="Calculating hotspot spatial clusters..." /> : (
        <>
          {/* Top 3 severe hotspots */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {hotspots.slice(0, 3).map((h, i) => (
              <div key={i} className="bg-[#14243A] border rounded-xl p-4 shadow-lg transition-all" style={{ borderColor: severityColor[h.severity] + '55' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 font-mono">#{h.rank} Hotspot Corridor</span>
                  <StatusBadge level={h.severity} />
                </div>
                <div className="text-sm font-bold text-slate-100 mb-0.5">{h.area}</div>
                <div className="text-xs text-slate-400 mb-3 font-mono">{h.road}</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div><span className="text-slate-500">Volume: </span><span className="text-sky-400 font-medium">{Math.round(h.avg_traffic).toLocaleString()}</span></div>
                  <div><span className="text-slate-500">Speed: </span><span className="text-cyan-400 font-medium">{h.avg_speed} km/h</span></div>
                  <div><span className="text-slate-500">Score: </span><span className="font-bold" style={{ color: severityColor[h.severity] }}>{(h.congestion_score * 100).toFixed(0)}%</span></div>
                  <div><span className="text-slate-500">Incidents: </span><span className="text-red-400 font-medium">{h.incident_count.toFixed(0)}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#14243A] border border-[#1E3A5F] rounded-xl p-1 w-fit">
            {[['table','Ranking Table'], ['map','Hotspot Map'], ['chart','Analytics']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k as any)} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === k ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}>{l}</button>
            ))}
          </div>

          {tab === 'table' && (
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-xs data-table">
                  <thead><tr>
                    <th className="text-center text-slate-400 font-medium">Rank</th>
                    <th className="text-left text-slate-400 font-medium">Area</th>
                    <th className="text-left text-slate-400 font-medium">Road</th>
                    <th className="text-right text-slate-400 font-medium">Avg Volume</th>
                    <th className="text-right text-slate-400 font-medium">Avg Speed</th>
                    <th className="text-right text-slate-400 font-medium">Cong. Index</th>
                    <th className="text-right text-slate-400 font-medium">Score</th>
                    <th className="text-right text-slate-400 font-medium">Capacity %</th>
                    <th className="text-center text-slate-400 font-medium">Severity</th>
                  </tr></thead>
                  <tbody>
                    {hotspots.map((h, i) => (
                      <tr key={i}>
                        <td className="text-center">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto font-mono ${i < 3 ? 'bg-red-500/20 text-red-400' : 'bg-[#1E3A5F] text-slate-400'}`}>{h.rank}</span>
                        </td>
                        <td className="text-slate-200 font-medium">{h.area}</td>
                        <td className="text-slate-400 max-w-32 truncate font-mono">{h.road}</td>
                        <td className="text-right text-sky-400 font-mono">{Math.round(h.avg_traffic).toLocaleString()}</td>
                        <td className="text-right text-cyan-400 font-mono">{h.avg_speed} km/h</td>
                        <td className="text-right text-slate-300 font-mono">{h.congestion_index.toFixed(2)}</td>
                        <td className="text-right font-bold font-mono" style={{ color: severityColor[h.severity] }}>{(h.congestion_score * 100).toFixed(1)}%</td>
                        <td className="text-right text-slate-300 font-mono">{h.capacity_utilization.toFixed(1)}%</td>
                        <td className="text-center"><StatusBadge level={h.severity} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'map' && (
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl overflow-hidden shadow-2xl" style={{ height: 500 }}>
              <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%', background: '#07111F' }}>
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="Dark Basemap">
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                      attribution='&copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
                    />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Street Basemap">
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                  </LayersControl.BaseLayer>
                </LayersControl>

                {mapData.map((loc, i) => (
                  <CircleMarker
                    key={i}
                    center={[loc.lat, loc.lng]}
                    radius={Math.max(9, Math.min(18, 8 + (loc.intensity || 2) * 2.5))}
                    pathOptions={{
                      color: '#FFFFFF',
                      fillColor: loc.color || '#FACC15',
                      fillOpacity: 0.85,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 min-w-44 font-sans">
                        <div className="font-bold text-sky-400 font-mono">{loc.area}</div>
                        <div className="text-slate-300 mb-1">{loc.road}</div>
                        <div className="text-[11px] space-y-0.5 text-slate-400 font-mono">
                          <div>Volume: <b className="text-slate-100">{loc.traffic_volume?.toLocaleString()}</b></div>
                          <div>Speed: <b className="text-cyan-400">{loc.avg_speed} km/h</b></div>
                          <div>Congestion: <b style={{ color: loc.color }}>{loc.congestion || 'High'}</b></div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          )}

          {tab === 'chart' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Congestion Score by Area</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 80, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} domain={[0, 100]} unit="%" />
                      <YAxis type="category" dataKey="area" tick={{ fill: '#94A3B8', fontSize: 10 }} width={80} />
                      <Tooltip contentStyle={{ background: '#0D1B2E', border: '1px solid #1E3A5F', borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="score" name="Congestion Score" fill="#EF4444" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Traffic Volume at Hotspots</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 80, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
                      <YAxis type="category" dataKey="area" tick={{ fill: '#94A3B8', fontSize: 10 }} width={80} />
                      <Tooltip contentStyle={{ background: '#0D1B2E', border: '1px solid #1E3A5F', borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="volume" name="Avg Traffic Volume" fill="#38BDF8" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
