import React from 'react';
import { 
  Bot, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Gauge, 
  Cpu, 
  Thermometer, 
  Layers, 
  ShieldCheck, 
  Clock, 
  RefreshCw,
  Zap
} from 'lucide-react';
import type { DiagnoseResponse } from '../types';

interface AIDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DiagnoseResponse | null;
  loading: boolean;
  onReDiagnose?: () => void;
}

export const AIDiagnosisModal: React.FC<AIDiagnosisModalProps> = ({
  isOpen,
  onClose,
  data,
  loading,
  onReDiagnose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-3xl glass-panel bg-[#0d1322]/95 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing top line */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500"></div>

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-heading text-white tracking-wide">
                  AI Crash Diagnostic Engine
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  PostgreSQL RAG Context
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-0.5">
                {data ? `Target Asset: ${data.machine_id}` : 'Analyzing machine telemetry...'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-300">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-cyan-400 animate-bounce" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold font-heading text-base">Querying PostgreSQL Crash Telemetry...</p>
                <p className="text-xs text-gray-400 mt-1">Extracting RPM, Torque Nm, and failure type metrics</p>
              </div>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-gray-400">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-80" />
              <p className="text-base font-semibold text-white">No Diagnostic Context Available</p>
              <p className="text-xs mt-1">Select a machine and ensure telemetry simulator is active.</p>
            </div>
          ) : (
            <>
              {/* Failure Banner */}
              <div className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
                data.has_failure 
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' 
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-start gap-3">
                  {data.has_failure ? (
                    <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base font-heading">
                        {data.has_failure ? (data.failure_reason || 'Machine Crash Detected') : 'Asset Operational (No Active Crash)'}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                        data.has_failure ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {data.has_failure ? 'CRITICAL FAULT' : 'HEALTHY'}
                      </span>
                    </div>
                    <p className="text-xs opacity-90 mt-1">
                      {data.summary}
                    </p>
                  </div>
                </div>
                {data.timestamp && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" /> Logged
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-300">
                      {new Date(data.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Exact Crash Telemetry Grid */}
              {data.telemetry && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold font-heading mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Captured Telemetry Metrics at Time of Incident
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {/* RPM */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                      <div className="flex justify-center text-cyan-400 mb-1"><Gauge className="w-4 h-4" /></div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Rotational Speed</span>
                      <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                        {data.telemetry.rpm !== null ? `${data.telemetry.rpm} RPM` : '--'}
                      </span>
                    </div>

                    {/* Torque */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                      <div className="flex justify-center text-purple-400 mb-1"><Cpu className="w-4 h-4" /></div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Torque</span>
                      <span className={`text-sm font-bold font-mono mt-0.5 block ${
                        data.telemetry.torque_nm && data.telemetry.torque_nm > 60 ? 'text-rose-400 pulse-red' : 'text-white'
                      }`}>
                        {data.telemetry.torque_nm !== null ? `${data.telemetry.torque_nm.toFixed(1)} Nm` : '--'}
                      </span>
                    </div>

                    {/* Tool Wear */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                      <div className="flex justify-center text-amber-400 mb-1"><Layers className="w-4 h-4" /></div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Tool Wear</span>
                      <span className={`text-sm font-bold font-mono mt-0.5 block ${
                        data.telemetry.tool_wear_min && data.telemetry.tool_wear_min > 200 ? 'text-amber-400' : 'text-white'
                      }`}>
                        {data.telemetry.tool_wear_min !== null ? `${data.telemetry.tool_wear_min} min` : '--'}
                      </span>
                    </div>

                    {/* Air Temp */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                      <div className="flex justify-center text-cyan-400 mb-1"><Thermometer className="w-4 h-4" /></div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Air Temp</span>
                      <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                        {data.telemetry.air_temp_k !== null ? `${data.telemetry.air_temp_k.toFixed(1)} K` : '--'}
                      </span>
                    </div>

                    {/* Process Temp */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                      <div className="flex justify-center text-purple-400 mb-1"><Thermometer className="w-4 h-4" /></div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Process Temp</span>
                      <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                        {data.telemetry.process_temp_k !== null ? `${data.telemetry.process_temp_k.toFixed(1)} K` : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Root Cause Technical Analysis */}
              <div className="bg-cyan-950/20 border border-cyan-500/20 p-4.5 rounded-2xl">
                <h4 className="text-xs uppercase tracking-wider text-cyan-400 font-bold font-heading mb-2 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" /> Root Cause Analysis
                </h4>
                <p className="text-xs text-gray-200 leading-relaxed font-sans">
                  {data.root_cause}
                </p>
              </div>

              {/* Diagnostic Assessment */}
              <div className="bg-white/[0.02] border border-white/10 p-4.5 rounded-2xl">
                <h4 className="text-xs uppercase tracking-wider text-purple-400 font-bold font-heading mb-2">
                  System Assessment
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  {data.diagnosis}
                </p>
              </div>

              {/* Recommended Maintenance Actions */}
              {data.recommendations && data.recommendations.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-emerald-400 font-bold font-heading mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Recommended Action Protocols
                  </h4>
                  <div className="space-y-2.5">
                    {data.recommendations.map((rec, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 rounded-xl bg-white/[0.02] border border-emerald-500/20 flex items-start gap-3 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-gray-200 leading-relaxed">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            AI Engine Confidence: <span className="text-white font-bold">{((data?.confidence_score || 0.95) * 100).toFixed(0)}%</span>
          </div>

          <div className="flex items-center gap-3">
            {onReDiagnose && (
              <button
                onClick={onReDiagnose}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Re-Analyze
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              Close Diagnosis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
