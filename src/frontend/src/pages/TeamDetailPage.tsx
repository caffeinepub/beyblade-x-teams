import { useState, useMemo, useCallback } from 'react';
import { useGetTeamWithMemberNames, useGetTeamFootage, useDisbandTeam, useLeaveTeam, useRemoveMemberFromTeam, useGetTeamMembershipStatus } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import PageShell from '../components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Crown, AlertTriangle, LogOut, UserMinus, Swords, AlertCircle } from 'lucide-react';
import JoinRequestButton from '../components/teams/JoinRequestButton';
import TeamIconUploader from '../components/teams/TeamIconUploader';
import TeamFootageUploader from '../components/teams/TeamFootageUploader';
import TeamFootageGallery from '../components/teams/TeamFootageGallery';
import BattleRequestDialog from '../components/teams/BattleRequestDialog';
import ScheduledBattlesList from '../components/teams/ScheduledBattlesList';
import BattleRequestList from '../components/teams/BattleRequestList';
import { useUploadTeamIcon } from '../hooks/useQueries';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { TeamDTO } from '../backend';

interface TeamDetailPageProps {
  teamId: string;
}

function TeamDetailPageContent({ teamId }: TeamDetailPageProps) {
  // ALL HOOKS AT TOP LEVEL
  const { data: team, isLoading, isError, error } = useGetTeamWithMemberNames(teamId);
  const { data: footage, isLoading: footageLoading } = useGetTeamFootage(teamId);
  const { data: myTeamId } = useGetTeamMembershipStatus();
  const { identity } = useInternetIdentity();
  const uploadIconMutation = useUploadTeamIcon();
  const disbandMutation = useDisbandTeam();
  const leaveMutation = useLeaveTeam();
  const removeMemberMutation = useRemoveMemberFromTeam();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileBytes, setSelectedFileBytes] = useState<Uint8Array | null>(null);
  const [battleDialogOpen, setBattleDialogOpen] = useState(false);

  // Extract primitive values for stable memoization
  const teamLeaderStr = useMemo(() => team?.leader?.toString() ?? null, [team?.leader]);
  const teamMemberIds = useMemo(() => team?.members?.map(m => m.id.toString()) ?? [], [team?.members]);
  const currentPrincipalStr = useMemo(() => identity?.getPrincipal().toString() ?? null, [identity]);
  const isAuthenticated = useMemo(() => !!identity, [identity]);
  
  // Stable memoized values using primitive dependencies
  const isLeader = useMemo(() => {
    return currentPrincipalStr !== null && teamLeaderStr !== null && currentPrincipalStr === teamLeaderStr;
  }, [currentPrincipalStr, teamLeaderStr]);
  
  const isMember = useMemo(() => {
    return currentPrincipalStr !== null && teamMemberIds.includes(currentPrincipalStr);
  }, [currentPrincipalStr, teamMemberIds]);

  const canManageTeam = useMemo(() => isLeader, [isLeader]);
  const canInitiateBattle = useMemo(() => isLeader, [isLeader]);
  const canUploadFootage = useMemo(() => isMember, [isMember]);
  const canViewFootage = useMemo(() => isMember, [isMember]);

  // Convert team to TeamDTO for components that need it
  const teamDTO = useMemo((): TeamDTO | null => {
    if (!team) return null;
    return {
      id: team.id,
      leader: team.leader,
      name: team.name,
      members: team.members.map(m => m.id),
      joinRequests: team.joinRequests,
      files: team.files,
      icon: team.icon,
      videos: team.videos,
    };
  }, [team]);

  // Stable callbacks
  const handleFileSelect = useCallback((file: File, bytes: Uint8Array) => {
    setSelectedFile(file);
    setSelectedFileBytes(bytes);
  }, []);

  const handleIconUpload = useCallback(async () => {
    if (!selectedFile || !selectedFileBytes || !team) return;
    try {
      await uploadIconMutation.mutateAsync({
        teamId: team.id,
        filename: selectedFile.name,
        contentType: selectedFile.type,
        bytes: selectedFileBytes,
      });
      setSelectedFile(null);
      setSelectedFileBytes(null);
    } catch (error) {
      console.error('Failed to upload icon:', error);
    }
  }, [selectedFile, selectedFileBytes, team?.id, uploadIconMutation]);

  const handleDisband = useCallback(async () => {
    if (!team || !window.confirm('Are you sure you want to disband this team? This action cannot be undone.')) return;
    try {
      await disbandMutation.mutateAsync(team.id);
      window.location.hash = '/teams';
    } catch (error) {
      console.error('Failed to disband team:', error);
    }
  }, [team?.id, disbandMutation]);

  const handleLeave = useCallback(async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    try {
      await leaveMutation.mutateAsync();
      window.location.hash = '/teams';
    } catch (error) {
      console.error('Failed to leave team:', error);
    }
  }, [leaveMutation]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    if (!team || !window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeMemberMutation.mutateAsync({
        teamId: team.id,
        member: { toString: () => memberId } as any,
      });
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  }, [team?.id, removeMemberMutation]);

  if (isLoading) {
    return (
      <PageShell>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (isError || !team || !teamDTO) {
    return (
      <PageShell>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load team details'}
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Team Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {team.icon && (
              <img 
                src={`data:${team.icon.contentType};base64,${btoa(String.fromCharCode(...Array.from(team.icon.bytes)))}`}
                alt={team.name} 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover" 
              />
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{team.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Team ID: {team.id.toString()}
              </p>
            </div>
          </div>
          
          {!isMember && isAuthenticated && (
            <JoinRequestButton team={teamDTO} />
          )}
        </div>

        {/* Team Icon Upload (Leader Only) */}
        {canManageTeam && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Icon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TeamIconUploader
                currentIcon={team.icon}
                onFileSelect={handleFileSelect}
                disabled={uploadIconMutation.isPending}
              />
              {selectedFile && (
                <Button 
                  onClick={handleIconUpload}
                  disabled={uploadIconMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {uploadIconMutation.isPending ? 'Uploading...' : 'Upload Icon'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Battle Request Button (Leader Only) */}
        {canInitiateBattle && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Swords className="h-5 w-5" />
                Battle Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => setBattleDialogOpen(true)} className="w-full sm:w-auto">
                <Swords className="h-4 w-4 mr-2" />
                Request Battle
              </Button>
              
              {/* Incoming Battle Requests */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Incoming Requests</h3>
                <BattleRequestList teamId={teamId} />
              </div>

              {/* Scheduled Battles */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Scheduled Battles</h3>
                <ScheduledBattlesList teamId={teamId} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({team.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {team.members.map((member) => (
                <div
                  key={member.id.toString()}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                        {member.id.toString()}
                      </p>
                    </div>
                    {member.id.toString() === teamLeaderStr && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Leader
                      </Badge>
                    )}
                  </div>
                  {canManageTeam && member.id.toString() !== teamLeaderStr && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id.toString())}
                      disabled={removeMemberMutation.isPending}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Footage */}
        {canViewFootage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Footage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canUploadFootage && (
                <TeamFootageUploader teamId={team.id} />
              )}
              <TeamFootageGallery
                team={teamDTO}
                footage={footage || []}
                isLoading={footageLoading}
              />
            </CardContent>
          </Card>
        )}

        {/* Team Management */}
        {isMember && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Team Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLeader ? (
                <Button
                  variant="destructive"
                  onClick={handleDisband}
                  disabled={disbandMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {disbandMutation.isPending ? 'Disbanding...' : 'Disband Team'}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleLeave}
                  disabled={leaveMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {leaveMutation.isPending ? 'Leaving...' : 'Leave Team'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Battle Request Dialog */}
      {canInitiateBattle && (
        <BattleRequestDialog
          open={battleDialogOpen}
          onOpenChange={setBattleDialogOpen}
          requestingTeamId={team.id}
          targetTeamId={BigInt(0)}
          targetTeamName=""
        />
      )}
    </PageShell>
  );
}

export default function TeamDetailPage({ teamId }: TeamDetailPageProps) {
  return (
    <ErrorBoundary>
      <TeamDetailPageContent teamId={teamId} />
    </ErrorBoundary>
  );
}
