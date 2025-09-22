# Time Tracking Specification

**Spec ID:** 012-A  
**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

The Time Tracking system provides comprehensive work logging capabilities for consultant businesses, including manual time entry, automated timer functionality, detailed reporting, and seamless integration with project management and invoicing systems. It serves as the foundation for accurate billing, productivity analysis, and project cost tracking.

## Feature Requirements

### Functional Requirements

#### Core Time Tracking Capabilities

##### Manual Time Entry

- Intuitive time entry interface with date/time pickers and duration input
- Quick time logging with predefined time blocks (15min, 30min, 1h, 2h, etc.)
- Bulk time entry for multiple days with copy/paste functionality
- Time entry templates for recurring activities and common task types
- Retroactive time logging with approval workflows for past entries
- Time entry validation to prevent overlapping entries and unrealistic durations

##### Automated Timer System

- Start/stop timer with one-click operation and keyboard shortcuts
- Multiple concurrent timers for different projects and tasks
- Automatic idle detection with configurable timeout settings
- Smart pause/resume functionality when switching between applications
- Timer persistence across browser sessions and device restarts
- Background timer notifications and alerts for running timers

##### Smart Time Detection

- Automatic activity detection based on application usage
- Calendar integration to pre-populate time entries from meetings
- Email and communication time tracking with client association
- Intelligent time suggestions based on historical patterns
- Automatic break detection and exclusion from billable time
- Smart categorization of activities into billable/non-billable time

### Technical Specifications

#### Data Models

```typescript
interface TimeEntry {
  id: string;
  user_id: string;
  
  // Time information
  start_time: string; // ISO datetime
  end_time?: string; // ISO datetime, null for running timers
  duration_minutes: number; // Calculated or manually entered
  date: string; // YYYY-MM-DD for reporting grouping
  
  // Project and task association
  project_id?: string;
  task_id?: string;
  client_id?: string; // Derived from project or set directly
  
  // Activity details
  description: string;
  activity_type: 'development' | 'design' | 'meeting' | 'research' | 'documentation' | 'communication' | 'admin' | 'other';
  
  // Billing information
  is_billable: boolean;
  billable_hours?: number; // May differ from actual hours
  hourly_rate?: number; // Override project/client rate
  billing_status: 'pending' | 'billed' | 'paid' | 'non_billable';
  invoice_id?: string; // Reference when invoiced
  
  // Timer metadata
  timer_method: 'manual' | 'timer' | 'imported' | 'auto_detected';
  was_running: boolean; // True if entry was created from a running timer
  idle_time_minutes?: number; // Time excluded due to inactivity
  
  // Approval and validation
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  
  // Location and context
  location?: string; // Office, home, client site, etc.
  device_info?: DeviceInfo;
  timezone: string;
  
  // Tags and categorization
  tags: string[];
  category?: string; // Custom user categories
  
  // Metadata
  notes?: string;
  attachments: TimeEntryAttachment[];
  
  created_at: string;
  updated_at: string;
  deleted_at?: string; // Soft delete for audit trail
}

interface DeviceInfo {
  device_type: 'desktop' | 'mobile' | 'tablet';
  operating_system: string;
  browser?: string;
  ip_address?: string; // For location tracking if enabled
}

interface TimeEntryAttachment {
  id: string;
  name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

interface ActiveTimer {
  id: string;
  user_id: string;
  
  // Timer state
  start_time: string;
  current_duration_minutes: number; // Updated in real-time
  is_paused: boolean;
  pause_start?: string;
  total_pause_minutes: number;
  
  // Associated work
  project_id?: string;
  task_id?: string;
  description: string;
  activity_type: TimeEntry['activity_type'];
  
  // Settings
  auto_pause_enabled: boolean;
  idle_threshold_minutes: number;
  
  // Notifications
  reminder_intervals: number[]; // Minutes for reminders
  last_reminder?: string;
  
  created_at: string;
  updated_at: string;
}

interface TimeTrackingSettings {
  id: string;
  user_id: string;
  
  // Timer preferences
  default_timer_duration?: number; // Auto-stop after X hours
  auto_start_timer: boolean;
  auto_pause_on_idle: boolean;
  idle_threshold_minutes: number;
  
  // Time entry preferences
  default_activity_type: TimeEntry['activity_type'];
  require_description: boolean;
  require_project_association: boolean;
  allow_overlapping_entries: boolean;
  time_rounding_increment: number; // Round to nearest X minutes
  
  // Billing preferences
  default_billable_status: boolean;
  require_billing_approval: boolean;
  auto_mark_admin_non_billable: boolean;
  
  // Notification preferences
  timer_reminders_enabled: boolean;
  daily_summary_enabled: boolean;
  weekly_report_enabled: boolean;
  reminder_intervals: number[];
  
  // Integration settings
  calendar_integration_enabled: boolean;
  calendar_provider?: 'google' | 'outlook' | 'apple';
  email_time_tracking_enabled: boolean;
  
  // Work schedule
  work_schedule: WorkSchedule;
  timezone: string;
  
  created_at: string;
  updated_at: string;
}

interface WorkSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface DaySchedule {
  is_work_day: boolean;
  start_time?: string; // HH:MM format
  end_time?: string; // HH:MM format
  break_duration_minutes?: number;
  target_hours?: number;
}

interface TimeReport {
  id: string;
  user_id: string;
  
  // Report configuration
  name: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'custom' | 'project' | 'client';
  date_range: {
    start_date: string;
    end_date: string;
  };
  
  // Filters
  filters: {
    project_ids?: string[];
    client_ids?: string[];
    activity_types?: TimeEntry['activity_type'][];
    billing_status?: TimeEntry['billing_status'][];
    is_billable?: boolean;
    tags?: string[];
  };
  
  // Report data
  summary: TimeReportSummary;
  detailed_entries: TimeEntry[];
  charts_data: TimeChartsData;
  
  // Settings
  is_scheduled: boolean;
  schedule_frequency?: 'daily' | 'weekly' | 'monthly';
  recipients: string[]; // Email addresses
  include_charts: boolean;
  include_details: boolean;
  
  generated_at: string;
  created_at: string;
}

interface TimeReportSummary {
  total_hours: number;
  billable_hours: number;
  non_billable_hours: number;
  total_revenue: number;
  average_hourly_rate: number;
  
  // Breakdown by category
  by_project: ProjectTimeSummary[];
  by_client: ClientTimeSummary[];
  by_activity_type: ActivityTypeSummary[];
  by_day: DailyTimeSummary[];
  
  // Productivity metrics
  most_productive_day: string;
  average_daily_hours: number;
  overtime_hours: number;
  utilization_rate: number; // Billable hours / total work hours
}

interface ProjectTimeSummary {
  project_id: string;
  project_name: string;
  client_name: string;
  total_hours: number;
  billable_hours: number;
  revenue: number;
  progress_percentage: number;
  budget_utilization: number;
}

interface ClientTimeSummary {
  client_id: string;
  client_name: string;
  total_hours: number;
  billable_hours: number;
  revenue: number;
  project_count: number;
  average_hourly_rate: number;
}
```

