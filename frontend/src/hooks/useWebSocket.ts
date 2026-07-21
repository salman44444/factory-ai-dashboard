import { useEffect, useState, useRef } from 'react';
import type { TelemetryLog, Alert } from '../types';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      // Connect to port 8000 for the WebSocket server
      const wsUrl = `ws://${window.location.hostname}:8000/ws/live-data`;
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket Connected');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event_type, data } = payload;

          if (event_type === 'telemetry') {
            setTelemetryLogs((prev) => {
              const next = [...prev, data];
              // Slice to last 400 telemetry records to avoid memory bloat
              return next.length > 400 ? next.slice(next.length - 400) : next;
            });
          } else if (event_type === 'alert') {
            setAlerts((prev) => {
              if (prev.some(a => a.id === data.id)) return prev;
              const next = [data, ...prev];
              return next.length > 50 ? next.slice(0, 50) : next;
            });
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket Disconnected. Reconnecting in 3s...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        ws.close();
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, []);

  return { isConnected, telemetryLogs, alerts, setAlerts };
}
