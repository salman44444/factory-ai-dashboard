import { useEffect, useState, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Thermometer, 
  Gauge, 
  Cpu, 
  Search, 
  Server, 
  Radio,
  Layers,
  Wrench,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Download
} from 'lucide-react';

import type { Machine, TelemetryLog, DiagnoseResponse } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { useTheme } from './hooks/useTheme';
import { MetricCard } from './components/MetricCard';
import { ChartCard } from './components/ChartCard';
import { AlertBanner } from './components/AlertBanner';
import { SimulatorControl } from './components/SimulatorControl';
import { TelemetryTable } from './components/TelemetryTable';
import { AIDiagnosisModal } from './components/AIDiagnosisModal';


export default function App() {
  const { isConnected, telemetryLogs, alerts, setAlerts } = useWebSocket();
  const { theme, setTheme } = useTheme();
  
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [historicalLogs, setHistoricalLogs] = useState<TelemetryLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | 'L' | 'M' | 'H'>('ALL');
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [historyViewMode, setHistoryViewMode] = useState<'live' | 'failure'>('live');
  const [failureContextLogs, setFailureContextLogs] = useState<TelemetryLog[]>([]);
  const [loadingFailureContext, setLoadingFailureContext] = useState(false);

  // UTC Real-time Clock Ticker
  const [utcTime, setUtcTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // AI Diagnosis State
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<DiagnoseResponse | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);

  const handleDiagnoseWithAI = async (machineId?: string) => {
    const targetId = machineId || selectedMachineId;
    if (!targetId) return;

    setLoadingDiagnosis(true);
    setDiagnosisData(null);
    setDiagnosisModalOpen(true);
    try {
      const res = await fetch('/api/chat/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: targetId })
      });
      const data = await res.json();
      if (!res.ok) {
        setDiagnosisData({
          machine_id: targetId,
          failure_type: 'Backend Error',
          diagnosis: '',
          sources_used: [],
          error: data.detail || 'Failed to generate AI diagnosis.'
        });
      } else {
        setDiagnosisData(data);
      }
    } catch (e: any) {
      console.error('Error triggering AI diagnosis:', e);
      setDiagnosisData({
        machine_id: targetId,
        failure_type: 'Connection Error',
        diagnosis: '',
        sources_used: [],
        error: e.message || 'Unable to connect to AI backend service.'
      });
    } finally {
      setLoadingDiagnosis(false);
    }
  };


  // Selected Machine Details
  const selectedMachine = useMemo(() => {
    return machines.find(m => m.id === selectedMachineId);
  }, [machines, selectedMachineId]);

  // Fetch initial machines and alerts on load
  const fetchInitialData = async () => {
    try {
      const machRes = await fetch('/api/v1/machines/?limit=1000');
      const machData = await machRes.json();
      setMachines(machData);
      
      // Auto-select first machine if none selected
      if (machData.length > 0 && !selectedMachineId) {
        setSelectedMachineId(machData[0].id);
      }

      const alertRes = await fetch('/api/v1/alerts/?limit=50');
      const alertData = await alertRes.json();
      setAlerts(alertData);
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Poll machines status periodically to sync with simulator updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const machRes = await fetch('/api/v1/machines/?limit=1000');
        const machData = await machRes.json();
        setMachines(machData);
      } catch (e) {
        console.error('Error syncing machines:', e);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch telemetry history when selected machine changes or its status changes
  useEffect(() => {
    if (!selectedMachineId) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        // Fetch last 50 logs for this machine
        const res = await fetch(`/api/v1/telemetry/machine/${selectedMachineId}?limit=50`);
        const data = await res.json();
        // Sort historical data ascending for chart plotting (oldest first)
        const sorted = data.reverse();
        setHistoricalLogs(sorted);
      } catch (e) {
        console.error('Error fetching machine history:', e);
      } finally {
        setLoadingHistory(false);
      }
    };

    const fetchFailureContext = async () => {
      setLoadingFailureContext(true);
      try {
        // Fetch logs leading up to failure
        const res = await fetch(`/api/v1/telemetry/machine/${selectedMachineId}/failure-context?limit=50`);
        const data = await res.json();
        setFailureContextLogs(data);
      } catch (e) {
        console.error('Error fetching failure context:', e);
      } finally {
        setLoadingFailureContext(false);
      }
    };

    fetchHistory();
    fetchFailureContext();
  }, [selectedMachineId, selectedMachine?.status]);

  // Auto-switch view mode when selecting a failed machine
  useEffect(() => {
    if (selectedMachine?.status === 'FAULT') {
      setHistoryViewMode('failure');
    } else {
      setHistoryViewMode('live');
    }
  }, [selectedMachineId]);

  // Combine historical logs and real-time WebSocket logs for chart display
  const activeLogs = useMemo(() => {
    if (!selectedMachineId) return [];

    // Filter incoming WS logs belonging to this machine
    const wsFiltered = telemetryLogs.filter(log => log.machine_id === selectedMachineId);
    
    // Merge history and ws logs, ensuring no duplicates by ID
    const mergedMap = new Map<string, TelemetryLog>();
    historicalLogs.forEach(log => mergedMap.set(log.id, log));
    wsFiltered.forEach(log => mergedMap.set(log.id, log));
    
    // Convert back to sorted array and limit to last 50 points
    const merged = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return merged.slice(-50);
  }, [selectedMachineId, historicalLogs, telemetryLogs]);

  // Select which log dataset to display based on historyViewMode
  const displayedLogs = useMemo(() => {
    return historyViewMode === 'live' ? activeLogs : failureContextLogs;
  }, [historyViewMode, activeLogs, failureContextLogs]);

  // Get current metrics (latest data point) for selected machine
  const currentMetrics = useMemo(() => {
    if (activeLogs.length > 0) {
      return activeLogs[activeLogs.length - 1];
    }
    return null;
  }, [activeLogs]);

  // Search/Filter machines list by text & grade
  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      const matchesText = 
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGrade = gradeFilter === 'ALL' || m.type === gradeFilter;
      return matchesText && matchesGrade;
    });
  }, [machines, searchQuery, gradeFilter]);

  // Calculate global summary states
  const totals = useMemo(() => {
    const total = machines.length;
    const running = machines.filter(m => m.status === 'RUNNING').length;
    const warning = machines.filter(m => m.status === 'WARNING').length;
    const fault = machines.filter(m => m.status === 'FAULT').length;
    const offline = machines.filter(m => m.status === 'OFFLINE').length;
    
    const activeAlerts = alerts.filter(a => !a.resolved).length;
    
    return { total, running, warning, fault, offline, activeAlerts };
  }, [machines, alerts]);

  // Handle alert resolution
  const handleResolveAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: true })
      });
      if (res.ok) {
        setAlerts((prev) => 
          prev.map((a) => a.id === id ? { ...a, resolved: true } : a)
        );
      }
    } catch (e) {
      console.error('Error resolving alert:', e);
    }
  };

  // Export current telemetry dataset to CSV file
  const handleExportCSV = () => {
    if (displayedLogs.length === 0) return;
    const headers = ['id', 'machine_id', 'product_id', 'timestamp', 'air_temp_k', 'process_temp_k', 'rpm', 'torque_nm', 'tool_wear_min', 'is_failure', 'failure_reason'];
    const rows = displayedLogs.map(log => [
      log.id,
      log.machine_id,
      log.product_id || '',
      log.timestamp,
      log.air_temp_k,
      log.process_temp_k,
      log.rpm,
      log.torque_nm,
      log.tool_wear_min,
      log.is_failure ? 'TRUE' : 'FALSE',
      `"${log.failure_reason || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telemetry_${selectedMachineId || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-label-primary)] font-sans flex flex-col antialiased">
      {/* Apple HIG Translucent Header Toolbar */}
      <header className="apple-glass-header py-3.5 px-6 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--color-accent)] p-2.5 rounded-[12px] text-white shadow-sm flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-heading text-[var(--color-label-primary)] tracking-tight leading-none">
                AeroForge AI
              </h1>
              <p className="text-[var(--color-label-secondary)] text-[10px] uppercase tracking-wider font-semibold mt-1">
                Factory Monitoring & Anomaly Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* UTC Clock Ticker */}
            <div className="px-3 py-1.5 rounded-xl bg-[var(--color-bg-control)] border border-[var(--color-border-subtle)] text-xs font-semibold text-[var(--color-label-secondary)] font-mono">
              {utcTime || '12:00:00 UTC'}
            </div>

            {/* Telemetry Status Pill */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${
              isConnected 
                ? 'bg-[var(--color-emerald-subtle)] border-[var(--color-emerald)] text-[var(--color-emerald)]' 
                : 'bg-[var(--color-amber-subtle)] border-[var(--color-amber)] text-[var(--color-amber)]'
            }`}>
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'pulse-green' : 'pulse-yellow'}`} />
              {isConnected ? 'Telemetry Online' : 'Connecting Stream...'}
            </div>

            {/* CSV Export Action Button */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-[var(--color-bg-control)] hover:bg-[var(--color-bg-surface-elevated)] text-[var(--color-label-primary)] border border-[var(--color-border-subtle)] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Apple HIG Theme Switcher */}
            <div className="apple-segmented-control">
              <button
                onClick={() => setTheme('light')}
                className={`apple-segmented-item flex items-center gap-1 ${theme === 'light' ? 'active' : ''}`}
                title="Light Theme"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`apple-segmented-item flex items-center gap-1 ${theme === 'dark' ? 'active' : ''}`}
                title="Dark Theme"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dark</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`apple-segmented-item flex items-center gap-1 ${theme === 'system' ? 'active' : ''}`}
                title="Match System Theme"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Auto</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1600px] mx-auto px-6 py-6 flex-1 w-full grid grid-cols-12 gap-6">
        
        {/* KPI Cards Strip */}
        <section className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard 
            title="Total Assets" 
            value={totals.total} 
            icon={Server} 
            color="purple" 
          />
          <MetricCard 
            title="Active Operational" 
            value={totals.running} 
            icon={Activity} 
            color="emerald" 
            trend={`${((totals.running / (totals.total || 1)) * 100).toFixed(0)}% Utilized`}
            trendType="up"
          />
          <MetricCard 
            title="Warnings Raised" 
            value={totals.warning} 
            icon={AlertTriangle} 
            color="amber" 
            trend={`${totals.warning} minor risk`}
            trendType={totals.warning > 0 ? 'danger' : 'neutral'}
          />
          <MetricCard 
            title="Failure Incidents" 
            value={totals.fault} 
            icon={AlertTriangle} 
            color="rose" 
            trend={totals.fault > 0 ? 'CRITICAL SHUTDOWN' : 'All clear'}
            trendType={totals.fault > 0 ? 'danger' : 'neutral'}
          />
          <MetricCard 
            title="Active Incidents" 
            value={totals.activeAlerts} 
            icon={Wrench} 
            color="cyan" 
            trend="Unresolved alerts"
            trendType={totals.activeAlerts > 0 ? 'danger' : 'neutral'}
          />
        </section>

        {/* Left Sidebar: Asset Selection list (Apple macOS Inset Grouped List) */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-[calc(100vh-230px)] min-h-[500px]">
          <div className="apple-card p-4 flex flex-col flex-1 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-2 bg-[var(--color-bg-control)] border border-[var(--color-border-subtle)] px-3 py-2 rounded-xl mb-3">
              <Search className="w-4 h-4 text-[var(--color-label-tertiary)]" />
              <input 
                type="text" 
                placeholder="Search assets (e.g. M14890)..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs w-full outline-none text-[var(--color-label-primary)] placeholder-[var(--color-label-tertiary)]"
              />
            </div>

            {/* Category Grade Filters */}
            <div className="flex items-center gap-1.5 mb-3">
              {(['ALL', 'L', 'M', 'H'] as const).map(grade => (
                <button
                  key={grade}
                  onClick={() => setGradeFilter(grade)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    gradeFilter === grade
                      ? 'bg-[var(--color-accent)] text-white shadow-xs'
                      : 'bg-[var(--color-bg-control)] text-[var(--color-label-secondary)] hover:text-[var(--color-label-primary)]'
                  }`}
                >
                  {grade === 'ALL' ? 'All' : `Grade ${grade}`}
                </button>
              ))}
            </div>

            {/* Machinery List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <p className="text-[var(--color-label-secondary)] text-[10px] uppercase tracking-wider font-semibold mb-2 px-1">
                Factory Machines ({filteredMachines.length})
              </p>
              {filteredMachines.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-label-tertiary)] text-xs font-medium">
                  No matching machines.
                </div>
              ) : (
                filteredMachines.map((machine) => {
                  const statusColors = 
                    machine.status === 'RUNNING' ? { dot: 'bg-[var(--color-emerald)] pulse-green', border: 'border-[var(--color-border-subtle)]' } :
                    machine.status === 'WARNING' ? { dot: 'bg-[var(--color-amber)] pulse-yellow', border: 'border-[var(--color-border-subtle)]' } :
                    machine.status === 'FAULT' ? { dot: 'bg-[var(--color-rose)] pulse-red', border: 'border-[var(--color-border-subtle)]' } :
                    { dot: 'bg-[var(--color-label-tertiary)]', border: 'border-[var(--color-border-subtle)]' };

                  const isSelected = selectedMachineId === machine.id;

                  return (
                    <button
                      key={machine.id}
                      onClick={() => setSelectedMachineId(machine.id)}
                      className={`w-full text-left p-3 rounded-[12px] transition-all flex items-center justify-between cursor-pointer border ${
                        isSelected 
                          ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm' 
                          : `bg-[var(--color-bg-control)] ${statusColors.border} hover:bg-[var(--color-bg-surface-elevated)]`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-white' : statusColors.dot}`}></div>
                        <div>
                          <p className={`text-xs font-bold font-heading ${isSelected ? 'text-white' : 'text-[var(--color-label-primary)]'}`}>
                            {machine.id}
                          </p>
                          <p className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[var(--color-label-secondary)]'}`}>
                            {machine.name}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[var(--color-bg-surface)] text-[var(--color-label-secondary)] border border-[var(--color-border-subtle)]'
                      }`}>
                        {machine.type}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Center Diagnostics & Charts */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-6">
          {/* Main Chart */}
          <ChartCard 
            data={displayedLogs} 
            machineId={selectedMachineId} 
            loading={historyViewMode === 'live' ? loadingHistory : loadingFailureContext} 
          />

          {/* Machine Real-time Telemetry Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="apple-card p-3.5 text-center">
              <div className="flex justify-center text-[var(--color-cyan)] mb-1"><Thermometer className="w-4 h-4" /></div>
              <p className="text-[var(--color-label-secondary)] text-[10px] uppercase font-heading font-semibold">Air Temp</p>
              <h4 className="text-base font-bold text-[var(--color-label-primary)] mt-0.5 font-mono">
                {currentMetrics ? `${currentMetrics.air_temp_k.toFixed(1)} K` : '--'}
              </h4>
            </div>

            <div className="apple-card p-3.5 text-center">
              <div className="flex justify-center text-[var(--color-purple)] mb-1"><Thermometer className="w-4 h-4" /></div>
              <p className="text-[var(--color-label-secondary)] text-[10px] uppercase font-heading font-semibold">Process Temp</p>
              <h4 className="text-base font-bold text-[var(--color-label-primary)] mt-0.5 font-mono">
                {currentMetrics ? `${currentMetrics.process_temp_k.toFixed(1)} K` : '--'}
              </h4>
            </div>

            <div className="apple-card p-3.5 text-center">
              <div className="flex justify-center text-[var(--color-cyan)] mb-1"><Gauge className="w-4 h-4" /></div>
              <p className="text-[var(--color-label-secondary)] text-[10px] uppercase font-heading font-semibold">Speed</p>
              <h4 className="text-base font-bold text-[var(--color-label-primary)] mt-0.5 font-mono">
                {currentMetrics ? `${currentMetrics.rpm} RPM` : '--'}
              </h4>
            </div>

            <div className="apple-card p-3.5 text-center">
              <div className="flex justify-center text-[var(--color-purple)] mb-1"><Cpu className="w-4 h-4" /></div>
              <p className="text-[var(--color-label-secondary)] text-[10px] uppercase font-heading font-semibold">Torque</p>
              <h4 className="text-base font-bold text-[var(--color-label-primary)] mt-0.5 font-mono">
                {currentMetrics ? `${currentMetrics.torque_nm.toFixed(1)} Nm` : '--'}
              </h4>
            </div>

            <div className="apple-card p-3.5 text-center">
              <div className="flex justify-center text-[var(--color-amber)] mb-1"><Layers className="w-4 h-4" /></div>
              <p className="text-[var(--color-label-secondary)] text-[10px] uppercase font-heading font-semibold">Tool Wear</p>
              <h4 className="text-base font-bold text-[var(--color-label-primary)] mt-0.5 font-mono">
                {currentMetrics ? `${currentMetrics.tool_wear_min} m` : '--'}
              </h4>
            </div>
          </div>

          {/* Machine Info & Diagnostic Details */}
          <div className="apple-card p-5 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold font-heading text-[var(--color-label-primary)]">
                Diagnostics Context
              </h3>
              {selectedMachineId && (
                <button
                  onClick={() => handleDiagnoseWithAI(selectedMachineId)}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  Diagnose with AI
                </button>
              )}
            </div>
            {selectedMachine ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div className="bg-[var(--color-bg-control)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-label-secondary)] block text-[10px] uppercase font-semibold">System Name</span>
                  <span className="font-bold text-[var(--color-label-primary)] block mt-0.5">{selectedMachine.name}</span>
                </div>
                <div className="bg-[var(--color-bg-control)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-label-secondary)] block text-[10px] uppercase font-semibold">Current Product</span>
                  <span className="font-bold text-[var(--color-purple)] block mt-0.5 font-mono">{currentMetrics?.product_id || 'None'}</span>
                </div>
                <div className="bg-[var(--color-bg-control)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-label-secondary)] block text-[10px] uppercase font-semibold">Class Category</span>
                  <span className="font-bold text-[var(--color-cyan)] block mt-0.5">
                    {selectedMachine.type === 'L' ? 'Low Grade (L)' : 
                     selectedMachine.type === 'M' ? 'Medium Grade (M)' : 
                     'High Grade (H)'}
                  </span>
                </div>
                <div className="bg-[var(--color-bg-control)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-label-secondary)] block text-[10px] uppercase font-semibold">Operating Status</span>
                  <span className={`font-bold block mt-0.5 ${
                    selectedMachine.status === 'RUNNING' ? 'text-[var(--color-emerald)]' :
                    selectedMachine.status === 'WARNING' ? 'text-[var(--color-amber)]' :
                    selectedMachine.status === 'FAULT' ? 'text-[var(--color-rose)]' : 'text-[var(--color-label-tertiary)]'
                  }`}>
                    {selectedMachine.status}
                  </span>
                </div>
                <div className="bg-[var(--color-bg-control)] p-3 rounded-xl border border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-label-secondary)] block text-[10px] uppercase font-semibold">Anomaly Trigger</span>
                  <span className="font-bold block mt-0.5 text-[var(--color-label-primary)]">
                    {currentMetrics?.is_failure ? (
                      <span className="text-[var(--color-rose)] pulse-red">{currentMetrics.failure_reason || 'Failure'}</span>
                    ) : 'None'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[var(--color-label-secondary)] text-xs">Select an asset from the checklist to see diagnostics data.</p>
            )}
          </div>

          {/* Incident & Telemetry History Table */}
          {selectedMachineId && (
            <TelemetryTable
              data={displayedLogs}
              loading={historyViewMode === 'live' ? loadingHistory : loadingFailureContext}
              viewMode={historyViewMode}
              onViewModeChange={setHistoryViewMode}
              hasFailure={failureContextLogs.some(log => log.is_failure)}
            />
          )}
        </section>

        {/* Right Column: Alerts & Controls */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          {/* Simulation controller */}
          <SimulatorControl />

          {/* Active warnings and history */}
          <AlertBanner alerts={alerts} onResolve={handleResolveAlert} />
        </section>

      </main>

      {/* Footer info */}
      <footer className="py-4 border-t border-[var(--color-separator)] text-center text-xs text-[var(--color-label-secondary)] bg-[var(--color-bg-surface)] mt-6">
        <p>© 2026 AeroForge AI Monitoring. Real-time telemetry via WebSockets.</p>
      </footer>

      {/* AI Diagnosis Modal */}
      <AIDiagnosisModal 
        isOpen={diagnosisModalOpen}
        onClose={() => setDiagnosisModalOpen(false)}
        data={diagnosisData}
        loading={loadingDiagnosis}
        onReDiagnose={() => handleDiagnoseWithAI()}
      />
    </div>
  );
}
