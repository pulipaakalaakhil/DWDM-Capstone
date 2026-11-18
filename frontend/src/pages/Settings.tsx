import React, { useState } from 'react';
import { SlidersHorizontal, Save, Bell, Server, Moon, ShieldCheck, Check } from 'lucide-react';

export default function Settings() {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [refreshRate, setRefreshRate] = useState(5);
  const [speedThreshold, setSpeedThreshold] = useState(25);
  const [volumeThreshold, setVolumeThreshold] = useState(2200);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-100">System Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure operational thresholds, API connections, and alert triggers</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* API & Backend */}
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Server size={15} className="text-sky-400" />
            Backend Connection
          </h3>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">FastAPI Base Endpoint</label>
            <input
              type="text"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-400/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Live Monitoring Refresh Interval: {refreshRate}s</label>
            <input
              type="range"
              min={1}
              max={30}
              value={refreshRate}
              onChange={e => setRefreshRate(+e.target.value)}
              className="w-full accent-sky-400"
            />
          </div>
        </div>

        {/* Thresholds */}
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Bell size={15} className="text-amber-400" />
            Congestion Alert Triggers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Severe Speed Drop Threshold (km/h)</label>
              <input
                type="number"
                value={speedThreshold}
                onChange={e => setSpeedThreshold(+e.target.value)}
                className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-400/50"
              />
              <span className="text-[10px] text-slate-500">Alert triggers when road speed falls below this velocity</span>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Volume Spike Threshold (Vehicles)</label>
              <input
                type="number"
                value={volumeThreshold}
                onChange={e => setVolumeThreshold(+e.target.value)}
                className="w-full bg-[#07111F] border border-[#1E3A5F] text-xs text-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-400/50"
              />
              <span className="text-[10px] text-slate-500">Alert triggers when road density exceeds this volume</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs text-slate-300 block">Critical Warning Beep</span>
              <span className="text-[10px] text-slate-500">Audible notification on severe congestion detection</span>
            </div>
            <button
              type="button"
              onClick={() => setSoundAlerts(!soundAlerts)}
              className={`w-10 h-5 rounded-full transition-colors relative ${soundAlerts ? 'bg-sky-500' : 'bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${soundAlerts ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Moon size={15} className="text-cyan-400" />
            Theme & Visualization Mode
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Color Palette</span>
            <span className="px-2.5 py-1 rounded bg-[#07111F] border border-[#1E3A5F] text-sky-400 font-mono text-[11px]">
              Smart City Command Center (Dark Navy)
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 animate-fadeIn">
              <Check size={14} /> Configuration saved successfully
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-400 text-xs font-semibold rounded-lg transition-colors"
          >
            <Save size={14} /> Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
