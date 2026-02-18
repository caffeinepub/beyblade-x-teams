import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCreateTeam, useUploadTeamIcon, useGetTeamMembershipStatus } from '../hooks/useQueries';
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
  const createTeamMutation = useCreateTeam();
  const uploadIconMutation = useUploadTeamIcon();
  const { data: currentTeamId, isLoading: membershipLoading } = useGetTeamMembershipStatus();

  const [teamName, setTeamName] = useState('');
  const [iconFile, setIconFile] = useState<{ file: File; content: Uint8Array } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const isAuthenticated = !!identity;
  const isAlreadyOnTeam = currentTeamId !== null && currentTeamId !== undefined;

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  const handleFileSelect = (file: File, content: Uint8Array) => {
    setIconFile({ file, content });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    if (!isAuthenticated || !identity) {
      toast.error('Please sign in to create a team');
      return;
    }

    setIsCreating(true);

    try {
      // Create team with current user as the only initial member
      const teamId = await createTeamMutation.mutateAsync({
        name: teamName.trim(),
        initialMembers: [identity.getPrincipal()],
      });

      // Upload team icon if provided
      if (iconFile) {
        await uploadIconMutation.mutateAsync({
          teamId,
          filename: iconFile.file.name,
          contentType: iconFile.file.type,
          bytes: iconFile.content,
        });
      }

      // Navigate to team detail
      navigate(`/team/${teamId.toString()}`);
    } catch (error: any) {
      console.error('Failed to create team:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <PageShell title="Create Team" maxWidth="2xl">
        <Alert>
          <AlertDescription>
            Please sign in to create a team.
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  if (membershipLoading) {
    return (
      <PageShell title="Create Team" maxWidth="2xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (isAlreadyOnTeam) {
    return (
      <PageShell title="Create Team" maxWidth="2xl">
        <Button onClick={() => navigate('/')} variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            You are already on a team. You can only be a member of one team at a time.
          </AlertDescription>
        </Alert>

        <div className="mt-6">
          <Button onClick={() => navigate(`/team/${currentTeamId.toString()}`)} className="gap-2">
            Go to My Team
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Create Team" description="Start your Bey Hub X journey" maxWidth="2xl">
      <Button onClick={() => navigate('/')} variant="ghost" className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name *</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
                disabled={isCreating}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Choose a unique name for your team (max 50 characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Team Icon (Optional)</Label>
              <TeamIconUploader 
                onFileSelect={handleFileSelect} 
                disabled={isCreating}
                currentIcon={null}
                compact={false}
              />
              <p className="text-xs text-muted-foreground">
                Upload a team icon (PNG, JPG, or WebP, max 10 MB)
              </p>
            </div>

            <Button type="submit" disabled={isCreating || !teamName.trim()} className="w-full gap-2">
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isCreating ? 'Creating Team...' : 'Create Team'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
