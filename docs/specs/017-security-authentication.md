# Security & Authentication Guide

**Spec ID:** 017-A  
**Status:** Comprehensive  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

This document provides comprehensive security and authentication guidelines for the Consultant Time Tracking application. The system implements multiple layers of security including Supabase authentication, Row Level Security (RLS), client-side encryption, and comprehensive data protection measures.

## Security Architecture

### Multi-Layer Security Model

```text
Application Security Layers
├── Frontend Security
│   ├── Input Validation & Sanitization
│   ├── XSS Protection
│   ├── Client-side Encryption
│   └── Secure Storage Practices
│
├── Authentication Layer
│   ├── Supabase Auth (JWT Tokens)
│   ├── Session Management
│   ├── Password Security
│   └── Multi-factor Authentication (Future)
│
├── Database Security
│   ├── Row Level Security (RLS)
│   ├── Data Encryption at Rest
│   ├── Secure Connections (TLS)
│   └── Audit Logging
│
└── Infrastructure Security
    ├── HTTPS Enforcement
    ├── Environment Variables
    ├── Secret Management
    └── Network Security
```

## Authentication System

### Supabase Authentication Implementation

**Core Authentication Hook:**

```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with security validation
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session retrieval error:', error);
        handleAuthError(error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Log security event
      if (session) {
        logSecurityEvent('session_restored', {
          userId: session.user.id,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logSecurityEvent('auth_state_change', {
          event,
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        });

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            handleSuccessfulLogin(session);
            break;
          case 'SIGNED_OUT':
            handleLogout();
            break;
          case 'TOKEN_REFRESHED':
            handleTokenRefresh(session);
            break;
          case 'USER_UPDATED':
            handleUserUpdate(session);
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Secure sign-up with validation
  const signUp = async (email: string, password: string) => {
    try {
      // Client-side validation
      validateEmail(email);
      validatePassword(password);

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        logSecurityEvent('signup_failed', {
          email: email.toLowerCase().trim(),
          error: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      logSecurityEvent('signup_successful', {
        email: email.toLowerCase().trim(),
        timestamp: new Date().toISOString()
      });

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  // Secure sign-in with rate limiting
  const signIn = async (email: string, password: string) => {
    try {
      // Check rate limiting
      if (isRateLimited(email)) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      validateEmail(email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        recordFailedLogin(email);
        logSecurityEvent('signin_failed', {
          email: email.toLowerCase().trim(),
          error: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      clearFailedLogins(email);
      logSecurityEvent('signin_successful', {
        email: email.toLowerCase().trim(),
        userId: data.user?.id,
        timestamp: new Date().toISOString()
      });

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  // Secure sign-out
  const signOut = async () => {
    try {
      const currentUserId = user?.id;
      
      // Clear sensitive data from memory
      clearSensitiveData();
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      logSecurityEvent('signout_successful', {
        userId: currentUserId,
        timestamp: new Date().toISOString()
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getUserProfile,
    updateUserProfile,
  };
}
```

### Password Security

**Password Validation:**

```typescript
interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommon: boolean;
}

const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommon: true
};

export function validatePassword(
  password: string, 
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Length check
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }

  // Character requirements
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Common password check
  if (policy.preventCommon && isCommonPassword(password)) {
    errors.push('This password is too common. Please choose a more unique password');
  }

  // Pattern checks
  if (hasRepeatingCharacters(password)) {
    errors.push('Password should not have excessive repeating characters');
  }

  if (isSequentialPattern(password)) {
    errors.push('Password should not contain sequential patterns (e.g., "123", "abc")');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Common password detection
const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  return commonPasswords.some(common => 
    password.toLowerCase().includes(common.toLowerCase())
  );
};

// Pattern detection
const hasRepeatingCharacters = (password: string): boolean => {
  return /(.)\1{3,}/.test(password); // 4+ repeating characters
};

const isSequentialPattern = (password: string): boolean => {
  const sequences = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop'];
  return sequences.some(seq => 
    seq.includes(password.toLowerCase().slice(0, 4)) ||
    seq.split('').reverse().join('').includes(password.toLowerCase().slice(0, 4))
  );
};
```

