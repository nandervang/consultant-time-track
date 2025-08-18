import { useState, useEffect } from 'react';
import { DashboardWidget } from '@/types/dashboard';
import { supabase, Database } from '@/lib/supabase';

type WidgetRow = Database['public']['Tables']['dashboard_widgets']['Row'];
type WidgetInsert = Database['public']['Tables']['dashboard_widgets']['Insert'];

export function useWidgets(userId: string | null) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default widgets configuration for new users
  const defaultWidgets: Omit<WidgetInsert, 'user_id'>[] = [
    {
      widget_type: 'company-motto',
      title: 'Company Motto',
      position_x: 0,
      position_y: 0,
      width: 3,
      height: 1,
      config: { motto: 'Building the future, one project at a time.' }
    },
    {
      widget_type: 'monthly-expenses',
      title: 'Monthly Expenses',
      position_x: 0,
      position_y: 1,
      width: 1,
      height: 1,
    },
    {
      widget_type: 'time-logged',
      title: 'Time Logged',
      position_x: 1,
      position_y: 1,
      width: 1,
      height: 1,
    },
    {
      widget_type: 'quick-stats',
      title: 'Quick Stats',
      position_x: 2,
      position_y: 1,
      width: 1,
      height: 1,
    },
    {
      widget_type: 'revenue-chart',
      title: 'Revenue Chart',
      position_x: 0,
      position_y: 2,
      width: 2,
      height: 1,
    },
    {
      widget_type: 'recent-activities',
      title: 'Recent Activities',
      position_x: 2,
      position_y: 2,
      width: 1,
      height: 1,
    },
    {
      widget_type: 'projects-overview',
      title: 'Projects Overview',
      position_x: 0,
      position_y: 3,
      width: 2,
      height: 1,
    },
    {
      widget_type: 'cash-flow',
      title: 'Cash Flow',
      position_x: 2,
      position_y: 3,
      width: 1,
      height: 1,
    },
    {
      widget_type: 'cash-flow-projections',
      title: 'Cash Flow Projections',
      position_x: 0,
      position_y: 4,
      width: 2,
      height: 1,
    },
  ];

  // Convert Supabase row to DashboardWidget
  const convertRowToWidget = (row: WidgetRow): DashboardWidget => ({
    id: row.id,
    type: row.widget_type,
    title: row.title,
    size: { w: row.width as 1 | 2 | 3, h: row.height },
    position: { x: row.position_x, y: row.position_y, w: row.width, h: row.height },
    config: row.config,
  });

  // Fetch widgets from Supabase
  const fetchWidgets = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_visible', true)
        .order('position_y', { ascending: true })
        .order('position_x', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Create default widgets for new users
        await createDefaultWidgets();
        return;
      }

      const dashboardWidgets = data.map(convertRowToWidget);
      setWidgets(dashboardWidgets);
    } catch (err) {
      console.error('Error fetching widgets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load widgets');
      // Fallback to localStorage for offline functionality
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // Create default widgets for new users
  const createDefaultWidgets = async () => {
    if (!userId) return;

    try {
      const widgetsToInsert = defaultWidgets.map(widget => ({
        ...widget,
        user_id: userId
      }));

      const { data, error } = await supabase
        .from('dashboard_widgets')
        .insert(widgetsToInsert)
        .select();

      if (error) throw error;

      const dashboardWidgets = data.map(convertRowToWidget);
      setWidgets(dashboardWidgets);
    } catch (err) {
      console.error('Error creating default widgets:', err);
      // Fallback to localStorage
      loadFromLocalStorage();
    }
  };

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    const savedWidgets = localStorage.getItem(`widgets_${userId}`);
    if (savedWidgets) {
      try {
        setWidgets(JSON.parse(savedWidgets));
      } catch (error) {
        console.error('Error loading widgets from localStorage:', error);
        // Use default widgets as final fallback
        const fallbackWidgets: DashboardWidget[] = defaultWidgets.map((widget, index) => ({
          id: (index + 1).toString(),
          type: widget.widget_type,
          title: widget.title,
          size: { w: widget.width as 1 | 2 | 3, h: widget.height },
          position: { x: widget.position_x, y: widget.position_y, w: widget.width, h: widget.height },
          config: widget.config,
        }));
        setWidgets(fallbackWidgets);
      }
    }
  };

  // Save widgets to both Supabase and localStorage
  const updateWidgets = async (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    
    if (userId) {
      // Save to localStorage immediately for better UX
      localStorage.setItem(`widgets_${userId}`, JSON.stringify(newWidgets));
      
      try {
        // Update positions and visibility in Supabase
        const updates = newWidgets.map(widget => ({
          id: widget.id,
          position_x: widget.position.x,
          position_y: widget.position.y,
          width: widget.size.w,
          height: widget.size.h,
          title: widget.title,
          config: widget.config,
        }));

        // Use upsert for better handling
        for (const update of updates) {
          await supabase
            .from('dashboard_widgets')
            .update(update)
            .eq('id', update.id)
            .eq('user_id', userId);
        }
      } catch (err) {
        console.error('Error saving widgets to Supabase:', err);
        setError('Failed to save widget positions');
      }
    }
  };

  // Add new widget
  const addWidget = async (widget: DashboardWidget) => {
    if (!userId) return;

    try {
      const widgetInsert: WidgetInsert = {
        user_id: userId,
        widget_type: widget.type,
        title: widget.title,
        position_x: widget.position.x,
        position_y: widget.position.y,
        width: widget.size.w,
        height: widget.size.h,
        config: widget.config || {},
      };

      const { data, error } = await supabase
        .from('dashboard_widgets')
        .insert([widgetInsert])
        .select()
        .single();

      if (error) throw error;

      const newWidget = convertRowToWidget(data);
      const newWidgets = [...widgets, newWidget];
      setWidgets(newWidgets);
      
      // Update localStorage
      localStorage.setItem(`widgets_${userId}`, JSON.stringify(newWidgets));
    } catch (err) {
      console.error('Error adding widget:', err);
      setError('Failed to add widget');
      
      // Fallback to local state update
      const newWidgets = [...widgets, widget];
      setWidgets(newWidgets);
      localStorage.setItem(`widgets_${userId}`, JSON.stringify(newWidgets));
    }
  };

  // Remove widget
  const removeWidget = async (widgetId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .delete()
        .eq('id', widgetId)
        .eq('user_id', userId);

      if (error) throw error;

      const newWidgets = widgets.filter(w => w.id !== widgetId);
      setWidgets(newWidgets);
      
      // Update localStorage
      localStorage.setItem(`widgets_${userId}`, JSON.stringify(newWidgets));
    } catch (err) {
      console.error('Error removing widget:', err);
      setError('Failed to remove widget');
      
      // Fallback to local state update
      const newWidgets = widgets.filter(w => w.id !== widgetId);
      setWidgets(newWidgets);
      localStorage.setItem(`widgets_${userId}`, JSON.stringify(newWidgets));
    }
  };

  // Update individual widget
  const updateWidget = async (widgetId: string, updates: Partial<DashboardWidget>) => {
    if (!userId) return;

    try {
      const widgetUpdate: Partial<WidgetInsert> = {};
      
      if (updates.title) widgetUpdate.title = updates.title;
      if (updates.config) widgetUpdate.config = updates.config;
      if (updates.position) {
        widgetUpdate.position_x = updates.position.x;
        widgetUpdate.position_y = updates.position.y;
      }
      if (updates.size) {
        widgetUpdate.width = updates.size.w;
        widgetUpdate.height = updates.size.h;
      }

      const { error } = await supabase
        .from('dashboard_widgets')
        .update(widgetUpdate)
        .eq('id', widgetId)
        .eq('user_id', userId);

      if (error) throw error;

      const newWidgets = widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      );
      setWidgets(newWidgets);
      
      // Update localStorage
      localStorage.setItem(`widgets_${userId}`, JSON.stringify(newWidgets));
    } catch (err) {
      console.error('Error updating widget:', err);
      setError('Failed to update widget');
      
      // Fallback to local state update
      const newWidgets = widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      );
      setWidgets(newWidgets);
      localStorage.setItem(`widgets_${userId}`, JSON.stringify(newWidgets));
    }
  };

  useEffect(() => {
    fetchWidgets();
  }, [userId]); // fetchWidgets is stable, no need to include

  return {
    widgets,
    loading,
    error,
    updateWidgets,
    addWidget,
    removeWidget,
    updateWidget,
    refetch: fetchWidgets
  };
}
