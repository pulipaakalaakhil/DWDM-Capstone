import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  height?: string;
}

export default function ChartCard({ title, subtitle, children, className = '', action, height = 'h-64' }: ChartCardProps) {
  return (
    <div className={`bg-[#14243A] border border-[#1E3A5F] rounded-xl p-4 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className={height}>{children}</div>
    </div>
  );
}
