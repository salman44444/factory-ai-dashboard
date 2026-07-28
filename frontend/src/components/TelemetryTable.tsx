import React, { useState } from 'react';
import { Loader2, ShieldAlert, History, AlertTriangle, Eye, Search } from 'lucide-react';
import type { TelemetryLog } from '../types';
import { TelemetryRowInspectModal } from './TelemetryRowInspectModal';

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
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedRowLog, setSelectedRowLog] = useState<TelemetryLog | null>(null);

  // We want to show the latest records at the top for the table view
  const reversedData = [...data].reverse();

  // Filter logs by search query
  const filteredData = reversedData.filter(log => {
    if (!filterQuery) return true;
    const query = filterQuery.toLowerCase();
    return (
      log.id.toLowerCase().includes(query) ||
      (log.product_id && log.product_id.toLowerCase().includes(query)) ||
      (log.failure_reason && log.failure_reason.toLowerCase().includes(query))
    );
  });

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return timestamp;
    }
  };

  return (
    <>
      <div className="apple-card p-5 flex flex-col h-[390px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold font-heading text-[var(--color-label-primary)] flex items-center gap-2">
              <History className="w-4 h-4 text-[var(--color-cyan)]" />
              Telemetry & Incident Logs
            </h3>
            <p className="text-[var(--color-label-secondary)] text-[11px] mt-0.5">
              Detailed sensor metrics timeline
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Search Input Filter */}
            <div className="flex items-center gap-1.5 bg-[var(--color-bg-control)] border border-[var(--color-border-subtle)] px-2.5 py-1 rounded-xl">
              <Search className="w-3.5 h-3.5 text-[var(--color-label-tertiary)]" />
              <input 
                type="text" 
                placeholder="Filter logs..."
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                className="bg-transparent text-xs outline-none text-[var(--color-label-primary)] placeholder-[var(--color-label-tertiary)] w-28"
              />
            </div>

            {/* Apple Segmented Control View Mode Toggle */}
            <div className="apple-segmented-control">
              <button
                onClick={() => onViewModeChange('live')}
                className={`apple-segmented-item ${viewMode === 'live' ? 'active' : ''}`}
              >
                Recent Activity
              </button>
              <button
                onClick={() => onViewModeChange('failure')}
                disabled={!hasFailure}
                className={`apple-segmented-item flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed ${
                  viewMode === 'failure' ? 'active' : ''
                }`}
                title={!hasFailure ? "No failures logged for this machine yet" : "Show pre-failure diagnostics"}
              >
                <ShieldAlert className="w-3 h-3" />
                Pre-Failure Context
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 min-h-0 overflow-y-auto border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-bg-surface-elevated)]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--color-cyan)] text-xs gap-2 py-8">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[var(--color-label-secondary)]">Loading telemetry data...</span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[var(--color-label-tertiary)] text-xs py-8 font-medium">
              No telemetry records found matching filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--color-bg-control)] text-[var(--color-label-secondary)] font-semibold sticky top-0 border-b border-[var(--color-separator)] backdrop-blur-md">
                <tr>
                  <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider">Time</th>
                  <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider">Product ID</th>
                  <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-right">Air (K)</th>
                  <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-right">Proc (K)</th>
                  <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-right">RPM</th>
                  <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-right">Torque</th>
                  <th className="py-2.5 px-2 text-[10px] uppercase tracking-wider text-right">Wear</th>
                  <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider text-center">Status</th>
                  <th className="py-2.5 px-3 text-[10px] uppercase tracking-wider text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-separator)]">
                {filteredData.map((log) => {
                  const isHighTorque = log.torque_nm > 60;
                  const isHighToolWear = log.tool_wear_min > 200;

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-[var(--color-bg-control)] transition-colors ${
                        log.is_failure
                          ? 'bg-[var(--color-rose-subtle)] border-l-2 border-[var(--color-rose)]'
                          : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-[var(--color-label-secondary)] whitespace-nowrap text-[11px] font-mono">
                        {formatTime(log.timestamp)}
                      </td>
                      <td className="py-2 px-3 font-semibold text-[var(--color-purple)] font-mono text-[11px]">
                        {log.product_id || '--'}
                      </td>
                      <td className="py-2 px-2 text-right text-[var(--color-label-primary)] font-mono text-[11px]">
                        {log.air_temp_k?.toFixed(1) || '--'}
                      </td>
                      <td className="py-2 px-2 text-right text-[var(--color-label-primary)] font-mono text-[11px]">
                        {log.process_temp_k?.toFixed(1) || '--'}
                      </td>
                      <td className="py-2 px-2 text-right text-[var(--color-cyan)] font-mono text-[11px]">
                        {log.rpm || '--'}
                      </td>
                      <td
                        className={`py-2 px-2 text-right font-mono text-[11px] ${
                          isHighTorque ? 'text-[var(--color-amber)] font-bold' : 'text-[var(--color-purple)]'
                        }`}
                      >
                        {log.torque_nm?.toFixed(1) || '--'}
                      </td>
                      <td
                        className={`py-2 px-2 text-right font-mono text-[11px] ${
                          isHighToolWear ? 'text-[var(--color-amber)] font-bold' : 'text-[var(--color-label-primary)]'
                        }`}
                      >
                        {log.tool_wear_min !== undefined ? `${log.tool_wear_min}m` : '--'}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {log.is_failure ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--color-rose-subtle)] text-[var(--color-rose)] border border-[var(--color-rose)] flex items-center justify-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            FAULT
                          </span>
                        ) : isHighTorque || isHighToolWear ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--color-amber-subtle)] text-[var(--color-amber)] border border-[var(--color-amber)] inline-block">
                            WARNING
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--color-emerald-subtle)] text-[var(--color-emerald)] border border-[var(--color-emerald)] inline-block">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRowLog(log)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[var(--color-bg-control)] hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-label-primary)] border border-[var(--color-border-subtle)] transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                        >
                          <Eye className="w-3 h-3" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Row Inspector Modal */}
      <TelemetryRowInspectModal
        isOpen={Boolean(selectedRowLog)}
        onClose={() => setSelectedRowLog(null)}
        log={selectedRowLog}
      />
    </>
  );
};
