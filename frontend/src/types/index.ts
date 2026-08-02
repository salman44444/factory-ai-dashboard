export interface Machine {
  id: string;
  name: string;
  type: string;
  status: 'RUNNING' | 'WARNING' | 'OFFLINE' | 'FAULT';
  created_at?: string;
}

export interface TelemetryLog {
  id: string;
  machine_id: string;
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

export interface DiagnoseTelemetryDetails {
  id?: number;
  machine_id: string;
  product_id?: string | null;
  air_temp_k?: number | null;
  process_temp_k?: number | null;
  rpm?: number | null;
  torque_nm?: number | null;
  tool_wear_min?: number | null;
  is_failure: boolean;
  failure_reason?: string | null;
  timestamp?: string | null;
}

export interface AgentFlowDetails {
  telemetry_window: Record<string, any>[];
  haas_manual_context: string;
  fanuc_alarm_context: string;
  cnc_sop_context: string;
  haas_query?: string;
  fanuc_query?: string;
  cnc_sop_query?: string;
}

export interface DiagnoseResponse {
  machine_id: string;
  failure_type: string;
  diagnosis: string;
  sources_used: string[];
  agent_flow_details?: AgentFlowDetails;
  error?: string;
}
