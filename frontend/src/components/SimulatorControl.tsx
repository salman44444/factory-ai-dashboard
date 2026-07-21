import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Database, Loader2 } from 'lucide-react';

interface SimulatorControlProps {
  onStatusChange?: (running: boolean) => void;
}

export const SimulatorControl: React.FC<SimulatorControlProps> = ({ onStatusChange }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/v1/simulator/status');
      const data = await res.json();
      setIsRunning(data.is_running);
      if (onStatusChange) onStatusChange(data.is_running);
    } catch (e) {
      console.error('Error fetching simulator status:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll status every 5 seconds to keep synced if toggled elsewhere
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    setDbStatus(null);
    try {
      const endpoint = isRunning ? '/api/v1/simulator/stop' : '/api/v1/simulator/start';
      const res = await fetch(endpoint, { method: 'POST' });
      await res.json();
      setIsRunning(!isRunning);
      if (onStatusChange) onStatusChange(!isRunning);
    } catch (e) {
      console.error('Error toggling simulator:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to delete all database telemetry and reset the simulator?')) return;
    setLoading(true);
    setDbStatus('Resetting simulator...');
    try {
      const res = await fetch('/api/v1/simulator/reset', { method: 'DELETE' });
      const data = await res.json();
      setIsRunning(false);
      if (onStatusChange) onStatusChange(false);
      setDbStatus(`Deleted ${data.deleted_records_count} logs. Reset successful.`);
    } catch (e) {
      console.error('Error resetting simulator:', e);
      setDbStatus('Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkLoad = async () => {
    setLoading(true);
    setDbStatus('Bulk loading 10,000 logs (may take a few seconds)...');
    try {
      const res = await fetch('/api/v1/simulator/load', { method: 'POST' });
      await res.json();
      setDbStatus('Preloaded all CSV records successfully.');
      // Refresh status
      fetchStatus();
    } catch (e) {
      console.error('Error bulk loading:', e);
      setDbStatus('Bulk load failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between h-full">
      <div>
        <h3 className="text-md font-bold font-heading text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          Simulator Operations
        </h3>
        <p className="text-gray-400 text-xs mt-0.5">
          Control the industrial machine telemetry streaming loop
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500 pulse-green' : 'bg-gray-500'}`}></span>
            <span className="text-xs font-semibold text-gray-300">
              Status: {isRunning ? 'Active Stream' : 'Paused / Stopped'}
            </span>
          </div>
          
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isRunning 
                ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/20' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleBulkLoad}
            disabled={loading}
            className="py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 hover:text-white rounded-xl text-xs font-semibold border border-white/5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            Bulk Load
          </button>
          
          <button
            onClick={handleReset}
            disabled={loading}
            className="py-2.5 bg-rose-950/20 hover:bg-rose-950/30 border border-rose-500/10 hover:border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Data
          </button>
        </div>
      </div>

      {dbStatus && (
        <div className="mt-4 text-[10px] text-gray-400 bg-black/20 p-2 rounded-lg border border-white/5 truncate">
          {dbStatus}
        </div>
      )}
    </div>
  );
};