### Rate Limiting and Brute Force Protection

```typescript
class RateLimiter {
  private attempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly RESET_WINDOW = 60 * 60 * 1000; // 1 hour

  isRateLimited(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;

    const now = Date.now();
    
    // Reset if window has passed
    if (now - record.lastAttempt > this.RESET_WINDOW) {
      this.attempts.delete(identifier);
      return false;
    }

    // Check if still in lockout period
    if (record.blocked && now - record.lastAttempt < this.LOCKOUT_DURATION) {
      return true;
    } else if (record.blocked) {
      // Lockout period expired, reset
      this.attempts.delete(identifier);
      return false;
    }

    return record.count >= this.MAX_ATTEMPTS;
  }

  recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const record = this.attempts.get(identifier) || { count: 0, lastAttempt: now, blocked: false };

    record.count++;
    record.lastAttempt = now;

    if (record.count >= this.MAX_ATTEMPTS) {
      record.blocked = true;
      logSecurityEvent('rate_limit_triggered', {
        identifier,
        attempts: record.count,
        timestamp: new Date().toISOString()
      });
    }

    this.attempts.set(identifier, record);
  }

  clearFailedAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return this.MAX_ATTEMPTS;
    return Math.max(0, this.MAX_ATTEMPTS - record.count);
  }
}

const rateLimiter = new RateLimiter();

export const isRateLimited = (email: string) => rateLimiter.isRateLimited(email);
export const recordFailedLogin = (email: string) => rateLimiter.recordFailedAttempt(email);
export const clearFailedLogins = (email: string) => rateLimiter.clearFailedAttempts(email);
```

## Row Level Security (RLS)

### Database Security Policies

**Standard RLS Policy Pattern:**

```sql
-- Enable RLS on all user tables
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Standard policy set for user-scoped data
CREATE POLICY "users_can_view_own_data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_data" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_data" ON table_name
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_data" ON table_name
  FOR DELETE USING (auth.uid() = user_id);
```

**Advanced RLS Policies with Role-Based Access:**

```sql
-- User profiles with admin override
CREATE POLICY "profile_access_policy" ON user_profiles
  FOR ALL USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Time entries with manager access
CREATE POLICY "time_entries_access_policy" ON time_entries
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = time_entries.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('manager', 'admin')
    )
  );

-- Sensitive documents with encryption requirement
CREATE POLICY "sensitive_documents_policy" ON client_documents
  FOR ALL USING (
    auth.uid() = created_by AND
    (
      is_sensitive = false OR
      (is_sensitive = true AND encrypted_content IS NOT NULL)
    )
  );
```

### RLS Testing and Validation

```sql
-- Test RLS policies with different user contexts
BEGIN;
  -- Set test user context
  SELECT set_config('request.jwt.claims', '{"sub":"test-user-id"}', true);
  
  -- Test data isolation
  SELECT * FROM time_entries; -- Should only return test user's entries
  
  -- Test unauthorized access
  INSERT INTO time_entries (user_id, project_id, date, hours) 
  VALUES ('other-user-id', 'project-id', CURRENT_DATE, 8.0);
  -- Should fail with RLS violation
  
ROLLBACK;

-- Automated RLS testing function
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE(test_name text, passed boolean, message text) AS $$
BEGIN
  -- Test user data isolation
  RETURN QUERY
  WITH test_data AS (
    SELECT 
      'user_data_isolation' as test_name,
      NOT EXISTS (
        SELECT 1 FROM time_entries 
        WHERE user_id != auth.uid()
      ) as passed,
      'Users can only see their own data' as message
  )
  SELECT * FROM test_data;
  
  -- Add more test cases...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Data Encryption

### Client-Side Encryption for Sensitive Documents

**Encryption Service Implementation:**

```typescript
export class EncryptionService {
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12;
  private readonly SALT_LENGTH = 16;
  private readonly ITERATIONS = 100000;

