import React, { useEffect, useState, useRef } from 'react';
import { Activity, Pause, Play, Square, MapPin, Gauge, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import { useApp } from '../contexts/AppContext';

interface TrafficUpdate {
  type: string;
  timestamp: string;
  area: string;
  road: string;
  traffic_volume: number;
  avg_speed: number;
  congestion_level: string;
  lat: number;
  lng: number;
  mode: string;
}

export default function LiveTraffic() {
  const [updates, setUpdates] = useState<TrafficUpdate[]>([]);
  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ volume: 0, speed: 0, congestion: 'Low' });
  const wsRef = useRef<WebSocket | null>(null);
  const { addAlert } = useApp();

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/traffic');
      ws.onopen = () => { setConnected(true); setRunning(true); };
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data) as TrafficUpdate;
        if (data.type === 'traffic_update') {
          setUpdates(prev => [data, ...prev.slice(0, 49)]);
          setStats({ volume: data.traffic_volume, speed: data.avg_speed, congestion: data.congestion_level });
          if (data.congestion_level === 'Severe' || data.congestion_level === 'High') {
            addAlert({ type: 'alert', timestamp: data.timestamp, area: data.area, severity: data.congestion_level, message: `${data.congestion_level} congestion at ${data.area}` });
          }
        }
      };
      ws.onclose = () => { setConnected(false); setRunning(false); };
      ws.onerror = () => { setConnected(false); setRunning(false); };
      wsRef.current = ws;
    } catch { setConnected(false); }
  };

  const disconnect = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
    setRunning(false);
  };

  useEffect(() => { return () => { wsRef.current?.close(); }; }, []);

  const congestionColor: Record<string, string> = {
    'Free Flow': 'text-green-400', 'Low': 'text-lime-400', 'Moderate': 'text-yellow-400',
    'High': 'text-orange-400', 'Severe': 'text-red-400'
  };

  const formatTime = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    catch { return iso; }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Live Traffic Monitoring</h2>
          <p className="text-xs text-slate-500 mt-0.5">Historical dataset playback with real-time streaming</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${connected ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-slate-500/10 border-slate-500/30 text-slate-400'}`}>
            {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {connected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg px-2.5 py-1.5 text-xs text-sky-400">
            📽 Historical Playback Mode
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-400 font-medium">Controls:</span>
        <button
          onClick={connect}
          disabled={connected}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-400 text-xs rounded-lg transition-colors disabled:opacity-40"
        >
          <Play size={12} /> Start
        </button>
        <button
          onClick={() => wsRef.current?.close()}
          disabled={!connected}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-400 text-xs rounded-lg transition-colors disabled:opacity-40"
        >
          <Pause size={12} /> Pause
        </button>
        <button
          onClick={disconnect}
          disabled={!connected}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs rounded-lg transition-colors disabled:opacity-40"
        >
          <Square size={12} /> Stop
        </button>
        <div className="ml-auto flex items-center gap-2">
          <Activity size={13} className={connected ? 'text-green-400 animate-pulse' : 'text-slate-600'} />
          <span className="text-xs text-slate-500">{updates.length} updates received</span>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-sky-400">{stats.volume.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Traffic Volume</div>
        </div>
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.speed} km/h</div>
          <div className="text-xs text-slate-500 mt-1">Average Speed</div>
        </div>
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${congestionColor[stats.congestion] || 'text-slate-300'}`}>{stats.congestion}</div>
          <div className="text-xs text-slate-500 mt-1">Congestion Level</div>
        </div>
      </div>

      {/* Live Feed Table */}
      <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#1E3A5F]">
          <h3 className="text-sm font-semibold text-slate-200">Live Traffic Feed</h3>
          <div className="flex items-center gap-2">
            {connected && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
            <span className="text-xs text-slate-500">Last 50 records</span>
          </div>
        </div>
        {updates.length === 0 ? (
          <div className="p-12 text-center">
            <Activity size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Click <strong className="text-slate-300">Start</strong> to begin traffic monitoring</p>
            <p className="text-slate-600 text-xs mt-1">Streaming historical Bangalore traffic data via WebSocket</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs data-table">
              <thead>
                <tr>
                  <th className="text-left text-slate-400 font-medium">Time</th>
                  <th className="text-left text-slate-400 font-medium">Area</th>
                  <th className="text-left text-slate-400 font-medium">Road</th>
                  <th className="text-right text-slate-400 font-medium">Volume</th>
                  <th className="text-right text-slate-400 font-medium">Speed</th>
                  <th className="text-center text-slate-400 font-medium">Congestion</th>
                </tr>
              </thead>
              <tbody>
                {updates.map((u, i) => (
                  <tr key={i} className={i === 0 ? 'bg-sky-500/5' : ''}>
                    <td className="text-slate-400 font-mono">{formatTime(u.timestamp)}</td>
                    <td className="text-slate-300 font-medium">{u.area}</td>
                    <td className="text-slate-400 max-w-32 truncate">{u.road}</td>
                    <td className="text-right text-sky-400 font-medium">{u.traffic_volume.toLocaleString()}</td>
                    <td className="text-right text-cyan-400">{u.avg_speed} km/h</td>
                    <td className="text-center"><StatusBadge level={u.congestion_level} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
