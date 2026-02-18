import { Button } from '@/components/ui/button';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useRequestJoinTeam, useGetTeamMembershipStatus } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import type { TeamDTO } from '../../backend';

interface JoinRequestButtonProps {
  team: TeamDTO;
}

export default function JoinRequestButton({ team }: JoinRequestButtonProps) {
  const { identity } = useInternetIdentity();
  const requestJoinMutation = useRequestJoinTeam();
  const { data: currentTeamId, isLoading: membershipLoading } = useGetTeamMembershipStatus();

  const isAuthenticated = !!identity;
  const userPrincipal = identity?.getPrincipal().toString();
  
  const isLeader = userPrincipal === team.leader.toString();
  const isMember = team.members.some(m => m.toString() === userPrincipal);
  const hasPendingRequest = team.joinRequests.some(r => r.toString() === userPrincipal);
  const isTeamFull = team.members.length >= 3;
  const isOnDifferentTeam = currentTeamId !== null && currentTeamId !== undefined && currentTeamId.toString() !== team.id.toString();

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const handleRequest = () => {
    requestJoinMutation.mutate(team.id);
  };

  if (!isAuthenticated) {
    return (
      <Button disabled variant="outline" className="gap-2">
        <UserPlus className="h-4 w-4" />
        Login to Join
      </Button>
    );
  }

  if (membershipLoading) {
    return (
      <Button disabled variant="outline" className="gap-2">
        Loading...
      </Button>
    );
  }

  if (isLeader) {
    return null;
  }

  if (isMember) {
    return (
      <Button disabled variant="outline" className="gap-2">
        Already a Member
      </Button>
    );
  }

  if (isOnDifferentTeam) {
    return (
      <div className="flex flex-col gap-2">
        <Button disabled variant="outline" className="gap-2">
          <AlertCircle className="h-4 w-4" />
          Already on a Team
        </Button>
        <Button 
          onClick={() => navigate(`/team/${currentTeamId!.toString()}`)} 
          variant="ghost" 
          size="sm"
          className="text-xs"
        >
          Go to My Team
        </Button>
      </div>
    );
  }

  if (hasPendingRequest) {
    return (
      <Button disabled variant="outline" className="gap-2">
        Request Pending
      </Button>
    );
  }

  if (isTeamFull) {
    return (
      <Button disabled variant="outline" className="gap-2">
        Team Full
      </Button>
    );
  }

  return (
    <Button
      onClick={handleRequest}
      disabled={requestJoinMutation.isPending}
      className="gap-2"
    >
      <UserPlus className="h-4 w-4" />
      {requestJoinMutation.isPending ? 'Sending...' : 'Request to Join'}
    </Button>
  );
}
