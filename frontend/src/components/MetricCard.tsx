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
    cyan:    { hex: '#64D2FF', subtle: 'rgba(100,210,255,0.12)' },
    purple:  { hex: '#BF5AF2', subtle: 'rgba(191,90,242,0.12)'  },
    rose:    { hex: '#FF453A', subtle: 'rgba(255,69,58,0.12)'   },
    amber:   { hex: '#FF9F0A', subtle: 'rgba(255,159,10,0.12)'  },
    emerald: { hex: '#30D158', subtle: 'rgba(48,209,88,0.12)'   },
  };

  const c = colorMap[color];

  return (
    <div
      className="apple-card apple-card-hover p-4 flex flex-col justify-between"
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderColor: `${c.hex}28`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 24px rgba(0,0,0,0.55), 0 0 0 1px ${c.hex}45`;
        (e.currentTarget as HTMLElement).style.borderColor = `${c.hex}50`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '';
        (e.currentTarget as HTMLElement).style.borderColor = `${c.hex}28`;
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider font-heading text-[var(--color-label-secondary)]">
            {title}
          </p>
          <h3
            className="text-2xl font-bold mt-1.5 font-heading tracking-tight"
            style={{ color: c.hex }}
          >
            {value}
            {unit && <span className="text-xs font-medium ml-1 text-[var(--color-label-tertiary)]">{unit}</span>}
          </h3>
        </div>
        <div
          className="p-2.5 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: c.subtle, border: `1px solid ${c.hex}30` }}
        >
          <Icon className="w-5 h-5" style={{ color: c.hex }} />
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
        </div>
      )}
    </div>
  );
};
