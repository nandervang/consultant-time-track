import { useState, useEffect, useCallback, useRef } from 'react';
import { PingTarget, PingResult, PingSettings, UptimeStats } from '@/types/ping';

const DEFAULT_SETTINGS: PingSettings = {
  interval: 5, // 5 minutes
  timeout: 10, // 10 seconds
  retries: 3,
  enabled: true,
};

export function usePingMonitor() {
  const [targets, setTargets] = useState<PingTarget[]>([]);
  const [results, setResults] = useState<PingResult[]>([]);
  const [settings, setSettings] = useState<PingSettings>(DEFAULT_SETTINGS);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTargets = localStorage.getItem('ping-targets');
    const savedResults = localStorage.getItem('ping-results');
    const savedSettings = localStorage.getItem('ping-settings');

    if (savedTargets) {
      setTargets(JSON.parse(savedTargets));
    }
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    }
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ping-targets', JSON.stringify(targets));
  }, [targets]);

  useEffect(() => {
    localStorage.setItem('ping-results', JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem('ping-settings', JSON.stringify(settings));
  }, [settings]);

  // Ping function using fetch with timeout
  const pingUrl = useCallback(async (url: string, timeout: number): Promise<{ responseTime: number; status: 'success' | 'failure' | 'timeout'; statusCode?: number; error?: string }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

    try {
      const startTime = performance.now();
      
      // Use a proxy or CORS-enabled ping endpoint for real production
      // For now, we'll use fetch with no-cors mode which has limitations
      await fetch(url, {
        method: 'GET',
        mode: 'no-cors', // This limits what we can check but avoids CORS issues
        signal: controller.signal,
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      clearTimeout(timeoutId);

      // With no-cors mode, we can't read the actual status
      // So we consider it successful if no error was thrown
      return {
        responseTime,
        status: 'success',
        statusCode: 200, // We can't read the actual status with no-cors
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            responseTime: timeout * 1000,
            status: 'timeout',
            error: 'Request timed out',
          };
        }
        return {
          responseTime: 0,
          status: 'failure',
          error: error.message,
        };
      }
      
      return {
        responseTime: 0,
        status: 'failure',
        error: 'Unknown error',
      };
    }
  }, []);

  // Execute ping for a target
  const pingTarget = useCallback(async (target: PingTarget): Promise<void> => {
    if (!target.enabled) return;

    let lastError: string | undefined;
    let bestResult: { responseTime: number; status: 'success' | 'failure' | 'timeout'; statusCode?: number; error?: string } | null = null;

    // Try with retries
    for (let i = 0; i <= settings.retries; i++) {
      const result = await pingUrl(target.url, settings.timeout);
      
      if (result.status === 'success') {
        bestResult = result;
        break;
      } else {
        lastError = result.error;
        bestResult = result;
        
        // Wait a bit before retrying
        if (i < settings.retries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (bestResult) {
      const pingResult: PingResult = {
        id: crypto.randomUUID(),
        targetId: target.id,
        timestamp: new Date().toISOString(),
        responseTime: bestResult.responseTime,
        status: bestResult.status,
        statusCode: bestResult.statusCode,
        error: lastError,
      };

      setResults(prev => {
        // Keep only last 1000 results per target to avoid memory issues
        const filtered = prev.filter(r => r.targetId !== target.id).slice(-999);
        return [...filtered, pingResult];
      });
    }
  }, [pingUrl, settings.retries, settings.timeout]);

  // Execute ping for all enabled targets
  const pingAllTargets = useCallback(async (): Promise<void> => {
    const enabledTargets = targets.filter(target => target.enabled);
    
    // Ping all targets in parallel
    await Promise.all(enabledTargets.map(target => pingTarget(target)));
  }, [targets, pingTarget]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return;

    setIsMonitoring(true);
    
    // Initial ping
    pingAllTargets();
    
    // Set up interval
    intervalRef.current = setInterval(() => {
      pingAllTargets();
    }, settings.interval * 60 * 1000); // Convert minutes to milliseconds
  }, [pingAllTargets, settings.interval]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  // Restart monitoring when settings change
  useEffect(() => {
    if (isMonitoring) {
      stopMonitoring();
      startMonitoring();
    }
  }, [settings.interval, isMonitoring, startMonitoring, stopMonitoring]);

  // Auto-start monitoring if enabled
  useEffect(() => {
    if (settings.enabled && targets.length > 0 && !isMonitoring) {
      startMonitoring();
    } else if (!settings.enabled && isMonitoring) {
      stopMonitoring();
    }
  }, [settings.enabled, targets.length, isMonitoring, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Calculate uptime statistics
  const getUptimeStats = useCallback((targetId: string): UptimeStats => {
    const targetResults = results.filter(r => r.targetId === targetId);
    const now = new Date();
    
    const calculateUptime = (hours: number): number => {
      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
      const relevantResults = targetResults.filter(r => new Date(r.timestamp) >= cutoff);
      
      if (relevantResults.length === 0) return 0;
      
      const successCount = relevantResults.filter(r => r.status === 'success').length;
      return (successCount / relevantResults.length) * 100;
    };

    const recentResults = targetResults.slice(-10);
    const avgResponseTime = recentResults.length > 0
      ? recentResults
          .filter(r => r.responseTime !== null && r.status === 'success')
          .reduce((sum, r) => sum + (r.responseTime || 0), 0) / recentResults.filter(r => r.status === 'success').length
      : 0;

    const lastResult = targetResults[targetResults.length - 1];
    const status: 'up' | 'down' | 'unknown' = lastResult 
      ? lastResult.status === 'success' ? 'up' : 'down'
      : 'unknown';

    return {
      targetId,
      uptime24h: calculateUptime(24),
      uptime7d: calculateUptime(24 * 7),
      uptime30d: calculateUptime(24 * 30),
      avgResponseTime: isNaN(avgResponseTime) ? 0 : avgResponseTime,
      lastCheck: lastResult?.timestamp || '',
      status,
    };
  }, [results]);

  // CRUD operations for targets
  const addTarget = useCallback((target: Omit<PingTarget, 'id' | 'createdAt'>): void => {
    const newTarget: PingTarget = {
      ...target,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTargets(prev => [...prev, newTarget]);
  }, []);

  const updateTarget = useCallback((id: string, updates: Partial<PingTarget>): void => {
    setTargets(prev => prev.map(target => 
      target.id === id ? { ...target, ...updates } : target
    ));
  }, []);

  const removeTarget = useCallback((id: string): void => {
    setTargets(prev => prev.filter(target => target.id !== id));
    setResults(prev => prev.filter(result => result.targetId !== id));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<PingSettings>): void => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const manualPing = useCallback(async (targetId: string): Promise<void> => {
    const target = targets.find(t => t.id === targetId);
    if (target) {
      await pingTarget(target);
    }
  }, [targets, pingTarget]);

  return {
    targets,
    results,
    settings,
    isMonitoring,
    addTarget,
    updateTarget,
    removeTarget,
    updateSettings,
    startMonitoring,
    stopMonitoring,
    manualPing,
    pingAllTargets,
    getUptimeStats,
  };
}
