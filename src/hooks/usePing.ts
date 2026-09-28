import { useState, useEffect, useCallback, useRef } from 'react';

export type PingStatus = 'fast' | 'moderate' | 'slow' | 'offline';

export interface UsePingOptions {
  /**
   * Interval in milliseconds between ping checks (default: 6000ms, between 5s and 10s)
   */
  interval?: number;
  /**
   * Lightweight endpoint to query (default: '/api/ping')
   */
  endpoint?: string;
  /**
   * Request timeout in milliseconds (default: 4000ms)
   */
  timeout?: number;
}

export interface UsePingResult {
  ping: number | null;
  status: PingStatus;
  displayText: string;
  badgeClass: string;
  dotClass: string;
  textClass: string;
  isOnline: boolean;
  refreshPing: () => Promise<void>;
}

export function usePing({
  interval = 6000,
  endpoint = '/api/ping',
  timeout = 4000
}: UsePingOptions = {}): UsePingResult {
  const [ping, setPing] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const isMountedRef = useRef<boolean>(true);

  const measurePing = useCallback(async () => {
    // 1. Check navigator online state first
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (isMountedRef.current) {
        setIsOnline(false);
        setPing(null);
      }
      return;
    }

    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      // Send lightweight fetch request with cache: 'no-store'
      const response = await fetch(`${endpoint}?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Attempt fallback to /favicon.ico in case endpoint failed
        const fallbackStart = performance.now();
        const fbRes = await fetch(`/favicon.ico?_t=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-store'
        });
        if (!fbRes.ok) throw new Error(`HTTP ${response.status}`);
        const fallbackLatency = Math.round(performance.now() - fallbackStart);
        if (isMountedRef.current) {
          setPing(fallbackLatency);
          setIsOnline(true);
        }
        return;
      }

      const latency = Math.round(performance.now() - start);
      if (isMountedRef.current) {
        setPing(latency);
        setIsOnline(true);
      }
    } catch {
      clearTimeout(timeoutId);
      if (isMountedRef.current) {
        setPing(null);
        setIsOnline(false);
      }
    }
  }, [endpoint, timeout]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial ping measurement immediately on mount
    measurePing();

    // Periodic background latency checks (every 6 seconds)
    const intervalId = setInterval(() => {
      measurePing();
    }, interval);

    // Network connection event listeners
    const handleOnline = () => {
      setIsOnline(true);
      measurePing();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setPing(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [measurePing, interval]);

  // Compute status and styling classes based on latency:
  // EXCELLENT (< 80ms):
  //   Color: Vibrant Emerald Green (text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)])
  //   Pulse Dot: Emerald Green (bg-emerald-400)
  // MODERATE (80ms - 180ms):
  //   Color: Amber Yellow (text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.3)])
  //   Pulse Dot: Amber Yellow (bg-amber-400)
  // POOR / HIGH LATENCY (> 180ms or null / offline):
  //   Color: Alert Red (text-red-400 bg-red-500/15 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)])
  //   Pulse Dot: Red (bg-red-500)
  let status: PingStatus = 'offline';
  let displayText = 'Offline';
  let badgeClass = 'text-red-400 bg-red-500/15 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
  let dotClass = 'bg-red-500';
  let textClass = 'text-red-400';

  if (!isOnline || ping === null) {
    status = 'offline';
    displayText = 'Offline';
    badgeClass = 'text-red-400 bg-red-500/15 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    dotClass = 'bg-red-500';
    textClass = 'text-red-400';
  } else if (ping < 80) {
    status = 'fast';
    displayText = `${ping}ms`;
    badgeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    dotClass = 'bg-emerald-400';
    textClass = 'text-emerald-400';
  } else if (ping <= 180) {
    status = 'moderate';
    displayText = `${ping}ms`;
    badgeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
    dotClass = 'bg-amber-400';
    textClass = 'text-amber-400';
  } else {
    status = 'slow';
    displayText = `${ping}ms`;
    badgeClass = 'text-red-400 bg-red-500/15 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    dotClass = 'bg-red-500';
    textClass = 'text-red-400';
  }

  return {
    ping,
    status,
    displayText,
    badgeClass,
    dotClass,
    textClass,
    isOnline,
    refreshPing: measurePing
  };
}
