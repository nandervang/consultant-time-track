import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink, Settings } from 'lucide-react';
import { 
  fortnoxService, 
  getStoredFortnoxConfig, 
  storeFortnoxConfig, 
  clearFortnoxConfig,
  validateFortnoxConfig,
  type FortnoxConfig 
} from '@/lib/fortnox';

interface FortnoxConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigured?: () => void;
}

export function FortnoxConfigDialog({ open, onOpenChange, onConfigured }: FortnoxConfigDialogProps) {
  const [config, setConfig] = useState<Partial<FortnoxConfig>>({
    accessToken: '',
    clientSecret: '',
  });
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (open) {
      // Load existing configuration when dialog opens
      const stored = getStoredFortnoxConfig();
      if (stored) {
        setConfig(stored);
        setIsConfigured(true);
        setConnectionStatus('success');
      } else {
        setConfig({ accessToken: '', clientSecret: '' });
        setIsConfigured(false);
        setConnectionStatus('idle');
      }
    }
  }, [open]);

  const handleInputChange = (field: keyof FortnoxConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setConnectionStatus('idle');
    setErrorMessage('');
  };

  const testConnection = async () => {
    if (!validateFortnoxConfig(config)) {
      setErrorMessage('Please provide both Access Token and Client Secret');
      setConnectionStatus('error');
      return;
    }

    setTesting(true);
    setErrorMessage('');
    
    try {
      fortnoxService.configure(config);
      const isConnected = await fortnoxService.testConnection();
      
      if (isConnected) {
        setConnectionStatus('success');
        storeFortnoxConfig(config);
        setIsConfigured(true);
      } else {
        setConnectionStatus('error');
        setErrorMessage('Failed to connect to Fortnox. Please check your credentials.');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (connectionStatus === 'success' && validateFortnoxConfig(config)) {
      storeFortnoxConfig(config);
      onConfigured?.();
      onOpenChange(false);
    }
  };

  const handleClearConfig = () => {
    clearFortnoxConfig();
    setConfig({ accessToken: '', clientSecret: '' });
    setIsConfigured(false);
    setConnectionStatus('idle');
    setErrorMessage('');
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Settings className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'success':
        return 'Connected successfully';
      case 'error':
        return 'Connection failed';
      default:
        return 'Not configured';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fortnox Integration</DialogTitle>
          <DialogDescription>
            Configure your Fortnox API credentials to export invoice items directly to Fortnox.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {getStatusIcon()}
                Connection Status: {getStatusText()}
              </CardTitle>
            </CardHeader>
            {connectionStatus === 'success' && (
              <CardContent className="pt-0">
                <p className="text-sm text-green-600">
                  Your Fortnox integration is ready to use.
                </p>
              </CardContent>
            )}
          </Card>

          {/* Configuration Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Enter your Fortnox Access Token"
                value={config.accessToken || ''}
                onChange={(e) => handleInputChange('accessToken', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="Enter your Fortnox Client Secret"
                value={config.clientSecret || ''}
                onChange={(e) => handleInputChange('clientSecret', e.target.value)}
              />
            </div>

            {/* Help Text */}
            <Alert>
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <p>To get your Fortnox API credentials:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Log in to your Fortnox account</li>
                    <li>Go to Settings → Integrations → API</li>
                    <li>Create a new integration or use existing one</li>
                    <li>Copy the Access Token and Client Secret</li>
                  </ol>
                  <a 
                    href="https://developer.fortnox.se/general/authentication/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Learn more <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </AlertDescription>
            </Alert>

            {/* Error Message */}
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Test Connection Button */}
            <Button 
              onClick={testConnection} 
              disabled={testing || !config.accessToken || !config.clientSecret}
              className="w-full"
              variant="outline"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {isConfigured && (
            <Button 
              variant="outline" 
              onClick={handleClearConfig}
              className="mr-auto"
            >
              Clear Config
            </Button>
          )}
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={connectionStatus !== 'success'}
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
