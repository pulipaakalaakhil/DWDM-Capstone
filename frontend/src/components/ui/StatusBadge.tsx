import React from 'react';

type Level = 'Free Flow' | 'Low' | 'Moderate' | 'High' | 'Severe' | string;

const styles: Record<string, string> = {
  'Free Flow': 'bg-green-500/15 text-green-400 border-green-500/30',
  'Low': 'bg-lime-500/15 text-lime-400 border-lime-500/30',
  'Moderate': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'High': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Severe': 'bg-red-500/15 text-red-400 border-red-500/30',
};

const dots: Record<string, string> = {
  'Free Flow': 'bg-green-400', 'Low': 'bg-lime-400',
  'Moderate': 'bg-yellow-400', 'High': 'bg-orange-400', 'Severe': 'bg-red-400',
};

interface StatusBadgeProps { level: Level; showDot?: boolean; size?: 'sm' | 'md'; }

export default function StatusBadge({ level, showDot = true, size = 'sm' }: StatusBadgeProps) {
  const cls = styles[level] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  const dotCls = dots[level] || 'bg-slate-400';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium ${cls} ${size === 'md' ? 'px-3 py-1 text-xs' : ''}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />}
      {level}
    </span>
  );
}
