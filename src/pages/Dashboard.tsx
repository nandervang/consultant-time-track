import DashboardGrid from '@/components/dashboard/DashboardGrid';

interface DashboardPageProps {
  isDarkMode: boolean;
}

export default function DashboardPage({ isDarkMode }: DashboardPageProps) {
  return <DashboardGrid isDarkMode={isDarkMode} />;
}
