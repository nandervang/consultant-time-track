import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Lock, Eye, EyeOff, Shield, AlertTriangle, Key } from 'lucide-react';
import { validateEncryptionPassword, generateSecurePassword } from '../../lib/encryption-simple';

interface EncryptionSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordSet: (password: string) => void;
  mode: 'setup' | 'unlock';
  title?: string;
  description?: string;
}

export function EncryptionSetupDialog({
  open,
  onOpenChange,
  onPasswordSet,
  mode,
  title,
  description
}: EncryptionSetupDialogProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSetupMode = mode === 'setup';
  const validation = validateEncryptionPassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSetupMode) {
        // Validate password in setup mode
        if (!validation.valid) {
          setError(validation.errors[0]);
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
      }

      if (!password) {
        setError('Password is required');
        return;
      }

      // Set the password
      onPasswordSet(password);
      
      // Reset form
      setPassword('');
      setConfirmPassword('');
      setError(null);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePassword = () => {
    const newPassword = generateSecurePassword(16);
    setPassword(newPassword);
    setConfirmPassword(newPassword);
    setShowPassword(true);
  };

  const resetForm = () => {
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setShowPassword(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSetupMode ? (
              <>
                <Shield className="h-5 w-5 text-blue-600" />
                {title || 'Set Up Document Encryption'}
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-yellow-600" />
                {title || 'Unlock Sensitive Documents'}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {description || (isSetupMode 
              ? 'Create a master password to encrypt sensitive documents. This password will be required to view or edit sensitive content.'
              : 'Enter your master password to access sensitive documents.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSetupMode && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                <strong>Important:</strong> Store this password safely. If you lose it, your encrypted documents cannot be recovered.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isSetupMode ? 'Master Password' : 'Password'}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your encryption password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {isSetupMode && password && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-gray-600">Password strength:</div>
                  <div className="space-y-1">
                    {validation.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600 flex items-center gap-1">
                        <div className="w-1 h-1 bg-red-600 rounded-full"></div>
                        {error}
                      </div>
                    ))}
                    {validation.valid && (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                        Strong password
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {isSetupMode && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your encryption password"
                    required
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  className="w-full"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Generate Secure Password
                </Button>
              </>
            )}
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (isSetupMode && (!validation.valid || password !== confirmPassword))}
              className="flex-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isSetupMode ? (
                'Set Up Encryption'
              ) : (
                'Unlock'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
