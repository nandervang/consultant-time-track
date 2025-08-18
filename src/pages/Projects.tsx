import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectsPageProps {
  isDarkMode: boolean;
}

export default function ProjectsPage({ isDarkMode }: ProjectsPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and track progress
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Project management features coming soon...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