  async generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptSensitiveContent(content: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      
      // Generate cryptographically secure random values
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      
      // Derive encryption key
      const key = await this.generateKey(password, salt);
      
      // Encrypt data
      const encrypted = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv: iv },
        key,
        data
      );
      
      // Combine salt + iv + encrypted data
      const result = new Uint8Array(
        this.SALT_LENGTH + this.IV_LENGTH + encrypted.byteLength
      );
      result.set(salt, 0);
      result.set(iv, this.SALT_LENGTH);
      result.set(new Uint8Array(encrypted), this.SALT_LENGTH + this.IV_LENGTH);
      
      // Return base64 encoded result
      return btoa(String.fromCharCode.apply(null, Array.from(result)));
    } catch (error) {
      logSecurityEvent('encryption_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw new Error('Encryption failed');
    }
  }

  async decryptSensitiveContent(encryptedContent: string, password: string): Promise<string> {
    try {
      // Decode base64
      const data = new Uint8Array(
        atob(encryptedContent)
          .split('')
          .map(char => char.charCodeAt(0))
      );
      
      // Extract components
      const salt = data.slice(0, this.SALT_LENGTH);
      const iv = data.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const encrypted = data.slice(this.SALT_LENGTH + this.IV_LENGTH);
      
      // Derive decryption key
      const key = await this.generateKey(password, salt);
      
      // Decrypt data
      const decrypted = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv: iv },
        key,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      logSecurityEvent('decryption_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw new Error('Decryption failed - incorrect password or corrupted data');
    }
  }

  // Secure password validation for encryption
  validateEncryptionPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 16) {
      errors.push('Encryption password must be at least 16 characters long');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) {
      errors.push('Encryption password must contain uppercase, lowercase, numbers, and special characters');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### Encryption Session Management

```typescript
class EncryptionSession {
  private password: string | null = null;
  private sessionTimeout: number | null = null;
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  setPassword(password: string): void {
    this.password = password;
    this.resetTimeout();
    
    logSecurityEvent('encryption_session_started', {
      timestamp: new Date().toISOString()
    });
  }

  getPassword(): string | null {
    if (this.isExpired()) {
      this.clearSession();
      return null;
    }
    
    this.resetTimeout(); // Extend session on use
    return this.password;
  }

  isActive(): boolean {
    return this.password !== null && !this.isExpired();
  }

  private isExpired(): boolean {
    return this.sessionTimeout !== null && Date.now() > this.sessionTimeout;
  }

  private resetTimeout(): void {
    this.sessionTimeout = Date.now() + this.SESSION_DURATION;
  }

  clearSession(): void {
    this.password = null;
    this.sessionTimeout = null;
    
    logSecurityEvent('encryption_session_ended', {
      timestamp: new Date().toISOString()
    });
  }

  // Auto-clear session on page unload
  initializeSessionCleanup(): void {
    window.addEventListener('beforeunload', () => {
      this.clearSession();
    });

    // Also clear on page visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Start timeout for clearing session
        setTimeout(() => {
          if (document.hidden) {
            this.clearSession();
          }
        }, 5 * 60 * 1000); // 5 minutes
      }
    });
  }
}

export const encryptionSession = new EncryptionSession();
```

## Input Validation and Sanitization

### Frontend Input Validation

```typescript
export class InputValidator {
  // Email validation with comprehensive checks
  static validateEmail(email: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!email) {
      errors.push('Email is required');
      return { valid: false, errors };
    }

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }

    // Length check
    if (email.length > 254) {
      errors.push('Email address is too long');
    }

    // Domain validation
    const domain = email.split('@')[1];
    if (domain && domain.length > 253) {
      errors.push('Domain name is too long');
    }

    // Check for dangerous characters
    if (/<script|javascript:|data:|vbscript:/i.test(email)) {
      errors.push('Email contains invalid characters');
    }

    return { valid: errors.length === 0, errors };
  }

  // Sanitize HTML content to prevent XSS
  static sanitizeHtml(html: string): string {
    // Create a temporary DOM element
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  }

  // Validate and sanitize text input
  static sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input) return '';
    
    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Truncate if too long
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }

  // Validate numeric input
  static validateNumber(
    value: string | number, 
    min?: number, 
    max?: number
  ): { valid: boolean; errors: string[]; value: number | null } {
    const errors: string[] = [];
    let numValue: number;

    if (typeof value === 'string') {
      numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push('Must be a valid number');
        return { valid: false, errors, value: null };
      }
    } else {
      numValue = value;
    }

    if (min !== undefined && numValue < min) {
      errors.push(`Must be at least ${min}`);
    }

    if (max !== undefined && numValue > max) {
      errors.push(`Must be no more than ${max}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      value: numValue
    };
  }

  // Validate file uploads
  static validateFile(
    file: File, 
    allowedTypes: string[], 
    maxSize: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
    }

    // Check for potentially dangerous file names
    if (/[<>:"/\\|?*]/.test(file.name)) {
      errors.push('File name contains invalid characters');
    }

    return { valid: errors.length === 0, errors };
  }
}
```

### SQL Injection Prevention

```typescript
// Safe query builder for dynamic queries
export class SafeQueryBuilder {
  private query: string = '';
  private params: unknown[] = [];

