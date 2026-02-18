import { useListTeams } from '../hooks/useQueries';
import PageShell from '../components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Eye } from 'lucide-react';
import { imageToDataUrl } from '../utils/imageDataUrl';

export default function TeamListPage() {
  const { data: teams, isLoading } = useListTeams();

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  if (isLoading) {
    return (
      <PageShell title="Teams" description="Browse all teams in Bey Hub X" maxWidth="2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageShell>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <PageShell title="Teams" description="Browse all teams in Bey Hub X" maxWidth="2xl">
        <Card>
          <CardContent className="py-12 text-center px-4">
            <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No Teams Yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Be the first to create a team and start your Beyblade X journey!
            </p>
            <Button onClick={() => navigate('/create-team')} className="min-h-11">
              Create Team
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="Teams" description="Browse all teams in Bey Hub X" maxWidth="2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {teams.map((team) => (
          <Card key={team.id.toString()} className="hover:border-primary/50 transition-colors">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                {team.icon && (
                  <img 
                    src={imageToDataUrl(team.icon.bytes, team.icon.contentType)}
                    alt={`${team.name} icon`}
                    className="h-12 w-12 sm:h-14 sm:w-14 object-cover rounded-lg border-2 border-border flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg truncate">{team.name}</CardTitle>
                  <Badge variant={team.members.length >= 3 ? 'secondary' : 'default'} className="mt-2 text-xs">
                    {team.members.length}/3 Members
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <Button
                onClick={() => navigate(`/team/${team.id.toString()}`)}
                variant="outline"
                className="w-full gap-2 min-h-11"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
