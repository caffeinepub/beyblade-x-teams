import { useState } from 'react';
import { useRequestJoinTeam, useGetTeamMembershipStatus } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import type { TeamDTO } from '../../backend';

interface JoinRequestButtonProps {
  team: TeamDTO;
}

export default function JoinRequestButton({ team }: JoinRequestButtonProps) {
  const requestJoinMutation = useRequestJoinTeam();
  const { data: currentTeamId, isLoading: membershipLoading } = useGetTeamMembershipStatus();
  const [requestSent, setRequestSent] = useState(false);

  const isAlreadyOnTeam = currentTeamId !== null && currentTeamId !== undefined;
  const isOnDifferentTeam = isAlreadyOnTeam && currentTeamId.toString() !== team.id.toString();

  const handleRequestJoin = async () => {
    try {
      await requestJoinMutation.mutateAsync(team.id);
      setRequestSent(true);
    } catch (error) {
      console.error('Failed to send join request:', error);
    }
  };

  if (membershipLoading) {
    return (
      <Button disabled className="gap-2 min-h-11 w-full sm:w-auto">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isOnDifferentTeam) {
    return (
      <div className="space-y-2 w-full">
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <AlertDescription className="text-amber-900 dark:text-amber-100 text-xs sm:text-sm">
            You're already on a team. You can only be a member of one team at a time.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => window.location.hash = `/team/${currentTeamId.toString()}`}
          variant="outline"
          className="w-full gap-2 min-h-11"
        >
          Go to My Team
        </Button>
      </div>
    );
  }

  if (requestSent) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900 dark:text-green-100 text-xs sm:text-sm">
          Join request sent! The team leader will review your request.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Button
      onClick={handleRequestJoin}
      disabled={requestJoinMutation.isPending || team.members.length >= 3}
      className="gap-2 min-h-11 w-full sm:w-auto px-6"
    >
      {requestJoinMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {team.members.length >= 3 ? 'Team Full' : 'Request to Join'}
        </>
      )}
    </Button>
  );
}
