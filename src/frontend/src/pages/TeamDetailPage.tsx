import { useState } from 'react';
import { useGetTeamWithMemberNames, useGetTeamFootage, useDisbandTeam, useLeaveTeam, useRemoveMemberFromTeam, useGetTeamMembershipStatus } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import PageShell from '../components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Crown, AlertTriangle, LogOut, UserMinus, Swords } from 'lucide-react';
import JoinRequestButton from '../components/teams/JoinRequestButton';
import TeamIconUploader from '../components/teams/TeamIconUploader';
import TeamFootageUploader from '../components/teams/TeamFootageUploader';
import TeamFootageGallery from '../components/teams/TeamFootageGallery';
import BattleRequestDialog from '../components/teams/BattleRequestDialog';
import ScheduledBattlesList from '../components/teams/ScheduledBattlesList';
import { useUploadTeamIcon } from '../hooks/useQueries';
import type { TeamDTO } from '../backend';

interface TeamDetailPageProps {
  teamId: string;
}

export default function TeamDetailPage({ teamId }: TeamDetailPageProps) {
  const { data: team, isLoading } = useGetTeamWithMemberNames(teamId);
  const { data: footage, isLoading: footageLoading } = useGetTeamFootage(teamId);
  const { data: myTeamId } = useGetTeamMembershipStatus();
  const { identity } = useInternetIdentity();
  const uploadIconMutation = useUploadTeamIcon();
  const disbandMutation = useDisbandTeam();
  const leaveMutation = useLeaveTeam();
  const removeMemberMutation = useRemoveMemberFromTeam();
  const [iconFile, setIconFile] = useState<{ file: File; content: Uint8Array } | null>(null);
  const [battleDialogOpen, setBattleDialogOpen] = useState(false);

  const isAuthenticated = !!identity;
  const isLeader = team && identity && team.leader.toString() === identity.getPrincipal().toString();
  const isMember = team && identity && team.members.some(m => m.id.toString() === identity.getPrincipal().toString());
  
  // Check if user is a team leader of their own team (not this team)
  const isLeaderOfOtherTeam = myTeamId !== null && myTeamId !== undefined && myTeamId.toString() !== teamId;

  const handleIconUpload = async () => {
    if (!iconFile || !team) return;

    try {
      await uploadIconMutation.mutateAsync({
        teamId: team.id,
        filename: iconFile.file.name,
        contentType: iconFile.file.type,
        bytes: iconFile.content,
      });
      setIconFile(null);
    } catch (error) {
      console.error('Failed to upload icon:', error);
    }
  };

  const handleDisband = async () => {
    if (!team) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to disband this team? This action cannot be undone and all team data will be lost.'
    );
    
    if (confirmed) {
      try {
        await disbandMutation.mutateAsync(team.id);
        window.location.hash = '/teams';
      } catch (error) {
        console.error('Failed to disband team:', error);
      }
    }
  };

  const handleLeave = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to leave this team?'
    );
    
    if (confirmed) {
      try {
        await leaveMutation.mutateAsync();
        window.location.hash = '/teams';
      } catch (error) {
        console.error('Failed to leave team:', error);
      }
    }
  };

  const handleRemoveMember = async (memberPrincipalStr: string) => {
    if (!team) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to remove this member from the team?'
    );
    
    if (confirmed) {
      try {
        await removeMemberMutation.mutateAsync({
          teamId: team.id,
          member: { toString: () => memberPrincipalStr } as any,
        });
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <PageShell title="Loading...">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!team) {
    return (
      <PageShell title="Team Not Found">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">This team does not exist.</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  // Convert team to TeamDTO format for JoinRequestButton and TeamFootageGallery compatibility
  const teamDTO: TeamDTO = {
    id: team.id,
    leader: team.leader,
    name: team.name,
    members: team.members.map(m => m.id),
    joinRequests: team.joinRequests,
    files: team.files,
    icon: team.icon,
    videos: team.videos,
  };

  // Find leader name
  const leaderMember = team.members.find(m => m.id.toString() === team.leader.toString());
  const leaderName = leaderMember ? leaderMember.name : 'Unknown';

  return (
    <PageShell title={team.name} description={`Team ID: ${team.id}`}>
      <div className="space-y-6">
        {/* Team Info Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {team.icon && (
                  <img
                    src={`data:${team.icon.contentType};base64,${btoa(String.fromCharCode(...team.icon.bytes))}`}
                    alt={team.name}
                    className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg border-2 border-border"
                  />
                )}
                <div>
                  <CardTitle className="text-xl sm:text-2xl">{team.name}</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {team.members.length} / 3 members
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {!isMember && isAuthenticated && (
                  <JoinRequestButton team={teamDTO} />
                )}
                {isLeaderOfOtherTeam && !isMember && (
                  <Button
                    onClick={() => setBattleDialogOpen(true)}
                    variant="default"
                    className="w-full sm:w-auto min-h-[44px]"
                  >
                    <Swords className="h-4 w-4 mr-2" />
                    Request Battle
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Icon Upload (for members) */}
            {isMember && (
              <div className="space-y-3">
                <TeamIconUploader
                  onFileSelect={(file, content) => setIconFile({ file, content })}
                  disabled={uploadIconMutation.isPending}
                  currentIcon={team.icon}
                  compact
                />
                {iconFile && (
                  <Button
                    onClick={handleIconUpload}
                    disabled={uploadIconMutation.isPending}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {uploadIconMutation.isPending ? 'Uploading...' : 'Upload Icon'}
                  </Button>
                )}
              </div>
            )}

            {/* Members List */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Team Members
              </h3>
              <div className="space-y-2">
                {team.members.map((member) => {
                  const memberIdStr = member.id.toString();
                  const isCurrentLeader = memberIdStr === team.leader.toString();
                  const isCurrentUser = identity && memberIdStr === identity.getPrincipal().toString();
                  
                  return (
                    <div
                      key={memberIdStr}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-sm sm:text-base font-medium truncate">{member.name}</span>
                        {isCurrentLeader && (
                          <Badge variant="default" className="flex-shrink-0">
                            <Crown className="h-3 w-3 mr-1" />
                            Leader
                          </Badge>
                        )}
                        {isCurrentUser && !isCurrentLeader && (
                          <Badge variant="secondary" className="flex-shrink-0">You</Badge>
                        )}
                      </div>
                      {isLeader && !isCurrentLeader && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(memberIdStr)}
                          disabled={removeMemberMutation.isPending}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 min-h-[44px] min-w-[44px]"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Actions */}
            {isMember && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                {isLeader ? (
                  <Button
                    variant="destructive"
                    onClick={handleDisband}
                    disabled={disbandMutation.isPending}
                    className="w-full sm:w-auto min-h-[44px] px-6"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {disbandMutation.isPending ? 'Disbanding...' : 'Disband Team'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleLeave}
                    disabled={leaveMutation.isPending}
                    className="w-full sm:w-auto min-h-[44px] px-6"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {leaveMutation.isPending ? 'Leaving...' : 'Leave Team'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Battles */}
        <ScheduledBattlesList teamId={teamId} />

        {/* Team Footage Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Team Footage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isMember && (
              <TeamFootageUploader teamId={team.id} />
            )}
            
            <TeamFootageGallery 
              footage={footage || []} 
              isLoading={footageLoading}
              team={teamDTO}
            />
          </CardContent>
        </Card>
      </div>

      {/* Battle Request Dialog */}
      {myTeamId !== null && myTeamId !== undefined && (
        <BattleRequestDialog
          open={battleDialogOpen}
          onOpenChange={setBattleDialogOpen}
          requestingTeamId={myTeamId}
          targetTeamId={team.id}
          targetTeamName={team.name}
        />
      )}
    </PageShell>
  );
}
