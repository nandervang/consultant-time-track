import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Clock, Users, BarChart3, CalendarDays } from 'lucide-react';
import { subDays, startOfMonth, endOfMonth, format } from 'date-fns';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { RevenueAnalytics } from '@/components/analytics/RevenueAnalytics';
import { TimeAnalytics } from '@/components/analytics/TimeAnalytics';
import { ClientAnalytics } from '@/components/analytics/ClientAnalytics';

interface DateRange {
  from: Date;
  to: Date;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'time' | 'clients'>('overview');

  const quickRanges = [
    {
      label: 'This Month',
      range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) }
    },
    {
      label: 'Last Month',
      range: { 
        from: startOfMonth(subDays(new Date(), 30)), 
        to: endOfMonth(subDays(new Date(), 30)) 
      }
    },
    {
      label: 'Last 30 Days',
      range: { from: subDays(new Date(), 30), to: new Date() }
    },
    {
      label: 'Last 90 Days',
      range: { from: subDays(new Date(), 90), to: new Date() }
    },
    {
      label: 'This Year',
      range: { 
        from: new Date(new Date().getFullYear(), 0, 1), 
        to: new Date(new Date().getFullYear(), 11, 31) 
      }
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'time', label: 'Time & Productivity', icon: Clock },
    { id: 'clients', label: 'Client Analytics', icon: Users },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights and reports for your consulting business
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CalendarDays className="h-4 w-4" />
          <span>
            {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Date Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
          <CardDescription>
            Select a date range to analyze your business performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickRanges.map((range) => (
              <Button
                key={range.label}
                variant={
                  dateRange.from.getTime() === range.range.from.getTime() &&
                  dateRange.to.getTime() === range.range.to.getTime()
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                onClick={() => setDateRange(range.range)}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              <IconComponent className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Analytics Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <AnalyticsOverview dateRange={dateRange} />
        )}

        {activeTab === 'revenue' && (
          <RevenueAnalytics dateRange={dateRange} />
        )}

        {activeTab === 'time' && (
          <TimeAnalytics dateRange={dateRange} />
        )}

        {activeTab === 'clients' && (
          <ClientAnalytics dateRange={dateRange} />
        )}
      </div>
    </div>
  );
}
