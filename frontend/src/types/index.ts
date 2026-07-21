export interface Machine {
  id: string;
  name: string;
  type: string;
  status: 'RUNNING' | 'WARNING' | 'OFFLINE' | 'FAULT';
  created_at?: string;
}

export interface TelemetryLog {
  id: string;
  product_id: string;
  air_temp_k: number;
  process_temp_k: number;
  rpm: number;
  torque_nm: number;
  tool_wear_min: number;
  is_failure: boolean;
  failure_reason: string | null;
  timestamp: string;
}

export interface Alert {
  id: string;
  machine_id: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'CRITICAL';
  reason: string;
  resolved: boolean;
}

export interface SimulatorStatus {
  is_running: boolean;
}
