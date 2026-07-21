import React from 'react';
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
  // Format timestamps for readability on x-axis
  const chartData = data.map((log) => {
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

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold font-heading text-white">
            Performance Diagnostics
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            Real-time RPM and Torque trends for Machine {machineId}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-gray-300">RPM (Left Axis)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            <span className="text-gray-300">Torque (Right Axis)</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-cyan-400 text-sm gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Syncing database history...</span>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            Waiting for live data stream...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis 
                dataKey="timeLabel" 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                stroke="#06b6d4" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#a855f7" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#111827', 
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  color: '#f3f4f6',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px'
                }}
                labelStyle={{ fontWeight: 'bold', color: '#9ca3af' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="rpm" 
                stroke="#06b6d4" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#06b6d4', strokeWidth: 2 }}
                name="Rotational Speed (RPM)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="torque_nm" 
                stroke="#a855f7" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#a855f7', strokeWidth: 2 }}
                name="Torque (Nm)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
