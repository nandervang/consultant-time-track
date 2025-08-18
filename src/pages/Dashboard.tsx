import DashboardGrid from '@/components/dashboard/DashboardGrid';
import { useAuth } from '@/hooks/useAuth';
import { useWidgets } from '@/hooks/useWidgets';

interface DashboardPageProps {
  isDarkMode: boolean;
}

export default function DashboardPage({ isDarkMode }: DashboardPageProps) {
  const { user } = useAuth();
  const { widgets, loading, updateWidgets, addWidget } = useWidgets(user?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardGrid
      widgets={widgets}
      onUpdateWidgets={updateWidgets}
      onAddWidget={addWidget}
      isDarkMode={isDarkMode}
    />
  );
}