  select(columns: string[]): SafeQueryBuilder {
    // Validate column names to prevent injection
    const validColumns = columns.filter(col => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col));
    this.query += `SELECT ${validColumns.join(', ')} `;
    return this;
  }

  from(table: string): SafeQueryBuilder {
    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      throw new Error('Invalid table name');
    }
    this.query += `FROM ${table} `;
    return this;
  }

  where(column: string, operator: string, value: unknown): SafeQueryBuilder {
    // Validate column name and operator
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
      throw new Error('Invalid column name');
    }

    const validOperators = ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN', 'NOT IN'];
    if (!validOperators.includes(operator.toUpperCase())) {
      throw new Error('Invalid operator');
    }

    this.query += `WHERE ${column} ${operator} $${this.params.length + 1} `;
    this.params.push(value);
    return this;
  }

  build(): { query: string; params: unknown[] } {
    return {
      query: this.query.trim(),
      params: this.params
    };
  }
}

// Usage with Supabase (which handles parameterization automatically)
const safeFilter = (tableName: string, filters: Record<string, unknown>) => {
  let query = supabase.from(tableName).select('*');
  
  Object.entries(filters).forEach(([key, value]) => {
    // Validate filter keys to prevent injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      throw new Error(`Invalid filter key: ${key}`);
    }
    query = query.eq(key, value);
  });
  
  return query;
};
```

## Security Monitoring and Logging

### Security Event Logging

```typescript
interface SecurityEvent {
  type: 'auth' | 'data_access' | 'encryption' | 'validation' | 'security_violation';
  action: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000;

  log(event: Omit<SecurityEvent, 'timestamp' | 'ipAddress' | 'userAgent'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    };

    this.events.push(fullEvent);
    
    // Keep only recent events in memory
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Send to monitoring service if critical
    if (event.severity === 'critical') {
      this.sendToMonitoringService(fullEvent);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`Security Event [${event.severity.toUpperCase()}]:`, fullEvent);
    }
  }

  private getClientIP(): string {
    // In a real application, this would be set by the server
    return 'client-ip-not-available';
  }

  private async sendToMonitoringService(event: SecurityEvent): Promise<void> {
    try {
      // Integration with monitoring service (e.g., Sentry, LogRocket)
      await fetch('/api/security-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send security event to monitoring service:', error);
    }
  }

  getRecentEvents(count: number = 50): SecurityEvent[] {
    return this.events.slice(-count);
  }

  getEventsByType(type: SecurityEvent['type']): SecurityEvent[] {
    return this.events.filter(event => event.type === type);
  }

  getCriticalEvents(): SecurityEvent[] {
    return this.events.filter(event => event.severity === 'critical');
  }
}

