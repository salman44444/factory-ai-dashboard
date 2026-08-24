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
    setDbStatus('Loading 9,000 simulated telemetry rows...');
    try {
      const res = await fetch('/api/v1/simulator/load', { method: 'POST' });
      await res.json();
      setDbStatus('Loaded all three machine dataset slices.');
      fetchStatus();
    } catch (e) {
      console.error('Error bulk loading:', e);
      setDbStatus('Bulk load failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apple-card p-5 flex flex-col justify-between h-full">
      <div>
        <h3 className="text-sm font-bold font-heading text-[var(--color-label-primary)] flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--color-cyan)]" />
          Dataset Playback
        </h3>
        <p className="text-[var(--color-label-secondary)] text-xs mt-0.5">
          Replay three AI4I dataset slices at one row per second
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <div className="flex items-center justify-between bg-[var(--color-bg-control)] p-3 rounded-[14px] border border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-[var(--color-emerald)] pulse-green' : 'bg-[var(--color-label-tertiary)]'}`}></span>
            <span className="text-xs font-semibold text-[var(--color-label-primary)]">
              Status: {isRunning ? 'Playback running' : 'Playback stopped'}
            </span>
          </div>
          
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              isRunning 
                ? 'bg-[var(--color-amber-subtle)] text-[var(--color-amber)] border border-[var(--color-amber)]' 
                : 'bg-[var(--color-emerald)] text-white hover:opacity-90 shadow-sm'
            }`}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pause Playback
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Start / Resume
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleBulkLoad}
            disabled={loading}
            className="py-2.5 bg-[var(--color-bg-control)] hover:bg-[var(--color-bg-surface-elevated)] disabled:opacity-50 text-[var(--color-label-primary)] rounded-xl text-xs font-semibold border border-[var(--color-border-subtle)] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Database className="w-3.5 h-3.5 text-[var(--color-cyan)]" />
            Load Full History
          </button>
          
          <button
            onClick={handleReset}
            disabled={loading}
            className="py-2.5 bg-[var(--color-rose-subtle)] hover:bg-[var(--color-rose-subtle)] border border-[var(--color-rose)] text-[var(--color-rose)] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        </div>
      </div>

      {dbStatus && (
        <div className="mt-4 text-[11px] text-[var(--color-label-secondary)] bg-[var(--color-bg-control)] p-2.5 rounded-lg border border-[var(--color-border-subtle)] truncate">
          {dbStatus}
        </div>
      )}
    </div>
  );
};
