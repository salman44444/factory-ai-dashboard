import React, { useState } from 'react';
import { 
  Bot, 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw,
  Zap,
  BookOpen,
  Code,
  GitFork,
  Database,
  Terminal,
  ChevronRight,
  ChevronDown,
  FileText
} from 'lucide-react';
import type { DiagnoseResponse } from '../types';

interface AIDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DiagnoseResponse | null;
  loading: boolean;
  onReDiagnose?: () => void;
}

const renderFormattedText = (text: string) => {
  if (!text || typeof text !== 'string') return null;

  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

const extractString = (content: any): string => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map(c => typeof c === 'string' ? c : (c?.text || JSON.stringify(c))).join('\n');
  }
  if (typeof content === 'object') {
    return content.text || content.content || content.diagnosis || JSON.stringify(content, null, 2);
  }
  return String(content);
};

const formatMarkdown = (rawContent: any) => {
  const content = extractString(rawContent);
  if (!content) return null;
  
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-2"></div>;

    if (trimmed.startsWith('#') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 60)) {
      const title = trimmed.replace(/^[#*]+|[#*]+$/g, '').trim();
      return (
        <h4 key={idx} className="text-xs uppercase tracking-wider text-cyan-400 font-bold font-heading mt-4 mb-2 flex items-center gap-2 border-b border-cyan-500/20 pb-1">
          {title}
        </h4>
      );
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <div key={idx} className="flex items-start gap-2 ml-2 my-1">
          <span className="text-cyan-400 font-bold">•</span>
          <span className="text-xs text-gray-200 leading-relaxed">
            {renderFormattedText(trimmed.substring(2))}
          </span>
        </div>
      );
    }

    if (/^\d+\./.test(trimmed)) {
      return (
        <div key={idx} className="flex items-start gap-2 my-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-xs text-gray-200 leading-relaxed">
            {renderFormattedText(trimmed)}
          </span>
        </div>
      );
    }

    return (
      <p key={idx} className="text-xs text-gray-300 leading-relaxed my-1">
        {renderFormattedText(trimmed)}
      </p>
    );
  });
};

