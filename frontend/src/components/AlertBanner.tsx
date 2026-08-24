import React from 'react';
import { AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';
import type { Alert } from '../types';

interface AlertBannerProps {
  alerts: Alert[];
  onResolve: (id: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onResolve }) => {
  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  const criticalAlert = unresolvedAlerts.find((a) => a.severity === 'CRITICAL');

  return (
    <div className="flex flex-col gap-4">
      {/* Critical System Banner matching Apple System Notification */}
      {criticalAlert && (
        <div className="relative overflow-hidden bg-[var(--color-rose-subtle)] border border-[var(--color-rose)] rounded-2xl p-4 flex items-center justify-between shadow-[var(--shadow-md)] animate-pulse">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--color-rose)] text-white p-2.5 rounded-xl pulse-red shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[var(--color-rose)] font-bold font-heading text-xs uppercase tracking-wider">
                MACHINE FAILURE DETECTED
              </h4>
              <p className="text-[var(--color-label-primary)] text-xs mt-0.5 font-medium">
                Machine {criticalAlert.machine_id}: {criticalAlert.reason}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onResolve(criticalAlert.id)}
            className="px-3.5 py-1.5 bg-[var(--color-rose)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Mark Reviewed
          </button>
        </div>
      )}

      {/* Alert Feed Card */}
      <div className="apple-card p-5 flex flex-col flex-1 max-h-[300px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold font-heading text-[var(--color-label-primary)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--color-amber)]" />
            Maintenance Alerts
          </h3>
          <span className="bg-[var(--color-amber-subtle)] text-[var(--color-amber)] px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-[var(--color-amber)]">
            {unresolvedAlerts.length} Open
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {alerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--color-label-tertiary)] text-xs py-8">
              <ShieldCheck className="w-8 h-8 text-[var(--color-emerald)] opacity-60 mb-2" />
              No machine warnings or failures yet.
            </div>
          ) : (
            alerts.map((alert) => {
              const severityStyles = 
                alert.severity === 'CRITICAL' ? 'border-[var(--color-rose)] bg-[var(--color-rose-subtle)] text-[var(--color-rose)]' :
                alert.severity === 'MEDIUM' ? 'border-[var(--color-amber)] bg-[var(--color-amber-subtle)] text-[var(--color-amber)]' :
                'border-[var(--color-cyan)] bg-[var(--color-cyan-subtle)] text-[var(--color-cyan)]';

              const timeStr = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div 
                  key={alert.id}
                  className={`border rounded-xl p-3 flex items-center justify-between gap-3 transition-all ${severityStyles} ${alert.resolved ? 'opacity-40 grayscale bg-[var(--color-bg-control)] border-[var(--color-border-subtle)]' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider font-heading px-1.5 py-0.5 bg-[var(--color-bg-surface)] rounded text-[var(--color-label-primary)] border border-[var(--color-border-subtle)]">
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-[var(--color-label-secondary)] font-mono">
                        {timeStr}
                      </span>
                      <span className="text-xs font-bold text-[var(--color-label-primary)]">
                        {alert.machine_id}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-label-primary)] mt-1 truncate">
                      {alert.reason}
                    </p>
                  </div>
                  {!alert.resolved ? (
                    <button
                      onClick={() => onResolve(alert.id)}
                      className="p-1.5 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-control)] rounded-lg text-[var(--color-label-primary)] transition-all cursor-pointer border border-[var(--color-border-subtle)]"
                      title="Mark alert as reviewed"
                    >
                      <CheckCircle className="w-4 h-4 text-[var(--color-emerald)]" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-[var(--color-emerald)] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Reviewed
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
