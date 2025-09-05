import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Plus, 
  Settings, 
  Globe, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { usePingMonitor } from '@/hooks/usePingMonitor';
import { PingTarget } from '@/types/ping';

export default function UptimeMonitorCard() {
  const {
    targets,
    settings,
    isMonitoring,
    isLoading,
    addTarget,
    updateTarget,
    removeTarget,
    updateSettings,
    startMonitoring,
    stopMonitoring,
    manualPing,
    getUptimeStats,
    getTargetEntriesCount,
  } = usePingMonitor();

  const [showSettings, setShowSettings] = useState(false);
  const [showAddTarget, setShowAddTarget] = useState(false);
  const [showEditTarget, setShowEditTarget] = useState(false);
  const [editingTarget, setEditingTarget] = useState<PingTarget | null>(null);
  const [headerInput, setHeaderInput] = useState('');
  const [statusInput, setStatusInput] = useState('200,201,202,204');
  const [newTarget, setNewTarget] = useState<Partial<PingTarget> & { name: string; url: string }>({
    name: '',
    url: '',
    enabled: true,
    type: 'http',
    method: 'GET',
    headers: {},
    expected_status: [200, 201, 202, 204],
    mongodb_config: {
      database: '',
      collection: '',
      operation: 'ping',
      query: ''
    }
  });

  const handleAddTarget = () => {
    if (newTarget.name && newTarget.url) {
      // Clean the target object to ensure only correct database properties are sent
      const cleanTarget = {
        name: newTarget.name,
        url: newTarget.url,
        type: newTarget.type || 'http',
        method: newTarget.method || 'GET',
        headers: newTarget.headers || {},
        body: newTarget.body,
        timeout: newTarget.timeout,
        expected_status: newTarget.expected_status || [200, 201, 202, 204],
        expected_text: newTarget.expected_text,
        mongodb_config: newTarget.type === 'mongodb' ? newTarget.mongodb_config : undefined,
        enabled: newTarget.enabled ?? true,
      };
      addTarget(cleanTarget);
      setNewTarget({ 
        name: '', 
        url: '', 
        enabled: true,
        type: 'http',
        method: 'GET',
        headers: {},
        expected_status: [200, 201, 202, 204],
        mongodb_config: {
          database: '',
          collection: '',
          operation: 'ping',
          query: ''
        }
      });
      setShowAddTarget(false);
    }
  };

  const handleEditTarget = (target: PingTarget) => {
    setEditingTarget(target);
    setHeaderInput(JSON.stringify(target.headers || {}, null, 2));
    setStatusInput((target.expected_status || [200]).join(','));
    setShowEditTarget(true);
  };

  const handleUpdateTarget = () => {
    if (editingTarget) {
      // Clean the target object to ensure only correct database properties are sent
      const cleanUpdates = {
        name: editingTarget.name,
        url: editingTarget.url,
        method: editingTarget.method,
        headers: editingTarget.headers,
        body: editingTarget.body,
        timeout: editingTarget.timeout,
        expected_status: editingTarget.expected_status,
        expected_text: editingTarget.expected_text,
        enabled: editingTarget.enabled,
      };
      updateTarget(editingTarget.id, cleanUpdates);
      setShowEditTarget(false);
      setEditingTarget(null);
    }
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  const formatInterval = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    return `${minutes / 60}h`;
  };

  const formatLastCheck = (timestamp: string): string => {
    if (!timestamp) return 'Aldrig';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Nyss';
    if (diffMinutes < 60) return `${diffMinutes}min sedan`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h sedan`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d sedan`;
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (status: 'up' | 'down' | 'unknown'): string => {
    switch (status) {
      case 'up': return 'bg-green-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: 'up' | 'down' | 'unknown') => {
    switch (status) {
      case 'up': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'down': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Uptime Monitor
            </CardTitle>
            <div className="text-xs text-muted-foreground mt-1">
              {settings ? `Kontrollerar var ${formatInterval(settings.interval_minutes)} • ${settings.timeout_seconds}s timeout` : 'Loading...'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isMonitoring ? 'default' : 'secondary'} className="text-xs">
              {isMonitoring ? 'Monitoring' : 'Stopped'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-4">
                Loading ping targets...
              </div>
            ) : targets.length > 0 ? (
              targets.map((target) => {
                const stats = getUptimeStats(target.id);
                const entriesCount = getTargetEntriesCount(target.id);
                return (
                  <div
                    key={target.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleEditTarget(target)}
                    title="Click to edit target settings"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(stats.current_status === 'success' ? 'up' : stats.current_status === 'failure' ? 'down' : 'unknown')}`} />
                      <div>
                        <div className="font-medium text-sm">{target.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {target.url} • {formatLastCheck(stats.last_check)}
                          {target.method && target.method !== 'GET' && ` • ${target.method}`}
                          {target.type === 'mongodb' && ` • ${entriesCount} entries`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          {getStatusIcon(stats?.current_status === 'success' ? 'up' : stats?.current_status === 'failure' ? 'down' : 'unknown')}
                          <span className="font-medium">{stats?.uptime_percentage?.toFixed(1) || '0.0'}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(stats?.avg_response_time || 0) > 0 && formatResponseTime(stats?.avg_response_time || 0)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          manualPing(target.id);
                        }}
                        title="Test now"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Inga övervakade webbplatser</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowAddTarget(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till första webbplats
                </Button>
              </div>
            )}
          </div>

          {targets.length > 0 && (
            <div className="flex justify-between mt-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                {targets.filter(t => t.enabled).length} av {targets.length} aktiva
                {isMonitoring && settings && ` • Nästa kontroll: ${formatInterval(settings.interval_minutes)}`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddTarget(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMonitoring}
                >
                  {isMonitoring ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausa
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Starta
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Add Target Dialog */}
      <Dialog open={showAddTarget} onOpenChange={setShowAddTarget}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lägg till API/webbplats övervakning</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Grundläggande</TabsTrigger>
              <TabsTrigger value="advanced">Avancerat</TabsTrigger>
              <TabsTrigger value="templates">Mallar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="target-name">Namn</Label>
                <Input
                  id="target-name"
                  value={newTarget.name}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Min API / webbplats"
                />
              </div>
              <div>
                <Label htmlFor="target-url">URL</Label>
                <Input
                  id="target-url"
                  value={newTarget.url}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://api.example.com/health or mongodb+srv://..."
                />
              </div>
              
              <div>
                <Label htmlFor="target-type">Typ av övervakning</Label>
                <Select
                  value={newTarget.type || 'http'}
                  onValueChange={(value: 'http' | 'mongodb') => setNewTarget(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP/API</SelectItem>
                    <SelectItem value="mongodb">MongoDB Database</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newTarget.type === 'http' && (
                <div>
                  <Label htmlFor="target-method">HTTP-metod</Label>
                  <Select
                    value={newTarget.method || 'GET'}
                    onValueChange={(value: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS') => 
                      setNewTarget(prev => ({ ...prev, method: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                      <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {newTarget.type === 'mongodb' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mongodb-database">Databasnamn</Label>
                    <Input
                      id="mongodb-database"
                      value={newTarget.mongodb_config?.database || ''}
                      onChange={(e) => setNewTarget(prev => ({ 
                        ...prev, 
                        mongodb_config: { 
                          ...prev.mongodb_config, 
                          database: e.target.value 
                        } 
                      }))}
                      placeholder="digitalidag"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mongodb-collection">Kollektionsnamn (valfritt)</Label>
                    <Input
                      id="mongodb-collection"
                      value={newTarget.mongodb_config?.collection || ''}
                      onChange={(e) => setNewTarget(prev => ({ 
                        ...prev, 
                        mongodb_config: { 
                          ...prev.mongodb_config, 
                          collection: e.target.value 
                        } 
                      }))}
                      placeholder="test_collection"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mongodb-operation">Operation</Label>
                    <Select
                      value={newTarget.mongodb_config?.operation || 'ping'}
                      onValueChange={(value: 'ping' | 'count' | 'find') => 
                        setNewTarget(prev => ({ 
                          ...prev, 
                          mongodb_config: { 
                            ...prev.mongodb_config, 
                            operation: value 
                          } 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ping">Ping (testa anslutning)</SelectItem>
                        <SelectItem value="count">Count (räkna dokument)</SelectItem>
                        <SelectItem value="find">Find (sök dokument)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="target-enabled"
                  checked={newTarget.enabled}
                  onCheckedChange={(enabled: boolean) => setNewTarget(prev => ({ ...prev, enabled }))}
                />
                <Label htmlFor="target-enabled">Aktiverad</Label>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div>
                <Label htmlFor="target-headers">Headers (JSON format)</Label>
                <textarea
                  id="target-headers"
                  className="w-full h-24 p-2 border rounded-md text-sm font-mono"
                  value={headerInput || JSON.stringify(newTarget.headers || {}, null, 2)}
                  onChange={(e) => {
                    setHeaderInput(e.target.value);
                    try {
                      const headers = JSON.parse(e.target.value);
                      setNewTarget(prev => ({ ...prev, headers }));
                    } catch {
                      // Invalid JSON, don't update target
                    }
                  }}
                  placeholder='{\n  "Authorization": "Bearer your-token",\n  "X-API-Key": "your-api-key"\n}'
                />
              </div>
              
              {['POST', 'PUT', 'PATCH'].includes(newTarget.method || 'GET') && (
                <div>
                  <Label htmlFor="target-body">Request Body</Label>
                  <textarea
                    id="target-body"
                    className="w-full h-24 p-2 border rounded-md text-sm font-mono"
                    value={newTarget.body || ''}
                    onChange={(e) => setNewTarget(prev => ({ ...prev, body: e.target.value }))}
                    placeholder='{"query": "test"}'
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="target-expected-status">Förväntade statuskoder (kommaseparerade)</Label>
                <Input
                  id="target-expected-status"
                  value={statusInput}
                  onChange={(e) => {
                    setStatusInput(e.target.value);
                    try {
                      const statuses = e.target.value.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));
                      setNewTarget(prev => ({ ...prev, expected_status: statuses }));
                    } catch {
                      // Invalid format
                    }
                  }}
                  placeholder="200,201,202,204"
                />
              </div>
              
              <div>
                <Label htmlFor="target-expected-text">Förväntad text i svar (valfritt)</Label>
                <Input
                  id="target-expected-text"
                  value={newTarget.expected_text || ''}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, expected_text: e.target.value }))}
                  placeholder="success"
                />
              </div>
              
              <div>
                <Label htmlFor="target-timeout">Timeout (sekunder, valfritt)</Label>
                <Input
                  id="target-timeout"
                  type="number"
                  value={newTarget.timeout || ''}
                  onChange={(e) => setNewTarget(prev => ({ ...prev, timeout: e.target.value ? parseInt(e.target.value) : undefined }))}
                  placeholder="10"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Snabbmallar</h4>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewTarget({
                        name: 'Algolia Search Index',
                        url: 'https://APPLICATION_ID-dsn.algolia.net/1/indexes/INDEX_NAME/query',
                        type: 'http',
                        method: 'POST',
                        headers: {
                          'X-Algolia-Application-Id': 'YOUR_APPLICATION_ID',
                          'X-Algolia-API-Key': 'YOUR_SEARCH_API_KEY',
                          'Content-Type': 'application/json'
                        },
                        body: '{"query": "test", "hitsPerPage": 1}',
                        expected_status: [200],
                        enabled: true,
                      });
                      setHeaderInput(JSON.stringify({
                        'X-Algolia-Application-Id': 'YOUR_APPLICATION_ID',
                        'X-Algolia-API-Key': 'YOUR_SEARCH_API_KEY',
                        'Content-Type': 'application/json'
                      }, null, 2));
                      setStatusInput('200');
                    }}
                  >
                    🔍 Algolia Search API
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewTarget({
                        name: 'REST API Health Check',
                        url: 'https://api.example.com/health',
                        type: 'http',
                        method: 'GET',
                        headers: {
                          'Authorization': 'Bearer YOUR_TOKEN'
                        },
                        expected_status: [200],
                        expected_text: 'healthy',
                        enabled: true,
                      });
                      setHeaderInput(JSON.stringify({
                        'Authorization': 'Bearer YOUR_TOKEN'
                      }, null, 2));
                      setStatusInput('200');
                    }}
                  >
                    🏥 REST API Health
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewTarget({
                        name: 'GraphQL Endpoint',
                        url: 'https://api.example.com/graphql',
                        type: 'http',
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': 'Bearer YOUR_TOKEN'
                        },
                        body: '{"query": "{ __schema { types { name } } }"}',
                        expected_status: [200],
                        enabled: true,
                      });
                      setHeaderInput(JSON.stringify({
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer YOUR_TOKEN'
                      }, null, 2));
                      setStatusInput('200');
                    }}
                  >
                    📊 GraphQL API
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewTarget({
                        name: 'DigitalIdag Users Count',
                        url: 'mongodb+srv://app:YOUR_PASSWORD@digitalidag.khxg9ko.mongodb.net/digitalidag?retryWrites=true&w=majority&appName=DigitalIdag',
                        type: 'mongodb',
                        enabled: true,
                        mongodb_config: {
                          database: 'digitalidag',
                          collection: 'partners',
                          operation: 'count',
                          query: ''
                        }
                      });
                    }}
                  >
                    🗄️ MongoDB Users Count
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAddTarget(false)}>
              Avbryt
            </Button>
            <Button onClick={handleAddTarget}>
              Lägg till övervakning
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Target Dialog */}
      <Dialog open={showEditTarget} onOpenChange={setShowEditTarget}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingTarget?.name}</DialogTitle>
          </DialogHeader>
          {editingTarget && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Grundläggande</TabsTrigger>
                <TabsTrigger value="advanced">Avancerat</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="edit-target-name">Namn</Label>
                  <Input
                    id="edit-target-name"
                    value={editingTarget.name}
                    onChange={(e) => setEditingTarget(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    placeholder="Min API / webbplats"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-target-url">URL</Label>
                  <Input
                    id="edit-target-url"
                    value={editingTarget.url}
                    onChange={(e) => setEditingTarget(prev => prev ? ({ ...prev, url: e.target.value }) : null)}
                    placeholder="https://api.example.com/health"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-target-method">HTTP-metod</Label>
                  <Select
                    value={editingTarget.method || 'GET'}
                    onValueChange={(value: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS') => 
                      setEditingTarget(prev => prev ? ({ ...prev, method: value }) : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                      <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-target-enabled"
                    checked={editingTarget.enabled}
                    onCheckedChange={(enabled: boolean) => setEditingTarget(prev => prev ? ({ ...prev, enabled }) : null)}
                  />
                  <Label htmlFor="edit-target-enabled">Aktiverad</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label htmlFor="edit-target-headers">Headers (JSON format)</Label>
                  <textarea
                    id="edit-target-headers"
                    className="w-full h-24 p-2 border rounded-md text-sm font-mono"
                    value={headerInput}
                    onChange={(e) => {
                      setHeaderInput(e.target.value);
                      try {
                        const headers = JSON.parse(e.target.value);
                        setEditingTarget(prev => prev ? ({ ...prev, headers }) : null);
                      } catch {
                        // Invalid JSON, don't update target
                      }
                    }}
                    placeholder='{\n  "Authorization": "Bearer your-token"\n}'
                  />
                </div>
                
                {['POST', 'PUT', 'PATCH'].includes(editingTarget.method || 'GET') && (
                  <div>
                    <Label htmlFor="edit-target-body">Request Body</Label>
                    <textarea
                      id="edit-target-body"
                      className="w-full h-24 p-2 border rounded-md text-sm font-mono"
                      value={editingTarget.body || ''}
                      onChange={(e) => setEditingTarget(prev => prev ? ({ ...prev, body: e.target.value }) : null)}
                      placeholder='{"query": "test"}'
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="edit-target-expected-status">Förväntade statuskoder</Label>
                  <Input
                    id="edit-target-expected-status"
                    value={statusInput}
                    onChange={(e) => {
                      setStatusInput(e.target.value);
                      try {
                        const statuses = e.target.value.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));
                        setEditingTarget(prev => prev ? ({ ...prev, expected_status: statuses }) : null);
                      } catch {
                        // Invalid format
                      }
                    }}
                    placeholder="200,201,202,204"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-target-expected-text">Förväntad text i svar</Label>
                  <Input
                    id="edit-target-expected-text"
                    value={editingTarget.expected_text || ''}
                    onChange={(e) => setEditingTarget(prev => prev ? ({ ...prev, expected_text: e.target.value }) : null)}
                    placeholder="success"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-target-timeout">Timeout (sekunder)</Label>
                  <Input
                    id="edit-target-timeout"
                    type="number"
                    value={editingTarget.timeout || ''}
                    onChange={(e) => setEditingTarget(prev => prev ? ({ ...prev, timeout: e.target.value ? parseInt(e.target.value) : undefined }) : null)}
                    placeholder="10"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => {
                if (editingTarget) {
                  removeTarget(editingTarget.id);
                  setShowEditTarget(false);
                  setEditingTarget(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Ta bort
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowEditTarget(false)}>
                Avbryt
              </Button>
              <Button onClick={handleUpdateTarget}>
                Spara ändringar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inställningar för Uptime Monitor</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Allmänt</TabsTrigger>
              <TabsTrigger value="targets">Webbplatser</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interval">Kontrollintervall (minuter)</Label>
                  <Select
                    value={settings?.interval_minutes?.toString() || '5'}
                    onValueChange={(value) => updateSettings({ interval_minutes: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minut</SelectItem>
                      <SelectItem value="5">5 minuter</SelectItem>
                      <SelectItem value="10">10 minuter</SelectItem>
                      <SelectItem value="30">30 minuter</SelectItem>
                      <SelectItem value="60">1 timme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeout">Timeout (sekunder)</Label>
                  <Select
                    value={settings?.timeout_seconds?.toString() || '10'}
                    onValueChange={(value) => updateSettings({ timeout_seconds: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 sekunder</SelectItem>
                      <SelectItem value="10">10 sekunder</SelectItem>
                      <SelectItem value="30">30 sekunder</SelectItem>
                      <SelectItem value="60">60 sekunder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="retries">Antal återförsök</Label>
                  <Select
                    value={settings?.retries?.toString() || '3'}
                    onValueChange={(value) => updateSettings({ retries: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="monitoring-enabled"
                    checked={settings?.enabled || false}
                    onCheckedChange={(enabled: boolean) => updateSettings({ enabled })}
                  />
                  <Label htmlFor="monitoring-enabled">Aktivera övervakning</Label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="targets" className="space-y-4">
              <div className="space-y-3">
                {targets.map((target) => {
                  const stats = getUptimeStats(target.id);
                  return (
                    <div key={target.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={target.enabled}
                          onCheckedChange={(enabled: boolean) => updateTarget(target.id, { enabled })}
                        />
                        <div>
                          <div className="font-medium">{target.name}</div>
                          <div className="text-sm text-muted-foreground">{target.url}</div>
                          <div className="text-xs text-muted-foreground">
                            Uptime: {stats?.uptime_percentage?.toFixed(1) || '0.0'}% (24h)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => manualPing(target.id)}
                          title="Manuell kontroll"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTarget(target.id)}
                          title="Ta bort"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end">
            <Button onClick={() => setShowSettings(false)}>
              Stäng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
