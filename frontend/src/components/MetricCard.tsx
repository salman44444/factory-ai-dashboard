import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  color: 'cyan' | 'purple' | 'rose' | 'amber' | 'emerald';
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  icon: Icon,
  color,
  trend,
  trendType = 'neutral'
}) => {
  const colorMap = {
    cyan: {
      bg: 'var(--color-cyan-subtle)',
      border: 'rgba(50, 173, 230, 0.25)',
      text: 'var(--color-cyan)',
      iconBg: 'var(--color-cyan-subtle)',
    },
    purple: {
      bg: 'var(--color-purple-subtle)',
      border: 'rgba(175, 82, 222, 0.25)',
      text: 'var(--color-purple)',
      iconBg: 'var(--color-purple-subtle)',
    },
    rose: {
      bg: 'var(--color-rose-subtle)',
      border: 'rgba(255, 59, 48, 0.25)',
      text: 'var(--color-rose)',
      iconBg: 'var(--color-rose-subtle)',
    },
    amber: {
      bg: 'var(--color-amber-subtle)',
      border: 'rgba(255, 149, 0, 0.25)',
      text: 'var(--color-amber)',
      iconBg: 'var(--color-amber-subtle)',
    },
    emerald: {
      bg: 'var(--color-emerald-subtle)',
      border: 'rgba(52, 199, 89, 0.25)',
      text: 'var(--color-emerald)',
      iconBg: 'var(--color-emerald-subtle)',
    }
  };

  const scheme = colorMap[color];

  return (
    <div 
      className="apple-card apple-card-hover p-4 flex flex-col justify-between"
      style={{ 
        backgroundColor: scheme.bg, 
        borderColor: scheme.border 
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider font-heading text-[var(--color-label-secondary)]">
            {title}
          </p>
          <h3 
            className="text-2xl font-bold mt-1.5 font-heading tracking-tight"
            style={{ color: scheme.text }}
          >
            {value}
            {unit && <span className="text-xs font-medium ml-1 text-[var(--color-label-tertiary)]">{unit}</span>}
          </h3>
        </div>
        <div 
          className="p-2.5 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: scheme.iconBg }}
        >
          <Icon className="w-5 h-5" style={{ color: scheme.text }} />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px]">
          <span 
            className="font-semibold"
            style={{
              color: trendType === 'up' ? 'var(--color-emerald)' :
                     trendType === 'down' ? 'var(--color-cyan)' :
                     trendType === 'danger' ? 'var(--color-rose)' :
                     'var(--color-label-secondary)'
            }}
          >
            {trend}
          </span>
          <span className="text-[var(--color-label-tertiary)]">since last check</span>
        </div>
      )}
    </div>
  );
};
