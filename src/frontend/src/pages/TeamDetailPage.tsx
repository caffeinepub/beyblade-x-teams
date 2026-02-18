import { useGetTeam, useGetTeamFootage, useDisbandTeam } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useCurrentUser';
import { useUploadTeamIcon } from '../hooks/useQueries';
import PageShell from '../components/layout/PageShell';
import TeamIconUploader from '../components/teams/TeamIconUploader';
import TeamFootageUploader from '../components/teams/TeamFootageUploader';
import TeamFootageGallery from '../components/teams/TeamFootageGallery';
import JoinRequestButton from '../components/teams/JoinRequestButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Crown, Users, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { imageToDataUrl } from '../utils/imageDataUrl';

interface TeamDetailPageProps {
  teamId: string;
}

export default function TeamDetailPage({ teamId }: TeamDetailPageProps) {
  const { data: team, isLoading } = useGetTeam(teamId);
  const { data: footage, isLoading: footageLoading } = useGetTeamFootage(teamId);
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const uploadIconMutation = useUploadTeamIcon();
  const disbandMutation = useDisbandTeam();

  const [uploadingIcon, setUploadingIcon] = useState(false);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const userPrincipal = identity?.getPrincipal().toString();
  const isLeader = userPrincipal === team?.leader.toString();
  const isMember = team?.members.some(m => m.toString() === userPrincipal);

  const handleIconSelect = async (file: File, content: Uint8Array) => {
    if (!team) return;
    
    setUploadingIcon(true);
    try {
      await uploadIconMutation.mutateAsync({
        teamId: team.id,
        filename: file.name,
        contentType: file.type,
        bytes: content,
      });
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleDisbandTeam = async () => {
    if (!team) return;
    
    try {
      await disbandMutation.mutateAsync(team.id);
      navigate('/teams');
    } catch (error) {
      console.error('Failed to disband team:', error);
    }
  };

  if (isLoading) {
    return (
      <PageShell maxWidth="2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }

  if (!team) {
    return (
      <PageShell maxWidth="2xl">
        <Card>
          <CardContent className="py-12 text-center px-4">
            <p className="text-sm sm:text-base text-muted-foreground mb-4">Team not found</p>
            <Button onClick={() => navigate('/teams')} variant="outline" className="min-h-11">
              Back to Teams
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="2xl">
      <Button onClick={() => navigate('/teams')} variant="ghost" className="mb-4 sm:mb-6 gap-2 min-h-11">
        <ArrowLeft className="h-4 w-4" />
        Back to Teams
      </Button>

      <div className="space-y-4 sm:space-y-6">
        {/* Team Header */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full">
                {team.icon && (
                  <img 
                    src={imageToDataUrl(team.icon.bytes, team.icon.contentType)}
                    alt={`${team.name} icon`}
                    className="h-14 w-14 sm:h-16 sm:w-16 object-cover rounded-lg border-2 border-border flex-shrink-0"
                  />
                )}
                <div className="space-y-2 flex-1 min-w-0">
                  <CardTitle className="text-2xl sm:text-3xl break-words">{team.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={team.members.length >= 3 ? 'secondary' : 'default'} className="text-xs">
                      {team.members.length}/3 Members
                    </Badge>
                    {isLeader && <Badge variant="outline" className="text-xs">You are the leader</Badge>}
                    {isMember && !isLeader && <Badge variant="outline" className="text-xs">You are a member</Badge>}
                  </div>
                </div>
              </div>
              {!isLeader && !isMember && (
                <div className="w-full sm:w-auto">
                  <JoinRequestButton team={team} />
                </div>
              )}
            </div>
          </CardHeader>
          {isLeader && (
            <CardContent className="p-4 sm:p-6">
              <Separator className="mb-4" />
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3">Team Icon</h4>
                  <TeamIconUploader 
                    onFileSelect={handleIconSelect} 
                    disabled={uploadingIcon}
                    currentIcon={team.icon ? { bytes: team.icon.bytes, contentType: team.icon.contentType } : null}
                    compact={true}
                  />
                  {uploadingIcon && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading icon...
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-3 text-destructive">Danger Zone</h4>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2 min-h-11 w-full sm:w-auto">
                        <Trash2 className="h-4 w-4" />
                        Disband Team
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-xs sm:max-w-md mx-4">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          This action cannot be undone. This will permanently delete the team "{team.name}" and remove all members.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="min-h-11 w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDisbandTeam}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-11 w-full sm:w-auto"
                        >
                          Disband Team
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Members */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-5 w-5" />
                Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
              {team.members.map((member, index) => {
                const isTeamLeader = member.toString() === team.leader.toString();
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg min-h-11">
                    <div className="flex items-center gap-2">
                      {isTeamLeader && <Crown className="h-4 w-4 text-primary flex-shrink-0" />}
                      <span className="text-sm font-medium">
                        {isTeamLeader ? 'Leader' : `Member ${index + 1}`}
                      </span>
                    </div>
                    {member.toString() === userPrincipal && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                );
              })}
              {team.members.length < 3 && (
                <p className="text-xs text-muted-foreground pt-2">
                  {3 - team.members.length} {3 - team.members.length === 1 ? 'spot' : 'spots'} available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pending Requests (Leader Only) */}
          {isLeader && team.joinRequests.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-5 w-5" />
                  Pending Requests
                  <Badge className="text-xs">{team.joinRequests.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm text-muted-foreground">
                  View and manage join requests in your{' '}
                  <button
                    onClick={() => navigate('/inbox')}
                    className="text-primary hover:underline"
                  >
                    Inbox
                  </button>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Team Footage Section */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Team Footage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
            {isMember && (
              <>
                <TeamFootageUploader teamId={team.id} />
                <Separator />
              </>
            )}
            <TeamFootageGallery footage={footage || []} isLoading={footageLoading} />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
