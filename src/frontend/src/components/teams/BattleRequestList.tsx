import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Swords, Check, X } from 'lucide-react';
import { useListBattleRequestsForTeam, useRespondToBattleRequest } from '../../hooks/useQueries';
import { useListTeams } from '../../hooks/useQueries';
import { format } from 'date-fns';
import type { BattleRequest } from '../../backend';
import { BattleRequestStatus } from '../../backend';

interface BattleRequestListProps {
  teamId: string;
}

export default function BattleRequestList({ teamId }: BattleRequestListProps) {
  const { data: battleRequests, isLoading: requestsLoading } = useListBattleRequestsForTeam(teamId);
  const { data: teams } = useListTeams();
  const respondMutation = useRespondToBattleRequest();

  // Filter for incoming pending requests (where this team is the target)
  const incomingRequests = battleRequests?.filter(
    (req) => req.targetTeam.toString() === teamId && req.status === BattleRequestStatus.pending
  ) || [];

  const getTeamName = (teamIdBigInt: bigint): string => {
    const team = teams?.find((t) => t.id.toString() === teamIdBigInt.toString());
    return team?.name || 'Unknown Team';
  };

  const handleRespond = async (requestId: bigint, accept: boolean) => {
    try {
      await respondMutation.mutateAsync({ requestId, accept });
    } catch (error) {
      console.error('Failed to respond to battle request:', error);
    }
  };

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

  if (incomingRequests.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Swords className="h-5 w-5 text-primary" />
          Incoming Battle Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {incomingRequests.map((request) => (
          <div
            key={request.id.toString()}
            className="p-4 bg-background rounded-lg border space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <p className="font-semibold text-sm sm:text-base">
                  {getTeamName(request.requestingTeam)}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Proposed Date: {format(new Date(request.proposedDate), 'PPP')}
                </p>
              </div>
              <Badge variant="secondary" className="self-start sm:self-auto">
                Pending
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleRespond(request.id, true)}
                disabled={respondMutation.isPending}
                className="flex-1 sm:flex-none min-h-[44px]"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRespond(request.id, false)}
                disabled={respondMutation.isPending}
                className="flex-1 sm:flex-none min-h-[44px]"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
