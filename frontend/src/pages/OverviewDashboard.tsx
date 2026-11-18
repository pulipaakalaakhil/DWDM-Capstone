import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity, Car, Gauge, BarChart2, AlertTriangle, MapPin, Clock, Brain,
  RefreshCw, Filter
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import KPICard from '../components/ui/KPICard';
import ChartCard from '../components/ui/ChartCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useApp } from '../contexts/AppContext';
import { analyticsApi } from '../api/client';
import { AnalyticsData } from '../types';

const COLORS = ['#22C55E', '#84CC16', '#FACC15', '#F97316', '#EF4444'];
const CONGESTION_COLORS: Record<string, string> = {
  'Free Flow': '#22C55E', 'Low': '#84CC16', 'Moderate': '#FACC15',
  'High': '#F97316', 'Severe': '#EF4444'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-lg p-2.5 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}: <span className="text-white font-medium">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span></span>
        </div>
      ))}
    </div>
  );
};

export default function OverviewDashboard() {
  const { summary, filters, setFilters, filterOptions } = useApp();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [congestionData, setCongestionData] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<'hourly' | 'daily' | 'monthly'>('hourly');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const params: Record<string, string> = { granularity };
      if (filters.area) params.area = filters.area;
      if (filters.congestion) params.congestion = filters.congestion;

      const [analyticsRes, congestionRes, heatmapRes] = await Promise.all([
        analyticsApi.getTraffic(params),
        analyticsApi.getCongestion(),
        analyticsApi.getHeatmap(),
      ]);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data);
      if (congestionRes.data.success) setCongestionData(congestionRes.data);
      if (heatmapRes.data.success) setHeatmap(heatmapRes.data.heatmap || []);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load analytics. Is the backend running?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters.area, filters.congestion, granularity]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refresh = () => { setRefreshing(true); fetchData(); };

  const congestionPieData = analytics
    ? Object.entries(analytics.congestion_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const heatDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxHeat = heatmap.length > 0
    ? Math.max(...heatmap.flatMap(r => heatDays.map(d => r[d] || 0)))
    : 1;

  const getHeatColor = (val: number) => {
    const ratio = val / maxHeat;
    if (ratio < 0.2) return '#1E3A5F';
    if (ratio < 0.4) return '#1d4ed8';
    if (ratio < 0.6) return '#0369a1';
    if (ratio < 0.8) return '#0284c7';
    return '#38BDF8';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Traffic Intelligence Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Bangalore Traffic Pattern Analysis — Real-time & Historical</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Area filter */}
          <select
            value={filters.area || ''}
            onChange={e => setFilters({ area: e.target.value || null })}
            className="bg-[#14243A] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-400/50"
          >
            <option value="">All Areas</option>
            {filterOptions.areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Congestion filter */}
          <select
            value={filters.congestion || ''}
            onChange={e => setFilters({ congestion: e.target.value || null })}
            className="bg-[#14243A] border border-[#1E3A5F] text-xs text-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-400/50"
          >
            <option value="">All Congestion</option>
            {filterOptions.congestion_levels.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Granularity */}
          <div className="flex bg-[#14243A] border border-[#1E3A5F] rounded-lg overflow-hidden">
            {(['hourly', 'daily', 'monthly'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${granularity === g ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>

          <button onClick={refresh} disabled={refreshing} className="flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          title="Total Records"
          value={summary?.total_records ?? '—'}
          icon={<BarChart2 size={16} />}
          color="sky"
          subtitle="Bangalore traffic dataset"
          sparklineData={[400, 450, 420, 480, 460, 500, 490]}
        />
        <KPICard
          title="Total Vehicles"
          value={summary ? (summary.total_vehicles / 1e6).toFixed(1) + 'M' : '—'}
          icon={<Car size={16} />}
          color="green"
          change={3.2}
          trend="up"
          subtitle="vs last period"
        />
        <KPICard
          title="Avg Speed"
          value={summary?.avg_speed ?? '—'}
          unit="km/h"
          icon={<Gauge size={16} />}
          color="cyan"
          change={-2.1}
          trend="down"
          subtitle="city-wide average"
          sparklineData={[45, 40, 38, 42, 35, 30, 34]}
        />
        <KPICard
          title="Avg Traffic Volume"
          value={summary ? Math.round(summary.avg_volume).toLocaleString() : '—'}
          icon={<Activity size={16} />}
          color="purple"
          change={5.4}
          trend="up"
          subtitle="vehicles/interval"
        />
        <KPICard
          title="Congestion Index"
          value={summary?.congestion_index ?? '—'}
          icon={<AlertTriangle size={16} />}
          color="orange"
          subtitle="0=Free Flow, 4=Severe"
        />
        <KPICard
          title="Traffic Hotspots"
          value={10}
          icon={<MapPin size={16} />}
          color="red"
          subtitle="Top congested areas"
        />
        <KPICard
          title="Peak Traffic Hour"
          value={summary?.peak_hour !== null && summary?.peak_hour !== undefined ? `${String(summary.peak_hour).padStart(2, '0')}:00` : '—'}
          icon={<Clock size={16} />}
          color="yellow"
          subtitle="Highest volume hour"
        />
        <KPICard
          title="Dataset Coverage"
          value={Array.isArray(summary?.areas) ? summary.areas.length : (summary?.areas ?? '—')}
          unit="areas"
          icon={<Brain size={16} />}
          color="pink"
          subtitle={`${Array.isArray(summary?.roads) ? summary.roads.length : (summary?.roads ?? 0)} road intersections`}
        />
      </div>

      {/* Charts Row 1 */}
      {loading ? (
        <LoadingSpinner fullPage text="Loading analytics data..." />
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-slate-500 text-xs mt-1">Make sure the backend is running on port 8000</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Traffic Volume Over Time */}
            <ChartCard title="Traffic Volume Over Time" subtitle={`${granularity} trend`} className="lg:col-span-2" height="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.time_series || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="period" tick={{ fill: '#64748B', fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="traffic_volume" name="Traffic Volume" stroke="#38BDF8" fill="url(#volGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="avg_speed" name="Avg Speed" stroke="#22D3EE" fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Congestion Pie */}
            <ChartCard title="Congestion Distribution" subtitle="by level" height="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={congestionPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                    {congestionPieData.map((entry, i) => (
                      <Cell key={i} fill={CONGESTION_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Traffic by Location */}
            <ChartCard title="Traffic by Location" subtitle="avg volume per area" height="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.area_data?.slice(0, 10) || []} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="area" tick={{ fill: '#64748B', fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="traffic_volume" name="Traffic Volume" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="avg_speed" name="Avg Speed" fill="#22D3EE" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Weekday vs Weekend */}
            <ChartCard title="Weekday vs Weekend" subtitle="hourly traffic volume" height="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.weekday_weekend || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="hour" tickFormatter={v => `${v}h`} tick={{ fill: '#64748B', fontSize: 10 }} interval={3} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
                  <Bar dataKey="weekday" name="Weekday" fill="#38BDF8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="weekend" name="Weekend" fill="#22D3EE" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Charts Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Congestion hourly trend */}
            <ChartCard title="Hourly Congestion Index" subtitle="0=Free Flow to 4=Severe" height="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={congestionData?.hourly_congestion || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="hour" tickFormatter={v => `${v}h`} tick={{ fill: '#64748B', fontSize: 10 }} interval={3} />
                  <YAxis domain={[0, 4]} tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="congestion_index" name="Congestion" stroke="#F97316" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="avg_speed" name="Avg Speed" stroke="#22C55E" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Weather Impact */}
            <ChartCard title="Weather Impact on Traffic" subtitle="avg volume by weather" height="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.weather_data || []} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="weather" tick={{ fill: '#64748B', fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="traffic_volume" name="Traffic Volume" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="avg_speed" name="Avg Speed" fill="#22C55E" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Traffic Density Heatmap */}
          <ChartCard title="Traffic Density Heatmap" subtitle="Hour vs Day — average traffic volume" height="auto">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-slate-500 text-left pb-2 pr-2 w-10">Hour</th>
                    {heatDays.map(d => <th key={d} className="text-slate-400 font-medium pb-2 text-center w-12">{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.slice(0, 24).map(row => (
                    <tr key={row.hour}>
                      <td className="text-slate-500 pr-2 py-0.5 text-right">{`${row.hour}h`}</td>
                      {heatDays.map(d => {
                        const val = row[d] || 0;
                        return (
                          <td key={d} className="py-0.5 px-0.5">
                            <div
                              className="h-5 rounded text-center flex items-center justify-center text-[9px] text-white/70 font-medium"
                              style={{ background: getHeatColor(val) }}
                              title={`${row.hour}:00 ${d} — ${Math.round(val).toLocaleString()}`}
                            >
                              {val > 500 ? Math.round(val / 100) + 'h' : ''}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-slate-500">Low</span>
                {['#1E3A5F', '#1d4ed8', '#0369a1', '#0284c7', '#38BDF8'].map((c, i) => (
                  <div key={i} className="w-8 h-3 rounded" style={{ background: c }} />
                ))}
                <span className="text-xs text-slate-500">High</span>
              </div>
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}
