import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useCurrentUser';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import PageShell from '../components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Edit, Save, X } from 'lucide-react';
import ProfilePictureUploader from '../components/profile/ProfilePictureUploader';
import { ExternalBlob } from '../backend';

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const saveProfileMutation = useSaveCallerUserProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [profilePicture, setProfilePicture] = useState<ExternalBlob | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isAuthenticated = !!identity;

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

  const profilePictureUrl = userProfile.profilePicture?.getDirectURL();
  const initials = userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <PageShell title="My Profile" description="Manage your profile information">
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
    </PageShell>
  );
}
