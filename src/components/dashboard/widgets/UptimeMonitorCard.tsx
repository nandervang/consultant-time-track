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
    addTarget,
    updateTarget,
    removeTarget,
    updateSettings,
    startMonitoring,
    stopMonitoring,
    manualPing,
    getUptimeStats,
  } = usePingMonitor();

  const [showSettings, setShowSettings] = useState(false);
  const [showAddTarget, setShowAddTarget] = useState(false);
  const [newTarget, setNewTarget] = useState<Omit<PingTarget, 'id' | 'createdAt'>>({
    name: '',
    url: '',
    enabled: true,
  });

  const handleAddTarget = () => {
    if (newTarget.name && newTarget.url) {
      addTarget(newTarget);
      setNewTarget({ name: '', url: '', enabled: true });
      setShowAddTarget(false);
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
              Kontrollerar var {formatInterval(settings.interval)} • {settings.timeout}s timeout
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
            {targets.length > 0 ? (
              targets.map((target) => {
                const stats = getUptimeStats(target.id);
                return (
                  <div
                    key={target.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(stats.status)}`} />
                      <div>
                        <div className="font-medium text-sm">{target.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {target.url} • {formatLastCheck(stats.lastCheck)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        {getStatusIcon(stats.status)}
                        <span className="font-medium">{stats.uptime24h.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats.avgResponseTime > 0 && formatResponseTime(stats.avgResponseTime)}
                      </div>
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
                {isMonitoring && ` • Nästa kontroll: ${formatInterval(settings.interval)}`}
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
                  onClick={isMonitoring ? stopMonitoring : startMonitoring}
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

      {/* Add Target Dialog */}
      <Dialog open={showAddTarget} onOpenChange={setShowAddTarget}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till webbplats</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-name">Namn</Label>
              <Input
                id="target-name"
                value={newTarget.name}
                onChange={(e) => setNewTarget(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Min webbplats"
              />
            </div>
            <div>
              <Label htmlFor="target-url">URL</Label>
              <Input
                id="target-url"
                value={newTarget.url}
                onChange={(e) => setNewTarget(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="target-enabled"
                checked={newTarget.enabled}
                onCheckedChange={(enabled: boolean) => setNewTarget(prev => ({ ...prev, enabled }))}
              />
              <Label htmlFor="target-enabled">Aktiverad</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddTarget(false)}>
                Avbryt
              </Button>
              <Button onClick={handleAddTarget}>
                Lägg till
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
                    value={settings.interval.toString()}
                    onValueChange={(value) => updateSettings({ interval: parseInt(value) })}
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
                    value={settings.timeout.toString()}
                    onValueChange={(value) => updateSettings({ timeout: parseInt(value) })}
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
                    value={settings.retries.toString()}
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
                    checked={settings.enabled}
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
                            Uptime: {stats.uptime24h.toFixed(1)}% (24h)
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
