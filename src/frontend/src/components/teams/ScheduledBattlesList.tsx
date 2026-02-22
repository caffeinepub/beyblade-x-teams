import { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Swords, Calendar as CalendarIcon } from 'lucide-react';
import { useListBattleRequestsForTeam, useListTeams } from '../../hooks/useQueries';
import { format } from 'date-fns';
import { BattleRequestStatus } from '../../backend';

interface ScheduledBattlesListProps {
  teamId: string;
}

export default function ScheduledBattlesList({ teamId }: ScheduledBattlesListProps) {
  const { data: battleRequests, isLoading: requestsLoading } = useListBattleRequestsForTeam(teamId);
  const { data: teams } = useListTeams();

  const sortedBattles = useMemo(() => {
    if (!battleRequests) return [];
    const scheduledBattles = battleRequests.filter(
      (req) => req.status === BattleRequestStatus.accepted
    );
    return [...scheduledBattles].sort((a, b) => {
      return new Date(a.proposedDate).getTime() - new Date(b.proposedDate).getTime();
    });
  }, [battleRequests]);

  const getOpponentTeamName = useCallback((request: typeof sortedBattles[0]): string => {
    if (!teams) return 'Unknown Team';
    const opponentTeamId = request.requestingTeam.toString() === teamId 
      ? request.targetTeam 
      : request.requestingTeam;
    const team = teams.find((t) => t.id.toString() === opponentTeamId.toString());
    return team?.name || 'Unknown Team';
  }, [teams, teamId]);

  if (requestsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (sortedBattles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Swords className="h-5 w-5" />
            Scheduled Battles
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Swords className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            No scheduled battles yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Swords className="h-5 w-5" />
          Scheduled Battles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedBattles.map((battle) => (
          <div
            key={battle.id.toString()}
            className="p-4 bg-muted/50 rounded-lg space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 flex-1">
                <p className="font-semibold text-sm sm:text-base">
                  vs {getOpponentTeamName(battle)}
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  {format(new Date(battle.proposedDate), 'PPP')}
                </div>
              </div>
              <Badge variant="default" className="shrink-0">
                Confirmed
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
