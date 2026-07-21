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
      bg: 'rgba(6, 182, 212, 0.08)',
      border: 'rgba(6, 182, 212, 0.2)',
      text: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      glow: 'glow-cyan'
    },
    purple: {
      bg: 'rgba(168, 85, 247, 0.08)',
      border: 'rgba(168, 85, 247, 0.2)',
      text: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      glow: 'glow-purple'
    },
    rose: {
      bg: 'rgba(244, 63, 94, 0.08)',
      border: 'rgba(244, 63, 94, 0.2)',
      text: 'text-rose-400',
      iconBg: 'bg-rose-500/10',
      glow: 'glow-rose'
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.2)',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      glow: 'glow-amber'
    },
    emerald: {
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.2)',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      glow: 'glow-green'
    }
  };

  const scheme = colorMap[color];

  return (
    <div 
      className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between"
      style={{ 
        backgroundColor: scheme.bg, 
        borderColor: scheme.border 
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider font-heading">
            {title}
          </p>
          <h3 className={`text-3xl font-bold mt-2 font-heading tracking-tight ${scheme.text} ${scheme.glow}`}>
            {value}
            {unit && <span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>}
          </h3>
        </div>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
          <Icon className={`w-5 h-5 ${scheme.text}`} />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${
            trendType === 'up' ? 'text-emerald-400' :
            trendType === 'down' ? 'text-cyan-400' :
            trendType === 'danger' ? 'text-rose-400 pulse-red' :
            'text-gray-400'
          }`}>
            {trend}
          </span>
          <span className="text-gray-500">since last check</span>
        </div>
      )}
    </div>
  );
};
