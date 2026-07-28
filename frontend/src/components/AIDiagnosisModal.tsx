import React from 'react';
import { 
  Bot, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw,
  Zap,
  BookOpen
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

  const isFailure = data?.failure_type && data.failure_type !== "Manual Inspection / Performance Anomaly";

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
                  LangGraph RAG Agent
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
                <p className="text-white font-semibold font-heading text-base">Querying Parallel RAG Experts...</p>
                <p className="text-xs text-gray-400 mt-1">Analyzing Pinecone manual chunks and PostgreSQL telemetry trends.</p>
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
                isFailure 
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' 
                  : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex items-start gap-3">
                  {isFailure ? (
                    <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base font-heading">
                        {data.failure_type}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                        isFailure ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isFailure ? 'CRITICAL FAULT' : 'HEALTHY'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnostic Assessment (Markdown output from AI) */}
              <div className="bg-white/[0.02] border border-white/10 p-4.5 rounded-2xl whitespace-pre-wrap">
                <h4 className="text-xs uppercase tracking-wider text-purple-400 font-bold font-heading mb-2">
                  Multi-Expert System Assessment
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  {data.diagnosis}
                </p>
              </div>

              {/* Sources Used */}
              {data.sources_used && data.sources_used.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-cyan-400 font-bold font-heading mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Knowledge Base Sources Used
                  </h4>
                  <div className="space-y-2.5">
                    {data.sources_used.map((source, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 rounded-xl bg-white/[0.02] border border-cyan-500/20 flex items-start gap-3 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-gray-200 leading-relaxed font-semibold">
                          {source}
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
            LangGraph Multi-Agent RAG Online
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
