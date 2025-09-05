export interface PingTarget {
  id: string;
  user_id: string;
  name: string;
  url: string;
  type?: 'http' | 'mongodb'; // Type of target
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number; // seconds
  expected_status?: number[];
  expected_text?: string;
  mongodb_config?: {
    database?: string;
    collection?: string;
    operation?: 'ping' | 'count' | 'find';
    query?: string; // JSON string for query
  };
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PingResult {
  id: string;
  target_id: string;
  user_id: string;
  timestamp: string;
  response_time: number | null; // milliseconds
  status: 'success' | 'failure' | 'timeout';
  status_code?: number;
  response_text?: string;
  response_size?: number;
  error_message?: string;
  created_at: string;
}

export interface PingSettings {
  id?: string;
  user_id: string;
  interval_minutes: number;
  timeout_seconds: number;
  retries: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UptimeStats {
  target_id: string;
  target_name: string;
  url: string;
  user_id: string;
  total_checks: number;
  successful_checks: number;
  uptime_percentage: number;
  avg_response_time: number;
  last_check: string;
  current_status: 'success' | 'failure' | 'timeout';
}
