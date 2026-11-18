import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  sparklineData?: number[];
  unit?: string;
}

export default function KPICard({ title, value, subtitle, icon, change, trend = 'neutral', color = 'sky', sparklineData, unit }: KPICardProps) {
  const colorMap: Record<string, string> = {
    sky: 'bg-sky-500/15 text-sky-400',
    green: 'bg-green-500/15 text-green-400',
    yellow: 'bg-yellow-500/15 text-yellow-400',
    orange: 'bg-orange-500/15 text-orange-400',
    red: 'bg-red-500/15 text-red-400',
    purple: 'bg-purple-500/15 text-purple-400',
    cyan: 'bg-cyan-500/15 text-cyan-400',
    pink: 'bg-pink-500/15 text-pink-400',
  };
  const strokeMap: Record<string, string> = {
    sky: '#38BDF8', green: '#22C55E', yellow: '#FACC15', orange: '#F97316',
    red: '#EF4444', purple: '#A855F7', cyan: '#22D3EE', pink: '#EC4899'
  };

  const trendIcon = trend === 'up'
    ? <TrendingUp size={11} className="text-green-400" />
    : trend === 'down'
      ? <TrendingDown size={11} className="text-red-400" />
      : <Minus size={11} className="text-slate-500" />;

  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500';

  const sparkData = sparklineData?.map((v, i) => ({ v, i }));

  return (
    <div className="bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4 hover:border-sky-400/30 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color] || colorMap.sky}`}>
          {icon}
        </div>
        {sparkData && sparkData.length > 0 && (
          <div className="w-20 h-10 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="v" stroke={strokeMap[color] || '#38BDF8'} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-slate-100 mb-0.5">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </div>

      <div className="text-xs text-slate-500 mb-2">{title}</div>

      {(change !== undefined || subtitle) && (
        <div className="flex items-center gap-1.5">
          {change !== undefined && (
            <>
              {trendIcon}
              <span className={`text-[11px] font-medium ${trendColor}`}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            </>
          )}
          {subtitle && <span className="text-[11px] text-slate-600">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
