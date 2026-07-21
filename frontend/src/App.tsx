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
  Wrench
} from 'lucide-react';

import type { Machine, TelemetryLog } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { MetricCard } from './components/MetricCard';
import { ChartCard } from './components/ChartCard';
import { AlertBanner } from './components/AlertBanner';
import { SimulatorControl } from './components/SimulatorControl';

export default function App() {
  const { isConnected, telemetryLogs, alerts, setAlerts } = useWebSocket();
  
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [historicalLogs, setHistoricalLogs] = useState<TelemetryLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  // Fetch telemetry history when selected machine changes
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

    fetchHistory();
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

  // Selected Machine Details
  const selectedMachine = useMemo(() => {
    return machines.find(m => m.id === selectedMachineId);
  }, [machines, selectedMachineId]);

  // Get current metrics (latest data point) for selected machine
  const currentMetrics = useMemo(() => {
    if (activeLogs.length > 0) {
      return activeLogs[activeLogs.length - 1];
    }
    return null;
  }, [activeLogs]);

  // Search/Filter machines list
  const filteredMachines = useMemo(() => {
    return machines.filter(m => 
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [machines, searchQuery]);

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

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f3f4f6] font-sans flex flex-col antialiased">
      {/* Premium Header */}
      <header className="glass-panel border-b border-white/5 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-purple-500 p-2 rounded-xl text-white shadow-lg shadow-cyan-500/10">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-none">
                AeroForge AI
              </h1>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mt-1">
                Factory Monitoring & Anomaly Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
              isConnected 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'pulse-green' : 'pulse-yellow'}`} />
              {isConnected ? 'Telemetry Online' : 'Connecting Stream...'}
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

        {/* Left Column: Asset Selection list */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-[calc(100vh-230px)] min-h-[500px]">
          <div className="glass-panel rounded-2xl p-4 flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-2 rounded-xl mb-4">
              <Search className="w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search assets (e.g. M14890)..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm w-full outline-none text-white placeholder-gray-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-gray-500 text-2xs uppercase tracking-wider font-semibold mb-2">
                Factory Machines ({filteredMachines.length})
              </p>
              {filteredMachines.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No matching machines.
                </div>
              ) : (
                filteredMachines.map((machine) => {
                  const statusColors = 
                    machine.status === 'RUNNING' ? { dot: 'bg-emerald-500 pulse-green', border: 'border-emerald-500/10 hover:border-emerald-500/30' } :
                    machine.status === 'WARNING' ? { dot: 'bg-amber-500 pulse-yellow', border: 'border-amber-500/10 hover:border-amber-500/30' } :
                    machine.status === 'FAULT' ? { dot: 'bg-rose-500 pulse-red', border: 'border-rose-500/10 hover:border-rose-500/30' } :
                    { dot: 'bg-gray-500', border: 'border-white/5 hover:border-white/10' };

                  const isSelected = selectedMachineId === machine.id;

                  return (
                    <button
                      key={machine.id}
                      onClick={() => setSelectedMachineId(machine.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-gradient-to-r from-cyan-950/30 to-purple-950/20 border-cyan-500/30 shadow-md shadow-cyan-950/30' 
                          : `bg-white/[0.02] ${statusColors.border}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${statusColors.dot}`}></div>
                        <div>
                          <p className="text-sm font-bold text-gray-200 font-heading">
                            {machine.id}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {machine.name}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-gray-400">
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
          <ChartCard data={activeLogs} machineId={selectedMachineId} loading={loadingHistory} />

          {/* Machine Real-time Telemetry Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="glass-panel bg-white/[0.01] rounded-2xl p-4 text-center">
              <div className="flex justify-center text-cyan-400 mb-1.5"><Thermometer className="w-5 h-5" /></div>
              <p className="text-gray-500 text-2xs uppercase font-heading font-semibold">Air Temp</p>
              <h4 className="text-lg font-bold text-gray-200 mt-0.5">
                {currentMetrics ? `${currentMetrics.air_temp_k.toFixed(1)} K` : '--'}
              </h4>
            </div>

            <div className="glass-panel bg-white/[0.01] rounded-2xl p-4 text-center">
              <div className="flex justify-center text-purple-400 mb-1.5"><Thermometer className="w-5 h-5" /></div>
              <p className="text-gray-500 text-2xs uppercase font-heading font-semibold">Process Temp</p>
              <h4 className="text-lg font-bold text-gray-200 mt-0.5">
                {currentMetrics ? `${currentMetrics.process_temp_k.toFixed(1)} K` : '--'}
              </h4>
            </div>

            <div className="glass-panel bg-white/[0.01] rounded-2xl p-4 text-center">
              <div className="flex justify-center text-cyan-400 mb-1.5"><Gauge className="w-5 h-5" /></div>
              <p className="text-gray-500 text-2xs uppercase font-heading font-semibold">Rotational Speed</p>
              <h4 className="text-lg font-bold text-gray-200 mt-0.5">
                {currentMetrics ? `${currentMetrics.rpm} RPM` : '--'}
              </h4>
            </div>

            <div className="glass-panel bg-white/[0.01] rounded-2xl p-4 text-center">
              <div className="flex justify-center text-purple-400 mb-1.5"><Cpu className="w-5 h-5" /></div>
              <p className="text-gray-500 text-2xs uppercase font-heading font-semibold">Torque</p>
              <h4 className="text-lg font-bold text-gray-200 mt-0.5">
                {currentMetrics ? `${currentMetrics.torque_nm.toFixed(1)} Nm` : '--'}
              </h4>
            </div>

            <div className="glass-panel bg-white/[0.01] rounded-2xl p-4 text-center">
              <div className="flex justify-center text-amber-500 mb-1.5"><Layers className="w-5 h-5" /></div>
              <p className="text-gray-500 text-2xs uppercase font-heading font-semibold">Tool Wear</p>
              <h4 className="text-lg font-bold text-gray-200 mt-0.5">
                {currentMetrics ? `${currentMetrics.tool_wear_min} min` : '--'}
              </h4>
            </div>
          </div>

          {/* Machine Info & Diagnostic Details */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col flex-1">
            <h3 className="text-sm font-bold font-heading text-white mb-2">
              Diagnostics Context
            </h3>
            {selectedMachine ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-500 block">System Name</span>
                  <span className="font-bold text-gray-300 block mt-1">{selectedMachine.name}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-500 block">Current Product</span>
                  <span className="font-bold text-purple-400 block mt-1">{currentMetrics?.product_id || 'None'}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-500 block">Class Category</span>
                  <span className="font-bold text-cyan-400 block mt-1">
                    {selectedMachine.type === 'L' ? 'Low Grade (L)' : 
                     selectedMachine.type === 'M' ? 'Medium Grade (M)' : 
                     'High Grade (H)'}
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-500 block">Operating Status</span>
                  <span className={`font-bold block mt-1 ${
                    selectedMachine.status === 'RUNNING' ? 'text-emerald-400' :
                    selectedMachine.status === 'WARNING' ? 'text-amber-400' :
                    selectedMachine.status === 'FAULT' ? 'text-rose-400' : 'text-gray-500'
                  }`}>
                    {selectedMachine.status}
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-gray-500 block">Anomaly Trigger</span>
                  <span className="font-bold block mt-1 text-gray-300">
                    {currentMetrics?.is_failure ? (
                      <span className="text-rose-400 pulse-red">{currentMetrics.failure_reason || 'Failure'}</span>
                    ) : 'None'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-xs">Select an asset from the checklist to see diagnostics data.</p>
            )}
          </div>
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
      <footer className="py-4 border-t border-white/5 text-center text-xs text-gray-600 bg-black/10 mt-6">
        <p>© 2026 AeroForge AI Monitoring. Real-time telemetry via WebSockets.</p>
      </footer>
    </div>
  );
}
