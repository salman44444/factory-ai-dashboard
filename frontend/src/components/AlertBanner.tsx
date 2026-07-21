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
      {/* Critical Global Banner */}
      {criticalAlert && (
        <div className="relative overflow-hidden bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-pulse">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/20 p-2 rounded-xl text-rose-400 pulse-red">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-rose-200 font-bold font-heading text-sm uppercase tracking-wide">
                CRITICAL SYSTEM ALERT
              </h4>
              <p className="text-rose-300 text-xs mt-0.5">
                Machine {criticalAlert.machine_id}: {criticalAlert.reason}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onResolve(criticalAlert.id)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-950/50"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Alert Feed Card */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col flex-1 max-h-[300px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-bold font-heading text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Predictive Maintenance Warnings
          </h3>
          <span className="bg-gray-800/80 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-amber-500/20">
            {unresolvedAlerts.length} Active
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {alerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm py-8">
              <ShieldCheck className="w-8 h-8 text-emerald-500/40 mb-2" />
              All systems nominal. No alerts.
            </div>
          ) : (
            alerts.map((alert) => {
              const severityColor = 
                alert.severity === 'CRITICAL' ? 'border-rose-500/30 bg-rose-500/5 text-rose-400' :
                alert.severity === 'MEDIUM' ? 'border-amber-500/30 bg-amber-500/5 text-amber-400' :
                'border-cyan-500/30 bg-cyan-500/5 text-cyan-400';

              const timeStr = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div 
                  key={alert.id}
                  className={`border rounded-xl p-3 flex items-center justify-between gap-4 transition-all ${severityColor} ${alert.resolved ? 'opacity-40 grayscale border-gray-850 bg-gray-900/5' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider font-heading px-1.5 py-0.5 bg-white/5 rounded">
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {timeStr}
                      </span>
                      <span className="text-xs font-bold text-gray-300">
                        {alert.machine_id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1 truncate">
                      {alert.reason}
                    </p>
                  </div>
                  {!alert.resolved ? (
                    <button
                      onClick={() => onResolve(alert.id)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all cursor-pointer"
                      title="Resolve Alert"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Resolved
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
