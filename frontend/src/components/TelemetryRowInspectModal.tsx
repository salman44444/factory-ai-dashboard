import React from 'react';
import { X, Terminal, Database, FileText } from 'lucide-react';
import type { TelemetryLog } from '../types';

interface TelemetryRowInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: TelemetryLog | null;
}

export const TelemetryRowInspectModal: React.FC<TelemetryRowInspectModalProps> = ({
  isOpen,
  onClose,
  log
}) => {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[var(--color-bg-overlay)] backdrop-blur-xl animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-2xl bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border-subtle)] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-[var(--color-separator)] flex items-center justify-between bg-[var(--color-bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent)] text-[var(--color-accent)]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading text-[var(--color-label-primary)]">
                Telemetry Record
              </h3>
              <p className="text-xs text-[var(--color-label-secondary)] mt-0.5 font-mono">
                Record ID: {log.id.substring(0, 18)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--color-label-secondary)] hover:text-[var(--color-label-primary)] hover:bg-[var(--color-bg-control)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-[var(--color-label-primary)]">
          {/* Key Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-[var(--color-bg-control)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
              <span className="text-[10px] text-[var(--color-label-secondary)] uppercase font-semibold block">Machine</span>
              <span className="font-bold text-[var(--color-accent)] block mt-0.5">{log.machine_id}</span>
            </div>
            <div className="bg-[var(--color-bg-control)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
              <span className="text-[10px] text-[var(--color-label-secondary)] uppercase font-semibold block">Product ID</span>
              <span className="font-bold text-[var(--color-purple)] block mt-0.5 font-mono">{log.product_id || '--'}</span>
            </div>
            <div className="bg-[var(--color-bg-control)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
              <span className="text-[10px] text-[var(--color-label-secondary)] uppercase font-semibold block">Spindle Speed</span>
              <span className="font-bold text-[var(--color-accent)] block mt-0.5 font-mono">{log.rpm} RPM</span>
            </div>
            <div className="bg-[var(--color-bg-control)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
              <span className="text-[10px] text-[var(--color-label-secondary)] uppercase font-semibold block">Torque</span>
              <span className="font-bold text-[var(--color-purple)] block mt-0.5 font-mono">{log.torque_nm.toFixed(1)} Nm</span>
            </div>
          </div>

          {/* Detailed Metric List */}
          <div className="bg-[var(--color-bg-surface)] p-4 rounded-2xl border border-[var(--color-border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between text-xs border-b border-[var(--color-separator)] pb-2">
              <span className="text-[var(--color-label-secondary)] font-medium flex items-center gap-2">
                <Database className="w-4 h-4 text-[var(--color-accent)]" />
                Air Temperature:
              </span>
              <span className="font-bold text-[var(--color-label-primary)] font-mono">{log.air_temp_k.toFixed(1)} K</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-[var(--color-separator)] pb-2">
              <span className="text-[var(--color-label-secondary)] font-medium flex items-center gap-2">
                <Database className="w-4 h-4 text-[var(--color-accent)]" />
                Process Temperature:
              </span>
              <span className="font-bold text-[var(--color-label-primary)] font-mono">{log.process_temp_k.toFixed(1)} K</span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-[var(--color-separator)] pb-2">
              <span className="text-[var(--color-label-secondary)] font-medium flex items-center gap-2">
                <Database className="w-4 h-4 text-[var(--color-accent)]" />
                Tool Wear Counter:
              </span>
              <span className="font-bold text-[var(--color-amber)] font-mono">{log.tool_wear_min} min</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-label-secondary)] font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-accent)]" />
                Dataset Label:
              </span>
              {log.is_failure ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-rose-subtle)] text-[var(--color-rose)] border border-[var(--color-rose)]">
                  FAULT // {log.failure_reason || 'Critical Failure'}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-emerald-subtle)] text-[var(--color-emerald)] border border-[var(--color-emerald)]">
                  NORMAL
                </span>
              )}
            </div>
          </div>

          {/* Raw JSON Block */}
          <div>
            <span className="text-xs text-[var(--color-label-secondary)] font-semibold uppercase tracking-wider block mb-1.5">
              Raw telemetry record:
            </span>
            <pre className="p-4 rounded-xl bg-[var(--color-bg-control)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-accent)] font-mono overflow-x-auto">
              {JSON.stringify(log, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-separator)] bg-[var(--color-bg-surface)] flex justify-between items-center text-xs">
          <span className="text-[var(--color-label-tertiary)] font-mono">Timestamp: {log.timestamp}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
