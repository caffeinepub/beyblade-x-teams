import { useState, useEffect, useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useCurrentUser';
import { useSaveCallerUserProfile, useGetTeamMembershipStatus, useGetTeamWithMemberNames, useDisbandTeam, useLeaveTeam } from '../hooks/useQueries';
import PageShell from '../components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Save, X, Users, Crown, AlertTriangle, LogOut } from 'lucide-react';
import ProfilePictureUploader from '../components/profile/ProfilePictureUploader';
import { ExternalBlob } from '../backend';

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const { data: myTeamId } = useGetTeamMembershipStatus();
  const { data: teamData, isLoading: teamLoading } = useGetTeamWithMemberNames(
    myTeamId ? myTeamId.toString() : ''
  );
  const saveProfileMutation = useSaveCallerUserProfile();
  const disbandMutation = useDisbandTeam();
  const leaveMutation = useLeaveTeam();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [profilePicture, setProfilePicture] = useState<ExternalBlob | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isAuthenticated = !!identity;
  const currentPrincipalStr = identity?.getPrincipal().toString();

  // Check if user is team leader
  const isTeamLeader = useMemo(() => {
    if (!currentPrincipalStr || !teamData?.leader) return false;
    return teamData.leader.toString() === currentPrincipalStr;
  }, [currentPrincipalStr, teamData?.leader]);

  // Initialize form when profile loads
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setAboutMe(userProfile.aboutMe || '');
      setProfilePicture(userProfile.profilePicture || null);
    }
  }, [userProfile]);

  if (!isAuthenticated) {
    return (
      <PageShell title="Profile" description="Please log in to view your profile">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You must be logged in to view your profile.</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell title="Profile">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!userProfile) {
    return (
      <PageShell title="Profile" description="Profile not found">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Profile not found. Please complete your profile setup.</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const handleEdit = () => {
    setName(userProfile.name);
    setAboutMe(userProfile.aboutMe || '');
    setProfilePicture(userProfile.profilePicture || null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setName(userProfile.name);
    setAboutMe(userProfile.aboutMe || '');
    setProfilePicture(userProfile.profilePicture || null);
    setUploadProgress(0);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      await saveProfileMutation.mutateAsync({
        name: name.trim(),
        aboutMe: aboutMe.trim(),
        profilePicture: profilePicture || undefined,
      });
      setIsEditing(false);
      setUploadProgress(0);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleProfilePictureSelect = (blob: ExternalBlob) => {
    const blobWithProgress = blob.withUploadProgress((percentage) => {
      setUploadProgress(percentage);
    });
    setProfilePicture(blobWithProgress);
  };

  const handleDisbandTeam = async () => {
    if (!myTeamId) return;
    if (!window.confirm('Are you sure you want to disband this team? This action cannot be undone and all team data will be lost.')) {
      return;
    }
    try {
      await disbandMutation.mutateAsync(myTeamId);
    } catch (error) {
      console.error('Failed to disband team:', error);
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) {
      return;
    }
    try {
      await leaveMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to leave team:', error);
    }
  };

  const profilePictureUrl = userProfile.profilePicture?.getDirectURL();
  const initials = userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <PageShell title="My Profile" description="Manage your profile information">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            {!isEditing && (
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={profilePictureUrl} alt={userProfile.name} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <div className="flex-1 w-full">
                  <ProfilePictureUploader
                    onFileSelect={handleProfilePictureSelect}
                    disabled={saveProfileMutation.isPending}
                    currentPicture={profilePicture || userProfile.profilePicture || null}
                  />
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        Uploading: {uploadProgress}%
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saveProfileMutation.isPending}
                  className="min-h-11"
                />
              ) : (
                <p className="text-lg font-medium">{userProfile.name}</p>
              )}
            </div>

            {/* About Me Field */}
            <div className="space-y-2">
              <Label htmlFor="aboutMe">About Me</Label>
              {isEditing ? (
                <Textarea
                  id="aboutMe"
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  disabled={saveProfileMutation.isPending}
                  placeholder="Tell us about yourself..."
                  rows={6}
                  className="resize-none"
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {userProfile.aboutMe || 'No bio added yet.'}
                </p>
              )}
            </div>

            {/* Principal ID (read-only) */}
            <div className="space-y-2">
              <Label>Principal ID</Label>
              <p className="text-xs text-muted-foreground font-mono break-all bg-muted p-3 rounded-lg">
                {identity?.getPrincipal().toString()}
              </p>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!name.trim() || saveProfileMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  {saveProfileMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={saveProfileMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Information Card */}
        {myTeamId !== null && myTeamId !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : teamData ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">{teamData.name}</h3>
                      {isTeamLeader && (
                        <Badge variant="default">
                          <Crown className="h-3 w-3 mr-1" />
                          Leader
                        </Badge>
                      )}
                      {!isTeamLeader && (
                        <Badge variant="secondary">Member</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {teamData.members.length} / 3 members
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    {isTeamLeader ? (
                      <Button
                        variant="destructive"
                        onClick={handleDisbandTeam}
                        disabled={disbandMutation.isPending}
                        className="w-full sm:w-auto min-h-[44px] px-6"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {disbandMutation.isPending ? 'Disbanding...' : 'Disband Team'}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={handleLeaveTeam}
                        disabled={leaveMutation.isPending}
                        className="w-full sm:w-auto min-h-[44px] px-6"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {leaveMutation.isPending ? 'Leaving...' : 'Leave Team'}
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => window.location.hash = `/team/${myTeamId.toString()}`}
                      className="w-full sm:w-auto min-h-[44px] px-6"
                    >
                      View Team Details
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Unable to load team information.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