#### Time Tracking Hook

```typescript
export const useTimeTracking = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [settings, setSettings] = useState<TimeTrackingSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const startTimer = useCallback(async (
    timerData: Omit<ActiveTimer, 'id' | 'user_id' | 'start_time' | 'current_duration_minutes' | 'total_pause_minutes' | 'is_paused' | 'created_at' | 'updated_at'>
  ) => {
    setLoading(true);
    try {
      // Stop any existing timers if single-timer mode
      if (settings?.single_timer_mode) {
        await stopAllActiveTimers();
      }

      const { data, error } = await supabase
        .from('active_timers')
        .insert([{
          ...timerData,
          user_id: getCurrentUserId(),
          start_time: new Date().toISOString(),
          current_duration_minutes: 0,
          total_pause_minutes: 0,
          is_paused: false
        }])
        .select()
        .single();

      if (error) throw error;

      setActiveTimers(prev => [...prev, data]);

      // Start real-time duration updates
      startTimerUpdates(data.id);

      // Schedule auto-pause if enabled
      if (data.auto_pause_enabled) {
        scheduleIdleDetection(data.id);
      }

      // Schedule reminders
      scheduleTimerReminders(data.id, data.reminder_intervals);

      return data;
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [settings]);

  const stopTimer = useCallback(async (
    timerId: string,
    entryData?: Partial<Omit<TimeEntry, 'id' | 'user_id' | 'start_time' | 'end_time' | 'duration_minutes'>>
  ) => {
    const timer = activeTimers.find(t => t.id === timerId);
    if (!timer) throw new Error('Timer not found');

    const endTime = new Date();
    const totalMinutes = Math.round(
      (endTime.getTime() - new Date(timer.start_time).getTime()) / (1000 * 60)
    ) - timer.total_pause_minutes;

    // Create time entry from timer
    const timeEntry = await createTimeEntry({
      start_time: timer.start_time,
      end_time: endTime.toISOString(),
      duration_minutes: totalMinutes,
      date: format(new Date(timer.start_time), 'yyyy-MM-dd'),
      project_id: timer.project_id,
      task_id: timer.task_id,
      description: timer.description,
      activity_type: timer.activity_type,
      is_billable: settings?.default_billable_status ?? true,
      timer_method: 'timer',
      was_running: true,
      idle_time_minutes: timer.total_pause_minutes,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...entryData
    });

    // Remove active timer
    await supabase
      .from('active_timers')
      .delete()
      .eq('id', timerId);

    setActiveTimers(prev => prev.filter(t => t.id !== timerId));

    // Clear timer intervals
    clearTimerUpdates(timerId);
    clearTimerReminders(timerId);

    return timeEntry;
  }, [activeTimers, settings]);

  const pauseTimer = useCallback(async (timerId: string) => {
    const { error } = await supabase
      .from('active_timers')
      .update({
        is_paused: true,
        pause_start: new Date().toISOString()
      })
      .eq('id', timerId);

    if (error) throw error;

    setActiveTimers(prev => prev.map(timer =>
      timer.id === timerId 
        ? { ...timer, is_paused: true, pause_start: new Date().toISOString() }
        : timer
    ));
  }, []);

  const resumeTimer = useCallback(async (timerId: string) => {
    const timer = activeTimers.find(t => t.id === timerId);
    if (!timer?.pause_start) return;

    const pauseDuration = Math.round(
      (new Date().getTime() - new Date(timer.pause_start).getTime()) / (1000 * 60)
    );

    const { error } = await supabase
      .from('active_timers')
      .update({
        is_paused: false,
        pause_start: null,
        total_pause_minutes: timer.total_pause_minutes + pauseDuration
      })
      .eq('id', timerId);

    if (error) throw error;

    setActiveTimers(prev => prev.map(t =>
      t.id === timerId 
        ? { 
            ...t, 
            is_paused: false, 
            pause_start: undefined,
            total_pause_minutes: t.total_pause_minutes + pauseDuration
          }
        : t
    ));
  }, [activeTimers]);

  const createTimeEntry = useCallback(async (
    entryData: Omit<TimeEntry, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'client_id' | 'billing_status' | 'status'>
  ) => {
    setLoading(true);
    try {
      // Derive client_id from project if not provided
      let client_id = entryData.client_id;
      if (entryData.project_id && !client_id) {
        const { data: project } = await supabase
          .from('projects')
          .select('client_id')
          .eq('id', entryData.project_id)
          .single();
        client_id = project?.client_id;
      }

      // Apply time rounding if configured
      const roundedDuration = settings?.time_rounding_increment 
        ? Math.round(entryData.duration_minutes / settings.time_rounding_increment) * settings.time_rounding_increment
        : entryData.duration_minutes;

      // Determine billing status
      const billing_status = entryData.is_billable ? 'pending' : 'non_billable';

      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          ...entryData,
          user_id: getCurrentUserId(),
          client_id,
          duration_minutes: roundedDuration,
          billing_status,
          status: settings?.require_billing_approval ? 'draft' : 'approved',
          tags: entryData.tags || []
        }])
        .select()
        .single();

      if (error) throw error;

      setTimeEntries(prev => [...prev, data]);

      // Update project actual hours
      if (data.project_id) {
        await updateProjectHours(data.project_id, roundedDuration);
      }

      // Create cash flow impact
      if (data.is_billable && data.hourly_rate) {
        await createCashFlowImpact({
          type: 'revenue',
          amount: (roundedDuration / 60) * data.hourly_rate,
          date: data.date,
          source: 'time_tracking',
          reference_id: data.id,
          project_id: data.project_id
        });
      }

      return data;
    } catch (error) {
      console.error('Failed to create time entry:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [settings]);

  const updateTimeEntry = useCallback(async (
    entryId: string,
    updates: Partial<TimeEntry>
  ) => {
    const { error } = await supabase
      .from('time_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId);

    if (error) throw error;

    setTimeEntries(prev => prev.map(entry =>
      entry.id === entryId ? { ...entry, ...updates } : entry
    ));

    // Update related calculations if duration changed
    if (updates.duration_minutes) {
      const entry = timeEntries.find(e => e.id === entryId);
      if (entry?.project_id) {
        const durationDiff = updates.duration_minutes - entry.duration_minutes;
        await updateProjectHours(entry.project_id, durationDiff);
      }
    }
  }, [timeEntries]);

  const deleteTimeEntry = useCallback(async (entryId: string) => {
    const entry = timeEntries.find(e => e.id === entryId);
    if (!entry) return;

    // Soft delete to maintain audit trail
    await supabase
      .from('time_entries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', entryId);

    setTimeEntries(prev => prev.filter(e => e.id !== entryId));

    // Update project hours
    if (entry.project_id) {
      await updateProjectHours(entry.project_id, -entry.duration_minutes);
    }
  }, [timeEntries]);

  const generateTimeReport = useCallback(async (
    reportConfig: Omit<TimeReport, 'id' | 'user_id' | 'summary' | 'detailed_entries' | 'charts_data' | 'generated_at' | 'created_at'>
  ) => {
    setLoading(true);
    try {
      // Fetch time entries based on filters
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          project:projects(name, client:clients(name)),
          task:tasks(title)
        `)
        .eq('user_id', getCurrentUserId())
        .gte('date', reportConfig.date_range.start_date)
        .lte('date', reportConfig.date_range.end_date)
        .is('deleted_at', null);

      // Apply filters
      if (reportConfig.filters.project_ids?.length) {
        query = query.in('project_id', reportConfig.filters.project_ids);
      }
      if (reportConfig.filters.client_ids?.length) {
        query = query.in('client_id', reportConfig.filters.client_ids);
      }
      if (reportConfig.filters.activity_types?.length) {
        query = query.in('activity_type', reportConfig.filters.activity_types);
      }
      if (reportConfig.filters.billing_status?.length) {
        query = query.in('billing_status', reportConfig.filters.billing_status);
      }
      if (reportConfig.filters.is_billable !== undefined) {
        query = query.eq('is_billable', reportConfig.filters.is_billable);
      }

      const { data: entries, error } = await query;
      if (error) throw error;

      // Generate report summary
      const summary = generateReportSummary(entries);

      // Generate charts data
      const charts_data = generateChartsData(entries, reportConfig.date_range);

      const report: TimeReport = {
        ...reportConfig,
        id: generateId(),
        user_id: getCurrentUserId(),
        summary,
        detailed_entries: entries,
        charts_data,
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      return report;
    } catch (error) {
      console.error('Failed to generate time report:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    timeEntries,
    activeTimers,
    settings,
    loading,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    generateTimeReport,
    refreshData: () => Promise.all([fetchTimeEntries(), fetchActiveTimers(), fetchSettings()])
  };
};
```

### User Interface Specifications

#### Timer Interface

```typescript
const TimerWidget = () => {
  const { activeTimers, startTimer, stopTimer, pauseTimer, resumeTimer } = useTimeTracking();
  const [newTimerData, setNewTimerData] = useState({
    description: '',
    project_id: '',
    task_id: '',
    activity_type: 'development' as TimeEntry['activity_type']
  });

  const currentTimer = activeTimers[0]; // Primary timer
  const [currentDuration, setCurrentDuration] = useState(0);

  // Update timer display every second
  useEffect(() => {
    if (currentTimer && !currentTimer.is_paused) {
      const interval = setInterval(() => {
        const elapsed = Math.floor(
          (new Date().getTime() - new Date(currentTimer.start_time).getTime()) / (1000 * 60)
        ) - currentTimer.total_pause_minutes;
        setCurrentDuration(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentTimer]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async () => {
    if (!newTimerData.description.trim()) return;

    await startTimer({
      ...newTimerData,
      auto_pause_enabled: true,
      idle_threshold_minutes: 5,
      reminder_intervals: [30, 60, 120] // 30min, 1h, 2h reminders
    });

    // Reset form
    setNewTimerData({
      description: '',
      project_id: '',
      task_id: '',
      activity_type: 'development'
    });
  };

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracker
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {currentTimer ? (
          <>
            {/* Active timer display */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-mono font-bold">
                {formatDuration(currentDuration)}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {currentTimer.description}
              </div>

              {currentTimer.project_id && (
                <Badge variant="outline" className="text-xs">
                  {/* Project name would be fetched and displayed */}
                  Project
                </Badge>
              )}

              <div className="flex items-center justify-center gap-1">
                {currentTimer.is_paused ? (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => resumeTimer(currentTimer.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => stopTimer(currentTimer.id)}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => pauseTimer(currentTimer.id)}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => stopTimer(currentTimer.id)}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  </>
                )}
              </div>

              {currentTimer.is_paused && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Timer is paused. Total pause time: {formatDuration(currentTimer.total_pause_minutes)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        ) : (
          <>
            {/* New timer form */}
            <div className="space-y-3">
              <Input
                placeholder="What are you working on?"
                value={newTimerData.description}
                onChange={(e) => setNewTimerData(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleStartTimer();
                  }
                }}
              />

              <div className="grid grid-cols-2 gap-2">
                <ProjectSelect
                  value={newTimerData.project_id}
                  onChange={(value) => setNewTimerData(prev => ({
                    ...prev,
                    project_id: value,
                    task_id: '' // Reset task when project changes
                  }))}
                  placeholder="Select project"
                />

                <TaskSelect
                  projectId={newTimerData.project_id}
                  value={newTimerData.task_id}
                  onChange={(value) => setNewTimerData(prev => ({
                    ...prev,
                    task_id: value
                  }))}
                  placeholder="Select task"
                />
              </div>

              <Select
                value={newTimerData.activity_type}
                onValueChange={(value) => setNewTimerData(prev => ({
                  ...prev,
                  activity_type: value as TimeEntry['activity_type']
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleStartTimer}
                disabled={!newTimerData.description.trim()}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            </div>

            {/* Quick start buttons */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Quick Start
              </div>
              <div className="grid grid-cols-2 gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewTimerData(prev => ({
                    ...prev,
                    description: 'Development work',
                    activity_type: 'development'
                  }))}
                >
                  Development
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewTimerData(prev => ({
                    ...prev,
                    description: 'Client meeting',
                    activity_type: 'meeting'
                  }))}
                >
                  Meeting
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewTimerData(prev => ({
                    ...prev,
                    description: 'Research and planning',
                    activity_type: 'research'
                  }))}
                >
                  Research
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewTimerData(prev => ({
                    ...prev,
                    description: 'Documentation',
                    activity_type: 'documentation'
                  }))}
                >
                  Docs
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
```

#### Time Entries Management

```typescript
const TimeEntriesPage = () => {
  const { timeEntries, updateTimeEntry, deleteTimeEntry } = useTimeTracking();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [showManualEntry, setShowManualEntry] = useState(false);

  const filteredEntries = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return timeEntries.filter(entry => {
      const matchesDate = viewMode === 'daily' 
        ? entry.date === dateStr
        : isWithinInterval(new Date(entry.date), {
            start: startOfWeek(selectedDate),
            end: endOfWeek(selectedDate)
          });
      
      const matchesProject = filterProject === 'all' || entry.project_id === filterProject;
      
      return matchesDate && matchesProject;
    });
  }, [timeEntries, selectedDate, viewMode, filterProject]);

  const dailyTotal = useMemo(() => {
    return filteredEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0);
  }, [filteredEntries]);

  const billableTotal = useMemo(() => {
    return filteredEntries
      .filter(entry => entry.is_billable)
      .reduce((sum, entry) => sum + entry.duration_minutes, 0);
  }, [filteredEntries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Entries</h1>
          <p className="text-muted-foreground">
            Track and manage your work time
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowManualEntry(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(dailyTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {viewMode === 'daily' ? 'Today' : 'This week'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(billableTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailyTotal > 0 ? Math.round((billableTotal / dailyTotal) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entries</CardTitle>
            <ListIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredEntries.length}</div>
            <p className="text-xs text-muted-foreground">
              Time entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredEntries
                  .filter(entry => entry.is_billable && entry.hourly_rate)
                  .reduce((sum, entry) => 
                    sum + ((entry.duration_minutes / 60) * (entry.hourly_rate || 0)), 0
                  )
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Potential revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <DatePicker
              date={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>

          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>

          <ProjectSelect
            value={filterProject}
            onChange={setFilterProject}
            placeholder="All projects"
            includeAllOption
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('daily')}
          >
            Day
          </Button>
          <Button
            variant={viewMode === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('weekly')}
          >
            Week
          </Button>
        </div>
      </div>

      {/* Time entries */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === 'daily' 
              ? format(selectedDate, 'EEEE, MMMM do, yyyy')
              : `Week of ${format(startOfWeek(selectedDate), 'MMMM do, yyyy')}`
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No time entries</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking time or add a manual entry to get started.
              </p>
              <Button onClick={() => setShowManualEntry(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry) => (
                <TimeEntryRow
                  key={entry.id}
                  entry={entry}
                  onUpdate={updateTimeEntry}
                  onDelete={deleteTimeEntry}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual entry dialog */}
      <ManualTimeEntryDialog
        open={showManualEntry}
        onOpenChange={setShowManualEntry}
        defaultDate={selectedDate}
      />
    </div>
  );
};
```

### Database Schema

#### Time Tracking Tables

```sql
-- Main time entries table
CREATE TABLE time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Time information
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  date DATE NOT NULL, -- For easier querying and grouping
  
  -- Project and task association
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Activity details
  description TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('development', 'design', 'meeting', 'research', 'documentation', 'communication', 'admin', 'other')),
  
  -- Billing information
  is_billable BOOLEAN NOT NULL DEFAULT TRUE,
  billable_hours DECIMAL(8,2), -- May differ from duration_minutes/60
  hourly_rate DECIMAL(10,2),
  billing_status TEXT DEFAULT 'pending' CHECK (billing_status IN ('pending', 'billed', 'paid', 'non_billable')),
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Timer metadata
  timer_method TEXT DEFAULT 'manual' CHECK (timer_method IN ('manual', 'timer', 'imported', 'auto_detected')),
  was_running BOOLEAN DEFAULT FALSE,
  idle_time_minutes INTEGER DEFAULT 0,
  
  -- Approval and validation
  status TEXT DEFAULT 'approved' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Location and context
  location TEXT,
  device_info JSONB,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  
  -- Tags and categorization
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  
  -- Metadata
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete for audit trail
);

-- Time entry attachments table
CREATE TABLE time_entry_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active timers table
CREATE TABLE active_timers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timer state
  start_time TIMESTAMPTZ NOT NULL,
  current_duration_minutes INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT FALSE,
  pause_start TIMESTAMPTZ,
  total_pause_minutes INTEGER DEFAULT 0,
  
  -- Associated work
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('development', 'design', 'meeting', 'research', 'documentation', 'communication', 'admin', 'other')),
  
  -- Settings
  auto_pause_enabled BOOLEAN DEFAULT TRUE,
  idle_threshold_minutes INTEGER DEFAULT 5,
  
  -- Notifications
  reminder_intervals INTEGER[] DEFAULT '{30, 60, 120}',
  last_reminder TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time tracking settings table
CREATE TABLE time_tracking_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Timer preferences
  default_timer_duration INTEGER, -- Auto-stop after X hours
  auto_start_timer BOOLEAN DEFAULT FALSE,
  auto_pause_on_idle BOOLEAN DEFAULT TRUE,
  idle_threshold_minutes INTEGER DEFAULT 5,
  
  -- Time entry preferences
  default_activity_type TEXT DEFAULT 'development' CHECK (default_activity_type IN ('development', 'design', 'meeting', 'research', 'documentation', 'communication', 'admin', 'other')),
  require_description BOOLEAN DEFAULT TRUE,
  require_project_association BOOLEAN DEFAULT FALSE,
  allow_overlapping_entries BOOLEAN DEFAULT FALSE,
  time_rounding_increment INTEGER DEFAULT 0, -- 0 = no rounding, otherwise round to nearest X minutes
  
  -- Billing preferences
  default_billable_status BOOLEAN DEFAULT TRUE,
  require_billing_approval BOOLEAN DEFAULT FALSE,
  auto_mark_admin_non_billable BOOLEAN DEFAULT TRUE,
  
  -- Notification preferences
  timer_reminders_enabled BOOLEAN DEFAULT TRUE,
  daily_summary_enabled BOOLEAN DEFAULT TRUE,
  weekly_report_enabled BOOLEAN DEFAULT FALSE,
  reminder_intervals INTEGER[] DEFAULT '{30, 60, 120}',
  
  -- Integration settings
  calendar_integration_enabled BOOLEAN DEFAULT FALSE,
  calendar_provider TEXT CHECK (calendar_provider IN ('google', 'outlook', 'apple')),
  email_time_tracking_enabled BOOLEAN DEFAULT FALSE,
  
  -- Work schedule
  work_schedule JSONB DEFAULT '{
    "monday": {"is_work_day": true, "start_time": "09:00", "end_time": "17:00", "target_hours": 8},
    "tuesday": {"is_work_day": true, "start_time": "09:00", "end_time": "17:00", "target_hours": 8},
    "wednesday": {"is_work_day": true, "start_time": "09:00", "end_time": "17:00", "target_hours": 8},
    "thursday": {"is_work_day": true, "start_time": "09:00", "end_time": "17:00", "target_hours": 8},
    "friday": {"is_work_day": true, "start_time": "09:00", "end_time": "17:00", "target_hours": 8},
    "saturday": {"is_work_day": false},
    "sunday": {"is_work_day": false}
  }',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Indexes and Constraints

```sql
-- Performance indexes
CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, date DESC);
CREATE INDEX idx_time_entries_project ON time_entries(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_time_entries_client ON time_entries(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_time_entries_billing ON time_entries(billing_status, is_billable);
CREATE INDEX idx_time_entries_status ON time_entries(status) WHERE status != 'approved';
CREATE INDEX idx_time_entries_invoice ON time_entries(invoice_id) WHERE invoice_id IS NOT NULL;

-- Active timers indexes
CREATE INDEX idx_active_timers_user ON active_timers(user_id);
CREATE INDEX idx_active_timers_start_time ON active_timers(start_time);

-- Time range queries
CREATE INDEX idx_time_entries_date_range ON time_entries(date, user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_time_entries_start_time_range ON time_entries(start_time, user_id) WHERE deleted_at IS NULL;

-- GIN indexes for arrays and JSON
CREATE INDEX idx_time_entries_tags ON time_entries USING GIN(tags);
CREATE INDEX idx_active_timers_reminders ON active_timers USING GIN(reminder_intervals);

-- Text search
CREATE INDEX idx_time_entries_search ON time_entries USING GIN(
  to_tsvector('english', description || ' ' || COALESCE(notes, ''))
);

-- Unique constraints
CREATE UNIQUE INDEX idx_time_tracking_settings_user ON time_tracking_settings(user_id);

-- Check constraints for business rules
ALTER TABLE time_entries ADD CONSTRAINT check_end_time_after_start 
  CHECK (end_time IS NULL OR end_time > start_time);

ALTER TABLE time_entries ADD CONSTRAINT check_billable_hours_positive 
  CHECK (billable_hours IS NULL OR billable_hours >= 0);

ALTER TABLE active_timers ADD CONSTRAINT check_pause_logic 
  CHECK ((is_paused = FALSE AND pause_start IS NULL) OR (is_paused = TRUE AND pause_start IS NOT NULL));
```

#### Row Level Security

```sql
-- Enable RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking_settings ENABLE ROW LEVEL SECURITY;

-- Time entries policies
CREATE POLICY "Users can access own time entries" 
ON time_entries FOR ALL 
USING (auth.uid() = user_id);

-- Time entry attachments policies
CREATE POLICY "Users can access attachments for own time entries" 
ON time_entry_attachments FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM time_entries 
    WHERE time_entries.id = time_entry_attachments.time_entry_id 
    AND time_entries.user_id = auth.uid()
  )
);

-- Active timers policies
CREATE POLICY "Users can access own active timers" 
ON active_timers FOR ALL 
USING (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "Users can access own time tracking settings" 
ON time_tracking_settings FOR ALL 
USING (auth.uid() = user_id);
```

### Business Logic

#### Time Validation and Processing

```sql
-- Function to validate time entry overlaps
CREATE OR REPLACE FUNCTION check_time_entry_overlap(
  p_user_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_entry_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  overlap_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO overlap_count
  FROM time_entries
  WHERE user_id = p_user_id
    AND deleted_at IS NULL
    AND (p_entry_id IS NULL OR id != p_entry_id)
    AND end_time IS NOT NULL
    AND (
      (start_time < p_end_time AND end_time > p_start_time)
    );
  
  RETURN overlap_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate billable hours
CREATE OR REPLACE FUNCTION calculate_billable_hours(
  p_duration_minutes INTEGER,
  p_activity_type TEXT,
  p_auto_mark_admin_non_billable BOOLEAN DEFAULT TRUE
) RETURNS DECIMAL AS $$
BEGIN
  -- Auto-mark admin tasks as non-billable if configured
  IF p_auto_mark_admin_non_billable AND p_activity_type = 'admin' THEN
    RETURN 0;
  END IF;
  
  -- Convert minutes to hours with 2 decimal precision
  RETURN ROUND((p_duration_minutes::DECIMAL / 60), 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update project hours when time is logged
CREATE OR REPLACE FUNCTION update_project_hours_from_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    UPDATE projects 
    SET actual_hours = COALESCE(actual_hours, 0) + (NEW.duration_minutes / 60.0)
    WHERE id = NEW.project_id;
    
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Only update if project_id or duration changed
    IF OLD.project_id != NEW.project_id OR OLD.duration_minutes != NEW.duration_minutes THEN
      -- Remove hours from old project
      IF OLD.project_id IS NOT NULL THEN
        UPDATE projects 
        SET actual_hours = GREATEST(0, COALESCE(actual_hours, 0) - (OLD.duration_minutes / 60.0))
        WHERE id = OLD.project_id;
      END IF;
      
      -- Add hours to new project
      IF NEW.project_id IS NOT NULL THEN
        UPDATE projects 
        SET actual_hours = COALESCE(actual_hours, 0) + (NEW.duration_minutes / 60.0)
        WHERE id = NEW.project_id;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE (including soft delete)
  IF TG_OP = 'UPDATE' AND OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE projects 
    SET actual_hours = GREATEST(0, COALESCE(actual_hours, 0) - (OLD.duration_minutes / 60.0))
    WHERE id = OLD.project_id;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for project hours updates
CREATE TRIGGER trigger_update_project_hours 
  AFTER INSERT OR UPDATE OR DELETE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_project_hours_from_time();
```

### Integration with Other Systems

#### Project Management Integration

```typescript
// Auto-update task progress based on time logged
const updateTaskProgressFromTimeEntry = async (timeEntry: TimeEntry) => {
  if (!timeEntry.task_id) return;

  const { data: task } = await supabase
    .from('tasks')
    .select('estimated_hours, actual_hours')
    .eq('id', timeEntry.task_id)
    .single();

  if (task && task.estimated_hours) {
    const progressPercentage = Math.min(
      Math.round((task.actual_hours / task.estimated_hours) * 100),
      100
    );

    await supabase
      .from('tasks')
      .update({ progress_percentage: progressPercentage })
      .eq('id', timeEntry.task_id);

    // Auto-complete task if it reaches estimated hours
    if (task.actual_hours >= task.estimated_hours && progressPercentage === 100) {
      await supabase
        .from('tasks')
        .update({ status: 'review' })
        .eq('id', timeEntry.task_id);
    }
  }
};
```

#### Invoice Integration

```typescript
// Include time entries in invoice generation
const generateInvoiceFromTimeEntries = async (
  clientId: string,
  projectId: string,
  dateRange: { start: string; end: string }
) => {
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('client_id', clientId)
    .eq('project_id', projectId)
    .eq('is_billable', true)
    .eq('billing_status', 'pending')
    .gte('date', dateRange.start)
    .lte('date', dateRange.end);

  if (!timeEntries?.length) return null;

  // Group entries by hourly rate
  const rateGroups = timeEntries.reduce((groups, entry) => {
    const rate = entry.hourly_rate || 0;
    if (!groups[rate]) {
      groups[rate] = [];
    }
    groups[rate].push(entry);
    return groups;
  }, {} as Record<number, TimeEntry[]>);

  // Create invoice items
  const invoiceItems = Object.entries(rateGroups).map(([rate, entries]) => {
    const totalHours = entries.reduce((sum, entry) => 
      sum + (entry.billable_hours || entry.duration_minutes / 60), 0
    );
    
    return {
      description: `Professional services - ${entries.length} time entries`,
      quantity: totalHours,
      unit_price: parseFloat(rate),
      total: totalHours * parseFloat(rate),
      time_entry_ids: entries.map(e => e.id)
    };
  });

  return invoiceItems;
};
```

### Performance Optimizations

#### Query Optimization

```typescript
// Optimized time entry queries with proper indexing
const getTimeEntriesOptimized = async (filters: {
  userId: string;
  dateRange?: { start: string; end: string };
  projectIds?: string[];
  limit?: number;
}) => {
  let query = supabase
    .from('time_entries')
    .select(`
      id,
      start_time,
      end_time,
      duration_minutes,
      description,
      activity_type,
      is_billable,
      billing_status,
      project:projects(id, name, client:clients(name)),
      task:tasks(id, title)
    `)
    .eq('user_id', filters.userId)
    .is('deleted_at', null)
    .order('start_time', { ascending: false });

  if (filters.dateRange) {
    query = query
      .gte('date', filters.dateRange.start)
      .lte('date', filters.dateRange.end);
  }

  if (filters.projectIds?.length) {
    query = query.in('project_id', filters.projectIds);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  return query;
};
```

### Testing Requirements

#### Unit Tests

```typescript
describe('Time Tracking', () => {
  it('creates time entries with correct data');
  it('validates time entry overlaps');
  it('calculates billable hours correctly');
  it('handles timer start/stop operations');
  it('applies time rounding rules');
  it('manages soft deletion properly');
});

describe('Timer Operations', () => {
  it('starts and stops timers accurately');
  it('handles pause and resume functionality');
  it('detects idle time correctly');
  it('manages multiple concurrent timers');
});
```

#### Integration Tests

```typescript
describe('Time Tracking Integration', () => {
  it('updates project hours when time is logged');
  it('integrates with invoice generation');
  it('maintains task progress synchronization');
  it('handles concurrent timer operations');
});
```

---

This specification ensures the Time Tracking system provides comprehensive work logging capabilities while maintaining integration with project management, invoicing, and business intelligence systems.