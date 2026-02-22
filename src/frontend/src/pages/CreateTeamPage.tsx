import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCreateTeam, useUploadTeamIcon, useGetTeamMembershipStatus } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import PageShell from '../components/layout/PageShell';
import TeamIconUploader from '../components/teams/TeamIconUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateTeamPage() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const createTeamMutation = useCreateTeam();
  const uploadIconMutation = useUploadTeamIcon();
  const { data: myTeamId, isLoading: membershipLoading } = useGetTeamMembershipStatus();
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState('');
  const [iconFile, setIconFile] = useState<{ file: File; content: Uint8Array } | null>(null);

  const isAuthenticated = !!identity;
  const isAlreadyInTeam = myTeamId !== null && myTeamId !== undefined;
  const isActorReady = !!actor && !actorFetching;

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    if (!isActorReady) {
      toast.error('Connection not ready. Please wait a moment and try again.');
      return;
    }

    try {
      // Create the team and wait for the mutation to complete
      const teamId = await createTeamMutation.mutateAsync({
        name: teamName.trim(),
        initialMembers: [],
      });

      console.log('Team created with ID:', teamId, 'Type:', typeof teamId);

      // Upload icon if provided
      if (iconFile) {
        try {
          await uploadIconMutation.mutateAsync({
            teamId,
            filename: iconFile.file.name,
            contentType: iconFile.file.type,
            bytes: iconFile.content,
          });
        } catch (iconError) {
          console.error('Failed to upload icon:', iconError);
          toast.error('Team created but icon upload failed');
        }
      }

      // Ensure teamId is converted to string for navigation
      const teamIdString = String(teamId);
      console.log('Navigating to team detail page with ID:', teamIdString);
      
      // Navigate to the new team's detail page
      window.location.hash = `/team/${teamIdString}`;
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <PageShell title="Create Team">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to create a team.
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  // Show loading state while actor is initializing or checking membership
  if (actorFetching || membershipLoading) {
    return (
      <PageShell title="Create Team">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Initializing connection...</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (isAlreadyInTeam) {
    return (
      <PageShell title="Create Team">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are already a member of a team. Leave your current team before creating a new one.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => window.location.hash = '/teams'}>
            View All Teams
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell 
      title="Create New Team" 
      description="Start your Beyblade X journey by creating a team"
    >
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => window.location.hash = '/teams'}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teams
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Team Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  type="text"
                  placeholder="Enter your team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  disabled={createTeamMutation.isPending || !isActorReady}
                />
              </div>

              <div className="space-y-2">
                <Label>Team Icon (Optional)</Label>
                <TeamIconUploader
                  onFileSelect={(file, content) => setIconFile({ file, content })}
                  disabled={createTeamMutation.isPending || !isActorReady}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createTeamMutation.isPending || !teamName.trim() || !isActorReady}
                  className="flex-1"
                >
                  {createTeamMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Team...
                    </>
                  ) : (
                    'Create Team'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.hash = '/teams'}
                  disabled={createTeamMutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
