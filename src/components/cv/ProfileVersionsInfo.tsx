import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Copy } from 'lucide-react';
import { useCVVersions } from '@/hooks/useCVVersions';

interface ProfileVersionsInfoProps {
  profileId: string;
  onCreateVersion?: () => void;
  onEditVersions?: () => void;
}

export function ProfileVersionsInfo({ profileId, onCreateVersion, onEditVersions }: ProfileVersionsInfoProps) {
  const { versions, currentVersion, loading } = useCVVersions(profileId);

  if (loading) {
    return (
      <div className="text-xs text-muted-foreground">
        Loading versions...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">CV Variants</span>
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {versions.length}
          </Badge>
        </div>
        {onCreateVersion && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onCreateVersion}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {versions.length > 0 ? (
        <div className="space-y-1">
          {versions.slice(0, 2).map((version) => (
            <div key={version.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <div className="truncate font-medium">
                  {version.version_name}
                </div>
                {version.is_current && (
                  <Badge variant="default" className="text-xs px-1 py-0">
                    Current
                  </Badge>
                )}
              </div>
              {version.role_focus && (
                <div className="text-muted-foreground truncate">
                  {version.role_focus}
                </div>
              )}
            </div>
          ))}
          {versions.length > 2 && (
            <div className="text-xs text-muted-foreground">
              +{versions.length - 2} more variants
            </div>
          )}
          {onEditVersions && versions.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onEditVersions}
              className="w-full h-6 text-xs gap-1"
            >
              <Copy className="h-3 w-3" />
              Manage Variants
            </Button>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          No CV variants yet
        </div>
      )}
    </div>
  );
}