export const securityLogger = new SecurityLogger();

// Helper function for logging security events
export const logSecurityEvent = (
  action: string,
  metadata?: Record<string, unknown>,
  severity: SecurityEvent['severity'] = 'medium'
) => {
  securityLogger.log({
    type: 'auth',
    action,
    metadata,
    severity
  });
};
```

### Anomaly Detection

```typescript
class SecurityAnomalyDetector {
  private loginAttempts = new Map<string, number[]>();
  private dataAccess = new Map<string, number[]>();
  
  checkLoginAnomalies(userId: string): boolean {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    
    const attempts = this.loginAttempts.get(userId) || [];
    attempts.push(now);
    
    // Keep only attempts from last hour
    const recentAttempts = attempts.filter(time => now - time < hour);
    this.loginAttempts.set(userId, recentAttempts);
    
    // Flag if more than 10 attempts in an hour
    if (recentAttempts.length > 10) {
      logSecurityEvent('suspicious_login_pattern', {
        userId,
        attempts: recentAttempts.length,
        timeframe: 'last_hour'
      }, 'high');
      return true;
    }
    
    return false;
  }
  
  checkUnusualDataAccess(userId: string, tableName: string): boolean {
    const now = Date.now();
    const minute = 60 * 1000;
    
    const key = `${userId}:${tableName}`;
    const accesses = this.dataAccess.get(key) || [];
    accesses.push(now);
    
    // Keep only accesses from last minute
    const recentAccesses = accesses.filter(time => now - time < minute);
    this.dataAccess.set(key, recentAccesses);
    
    // Flag if more than 100 accesses per minute
    if (recentAccesses.length > 100) {
      logSecurityEvent('suspicious_data_access', {
        userId,
        tableName,
        accesses: recentAccesses.length,
        timeframe: 'last_minute'
      }, 'high');
      return true;
    }
    
    return false;
  }
}

export const anomalyDetector = new SecurityAnomalyDetector();
```

## Environment and Secret Management

### Secure Configuration

```typescript
// Environment variable validation
interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  fortnoxBaseUrl?: string;
  mongodbApiEndpoint?: string;
  environment: 'development' | 'staging' | 'production';
}

export function validateEnvironmentConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    fortnoxBaseUrl: import.meta.env.VITE_FORTNOX_BASE_URL,
    mongodbApiEndpoint: import.meta.env.VITE_MONGODB_API_ENDPOINT,
    environment: (import.meta.env.VITE_ENVIRONMENT as any) || 'development'
  };

  // Validate required environment variables
  if (!config.supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL environment variable is required');
  }

  if (!config.supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required');
  }

  // Validate URL formats
  try {
    new URL(config.supabaseUrl);
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid URL');
  }

  // Ensure production environment is properly configured
  if (config.environment === 'production') {
    if (config.supabaseUrl.includes('localhost')) {
      throw new Error('Production environment cannot use localhost URLs');
    }
  }

  return config;
}

// Secure storage for sensitive configuration
class SecureConfigStorage {
  private static readonly STORAGE_KEY = 'app_secure_config';
  private static readonly ENCRYPTION_KEY = 'user_config_encryption';

  static async store(config: Record<string, unknown>, password: string): Promise<void> {
    const encryption = new EncryptionService();
    const encrypted = await encryption.encryptSensitiveContent(
      JSON.stringify(config),
      password
    );
    
    sessionStorage.setItem(this.STORAGE_KEY, encrypted);
  }

