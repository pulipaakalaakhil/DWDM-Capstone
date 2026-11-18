import React, { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyticsApi, predictionApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const COLORS = ['#38BDF8','#22C55E','#FACC15','#F97316','#EF4444','#A855F7'];
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-lg p-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p: any, i: number) => <div key={i} className="text-slate-300">{p.name}: <span className="text-white font-medium">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span></div>)}
    </div>
  );
};

export default function BIAnalytics() {
  const [dashTab, setDashTab] = useState(0);
  const [analytics, setAnalytics] = useState<any>(null);
  const [comparison, setComparison] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<'hourly'|'daily'|'monthly'>('hourly');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await analyticsApi.getTraffic({ granularity });
        if (res.data.success) setAnalytics(res.data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [granularity]);

  const runComparison = async () => {
    try {
      const res = await predictionApi.evaluate();
      if (res.data.success) setComparison(res.data.comparison || []);
    } catch {}
  };

  const dashboards = ['Traffic Overview', 'Time-Based Analysis', 'Location Analysis', 'Prediction & ML', 'Vehicle & Weather'];

  const congestionPieData = analytics ? Object.entries(analytics.congestion_distribution || {}).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Business Intelligence Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tableau-style interactive dashboards powered by real traffic data</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['hourly','daily','monthly'] as const).map(g => (
            <button key={g} onClick={() => setGranularity(g)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${granularity === g ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'border-[#1E3A5F] text-slate-400 hover:text-slate-200'}`}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard tabs */}
      <div className="flex gap-1 flex-wrap bg-[#14243A] border border-[#1E3A5F] rounded-xl p-1">
        {dashboards.map((d, i) => (
          <button key={i} onClick={() => setDashTab(i)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${dashTab === i ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}>{d}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner fullPage /> : (
        <>
          {/* Dashboard 0: Traffic Overview */}
          {dashTab === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Records', value: analytics?.total_records?.toLocaleString() || '—', color: 'text-sky-400' },
                  { label: 'Areas Covered', value: analytics?.area_data?.length || '—', color: 'text-green-400' },
                  { label: 'Peak Volume Area', value: analytics?.area_data?.[0]?.area || '—', color: 'text-yellow-400' },
                  { label: 'Avg Speed', value: analytics?.area_data ? (analytics.area_data.reduce((a: number, b: any) => a + b.avg_speed, 0) / analytics.area_data.length).toFixed(1) + ' km/h' : '—', color: 'text-cyan-400' },
                ].map(c => (
                  <div key={c.label} className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                    <div className={`text-xl font-bold mb-1 ${c.color}`}>{c.value}</div>
                    <div className="text-xs text-slate-500">{c.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Traffic Volume Trend</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics?.time_series || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} /><stop offset="95%" stopColor="#38BDF8" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                        <XAxis dataKey="period" tick={{ fill: '#64748B', fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="traffic_volume" name="Traffic Volume" stroke="#38BDF8" fill="url(#g1)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Congestion Distribution</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={congestionPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                          {congestionPieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard 1: Time-Based */}
          {dashTab === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Traffic Volume by Period</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.time_series || []} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                      <XAxis dataKey="period" tick={{ fill: '#64748B', fontSize: 10 }} angle={-20} textAnchor="end" interval={2} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="traffic_volume" stroke="#38BDF8" strokeWidth={2} dot={false} name="Traffic Volume" />
                      <Line type="monotone" dataKey="avg_speed" stroke="#22C55E" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Avg Speed" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Weekday vs Weekend</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.weekday_weekend || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                      <XAxis dataKey="hour" tickFormatter={v => `${v}h`} tick={{ fill: '#64748B', fontSize: 10 }} interval={4} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
                      <Bar dataKey="weekday" name="Weekday" fill="#38BDF8" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="weekend" name="Weekend" fill="#22D3EE" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard 2: Location */}
          {dashTab === 2 && (
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Traffic Volume by Location (Top 15)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.area_data?.slice(0, 15) || []} layout="vertical" margin={{ top: 0, right: 10, left: 100, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
                    <YAxis type="category" dataKey="area" tick={{ fill: '#94A3B8', fontSize: 10 }} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="traffic_volume" name="Avg Traffic Volume" fill="#38BDF8" radius={[0, 3, 3, 0]} />
                    <Bar dataKey="avg_speed" name="Avg Speed (km/h)" fill="#22C55E" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Dashboard 3: ML */}
          {dashTab === 3 && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={runComparison} className="text-xs text-sky-400 border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 rounded-lg hover:bg-sky-500/20 transition-colors">
                  Load Model Comparison
                </button>
              </div>
              {comparison.length > 0 ? (
                <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Model Performance Comparison</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparison} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                        <XAxis dataKey="model" tick={{ fill: '#64748B', fontSize: 10 }} angle={-15} textAnchor="end" />
                        <YAxis domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#64748B', fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} formatter={(v: number) => `${(v * 100).toFixed(2)}%`} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="accuracy" name="Accuracy" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="f1_score" name="F1 Score" fill="#22C55E" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl flex items-center justify-center h-40 text-slate-600 text-sm">
                  Click "Load Model Comparison" to evaluate all models
                </div>
              )}
            </div>
          )}

          {/* Dashboard 4: Weather */}
          {dashTab === 4 && (
            <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Traffic by Weather Condition</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.weather_data || []} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                    <XAxis dataKey="weather" tick={{ fill: '#64748B', fontSize: 10 }} angle={-10} textAnchor="end" />
                    <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="traffic_volume" name="Traffic Volume" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="avg_speed" name="Avg Speed" fill="#22C55E" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
