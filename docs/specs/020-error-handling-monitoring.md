# Error Handling & Monitoring Guide

**Spec ID:** 020-A  
**Status:** Comprehensive  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

This document provides comprehensive guidelines for error handling, logging, monitoring, and debugging in the Consultant Time Tracking application. The approach ensures robust error management, comprehensive observability, and efficient debugging capabilities across the entire application stack.

## Error Handling Architecture

### Error Handling Philosophy

```text
Error Handling Strategy
├── Prevention (Proactive)
│   ├── Input Validation
│   ├── Type Safety (TypeScript)
│   ├── Schema Validation
│   └── Testing Coverage
│
├── Detection (Reactive)
│   ├── Error Boundaries
│   ├── Global Error Handlers
│   ├── API Error Interceptors
│   └── Monitoring Alerts
│
├── Recovery (Resilient)
│   ├── Graceful Degradation
│   ├── Retry Mechanisms
│   ├── Fallback UI States
│   └── Data Recovery
│
└── Learning (Continuous)
    ├── Error Analytics
    ├── Performance Monitoring
    ├── User Feedback
    └── System Optimization
```

### Error Classification

**Error Severity Levels:**

- **Critical:** System unavailable, data loss, security breach
- **High:** Core functionality broken, multiple users affected
- **Medium:** Feature malfunction, limited user impact
- **Low:** Minor UI issues, cosmetic problems
- **Info:** User actions, system events, debug information

## Frontend Error Handling

