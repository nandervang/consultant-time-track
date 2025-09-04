import React from 'react';

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  size: WidgetSize;
  position: { x: number; y: number; w: number; h: number };
  config?: Record<string, unknown>;
  data?: unknown;
}

export interface WidgetSize {
  w: 1 | 2 | 3; // width units
  h: number; // height in grid units
}

export type WidgetType = 
  | 'company-motto'
  | 'monthly-expenses'
  | 'time-logged'
  | 'today-time'
  | 'revenue-chart'
  | 'cash-flow'
  | 'cash-flow-projections'
  | 'quick-actions'
  | 'projects-overview'
  | 'budget-status'
  | 'quick-stats'
  | 'recent-activities'
  | 'client-overview'
  | 'invoice-status'
  | 'yearly-budget-chart'
  | 'yearly-expense-distribution'
  | 'payment-sources'
  | 'uptime-monitor'
  | 'blank-card';

export interface WidgetConfig {
  type: WidgetType;
  title: string;
  description: string;
  defaultSize: WidgetSize;
  component: React.ComponentType<WidgetProps>;
  icon: React.ComponentType<{ className?: string }>;
  category: 'overview' | 'finance' | 'time' | 'projects' | 'custom';
}

export interface WidgetProps {
  widget: DashboardWidget;
  isDarkMode: boolean;
  onUpdateWidget?: (widget: DashboardWidget) => void;
  onRemoveWidget?: (widgetId: string) => void;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  userId: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
