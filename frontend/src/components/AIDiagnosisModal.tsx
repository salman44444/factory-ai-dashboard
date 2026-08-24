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

const renderItalics = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*.*?\*|_.*?_)/g);
  return parts.map((part, idx) => {
    if ((part.startsWith('*') && part.endsWith('*') && part.length > 2) ||
        (part.startsWith('_') && part.endsWith('_') && part.length > 2)) {
      return <em key={idx} className="italic text-[var(--color-label-secondary)] font-normal">{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

const renderFormattedText = (text: string) => {
  if (!text || typeof text !== 'string') return null;

  // Split by inline backticks first
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, pIdx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return (
        <code 
          key={pIdx} 
          className="px-1.5 py-0.5 rounded bg-[var(--color-bg-control)] text-[var(--color-cyan)] font-mono text-[11px] border border-[var(--color-border-subtle)] font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Split by ** bold markers (both closed **text** and open **text)
    const boldParts = part.split(/(\*\*.*?\*\*|\*\*.*)/g);
    return (
      <React.Fragment key={pIdx}>
        {boldParts.map((bPart, bIdx) => {
          if (bPart.startsWith('**')) {
            const boldContent = (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length >= 4)
              ? bPart.slice(2, -2) 
              : bPart.slice(2);
            
            return (
              <strong key={bIdx} className="text-[var(--color-label-primary)] font-bold">
                {renderItalics(boldContent)}
              </strong>
            );
          }
          return renderItalics(bPart);
        })}
      </React.Fragment>
    );
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

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      return <hr key={idx} className="my-3 border-[var(--color-separator)]" />;
    }

    // Memorandum Header Key-Values (TO:, FROM:, DATE:, ASSET ID:, EVENT TYPE:)
    if (/^(TO|FROM|DATE|ASSET ID|EVENT TYPE):/i.test(trimmed)) {
      const colonIdx = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIdx).toUpperCase();
      const val = trimmed.substring(colonIdx + 1).trim();
      return (
        <div key={idx} className="flex items-center justify-between py-1 px-3 my-0.5 bg-[var(--color-bg-control)] rounded-lg border border-[var(--color-border-subtle)] text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-label-secondary)] font-mono">{key}:</span>
          <span className="font-bold text-[var(--color-label-primary)] font-mono">{val}</span>
        </div>
      );
    }

    // Heading Checks: # Heading, **1. Section, 1. Section, **Step 1: ..., or **Title**
    const isMarkdownHeader = trimmed.startsWith('#');
    const isNumberedHeader = /^\*\*\d+\./.test(trimmed) || /^\d+\.\s+[A-Z]/.test(trimmed);
    const isStepHeader = /^\*\*Step \d+:/i.test(trimmed) || /^Step \d+:/i.test(trimmed);
    const isBoldHeader = trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 60;

    if (isMarkdownHeader || isNumberedHeader || isStepHeader || isBoldHeader) {
      let title = trimmed
        .replace(/^[#*]+|[#*]+$/g, '')
        .trim();
      
      return (
        <h4 
          key={idx} 
          className="text-xs uppercase tracking-wider text-[var(--color-cyan)] font-bold font-heading mt-4 mb-2 flex items-center gap-2 border-b border-[var(--color-separator)] pb-1"
        >
          {title}
        </h4>
      );
    }

    // Bullet Points (- , * , •, • )
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('•')) {
      const bulletContent = trimmed.replace(/^[-*•]\s*/, '');
      return (
        <div key={idx} className="flex items-start gap-2 ml-2 my-1.5">
          <span className="text-[var(--color-cyan)] font-bold shrink-0 mt-0.5">•</span>
          <span className="text-xs text-[var(--color-label-primary)] leading-relaxed">
            {renderFormattedText(bulletContent)}
          </span>
        </div>
      );
    }

    // Numbered Steps / Card Items
    if (/^\d+\./.test(trimmed)) {
      return (
        <div key={idx} className="flex items-start gap-2.5 my-2 p-3 rounded-xl bg-[var(--color-bg-control)] border border-[var(--color-border-subtle)]">
          <span className="text-xs text-[var(--color-label-primary)] leading-relaxed">
            {renderFormattedText(trimmed)}
          </span>
        </div>
      );
    }

    // Default Paragraph
    return (
      <p key={idx} className="text-xs text-[var(--color-label-primary)] leading-relaxed my-1">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[var(--color-bg-overlay)] backdrop-blur-xl transition-all">
      <div 
        className="relative w-full max-w-4xl bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border-subtle)] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing top line */}
        <div className="h-1 w-full bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-rose)]"></div>

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--color-separator)] flex items-center justify-between bg-[var(--color-bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--color-cyan-subtle)] border border-[var(--color-cyan)] text-[var(--color-cyan)]">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-heading text-[var(--color-label-primary)] tracking-wide">
                  AI Maintenance Diagnosis
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-cyan-subtle)] border border-[var(--color-cyan)] text-[var(--color-cyan)]">
                  Manual-Grounded RAG
                </span>
              </div>
              <p className="text-[var(--color-label-secondary)] text-xs mt-0.5">
                {data?.machine_id ? `Machine: ${data.machine_id}` : 'Analyzing machine telemetry...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Apple Segmented Control */}
            {data && !data.error && (
              <div className="apple-segmented-control">
                <button
                  onClick={() => setActiveTab('user')}
                  className={`apple-segmented-item flex items-center gap-1.5 ${activeTab === 'user' ? 'active' : ''}`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  Diagnosis
                </button>
                <button
                  onClick={() => setActiveTab('dev')}
                  className={`apple-segmented-item flex items-center gap-1.5 ${activeTab === 'dev' ? 'active' : ''}`}
                >
                  <Code className="w-3.5 h-3.5" />
                  How the AI Reached This
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--color-label-secondary)] hover:text-[var(--color-label-primary)] hover:bg-[var(--color-bg-control)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[var(--color-label-primary)]">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[var(--color-cyan-subtle)] border-t-[var(--color-cyan)] animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[var(--color-cyan)] animate-bounce" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[var(--color-label-primary)] font-semibold font-heading text-base">Comparing telemetry with CNC manuals...</p>
                <p className="text-xs text-[var(--color-label-secondary)] mt-1">Searching the Haas, Fanuc, and operating-procedure indexes in parallel.</p>
              </div>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-[var(--color-label-secondary)]">
              <AlertTriangle className="w-12 h-12 text-[var(--color-amber)] mx-auto mb-3 opacity-80" />
              <p className="text-base font-semibold text-[var(--color-label-primary)]">No Diagnostic Context Available</p>
              <p className="text-xs mt-1">Select a machine with telemetry history before running a diagnosis.</p>
            </div>
          ) : activeTab === 'user' ? (
            /* USER DIAGNOSIS VIEW */
            <>
              {/* Failure Banner */}
              <div className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
                isFailure 
                  ? 'bg-[var(--color-rose-subtle)] border-[var(--color-rose)] text-[var(--color-rose)]' 
                  : 'bg-[var(--color-emerald-subtle)] border-[var(--color-emerald)] text-[var(--color-emerald)]'
              }`}>
                <div className="flex items-start gap-3">
                  {isFailure ? (
                    <AlertTriangle className="w-6 h-6 text-[var(--color-rose)] shrink-0 mt-0.5 animate-pulse" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-[var(--color-emerald)] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base font-heading">
                        {data.failure_type}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                        isFailure ? 'bg-[var(--color-rose)] text-white' : 'bg-[var(--color-emerald)] text-white'
                      }`}>
                        {isFailure ? 'CRITICAL FAULT' : 'HEALTHY'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Alert Box if Backend returned an error */}
              {data.error ? (
                <div className="p-4.5 rounded-2xl bg-[var(--color-rose-subtle)] border border-[var(--color-rose)] text-[var(--color-label-primary)]">
                  <h4 className="text-xs uppercase tracking-wider text-[var(--color-rose)] font-bold font-heading mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[var(--color-rose)]" />
                    Diagnostic Execution Failed
                  </h4>
                  <p className="text-xs text-[var(--color-rose)] font-mono mt-1">
                    {data.error}
                  </p>
                  <p className="text-[11px] text-[var(--color-label-secondary)] mt-2">
                    Make sure <code className="text-[var(--color-cyan)]">GEMINI_API_KEY</code> and <code className="text-[var(--color-cyan)]">PINECONE_API_KEY</code> are set in your <code className="text-[var(--color-cyan)]">.env</code> file and restart Docker.
                  </p>
                </div>
              ) : (
                /* Diagnostic Assessment (Formatted Markdown output from AI) */
                <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] p-5 rounded-2xl shadow-sm space-y-1">
                  <h4 className="text-xs uppercase tracking-wider text-[var(--color-purple)] font-bold font-heading mb-3">
                    Diagnosis and Recommended Actions
                  </h4>
                  {formatMarkdown(data.diagnosis)}
                </div>
              )}

              {/* Sources Used */}
              {data.sources_used && data.sources_used.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-[var(--color-cyan)] font-bold font-heading mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Manuals Consulted
                  </h4>
                  <div className="space-y-2.5">
                    {data.sources_used.map((source, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] flex items-start gap-3 hover:bg-[var(--color-bg-control)] transition-colors"
                      >
                        <div className="w-5 h-5 rounded-full bg-[var(--color-cyan-subtle)] border border-[var(--color-cyan)] text-[var(--color-cyan)] flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-[var(--color-label-primary)] leading-relaxed font-semibold">
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
              <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] shadow-sm">
                <h4 className="text-xs uppercase tracking-wider text-[var(--color-purple)] font-bold font-heading mb-3 flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-[var(--color-purple)]" />
                  LangGraph Retrieval and Synthesis Flow
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs">
                  {/* Step 1: Start -> SQL Node */}
                  <div className="p-3 rounded-xl bg-[var(--color-cyan-subtle)] border border-[var(--color-cyan)] text-[var(--color-label-primary)] flex flex-col justify-center">
                    <span className="text-[10px] text-[var(--color-cyan)] font-mono font-bold">NODE 1 (Entry)</span>
                    <strong className="text-[var(--color-label-primary)] mt-0.5">fetch_sql_context</strong>
                    <span className="text-[10px] text-[var(--color-label-secondary)] mt-1">PostgreSQL 20-Row Trend</span>
                  </div>

                  {/* Step 2: Fan Out to 3 Experts */}
                  <div className="md:col-span-3 grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-[var(--color-purple-subtle)] border border-[var(--color-purple)] flex flex-col justify-center">
                      <span className="text-[9px] text-[var(--color-purple)] font-mono font-bold">FAN-OUT 1</span>
                      <strong className="text-xs text-[var(--color-label-primary)]">rag_haas_expert</strong>
                      <span className="text-[9px] text-[var(--color-label-secondary)]">vf_service_manual</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--color-purple-subtle)] border border-[var(--color-purple)] flex flex-col justify-center">
                      <span className="text-[9px] text-[var(--color-purple)] font-mono font-bold">FAN-OUT 2</span>
                      <strong className="text-xs text-[var(--color-label-primary)]">rag_fanuc_expert</strong>
                      <span className="text-[9px] text-[var(--color-label-secondary)]">fanuc_spindle_alarm</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--color-purple-subtle)] border border-[var(--color-purple)] flex flex-col justify-center">
                      <span className="text-[9px] text-[var(--color-purple)] font-mono font-bold">FAN-OUT 3</span>
                      <strong className="text-xs text-[var(--color-label-primary)]">rag_sop_expert</strong>
                      <span className="text-[9px] text-[var(--color-label-secondary)]">cnc_lathe (SOP)</span>
                    </div>
                  </div>

                  {/* Step 3: Fan In to Generate Diagnosis */}
                  <div className="p-3 rounded-xl bg-[var(--color-emerald-subtle)] border border-[var(--color-emerald)] flex flex-col justify-center">
                    <span className="text-[10px] text-[var(--color-emerald)] font-mono font-bold">FAN-IN (LLM)</span>
                    <strong className="text-[var(--color-label-primary)] mt-0.5">generate_diagnosis</strong>
                    <span className="text-[10px] text-[var(--color-label-secondary)] mt-1">Google Gemini Synthesis</span>
                  </div>
                </div>
              </div>

              {/* Accordion List for Each Node's Raw Inputs/Outputs */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-[var(--color-cyan)] font-bold font-heading flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Queries, Telemetry, and Retrieved Manual Context
                </h4>

                {/* Node 1: fetch_sql_context */}
                <div className="border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden bg-[var(--color-bg-surface)] shadow-sm">
                  <button
                    onClick={() => toggleNode('sql')}
                    className="w-full px-4 py-3 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-control)] flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-[var(--color-cyan)]" />
                      <div>
                        <span className="text-xs font-bold text-[var(--color-label-primary)]">fetch_sql_context</span>
                        <span className="text-[10px] text-[var(--color-label-secondary)] ml-2">
                          Captured {flow?.telemetry_window?.length || 0} Telemetry Trend Rows
                        </span>
                      </div>
                    </div>
                    {expandedNode === 'sql' ? <ChevronDown className="w-4 h-4 text-[var(--color-label-secondary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--color-label-secondary)]" />}
                  </button>
                  {expandedNode === 'sql' && (
                    <div className="p-4 border-t border-[var(--color-separator)] bg-[var(--color-bg-control)] font-mono text-[11px] overflow-x-auto text-[var(--color-cyan)]">
                      <p className="text-[10px] text-[var(--color-label-secondary)] mb-2 font-sans font-bold uppercase">Sliding Window Telemetry Data (Passed to Prompt):</p>
                      <pre>{JSON.stringify(flow?.telemetry_window || [], null, 2)}</pre>
                    </div>
                  )}
                </div>

                {/* Node 2: rag_haas_expert */}
                <div className="border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden bg-[var(--color-bg-surface)] shadow-sm">
                  <button
                    onClick={() => toggleNode('haas')}
                    className="w-full px-4 py-3 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-control)] flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[var(--color-purple)]" />
                      <div>
                        <span className="text-xs font-bold text-[var(--color-label-primary)]">rag_haas_expert</span>
                        <span className="text-[10px] text-[var(--color-purple)] ml-2">Pinecone filter: book_id = "vf_service_manual"</span>
                      </div>
                    </div>
                    {expandedNode === 'haas' ? <ChevronDown className="w-4 h-4 text-[var(--color-label-secondary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--color-label-secondary)]" />}
                  </button>
                  {expandedNode === 'haas' && (
                    <div className="p-4 border-t border-[var(--color-separator)] bg-[var(--color-bg-control)] font-mono text-[11px] overflow-x-auto text-[var(--color-label-primary)] whitespace-pre-wrap">
                      <div className="mb-3">
                        <p className="text-[10px] text-[var(--color-cyan)] mb-1 font-sans font-bold uppercase">Generated Search Query:</p>
                        <div className="px-2.5 py-1.5 bg-[var(--color-cyan-subtle)] border border-[var(--color-cyan)] rounded text-[var(--color-cyan)] font-mono break-all">
                          {flow?.haas_query || 'N/A'}
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--color-label-secondary)] mb-2 font-sans font-bold uppercase">Retrieved Context from Haas VF Service Manual:</p>
                      {flow?.haas_manual_context || 'No Haas manual context retrieved.'}
                    </div>
                  )}
                </div>

                {/* Node 3: rag_fanuc_expert */}
                <div className="border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden bg-[var(--color-bg-surface)] shadow-sm">
                  <button
                    onClick={() => toggleNode('fanuc')}
                    className="w-full px-4 py-3 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-control)] flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[var(--color-purple)]" />
                      <div>
                        <span className="text-xs font-bold text-[var(--color-label-primary)]">rag_fanuc_expert</span>
                        <span className="text-[10px] text-[var(--color-purple)] ml-2">Pinecone filter: book_id = "fanuc_spindle_alarm_list"</span>
                      </div>
                    </div>
                    {expandedNode === 'fanuc' ? <ChevronDown className="w-4 h-4 text-[var(--color-label-secondary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--color-label-secondary)]" />}
                  </button>
                  {expandedNode === 'fanuc' && (
                    <div className="p-4 border-t border-[var(--color-separator)] bg-[var(--color-bg-control)] font-mono text-[11px] overflow-x-auto text-[var(--color-label-primary)] whitespace-pre-wrap">
                      <div className="mb-3">
                        <p className="text-[10px] text-[var(--color-cyan)] mb-1 font-sans font-bold uppercase">Generated Search Query:</p>
                        <div className="px-2.5 py-1.5 bg-[var(--color-cyan-subtle)] border border-[var(--color-cyan)] rounded text-[var(--color-cyan)] font-mono break-all">
                          {flow?.fanuc_query || 'N/A'}
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--color-label-secondary)] mb-2 font-sans font-bold uppercase">Retrieved Context from Fanuc Spindle Alarm List:</p>
                      {flow?.fanuc_alarm_context || 'No Fanuc alarm codes retrieved.'}
                    </div>
                  )}
                </div>

                {/* Node 4: rag_sop_expert */}
                <div className="border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden bg-[var(--color-bg-surface)] shadow-sm">
                  <button
                    onClick={() => toggleNode('sop')}
                    className="w-full px-4 py-3 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-control)] flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[var(--color-purple)]" />
                      <div>
                        <span className="text-xs font-bold text-[var(--color-label-primary)]">rag_sop_expert</span>
                        <span className="text-[10px] text-[var(--color-purple)] ml-2">Pinecone filter: book_id = "cnc_lathe"</span>
                      </div>
                    </div>
                    {expandedNode === 'sop' ? <ChevronDown className="w-4 h-4 text-[var(--color-label-secondary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--color-label-secondary)]" />}
                  </button>
                  {expandedNode === 'sop' && (
                    <div className="p-4 border-t border-[var(--color-separator)] bg-[var(--color-bg-control)] font-mono text-[11px] overflow-x-auto text-[var(--color-label-primary)] whitespace-pre-wrap">
                      <div className="mb-3">
                        <p className="text-[10px] text-[var(--color-cyan)] mb-1 font-sans font-bold uppercase">Generated Search Query:</p>
                        <div className="px-2.5 py-1.5 bg-[var(--color-cyan-subtle)] border border-[var(--color-cyan)] rounded text-[var(--color-cyan)] font-mono break-all">
                          {flow?.cnc_sop_query || 'N/A'}
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--color-label-secondary)] mb-2 font-sans font-bold uppercase">Retrieved Context from CNC Lathe Safety SOP:</p>
                      {flow?.cnc_sop_context || 'No CNC SOP guidelines retrieved.'}
                    </div>
                  )}
                </div>

                {/* Node 5: generate_diagnosis Raw Response */}
                <div className="border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden bg-[var(--color-bg-surface)] shadow-sm">
                  <button
                    onClick={() => toggleNode('raw')}
                    className="w-full px-4 py-3 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-control)] flex items-center justify-between text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Bot className="w-4 h-4 text-[var(--color-emerald)]" />
                      <div>
                        <span className="text-xs font-bold text-[var(--color-label-primary)]">generate_diagnosis</span>
                        <span className="text-[10px] text-[var(--color-emerald)] ml-2">Synthesized LLM Completion Output</span>
                      </div>
                    </div>
                    {expandedNode === 'raw' ? <ChevronDown className="w-4 h-4 text-[var(--color-label-secondary)]" /> : <ChevronRight className="w-4 h-4 text-[var(--color-label-secondary)]" />}
                  </button>
                  {expandedNode === 'raw' && (
                    <div className="p-4 border-t border-[var(--color-separator)] bg-[var(--color-bg-control)] font-mono text-[11px] overflow-x-auto text-[var(--color-emerald)] whitespace-pre-wrap">
                      <p className="text-[10px] text-[var(--color-label-secondary)] mb-2 font-sans font-bold uppercase">Raw Synthesized LLM String:</p>
                      {data.diagnosis}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-separator)] bg-[var(--color-bg-surface)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-label-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-emerald)] animate-ping"></span>
            LangGraph Multi-Agent RAG Online
          </div>

          <div className="flex items-center gap-3">
            {onReDiagnose && (
              <button
                onClick={onReDiagnose}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-[var(--color-bg-control)] border border-[var(--color-border-subtle)] text-[var(--color-label-primary)] hover:bg-[var(--color-bg-surface-elevated)] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Re-Analyze
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
            >
              Close Diagnosis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
