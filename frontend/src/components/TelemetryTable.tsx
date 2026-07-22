import React from 'react';
import { Loader2, ShieldAlert, History, AlertTriangle } from 'lucide-react';
import type { TelemetryLog } from '../types';

interface TelemetryTableProps {
  data: TelemetryLog[];
  loading: boolean;
  viewMode: 'live' | 'failure';
  onViewModeChange: (mode: 'live' | 'failure') => void;
  hasFailure: boolean;
}

export const TelemetryTable: React.FC<TelemetryTableProps> = ({
  data,
  loading,
  viewMode,
  onViewModeChange,
  hasFailure
}) => {
  // We want to show the latest records at the top for the table view
  const reversedData = [...data].reverse();

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-[380px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            Telemetry & Incident Logs
          </h3>
          <p className="text-gray-400 text-[10px] mt-0.5">
            Detailed sensor metrics timeline
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/5 self-end sm:self-auto">
          <button
            onClick={() => onViewModeChange('live')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
              viewMode === 'live'
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Recent Activity
          </button>
          <button
            onClick={() => onViewModeChange('failure')}
            disabled={!hasFailure}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              viewMode === 'failure'
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md'
                : 'text-gray-400 hover:text-rose-400'
            }`}
            title={!hasFailure ? "No failures logged for this machine yet" : "Show pre-failure diagnostics"}
          >
            <ShieldAlert className="w-3 h-3" />
            Pre-Failure Context
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0 overflow-y-auto border border-white/5 rounded-xl bg-black/20">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-cyan-400 text-xs gap-2 py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading telemetry data...</span>
          </div>
        ) : reversedData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-xs py-8">
            No telemetry records found.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-white/[0.03] text-gray-400 font-semibold sticky top-0 border-b border-white/5 backdrop-blur-md">
              <tr>
                <th className="py-2 px-3 text-[10px]">Time</th>
                <th className="py-2 px-3 text-[10px]">Product ID</th>
                <th className="py-2 px-2 text-[10px] text-right">Air (K)</th>
                <th className="py-2 px-2 text-[10px] text-right">Proc (K)</th>
                <th className="py-2 px-2 text-[10px] text-right">RPM</th>
                <th className="py-2 px-2 text-[10px] text-right">Torque</th>
                <th className="py-2 px-2 text-[10px] text-right">Wear</th>
                <th className="py-2 px-3 text-[10px] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {reversedData.map((log) => {
                const isHighTorque = log.torque_nm > 60;
                const isHighToolWear = log.tool_wear_min > 200;

                return (
                  <tr
                    key={log.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      log.is_failure
                        ? 'bg-rose-950/20 border-l-2 border-rose-500'
                        : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-gray-400 whitespace-nowrap text-[10px]">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="py-2 px-3 font-semibold text-purple-400 font-mono text-[10px]">
                      {log.product_id || '--'}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-300 font-mono text-[10px]">
                      {log.air_temp_k?.toFixed(1) || '--'}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-300 font-mono text-[10px]">
                      {log.process_temp_k?.toFixed(1) || '--'}
                    </td>
                    <td className="py-2 px-2 text-right text-cyan-400 font-mono text-[10px]">
                      {log.rpm || '--'}
                    </td>
                    <td
                      className={`py-2 px-2 text-right font-mono text-[10px] ${
                        isHighTorque ? 'text-amber-400 font-bold' : 'text-purple-400'
                      }`}
                    >
                      {log.torque_nm?.toFixed(1) || '--'}
                    </td>
                    <td
                      className={`py-2 px-2 text-right font-mono text-[10px] ${
                        isHighToolWear ? 'text-amber-400 font-bold' : 'text-gray-300'
                      }`}
                    >
                      {log.tool_wear_min !== undefined ? `${log.tool_wear_min}m` : '--'}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      {log.is_failure ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          FAULT
                        </span>
                      ) : isHighTorque || isHighToolWear ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block">
                          WARNING
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
