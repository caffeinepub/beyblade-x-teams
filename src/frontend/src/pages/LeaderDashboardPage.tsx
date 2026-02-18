import { useListTeams } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import PageShell from '../components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Crown, Mail } from 'lucide-react';

export default function LeaderDashboardPage() {
  const { data: teams, isLoading } = useListTeams();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;
  const userPrincipal = identity?.getPrincipal().toString();

  const myTeams = teams?.filter(team => team.leader.toString() === userPrincipal) || [];
  const teamsWithRequests = myTeams.filter(team => team.joinRequests.length > 0);

  if (!isAuthenticated) {
    return (
      <PageShell title="Leader Dashboard" maxWidth="2xl">
        <Alert>
          <AlertDescription>
            Please sign in to view your teams.
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell title="Leader Dashboard" description="Manage your teams and join requests" maxWidth="2xl">
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
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

  if (myTeams.length === 0) {
    return (
      <PageShell title="Leader Dashboard" description="Manage your teams and join requests" maxWidth="2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't created any teams. Create one to get started!
            </p>
            <Button onClick={() => window.location.hash = '/create-team'}>
              Create Team
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="Leader Dashboard" description="Manage your teams and join requests" maxWidth="2xl">
      <div className="space-y-6">
        {/* My Teams Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Your Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myTeams.map(team => (
                <button
                  key={team.id.toString()}
                  onClick={() => window.location.hash = `/team/${team.id.toString()}`}
                  className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold">{team.name}</h4>
                    <Badge variant={team.members.length >= 3 ? 'secondary' : 'default'}>
                      {team.members.length}/3
                    </Badge>
                  </div>
                  {team.joinRequests.length > 0 && (
                    <p className="text-xs text-primary">
                      {team.joinRequests.length} pending {team.joinRequests.length === 1 ? 'request' : 'requests'}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Join Requests Notice */}
        {teamsWithRequests.length > 0 ? (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Pending Join Requests</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You have {teamsWithRequests.reduce((sum, team) => sum + team.joinRequests.length, 0)} pending join request(s) across your teams.
                    Review and approve them in your Inbox.
                  </p>
                  <Button onClick={() => window.location.hash = '/inbox'} className="gap-2">
                    <Mail className="h-4 w-4" />
                    Go to Inbox
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
              <p className="text-muted-foreground">
                You don't have any join requests at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
