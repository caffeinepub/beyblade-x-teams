import { useListTeams } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import PageShell from '../components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Crown, Mail } from 'lucide-react';
import BattleRequestList from '../components/teams/BattleRequestList';

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
        <div className="space-y-4 sm:space-y-6">
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
          <CardContent className="py-12 text-center px-4">
            <Shield className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No Teams Yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              You haven't created any teams. Create one to get started!
            </p>
            <Button onClick={() => window.location.hash = '/create-team'} className="min-h-11 w-full sm:w-auto">
              Create Team
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="Leader Dashboard" description="Manage your teams and join requests" maxWidth="2xl">
      <div className="space-y-4 sm:space-y-6">
        {/* My Teams Overview */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Crown className="h-5 w-5 text-primary" />
              Your Teams
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {myTeams.map(team => (
                <button
                  key={team.id.toString()}
                  onClick={() => window.location.hash = `/team/${team.id.toString()}`}
                  className="p-3 sm:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left min-h-11"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm sm:text-base break-words flex-1">{team.name}</h4>
                    <Badge variant={team.members.length >= 3 ? 'secondary' : 'default'} className="text-xs flex-shrink-0">
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

        {/* Battle Requests for each team */}
        {myTeams.map(team => (
          <BattleRequestList key={team.id.toString()} teamId={team.id.toString()} />
        ))}

        {/* Join Requests Notice */}
        {teamsWithRequests.length > 0 ? (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full flex-shrink-0">
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Pending Join Requests</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    You have {teamsWithRequests.reduce((sum, team) => sum + team.joinRequests.length, 0)} pending join request(s) across your teams.
                    Review and approve them in your Inbox.
                  </p>
                  <Button onClick={() => window.location.hash = '/inbox'} className="gap-2 min-h-11 w-full sm:w-auto">
                    <Mail className="h-4 w-4" />
                    Go to Inbox
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center px-4">
              <Mail className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Pending Requests</h3>
              <p className="text-sm text-muted-foreground">
                You don't have any join requests at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
