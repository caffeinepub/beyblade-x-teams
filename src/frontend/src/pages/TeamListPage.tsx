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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to create a team and start your Beyblade X journey!
            </p>
            <Button onClick={() => navigate('/create-team')}>
              Create Team
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="Teams" description="Browse all teams in Bey Hub X" maxWidth="2xl">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card key={team.id.toString()} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start gap-3">
                {team.icon && (
                  <img 
                    src={imageToDataUrl(team.icon.bytes, team.icon.contentType)}
                    alt={`${team.name} icon`}
                    className="h-12 w-12 object-cover rounded-lg border-2 border-border"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{team.name}</CardTitle>
                  <Badge variant={team.members.length >= 3 ? 'secondary' : 'default'} className="mt-2">
                    {team.members.length}/3 Members
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate(`/team/${team.id.toString()}`)}
                variant="outline"
                className="w-full gap-2"
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