export const AIDiagnosisModal: React.FC<AIDiagnosisModalProps> = ({
  isOpen,
  onClose,
  data,
  loading,
  onReDiagnose
}) => {
  const [activeTab, setActiveTab] = useState<'user' | 'dev'>('user');
  const [expandedNode, setExpandedNode] = useState<string | null>('sql');

  if (!isOpen) return null;

  const isFailure = data?.failure_type && data.failure_type !== "Manual Inspection / Performance Anomaly";
  const flow = data?.agent_flow_details;

  const toggleNode = (nodeKey: string) => {
    setExpandedNode(prev => prev === nodeKey ? null : nodeKey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-4xl glass-panel bg-[#0d1322]/95 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing top line */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500"></div>

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
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
                {data?.machine_id ? `Target Asset: ${data.machine_id}` : 'Analyzing machine telemetry...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle Switcher */}
            {data && !data.error && (
              <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('user')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'user'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  Assessment
                </button>
                <button
                  onClick={() => setActiveTab('dev')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'dev'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  Agent Flow Inspector
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                <p className="text-xs text-gray-400 mt-1">Executing LangGraph Fan-Out to Haas, Fanuc & SOP retrievers.</p>
              </div>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-gray-400">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-80" />
              <p className="text-base font-semibold text-white">No Diagnostic Context Available</p>
              <p className="text-xs mt-1">Select a machine and ensure telemetry simulator is active.</p>
            </div>
          ) : activeTab === 'user' ? (
            /* USER DIAGNOSIS VIEW */
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

              {/* Error Alert Box if Backend returned an error */}
              {data.error ? (
                <div className="p-4.5 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-200">
                  <h4 className="text-xs uppercase tracking-wider text-rose-400 font-bold font-heading mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Diagnostic Execution Failed
                  </h4>
                  <p className="text-xs text-rose-300 font-mono mt-1">
                    {data.error}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Make sure <code className="text-cyan-400">GEMINI_API_KEY</code> and <code className="text-cyan-400">PINECONE_API_KEY</code> are set in your <code className="text-cyan-400">.env</code> file and restart Docker.
                  </p>
                </div>
              ) : (
                /* Diagnostic Assessment (Formatted Markdown output from AI) */
                <div className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl">
                  <h4 className="text-xs uppercase tracking-wider text-purple-400 font-bold font-heading mb-3">
                    Multi-Expert System Assessment
                  </h4>
                  <div className="space-y-1">
                    {formatMarkdown(data.diagnosis)}
                  </div>
                </div>
              )}

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
          ) : (
            /* DEVELOPER AGENT FLOW INSPECTOR VIEW */
            <div className="space-y-6 animate-fade-in">
              {/* DAG Architecture Visual Graph */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <h4 className="text-xs uppercase tracking-wider text-purple-400 font-bold font-heading mb-3 flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-purple-400" />
                  LangGraph Parallel Fan-Out / Fan-In Topology
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs">
                  {/* Step 1: Start -> SQL Node */}
                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 flex flex-col justify-center">
                    <span className="text-[10px] text-cyan-400 font-mono">NODE 1 (Entry)</span>
                    <strong className="text-white mt-0.5">fetch_sql_context</strong>
                    <span className="text-[10px] text-gray-400 mt-1">PostgreSQL 20-Row Trend</span>
                  </div>

                  {/* Step 2: Fan Out to 3 Experts */}
                  <div className="md:col-span-3 grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 flex flex-col justify-center">
                      <span className="text-[9px] text-purple-400 font-mono">FAN-OUT 1</span>
                      <strong className="text-xs text-white">rag_haas_expert</strong>
                      <span className="text-[9px] text-gray-400">vf_service_manual</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 flex flex-col justify-center">
                      <span className="text-[9px] text-purple-400 font-mono">FAN-OUT 2</span>
                      <strong className="text-xs text-white">rag_fanuc_expert</strong>
                      <span className="text-[9px] text-gray-400">fanuc_spindle_alarm</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 flex flex-col justify-center">
                      <span className="text-[9px] text-purple-400 font-mono">FAN-OUT 3</span>
                      <strong className="text-xs text-white">rag_sop_expert</strong>
                      <span className="text-[9px] text-gray-400">cnc_lathe (SOP)</span>
                    </div>
                  </div>

                  {/* Step 3: Fan In to Generate Diagnosis */}
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 flex flex-col justify-center">
                    <span className="text-[10px] text-emerald-400 font-mono">FAN-IN (LLM)</span>
                    <strong className="text-white mt-0.5">generate_diagnosis</strong>
                    <span className="text-[10px] text-gray-400 mt-1">Google Gemini Synthesis</span>
                  </div>
                </div>
              </div>

              {/* Accordion List for Each Node's Raw Inputs/Outputs */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-cyan-400 font-bold font-heading flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Node Execution Payloads & Retrieved Contexts
                </h4>

                {/* Node 1: fetch_sql_context */}
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button
                    onClick={() => toggleNode('sql')}
                    className="w-full px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <div>
                        <span className="text-xs font-bold text-white">fetch_sql_context</span>
                        <span className="text-[10px] text-gray-400 ml-2">
                          Captured {flow?.telemetry_window?.length || 0} Telemetry Trend Rows
                        </span>
                      </div>
                    </div>
                    {expandedNode === 'sql' ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expandedNode === 'sql' && (
                    <div className="p-4 border-t border-white/10 bg-black/40 font-mono text-[11px] overflow-x-auto text-cyan-300">
                      <p className="text-[10px] text-gray-400 mb-2 font-sans font-bold uppercase">Sliding Window Telemetry Data (Passed to Prompt):</p>
                      <pre>{JSON.stringify(flow?.telemetry_window || [], null, 2)}</pre>
                    </div>
                  )}
                </div>

                {/* Node 2: rag_haas_expert */}
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button
                    onClick={() => toggleNode('haas')}
                    className="w-full px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-xs font-bold text-white">rag_haas_expert</span>
                        <span className="text-[10px] text-purple-300 ml-2">Pinecone filter: book_id = "vf_service_manual"</span>
                      </div>
                    </div>
                    {expandedNode === 'haas' ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expandedNode === 'haas' && (
                    <div className="p-4 border-t border-white/10 bg-black/40 font-mono text-[11px] overflow-x-auto text-gray-300 whitespace-pre-wrap">
                      <p className="text-[10px] text-gray-400 mb-2 font-sans font-bold uppercase">Retrieved Context from Haas VF Service Manual:</p>
                      {flow?.haas_manual_context || 'No Haas manual context retrieved.'}
                    </div>
                  )}
                </div>

                {/* Node 3: rag_fanuc_expert */}
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button
                    onClick={() => toggleNode('fanuc')}
                    className="w-full px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-xs font-bold text-white">rag_fanuc_expert</span>
                        <span className="text-[10px] text-purple-300 ml-2">Pinecone filter: book_id = "fanuc_spindle_alarm_list"</span>
                      </div>
                    </div>
                    {expandedNode === 'fanuc' ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expandedNode === 'fanuc' && (
                    <div className="p-4 border-t border-white/10 bg-black/40 font-mono text-[11px] overflow-x-auto text-gray-300 whitespace-pre-wrap">
                      <p className="text-[10px] text-gray-400 mb-2 font-sans font-bold uppercase">Retrieved Context from Fanuc Spindle Alarm List:</p>
                      {flow?.fanuc_alarm_context || 'No Fanuc alarm codes retrieved.'}
                    </div>
                  )}
                </div>

                {/* Node 4: rag_sop_expert */}
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button
                    onClick={() => toggleNode('sop')}
                    className="w-full px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-xs font-bold text-white">rag_sop_expert</span>
                        <span className="text-[10px] text-purple-300 ml-2">Pinecone filter: book_id = "cnc_lathe"</span>
                      </div>
                    </div>
                    {expandedNode === 'sop' ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expandedNode === 'sop' && (
                    <div className="p-4 border-t border-white/10 bg-black/40 font-mono text-[11px] overflow-x-auto text-gray-300 whitespace-pre-wrap">
                      <p className="text-[10px] text-gray-400 mb-2 font-sans font-bold uppercase">Retrieved Context from CNC Lathe Safety SOP:</p>
                      {flow?.cnc_sop_context || 'No CNC SOP guidelines retrieved.'}
                    </div>
                  )}
                </div>

                {/* Node 5: generate_diagnosis Raw Response */}
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.01]">
                  <button
                    onClick={() => toggleNode('raw')}
                    className="w-full px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Bot className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs font-bold text-white">generate_diagnosis</span>
                        <span className="text-[10px] text-emerald-400 ml-2">Synthesized LLM Completion Output</span>
                      </div>
                    </div>
                    {expandedNode === 'raw' ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>
                  {expandedNode === 'raw' && (
                    <div className="p-4 border-t border-white/10 bg-black/40 font-mono text-[11px] overflow-x-auto text-emerald-300 whitespace-pre-wrap">
                      <p className="text-[10px] text-gray-400 mb-2 font-sans font-bold uppercase">Raw Synthesized LLM String:</p>
                      {data.diagnosis}
                    </div>
                  )}
                </div>

              </div>
            </div>
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