### Global Error Boundary

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '@/utils/errorLogger';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    logError(error, {
      context: 'React Error Boundary',
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to external service (Sentry, LogRocket, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Enhanced Error Fallback Component
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
}) => {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.662-.833-2.464 0L4.732 8.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Something went wrong
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            We've encountered an unexpected error. Our team has been notified and is working on a fix.
          </p>

          {isDevelopment && error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                Error Details (Development Only)
              </summary>
              <div className="mt-2 p-4 bg-gray-100 rounded-md">
                <pre className="text-xs text-red-600 whitespace-pre-wrap">
                  {error.name}: {error.message}
                  {'\n\n'}
                  {error.stack}
                  {errorInfo?.componentStack && (
                    '\n\nComponent Stack:' + errorInfo.componentStack
                  )}
                </pre>
              </div>
            </details>
          )}

          <div className="mt-6 flex space-x-4 justify-center">
            <button
              onClick={resetError}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go Home
            </button>
          </div>

          <div className="mt-4">
            <a
              href="mailto:support@yourapp.com?subject=Error%20Report"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Report this issue
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### API Error Handling

```typescript
// src/utils/apiErrorHandler.ts
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ApiError {
  type: ErrorType;
  message: string;
  details?: any;
  statusCode?: number;
  retryable: boolean;
  timestamp: string;
}

export class ApiErrorHandler {
  static createError(
    type: ErrorType,
    message: string,
    statusCode?: number,
    details?: any
  ): ApiError {
    return {
      type,
      message,
      details,
      statusCode,
      retryable: this.isRetryable(type, statusCode),
      timestamp: new Date().toISOString(),
    };
  }

  static isRetryable(type: ErrorType, statusCode?: number): boolean {
    if (type === ErrorType.NETWORK_ERROR) return true;
    if (type === ErrorType.RATE_LIMIT_ERROR) return true;
    if (statusCode && [408, 429, 500, 502, 503, 504].includes(statusCode)) {
      return true;
    }
    return false;
  }

  static fromSupabaseError(error: any): ApiError {
    const statusCode = error.status || error.code;
    let type: ErrorType;
    let message: string;

    switch (statusCode) {
      case 401:
        type = ErrorType.AUTHENTICATION_ERROR;
        message = 'Please sign in to continue';
        break;
      case 403:
        type = ErrorType.AUTHORIZATION_ERROR;
        message = 'You do not have permission to perform this action';
        break;
      case 404:
        type = ErrorType.NOT_FOUND_ERROR;
        message = 'The requested resource was not found';
        break;
      case 422:
        type = ErrorType.VALIDATION_ERROR;
        message = error.message || 'Invalid data provided';
        break;
      case 429:
        type = ErrorType.RATE_LIMIT_ERROR;
        message = 'Too many requests. Please try again later';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        type = ErrorType.SERVER_ERROR;
        message = 'Server error. Please try again later';
        break;
      default:
        if (!navigator.onLine) {
          type = ErrorType.NETWORK_ERROR;
          message = 'No internet connection. Please check your network';
        } else {
          type = ErrorType.UNKNOWN_ERROR;
          message = error.message || 'An unexpected error occurred';
        }
    }

    return this.createError(type, message, statusCode, error);
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    onRetry?: (attempt: number, error: ApiError) => void
  ): Promise<T> {
    let lastError: ApiError;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error 
          ? this.fromSupabaseError(error) 
          : error as ApiError;

        // Don't retry if not retryable or last attempt
        if (!lastError.retryable || attempt === maxAttempts - 1) {
          break;
        }

        // Call retry callback
        onRetry?.(attempt + 1, lastError);

        // Wait before retry
        const delay = this.getRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Global error interceptor for Supabase
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = ApiErrorHandler.fromSupabaseError(event.reason);
    logError(new Error(error.message), {
      type: 'unhandled_promise_rejection',
      originalError: event.reason,
      ...error,
    });

    // Prevent the default browser behavior
    event.preventDefault();
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logError(event.error, {
      type: 'uncaught_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
};
```

### Custom Hook Error Handling

```typescript
// src/hooks/useErrorHandler.ts
import { useState, useCallback } from 'react';
import { ApiError, ApiErrorHandler } from '@/utils/apiErrorHandler';
import { useToast } from '@/contexts/ToastContext';

interface UseErrorHandlerResult {
  error: ApiError | null;
  isRetrying: boolean;
  retryCount: number;
  clearError: () => void;
  handleError: (error: unknown) => void;
  withErrorHandling: <T>(operation: () => Promise<T>) => Promise<T | null>;
}

export const useErrorHandler = (
  maxRetries: number = 3,
  showToast: boolean = true
): UseErrorHandlerResult => {
  const [error, setError] = useState<ApiError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { showToast: displayToast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  const handleError = useCallback((rawError: unknown) => {
    const apiError = rawError instanceof Error
      ? ApiErrorHandler.fromSupabaseError(rawError)
      : rawError as ApiError;

    setError(apiError);

    if (showToast) {
      displayToast({
        type: 'error',
        title: 'Error',
        message: apiError.message,
      });
    }

    // Log error for monitoring
    logError(rawError instanceof Error ? rawError : new Error(apiError.message), {
      apiError,
      retryCount,
    });
  }, [showToast, displayToast, retryCount]);

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setIsRetrying(false);
      clearError();

      const result = await ApiErrorHandler.withRetry(
        operation,
        maxRetries,
        (attempt, error) => {
          setIsRetrying(true);
          setRetryCount(attempt);
          
          if (showToast) {
            displayToast({
              type: 'warning',
              title: 'Retrying',
              message: `Attempt ${attempt} of ${maxRetries}`,
            });
          }
        }
      );

      setIsRetrying(false);
      setRetryCount(0);
      return result;

    } catch (error) {
      setIsRetrying(false);
      handleError(error);
      return null;
    }
  }, [maxRetries, showToast, displayToast, clearError, handleError]);

  return {
    error,
    isRetrying,
    retryCount,
    clearError,
    handleError,
    withErrorHandling,
  };
};

// Enhanced hook for specific API operations
export const useApiOperation = <T>(
  operation: () => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
    enableRetry?: boolean;
    showToast?: boolean;
  } = {}
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const { withErrorHandling, error, isRetrying, clearError } = useErrorHandler(
    options.enableRetry ? 3 : 1,
    options.showToast ?? true
  );

  const execute = useCallback(async () => {
    setIsLoading(true);
    
    const result = await withErrorHandling(operation);
    
    if (result !== null) {
      setData(result);
      options.onSuccess?.(result);
    } else if (error) {
      options.onError?.(error);
    }
    
    setIsLoading(false);
  }, [operation, withErrorHandling, options, error]);

  return {
    execute,
    data,
    isLoading: isLoading || isRetrying,
    error,
    clearError,
  };
};
```

## Logging System

### Structured Logging

```typescript
// src/utils/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private logLevel: LogLevel;
  private sessionId: string;
  private userId?: string;
  private logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  constructor() {
    this.logLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;
    this.sessionId = this.generateSessionId();
    this.setupPeriodicFlush();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: this.userId,
      sessionId: this.sessionId,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry);
    
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer = this.logBuffer.slice(-this.MAX_BUFFER_SIZE);
    }

    // Immediate flush for critical errors
    if (entry.level === LogLevel.CRITICAL) {
      this.flushLogs();
    }
  }

  private async flushLogs() {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Send logs to monitoring service
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs }),
      });
    } catch (error) {
      // If sending fails, put logs back in buffer
      this.logBuffer.unshift(...logs);
      console.error('Failed to send logs:', error);
    }
  }

  private setupPeriodicFlush() {
    // Flush logs every 30 seconds
    setInterval(() => {
      this.flushLogs();
    }, 30000);

    // Flush logs when page is about to unload
    window.addEventListener('beforeunload', () => {
      this.flushLogs();
    });
  }

  debug(message: string, context?: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, metadata);
    this.addToBuffer(entry);

    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${context ? `[${context}] ` : ''}${message}`, metadata);
    }
  }

  info(message: string, context?: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.createLogEntry(LogLevel.INFO, message, context, metadata);
    this.addToBuffer(entry);

    if (import.meta.env.DEV) {
      console.info(`[INFO] ${context ? `[${context}] ` : ''}${message}`, metadata);
    }
  }

  warn(message: string, context?: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.createLogEntry(LogLevel.WARN, message, context, metadata);
    this.addToBuffer(entry);

    console.warn(`[WARN] ${context ? `[${context}] ` : ''}${message}`, metadata);
  }

  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry = this.createLogEntry(LogLevel.ERROR, message, context, metadata, error);
    this.addToBuffer(entry);

    console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, error, metadata);
  }

  critical(message: string, error?: Error, context?: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, context, metadata, error);
    this.addToBuffer(entry);

    console.error(`[CRITICAL] ${context ? `[${context}] ` : ''}${message}`, error, metadata);

    // Send immediate alert for critical errors
    this.sendCriticalAlert(entry);
  }

  private async sendCriticalAlert(entry: LogEntry) {
    try {
      await fetch('/api/alerts/critical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 20): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Search logs by criteria
  searchLogs(criteria: {
    level?: LogLevel;
    context?: string;
    userId?: string;
    since?: Date;
  }): LogEntry[] {
    return this.logBuffer.filter(entry => {
      if (criteria.level !== undefined && entry.level < criteria.level) {
        return false;
      }
      if (criteria.context && entry.context !== criteria.context) {
        return false;
      }
      if (criteria.userId && entry.userId !== criteria.userId) {
        return false;
      }
      if (criteria.since && new Date(entry.timestamp) < criteria.since) {
        return false;
      }
      return true;
    });
  }
}

export const logger = new Logger();

// Convenience function for error logging
export const logError = (
  error: Error | string,
  metadata?: Record<string, any>,
  context?: string
) => {
  if (typeof error === 'string') {
    logger.error(error, undefined, context, metadata);
  } else {
    logger.error(error.message, error, context, metadata);
  }
};
```

### Performance Monitoring

```typescript
// src/utils/performanceMonitor.ts
interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'ratio';
  timestamp: string;
  context?: string;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    this.setupWebVitalsObserver();
    this.setupResourceObserver();
    this.setupNavigationObserver();
  }

  private setupWebVitalsObserver() {
    if (!('PerformanceObserver' in window)) return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        this.recordMetric('LCP', entry.startTime, 'ms', 'web-vitals');
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', lcpObserver);

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        const fid = entry.processingStart - entry.startTime;
        this.recordMetric('FID', fid, 'ms', 'web-vitals');
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', fidObserver);

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.recordMetric('CLS', clsValue, 'ratio', 'web-vitals');
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', clsObserver);
  }

  private setupResourceObserver() {
    if (!('PerformanceObserver' in window)) return;

    const resourceObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          this.recordMetric(
            'API_Response_Time',
            entry.duration,
            'ms',
            'api',
            { endpoint: this.extractEndpoint(entry.name) }
          );
        }
      });
    });
    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', resourceObserver);
  }

  private setupNavigationObserver() {
    if (!('PerformanceObserver' in window)) return;

    const navigationObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        const nav = entry as PerformanceNavigationTiming;
        
        this.recordMetric('DNS_Lookup', nav.domainLookupEnd - nav.domainLookupStart, 'ms', 'navigation');
        this.recordMetric('TCP_Connect', nav.connectEnd - nav.connectStart, 'ms', 'navigation');
        this.recordMetric('Server_Response', nav.responseEnd - nav.requestStart, 'ms', 'navigation');
        this.recordMetric('DOM_Content_Loaded', nav.domContentLoadedEventEnd - nav.navigationStart, 'ms', 'navigation');
        this.recordMetric('Page_Load', nav.loadEventEnd - nav.navigationStart, 'ms', 'navigation');
      });
    });
    navigationObserver.observe({ entryTypes: ['navigation'] });
    this.observers.set('navigation', navigationObserver);
  }

  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return 'unknown';
    }
  }

  recordMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'],
    context?: string,
    tags?: Record<string, string>
  ) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      context,
      tags,
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log significant performance issues
    if (this.isPerformanceIssue(metric)) {
      logger.warn(`Performance issue detected: ${name} = ${value}${unit}`, 'performance', {
        metric,
      });
    }

    // Send to analytics
    this.sendMetricToAnalytics(metric);
  }

  private isPerformanceIssue(metric: PerformanceMetric): boolean {
    const thresholds = {
      LCP: 2500,      // 2.5 seconds
      FID: 100,       // 100ms
      CLS: 0.1,       // 0.1 ratio
      API_Response_Time: 5000, // 5 seconds
      Page_Load: 3000, // 3 seconds
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    return threshold !== undefined && metric.value > threshold;
  }

  private async sendMetricToAnalytics(metric: PerformanceMetric) {
    try {
      // Send to Google Analytics
      if (window.gtag) {
        window.gtag('event', 'performance_metric', {
          custom_map: {
            metric_name: metric.name,
            metric_value: metric.value,
            metric_unit: metric.unit,
          },
        });
      }

      // Send to custom analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      logger.debug('Failed to send performance metric', 'performance', { error, metric });
    }
  }

  // Measure custom operations
  measure<T>(name: string, operation: () => T | Promise<T>, context?: string): T | Promise<T> {
    const start = performance.now();

    const result = operation();

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        this.recordMetric(name, duration, 'ms', context);
      });
    } else {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', context);
      return result;
    }
  }

  // Get performance summary
  getSummary(since?: Date): {
    averages: Record<string, number>;
    counts: Record<string, number>;
    slowest: PerformanceMetric[];
  } {
    const filteredMetrics = since 
      ? this.metrics.filter(m => new Date(m.timestamp) >= since)
      : this.metrics;

    const averages: Record<string, number> = {};
    const counts: Record<string, number> = {};

    filteredMetrics.forEach(metric => {
      if (!averages[metric.name]) {
        averages[metric.name] = 0;
        counts[metric.name] = 0;
      }
      averages[metric.name] += metric.value;
      counts[metric.name]++;
    });

    Object.keys(averages).forEach(key => {
      averages[key] /= counts[key];
    });

    const slowest = filteredMetrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return { averages, counts, slowest };
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Convenience function for measuring operations
export const measurePerformance = <T>(
  name: string,
  operation: () => T | Promise<T>,
  context?: string
): T | Promise<T> => {
  return performanceMonitor.measure(name, operation, context);
};
```

## Real-time Monitoring

### System Health Monitoring

```typescript
// src/utils/healthMonitor.ts
interface HealthMetrics {
  connectivity: boolean;
  apiResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  batteryLevel?: number;
  connectionType?: string;
}

class HealthMonitor {
  private isMonitoring = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsHistory: Array<HealthMetrics & { timestamp: string }> = [];

  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.performHealthCheck();
    
    // Check health every minute
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000);

    // Monitor network changes
    window.addEventListener('online', this.handleNetworkChange);
    window.addEventListener('offline', this.handleNetworkChange);

    // Monitor battery if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', this.handleBatteryChange);
        battery.addEventListener('chargingchange', this.handleBatteryChange);
      });
    }
  }

  stop() {
    this.isMonitoring = false;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    window.removeEventListener('online', this.handleNetworkChange);
    window.removeEventListener('offline', this.handleNetworkChange);
  }

  private async performHealthCheck() {
    try {
      const metrics = await this.collectHealthMetrics();
      const entry = {
        ...metrics,
        timestamp: new Date().toISOString(),
      };

      this.metricsHistory.push(entry);
      
      // Keep only last 100 entries
      if (this.metricsHistory.length > 100) {
        this.metricsHistory = this.metricsHistory.slice(-100);
      }

      // Check for health issues
      this.analyzeHealth(metrics);

      // Send metrics to monitoring service
      await this.sendHealthMetrics(entry);

    } catch (error) {
      logger.error('Health check failed', error instanceof Error ? error : new Error(String(error)), 'health-monitor');
    }
  }

  private async collectHealthMetrics(): Promise<HealthMetrics> {
    const metrics: HealthMetrics = {
      connectivity: navigator.onLine,
      apiResponseTime: 0,
      errorRate: 0,
      memoryUsage: 0,
    };

    // Measure API response time
    const apiStart = performance.now();
    try {
      await fetch('/api/health', { method: 'HEAD' });
      metrics.apiResponseTime = performance.now() - apiStart;
    } catch {
      metrics.apiResponseTime = -1; // Indicates failure
    }

    // Get memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }

    // Get connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      metrics.connectionType = connection.effectiveType;
    }

    // Get battery level if available
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        metrics.batteryLevel = battery.level;
      } catch {
        // Battery API not supported or denied
      }
    }

    // Calculate error rate from recent logs
    const recentLogs = logger.searchLogs({
      level: LogLevel.ERROR,
      since: new Date(Date.now() - 60000), // Last minute
    });
    const totalLogs = logger.searchLogs({
      since: new Date(Date.now() - 60000),
    });
    metrics.errorRate = totalLogs.length > 0 ? recentLogs.length / totalLogs.length : 0;

    return metrics;
  }

  private analyzeHealth(metrics: HealthMetrics) {
    // Check connectivity
    if (!metrics.connectivity) {
      logger.warn('Device is offline', 'health-monitor');
    }

    // Check API response time
    if (metrics.apiResponseTime > 5000) {
      logger.warn(`Slow API response: ${metrics.apiResponseTime}ms`, 'health-monitor');
    } else if (metrics.apiResponseTime === -1) {
      logger.error('API health check failed', undefined, 'health-monitor');
    }

    // Check error rate
    if (metrics.errorRate > 0.1) { // More than 10% errors
      logger.warn(`High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`, 'health-monitor');
    }

    // Check memory usage
    if (metrics.memoryUsage > 0.9) { // More than 90% memory used
      logger.warn(`High memory usage: ${(metrics.memoryUsage * 100).toFixed(2)}%`, 'health-monitor');
    }

    // Check battery level
    if (metrics.batteryLevel !== undefined && metrics.batteryLevel < 0.1) {
      logger.info(`Low battery: ${(metrics.batteryLevel * 100).toFixed(0)}%`, 'health-monitor');
    }
  }

  private async sendHealthMetrics(metrics: HealthMetrics & { timestamp: string }) {
    try {
      await fetch('/api/health/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      });
    } catch (error) {
      logger.debug('Failed to send health metrics', 'health-monitor', { error });
    }
  }

  private handleNetworkChange = () => {
    const isOnline = navigator.onLine;
    logger.info(`Network status changed: ${isOnline ? 'online' : 'offline'}`, 'health-monitor');
    
    if (!isOnline) {
      // Handle offline mode
      this.enableOfflineMode();
    } else {
      // Handle coming back online
      this.disableOfflineMode();
    }
  };

  private handleBatteryChange = (event: Event) => {
    const battery = event.target as any;
    logger.debug('Battery status changed', 'health-monitor', {
      level: battery.level,
      charging: battery.charging,
    });
  };

  private enableOfflineMode() {
    // Show offline indicator
    document.body.classList.add('offline');
    
    // Cache current state
    localStorage.setItem('offline_mode', 'true');
    
    logger.info('Offline mode enabled', 'health-monitor');
  }

  private disableOfflineMode() {
    // Hide offline indicator
    document.body.classList.remove('offline');
    
    // Clear offline flag
    localStorage.removeItem('offline_mode');
    
    // Sync any pending data
    this.syncPendingData();
    
    logger.info('Offline mode disabled', 'health-monitor');
  }

  private async syncPendingData() {
    // Implement data synchronization logic
    logger.info('Syncing pending data...', 'health-monitor');
  }

  getHealthSummary(): {
    current: HealthMetrics;
    trend: 'improving' | 'stable' | 'degrading';
    issues: string[];
  } {
    const current = this.metricsHistory[this.metricsHistory.length - 1];
    const previous = this.metricsHistory[this.metricsHistory.length - 2];
    
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    const issues: string[] = [];

    if (current && previous) {
      const responseTimeDiff = current.apiResponseTime - previous.apiResponseTime;
      const errorRateDiff = current.errorRate - previous.errorRate;
      
      if (responseTimeDiff > 1000 || errorRateDiff > 0.05) {
        trend = 'degrading';
      } else if (responseTimeDiff < -500 || errorRateDiff < -0.02) {
        trend = 'improving';
      }
    }

    if (current) {
      if (!current.connectivity) issues.push('No internet connection');
      if (current.apiResponseTime > 5000) issues.push('Slow API responses');
      if (current.errorRate > 0.1) issues.push('High error rate');
      if (current.memoryUsage > 0.9) issues.push('High memory usage');
    }

    return {
      current: current || {
        connectivity: false,
        apiResponseTime: 0,
        errorRate: 0,
        memoryUsage: 0,
      },
      trend,
      issues,
    };
  }
}

