/**
 * Simple and secure client-side encryption for sensitive documents
 * Uses Web Crypto API with AES-GCM encryption
 */

export interface EncryptedContent {
  data: string;
  salt: string;
  iv: string;
}

/**
 * Encrypts sensitive document content with a password
 */
export async function encryptSensitiveContent(
  content: string,
  password: string
): Promise<string> {
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derive key from password using PBKDF2
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt']
    );
    
    // Encrypt the content
    const contentBuffer = encoder.encode(content);
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      contentBuffer
    );
    
    // Convert to base64 for storage
    const encryptedData: EncryptedContent = {
      data: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv))
    };
    
    return JSON.stringify(encryptedData);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive content');
  }
}

/**
 * Decrypts sensitive document content with a password
 */
export async function decryptSensitiveContent(
  encryptedContent: string,
  password: string
): Promise<string> {
  try {
    const encryptedData: EncryptedContent = JSON.parse(encryptedContent);
    
    // Convert base64 back to arrays
    const data = Uint8Array.from(atob(encryptedData.data), c => c.charCodeAt(0));
    const salt = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    
    // Derive the same key from password
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['decrypt']
    );
    
    // Decrypt the content
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt content. Invalid password or corrupted data.');
  }
}

/**
 * Validates encryption password strength
 */
export function validateEncryptionPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generates a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

/**
 * Session-based encryption key manager
 */
class EncryptionSession {
  private password: string | null = null;
  private expiryTime: number = 0;
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  setPassword(password: string): void {
    this.password = password;
    this.expiryTime = Date.now() + this.SESSION_DURATION;
  }

  getPassword(): string | null {
    if (this.password && Date.now() < this.expiryTime) {
      return this.password;
    }
    this.clearSession();
    return null;
  }

  clearSession(): void {
    this.password = null;
    this.expiryTime = 0;
  }

  extendSession(): void {
    if (this.password) {
      this.expiryTime = Date.now() + this.SESSION_DURATION;
    }
  }

  isActive(): boolean {
    return this.password !== null && Date.now() < this.expiryTime;
  }
}

export const encryptionSession = new EncryptionSession();
