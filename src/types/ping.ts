export interface PingTarget {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  createdAt: string;
}

export interface PingResult {
  id: string;
  targetId: string;
  timestamp: string;
  responseTime: number | null;
  status: 'success' | 'failure' | 'timeout';
  statusCode?: number;
  error?: string;
}

export interface PingSettings {
  interval: number; // in minutes
  timeout: number; // in seconds
  retries: number;
  enabled: boolean;
}

export interface UptimeStats {
  targetId: string;
  uptime24h: number; // percentage
  uptime7d: number; // percentage
  uptime30d: number; // percentage
  avgResponseTime: number; // milliseconds
  lastCheck: string;
  status: 'up' | 'down' | 'unknown';
}
