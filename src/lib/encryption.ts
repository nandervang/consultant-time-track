/**
 * Client-side encryption utilities for sensitive documents
 * Uses AES-GCM encryption with PBKDF2 key derivation
 */

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12,
  saltLength: 16,
  iterations: 100000, // PBKDF2 iterations
  tagLength: 16
} as const;

export interface EncryptedData {
  encrypted: string; // Base64 encoded
  salt: string; // Base64 encoded
  iv: string; // Base64 encoded
  version: number;
}

export interface EncryptionKey {
  key: CryptoKey;
  rawKey: ArrayBuffer;
}

/**
 * Generates a master encryption key from user password
 */
export async function deriveKeyFromPassword(
  password: string,
  salt?: Uint8Array
): Promise<{ key: EncryptionKey; salt: Uint8Array }> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Generate or use provided salt
  const keySalt = salt || crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength));
  
  // Import password as key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive encryption key using PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: keySalt,
      iterations: ENCRYPTION_CONFIG.iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength
    },
    false,
    ['encrypt', 'decrypt']
  );
  
  // Export key for storage
  const rawKey = await crypto.subtle.exportKey('raw', derivedKey);
  
  return {
    key: { key: derivedKey, rawKey },
    salt: keySalt
  };
}

/**
 * Encrypts data using AES-GCM
 */
export async function encryptData(
  data: string,
  encryptionKey: CryptoKey
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));
  
  // Encrypt data
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv: iv
    },
    encryptionKey,
    dataBuffer
  );
  
  // Convert to base64 for storage
  const encrypted = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  const ivBase64 = btoa(String.fromCharCode(...iv));
  
  return {
    encrypted,
    salt: '', // Will be set by the calling function
    iv: ivBase64,
    version: 1
  };
}

/**
 * Decrypts data using AES-GCM
 */
export async function decryptData(
  encryptedData: EncryptedData,
  encryptionKey: CryptoKey
): Promise<string> {
  try {
    // Decode from base64
    const encrypted = Uint8Array.from(atob(encryptedData.encrypted), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    
    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: iv
      },
      encryptionKey,
      encrypted
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    throw new Error('Failed to decrypt data. Invalid key or corrupted data.');
  }
}

/**
 * Encrypts document content with user password
 */
export async function encryptDocumentContent(
  content: unknown,
  password: string
): Promise<string> {
  const { key, salt } = await deriveKeyFromPassword(password);
  const encryptedData = await encryptData(JSON.stringify(content), key.key);
  
  // Include salt in the encrypted data
  encryptedData.salt = btoa(String.fromCharCode(...new Uint8Array(salt)));
  
  return JSON.stringify(encryptedData);
}

/**
 * Decrypts document content with user password
 */
export async function decryptDocumentContent(
  encryptedContent: string,
  password: string
): Promise<unknown> {
  const encryptedData: EncryptedData = JSON.parse(encryptedContent);
  const saltArray = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));
  
  const { key } = await deriveKeyFromPassword(password, saltArray);
  const decryptedContent = await decryptData(encryptedData, key.key);
  
  return JSON.parse(decryptedContent);
}

/**
 * Validates encryption password strength
 */
export function validateEncryptionPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
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
  
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Securely generates a random encryption password
 */
export function generateSecurePassword(length: number = 20): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

/**
 * Encryption key management for session
 */
export class EncryptionKeyManager {
  private static instance: EncryptionKeyManager;
  private encryptionKey: CryptoKey | null = null;
  private keyExpiry: number = 0;
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  
  private constructor() {}
  
  static getInstance(): EncryptionKeyManager {
    if (!EncryptionKeyManager.instance) {
      EncryptionKeyManager.instance = new EncryptionKeyManager();
    }
    return EncryptionKeyManager.instance;
  }
  
  async setEncryptionKey(password: string): Promise<void> {
    const { key } = await deriveKeyFromPassword(password);
    this.encryptionKey = key.key;
    this.keyExpiry = Date.now() + this.SESSION_DURATION;
  }
  
  getEncryptionKey(): CryptoKey | null {
    if (this.encryptionKey && Date.now() < this.keyExpiry) {
      return this.encryptionKey;
    }
    
    // Key expired, clear it
    this.clearKey();
    return null;
  }
  
  clearKey(): void {
    this.encryptionKey = null;
    this.keyExpiry = 0;
  }
  
  extendSession(): void {
    if (this.encryptionKey) {
      this.keyExpiry = Date.now() + this.SESSION_DURATION;
    }
  }
  
  isKeyValid(): boolean {
    return this.encryptionKey !== null && Date.now() < this.keyExpiry;
  }
}

/**
 * Secure storage utilities
 */
export const secureStorage = {
  /**
   * Stores encrypted data in localStorage with additional security measures
   */
  setEncrypted: async (key: string, data: unknown, password: string): Promise<void> => {
    try {
      const encryptedData = await encryptDocumentContent(data, password);
      const storageData = {
        data: encryptedData,
        timestamp: Date.now(),
        checksum: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(encryptedData))
      };
      
      localStorage.setItem(key, JSON.stringify(storageData));
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      throw new Error('Failed to securely store data');
    }
  },
  
  /**
   * Retrieves and decrypts data from localStorage
   */
  getEncrypted: async (key: string, password: string): Promise<unknown> => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const storageData = JSON.parse(stored);
      
      // Verify data integrity
      const checksum = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(storageData.data));
      const storedChecksum = new Uint8Array(storageData.checksum);
      const currentChecksum = new Uint8Array(checksum);
      
      if (!arraysEqual(storedChecksum, currentChecksum)) {
        throw new Error('Data integrity check failed');
      }
      
      return await decryptDocumentContent(storageData.data, password);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      throw new Error('Failed to decrypt stored data');
    }
  },
  
  /**
   * Removes encrypted data from localStorage
   */
  removeEncrypted: (key: string): void => {
    localStorage.removeItem(key);
  }
};

// Helper function to compare arrays
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