export const healthMonitor = new HealthMonitor();
```

## Debugging Tools

### Development Debug Panel

```typescript
// src/components/DebugPanel.tsx
import React, { useState, useEffect } from 'react';
import { logger, LogLevel } from '@/utils/logger';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { healthMonitor } from '@/utils/healthMonitor';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'performance' | 'health'>('logs');
  const [logs, setLogs] = useState(logger.getRecentLogs());
  const [performanceData, setPerformanceData] = useState(performanceMonitor.getSummary());
  const [healthData, setHealthData] = useState(healthMonitor.getHealthSummary());

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setLogs(logger.getRecentLogs());
      setPerformanceData(performanceMonitor.getSummary());
      setHealthData(healthMonitor.getHealthSummary());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !import.meta.env.DEV) return null;

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return 'text-gray-500';
      case LogLevel.INFO: return 'text-blue-500';
      case LogLevel.WARN: return 'text-yellow-500';
      case LogLevel.ERROR: return 'text-red-500';
      case LogLevel.CRITICAL: return 'text-red-700 font-bold';
    }
  };

  const getLevelName = (level: LogLevel) => {
    return LogLevel[level];
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t shadow-lg" style={{ height: '60vh' }}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Debug Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b">
          {(['logs', 'performance', 'health'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-auto" style={{ height: 'calc(60vh - 120px)' }}>
          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => logger.debug('Test debug message', 'debug-panel')}
                  className="px-2 py-1 text-xs bg-gray-200 rounded"
                >
                  Test Debug
                </button>
                <button
                  onClick={() => logger.error('Test error message', new Error('Test error'), 'debug-panel')}
                  className="px-2 py-1 text-xs bg-red-200 rounded"
                >
                  Test Error
                </button>
                <button
                  onClick={() => setLogs([])}
                  className="px-2 py-1 text-xs bg-yellow-200 rounded"
                >
                  Clear
                </button>
              </div>
              
              {logs.map((log, index) => (
                <div key={index} className="text-xs font-mono border-l-2 border-gray-200 pl-2">
                  <div className="flex items-center gap-2">
                    <span className={getLevelColor(log.level)}>
                      [{getLevelName(log.level)}]
                    </span>
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {log.context && (
                      <span className="text-blue-600">[{log.context}]</span>
                    )}
                  </div>
                  <div className="mt-1">{log.message}</div>
                  {log.metadata && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-gray-500">Metadata</summary>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.error && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-red-500">Error Details</summary>
                      <pre className="mt-1 p-2 bg-red-50 rounded text-xs overflow-auto">
                        {log.error.stack || `${log.error.name}: ${log.error.message}`}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Average Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(performanceData.averages).map(([metric, value]) => (
                    <div key={metric} className="p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">{metric}</div>
                      <div className="text-lg">{value.toFixed(2)}ms</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Slowest Operations</h3>
                <div className="space-y-2">
                  {performanceData.slowest.slice(0, 5).map((metric, index) => (
                    <div key={index} className="flex justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm">{metric.name}</span>
                      <span className="text-sm font-mono">{metric.value.toFixed(2)}{metric.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">System Health</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="text-sm font-medium">Connectivity</div>
                    <div className={`text-lg ${healthData.current.connectivity ? 'text-green-600' : 'text-red-600'}`}>
                      {healthData.current.connectivity ? 'Online' : 'Offline'}
                    </div>
                  </div>
                  
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="text-sm font-medium">API Response</div>
                    <div className="text-lg">{healthData.current.apiResponseTime.toFixed(0)}ms</div>
                  </div>
                  
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="text-sm font-medium">Error Rate</div>
                    <div className="text-lg">{(healthData.current.errorRate * 100).toFixed(1)}%</div>
                  </div>
                  
                  <div className="p-2 bg-gray-50 rounded">
                    <div className="text-sm font-medium">Memory Usage</div>
                    <div className="text-lg">{(healthData.current.memoryUsage * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {healthData.issues.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Health Issues</h3>
                  <div className="space-y-1">
                    {healthData.issues.map((issue, index) => (
                      <div key={index} className="p-2 bg-red-50 text-red-700 rounded">
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-2 bg-gray-50 rounded">
                <div className="text-sm font-medium">Trend</div>
                <div className={`text-lg capitalize ${
                  healthData.trend === 'improving' ? 'text-green-600' :
                  healthData.trend === 'degrading' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {healthData.trend}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook to enable debug panel
export const useDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+D to toggle debug panel
      if (event.ctrlKey && event.shiftKey && event.key === 'D' && import.meta.env.DEV) {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
};
```

## Production Monitoring Setup

### Monitoring Dashboard Setup

```typescript
// scripts/setup-monitoring.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setupMonitoringTables() {
  // Create error logs table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS error_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        context VARCHAR(100),
        user_id UUID REFERENCES auth.users(id),
        session_id VARCHAR(100),
        metadata JSONB,
        error_details JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
      CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_error_logs_context ON error_logs(context);
    `
  });

  // Create performance metrics table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        value FLOAT NOT NULL,
        unit VARCHAR(20) NOT NULL,
        context VARCHAR(100),
        tags JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(name);
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
    `
  });

  // Create health metrics table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS health_metrics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        connectivity BOOLEAN NOT NULL,
        api_response_time FLOAT NOT NULL,
        error_rate FLOAT NOT NULL,
        memory_usage FLOAT NOT NULL,
        battery_level FLOAT,
        connection_type VARCHAR(50),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_health_metrics_timestamp ON health_metrics(timestamp);
    `
  });

  console.log('✅ Monitoring tables created successfully');
}

async function setupMonitoringViews() {
  // Error summary view
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE VIEW error_summary AS
      SELECT 
        level,
        context,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as affected_users,
        MIN(timestamp) as first_seen,
        MAX(timestamp) as last_seen
      FROM error_logs 
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      GROUP BY level, context
      ORDER BY count DESC;
    `
  });

  // Performance summary view
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE VIEW performance_summary AS
      SELECT 
        name,
        context,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) as p95_value,
        COUNT(*) as sample_count
      FROM performance_metrics 
      WHERE timestamp >= NOW() - INTERVAL '1 hour'
      GROUP BY name, context
      ORDER BY avg_value DESC;
    `
  });

  console.log('✅ Monitoring views created successfully');
}

async function setupAlertFunctions() {
  // Function to detect critical errors
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION detect_critical_errors()
      RETURNS TABLE(alert_type TEXT, message TEXT, severity INT) AS $$
      BEGIN
        -- High error rate alert
        RETURN QUERY
        SELECT 
          'high_error_rate'::TEXT,
          'Error rate exceeded threshold: ' || COUNT(*)::TEXT || ' errors in last 5 minutes',
          3::INT
        FROM error_logs 
        WHERE timestamp >= NOW() - INTERVAL '5 minutes'
        AND level IN ('ERROR', 'CRITICAL')
        HAVING COUNT(*) > 10;

        -- Critical error alert
        RETURN QUERY
        SELECT 
          'critical_error'::TEXT,
          'Critical error detected: ' || message,
          4::INT
        FROM error_logs 
        WHERE timestamp >= NOW() - INTERVAL '1 minute'
        AND level = 'CRITICAL'
        LIMIT 1;

        -- Performance degradation alert
        RETURN QUERY
        SELECT 
          'performance_degradation'::TEXT,
          'Performance degraded: ' || name || ' avg ' || AVG(value)::TEXT || unit,
          2::INT
        FROM performance_metrics 
        WHERE timestamp >= NOW() - INTERVAL '5 minutes'
        AND name IN ('LCP', 'API_Response_Time', 'Page_Load')
        GROUP BY name, unit
        HAVING AVG(value) > 5000; -- 5 seconds threshold
      END;
      $$ LANGUAGE plpgsql;
    `
  });

  console.log('✅ Alert functions created successfully');
}

// Run setup
async function main() {
  try {
    await setupMonitoringTables();
    await setupMonitoringViews();
    await setupAlertFunctions();
    console.log('🎉 Monitoring setup completed successfully');
  } catch (error) {
    console.error('❌ Monitoring setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
```

---

This comprehensive error handling and monitoring guide provides robust systems for detecting, logging, and responding to issues in the consultant time tracking application, ensuring high availability and excellent user experience.
