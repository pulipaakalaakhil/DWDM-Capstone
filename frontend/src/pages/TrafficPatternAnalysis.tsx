import React, { useEffect, useState } from 'react';
import { TrendingUp, Calendar, Clock, CloudRain, MapPin } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { analyticsApi } from '../api/client';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ChartCard from '../components/ui/ChartCard';
import { useApp } from '../contexts/AppContext';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D1B2E] border border-[#1E3A5F] rounded-lg p-2.5 text-xs shadow-xl">
      <div className="text-slate-400 mb-1 font-medium">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">
            {p.name}: <span className="text-white font-semibold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TrafficPatternAnalysis() {
  const { filterOptions } = useApp();
  const [selectedArea, setSelectedArea] = useState('');
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [weekdayWeekend, setWeekdayWeekend] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [congestionTrend, setCongestionTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const areaParam = selectedArea ? { area: selectedArea } : {};
        const [hourRes, dayRes, monthRes, congRes] = await Promise.all([
          analyticsApi.getTraffic({ ...areaParam, granularity: 'hourly' }),
          analyticsApi.getTraffic({ ...areaParam, granularity: 'daily' }),
          analyticsApi.getTraffic({ ...areaParam, granularity: 'monthly' }),
          analyticsApi.getCongestion()
        ]);

        if (hourRes.data.success) {
          setHourlyData(hourRes.data.time_series || []);
          setWeekdayWeekend(hourRes.data.weekday_weekend || []);
          setWeatherData(hourRes.data.weather_data || []);
        }
        if (dayRes.data.success) setDailyData(dayRes.data.time_series || []);
        if (monthRes.data.success) setMonthlyData(monthRes.data.time_series || []);
        if (congRes.data.success) setCongestionTrend(congRes.data.monthly_trend || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [selectedArea]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Traffic Pattern Analysis</h2>
          <p className="text-xs text-slate-500 mt-0.5">Deep temporal and environmental pattern extraction from the Bangalore dataset</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Filter Location:</label>
          <select
            value={selectedArea}
            onChange={e => setSelectedArea(e.target.value)}
            className="bg-[#14243A] border border-[#1E3A5F] text-xs text-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-sky-400/50"
          >
            <option value="">All Corridors & Areas</option>
            {filterOptions.areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullPage text="Synthesizing multi-temporal traffic trends..." />
      ) : (
        <div className="space-y-4">
          {/* Row 1: Hourly & Day-of-week */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Diurnal Flow Cycles (Hourly Profile)" subtitle="Volume peak at morning (08:00-10:00) and evening rush (18:00-20:00)">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="period" tick={{ fill: '#64748B', fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="traffic_volume" name="Vehicles" stroke="#38BDF8" fill="url(#hourGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="avg_speed" name="Speed (km/h)" stroke="#22D3EE" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Weekly Demand Rhythm" subtitle="Average volume by day of week">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="period" tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="traffic_volume" name="Volume" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Row 2: Weekday vs Weekend Comparison & Weather impact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Weekday vs Weekend Divergence" subtitle="Commuter rush vs weekend leisure patterns">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayWeekend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="hour" tickFormatter={v => `${v}h`} tick={{ fill: '#64748B', fontSize: 10 }} interval={3} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
                  <Bar dataKey="weekday" name="Mon-Fri Traffic" fill="#38BDF8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="weekend" name="Sat-Sun Traffic" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Precipitation & Meteorological Sensitivity" subtitle="Impact of adverse weather conditions on velocity and volume">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weatherData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="weather" tick={{ fill: '#64748B', fontSize: 10 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
                  <Bar dataKey="traffic_volume" name="Volume" fill="#38BDF8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="avg_speed" name="Speed (km/h)" fill="#10B981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Row 3: Seasonal Monthly Trend */}
          <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-1">Annual Seasonality & Monthly Inflow</h3>
            <p className="text-xs text-slate-500 mb-4">Longitudinal monthly congestion index and volume fluctuations across Bangalore corridors</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="period" tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
                  <Line type="monotone" dataKey="traffic_volume" name="Average Volume" stroke="#38BDF8" strokeWidth={2.5} dot={{ fill: '#38BDF8', r: 3 }} />
                  <Line type="monotone" dataKey="avg_speed" name="Average Velocity" stroke="#EC4899" strokeWidth={2} dot={{ fill: '#EC4899', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
