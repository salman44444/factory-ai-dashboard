import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';
import { Loader2 } from 'lucide-react';
import type { TelemetryLog } from '../types';

interface ChartCardProps {
  data: TelemetryLog[];
  machineId: string;
  loading?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({ data, machineId, loading = false }) => {
  const [timeRange, setTimeRange] = useState<'1m' | '5m' | '15m' | 'ALL'>('ALL');

  // Format timestamps and filter by time range
  const chartData = useMemo(() => {
    let filtered = [...data];
    
    if (timeRange === '1m') {
      filtered = filtered.slice(-10);
    } else if (timeRange === '5m') {
      filtered = filtered.slice(-25);
    } else if (timeRange === '15m') {
      filtered = filtered.slice(-40);
    }

    return filtered.map((log) => {
      let label = '';
      try {
        const date = new Date(log.timestamp);
        label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } catch {
        label = log.timestamp;
      }
      return {
        ...log,
        timeLabel: label
      };
    });
  }, [data, timeRange]);

  return (
    <div className="apple-card p-5 flex flex-col h-[400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold font-heading text-[var(--color-label-primary)]">
            Sensor Trend
          </h3>
          <p className="text-[var(--color-label-secondary)] text-xs mt-0.5">
            Real-time RPM and Torque trends for Machine {machineId || 'Selected'}
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-cyan)]"></span>
              <span className="text-[var(--color-label-secondary)]">RPM (Left)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-purple)]"></span>
              <span className="text-[var(--color-label-secondary)]">Torque (Right)</span>
            </div>
          </div>

          {/* Time Range Apple Segmented Control */}
          <div className="apple-segmented-control">
            {(['1m', '5m', '15m', 'ALL'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`apple-segmented-item ${timeRange === range ? 'active' : ''}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--color-cyan)] text-sm gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-[var(--color-label-secondary)] font-medium">Syncing telemetry history...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[var(--color-label-tertiary)] text-sm font-medium">
            Waiting for live telemetry stream...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-separator)" vertical={false} />
              <XAxis 
                dataKey="timeLabel" 
                stroke="var(--color-label-tertiary)" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                stroke="var(--color-cyan)" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="var(--color-purple)" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-surface-elevated)', 
                  borderColor: 'var(--color-border-subtle)',
                  borderRadius: '12px',
                  color: 'var(--color-label-primary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  boxShadow: 'var(--shadow-md)'
                }}
                labelStyle={{ fontWeight: 'bold', color: 'var(--color-label-secondary)' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="rpm" 
                stroke="var(--color-cyan)" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: 'var(--color-cyan)', strokeWidth: 2, fill: 'var(--color-bg-surface)' }}
                name="Rotational Speed (RPM)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="torque_nm" 
                stroke="var(--color-purple)" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: 'var(--color-purple)', strokeWidth: 2, fill: 'var(--color-bg-surface)' }}
                name="Torque (Nm)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