  static async retrieve(password: string): Promise<Record<string, unknown> | null> {
    const encrypted = sessionStorage.getItem(this.STORAGE_KEY);
    if (!encrypted) return null;

    try {
      const encryption = new EncryptionService();
      const decrypted = await encryption.decryptSensitiveContent(encrypted, password);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  static clear(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
}
```

## Security Headers and Content Security Policy

### Content Security Policy Configuration

```typescript
// CSP configuration for security
export const contentSecurityPolicy = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for React development
    'https://unpkg.com', // For external libraries
    'https://cdn.jsdelivr.net'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'img-src': [
    "'self'",
    'data:', // For base64 images
    'https:', // For external images
    'blob:' // For generated images
  ],
  'connect-src': [
    "'self'",
    'https://*.supabase.co', // Supabase API
    'https://api.fortnox.se', // Fortnox API
    'wss://*.supabase.co' // Supabase realtime
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};

// Generate CSP header value
export const generateCSPHeader = (): string => {
  return Object.entries(contentSecurityPolicy)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};
```

### Security Headers Implementation

```typescript
// Security headers for enhanced protection
export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': generateCSPHeader()
};

// Apply security headers (for static hosting)
export const applySecurityHeaders = () => {
  if (typeof document !== 'undefined') {
    // Add meta tags for security headers
    Object.entries(securityHeaders).forEach(([name, value]) => {
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', name);
      meta.setAttribute('content', value);
      document.head.appendChild(meta);
    });
  }
};
```

## Security Testing and Validation

### Automated Security Tests

```typescript
// Security test suite
export class SecurityTestSuite {
  static async runAllTests(): Promise<{ passed: number; failed: number; results: any[] }> {
    const tests = [
      this.testPasswordValidation,
      this.testInputSanitization,
      this.testRateLimiting,
      this.testEncryption,
      this.testAuthenticationFlow
    ];

    const results = [];
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = await test();
        if (result.success) {
          passed++;
        } else {
          failed++;
        }
        results.push(result);
      } catch (error) {
        failed++;
        results.push({
          testName: test.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { passed, failed, results };
  }

  static async testPasswordValidation(): Promise<any> {
    const weakPasswords = ['password', '123456', 'abc123'];
    const strongPassword = 'MyStr0ng!P@ssw0rd123';

    const weakResults = weakPasswords.map(pwd => validatePassword(pwd));
    const strongResult = validatePassword(strongPassword);

    const weakPasswordsRejected = weakResults.every(result => !result.valid);
    const strongPasswordAccepted = strongResult.valid;

    return {
      testName: 'Password Validation',
      success: weakPasswordsRejected && strongPasswordAccepted,
      details: {
        weakPasswordsRejected,
        strongPasswordAccepted,
        weakResults,
        strongResult
      }
    };
  }

  static async testInputSanitization(): Promise<any> {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      '../../etc/passwd',
      'DROP TABLE users;'
    ];

    const sanitizedInputs = maliciousInputs.map(input => 
      InputValidator.sanitizeText(input)
    );

    const allSanitized = sanitizedInputs.every(sanitized => 
      !sanitized.includes('<script>') && 
      !sanitized.includes('javascript:') &&
      !sanitized.includes('DROP TABLE')
    );

    return {
      testName: 'Input Sanitization',
      success: allSanitized,
      details: {
        originalInputs: maliciousInputs,
        sanitizedInputs,
        allSanitized
      }
    };
  }

  static async testEncryption(): Promise<any> {
    const testData = 'Sensitive information that should be encrypted';
    const password = 'TestEncryptionPassword123!';
    
    try {
      const encryption = new EncryptionService();
      const encrypted = await encryption.encryptSensitiveContent(testData, password);
      const decrypted = await encryption.decryptSensitiveContent(encrypted, password);

      const encryptionWorks = decrypted === testData;
      const dataIsEncrypted = encrypted !== testData && encrypted.length > testData.length;

      return {
        testName: 'Encryption/Decryption',
        success: encryptionWorks && dataIsEncrypted,
        details: {
          encryptionWorks,
          dataIsEncrypted,
          originalLength: testData.length,
          encryptedLength: encrypted.length
        }
      };
    } catch (error) {
      return {
        testName: 'Encryption/Decryption',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown encryption error'
      };
    }
  }
}
```

---

This comprehensive security and authentication guide provides the foundation for a secure consultant time tracking application with multiple layers of protection, comprehensive monitoring, and best practices for handling sensitive business data.
