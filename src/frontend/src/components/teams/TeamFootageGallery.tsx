import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Video, Trash2, Loader2 } from 'lucide-react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useDeleteTeamFootage } from '../../hooks/useQueries';
import { useState } from 'react';
import type { ExternalBlob, TeamDTO } from '../../backend';

interface TeamFootageGalleryProps {
  footage: ExternalBlob[];
  isLoading: boolean;
  team?: TeamDTO;
}

export default function TeamFootageGallery({ footage, isLoading, team }: TeamFootageGalleryProps) {
  const { identity } = useInternetIdentity();
  const deleteFootageMutation = useDeleteTeamFootage();
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  const isTeamLeader = team && identity && team.leader.toString() === identity.getPrincipal().toString();
  const isTeamMember = team && identity && team.members.some(m => m.toString() === identity.getPrincipal().toString());

  const handleDelete = async (videoId: string) => {
    if (!team) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this video? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingVideoId(videoId);
    try {
      await deleteFootageMutation.mutateAsync({
        teamId: team.id,
        videoId,
      });
    } finally {
      setDeletingVideoId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="aspect-video w-full rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!footage || footage.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <Video className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-xs sm:text-sm text-muted-foreground">
          No team footage uploaded yet. Team members can upload videos to showcase their skills!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {footage.map((video, index) => {
        const videoId = `video-${index}`;
        const isDeleting = deletingVideoId === videoId;
        
        // For now, we'll show delete button to team leaders and members
        // Backend will enforce proper authorization
        const canDelete = isTeamLeader || isTeamMember;

        return (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Left column: Profile picture and team icon */}
                <div className="flex flex-col gap-3 items-center flex-shrink-0">
                  {/* Uploader profile picture - placeholder for now */}
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Video className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Team icon */}
                  {team?.icon && (
                    <div className="h-10 w-10 rounded-lg overflow-hidden border border-border">
                      <img
                        src={`data:${team.icon.contentType};base64,${btoa(String.fromCharCode(...team.icon.bytes))}`}
                        alt="Team icon"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Right column: Video content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">Team Member</p>
                      <p className="text-xs text-muted-foreground">{team?.name || 'Team'}</p>
                    </div>
                    
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(videoId)}
                        disabled={isDeleting}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  <video
                    controls
                    className="w-full rounded-lg bg-black"
                    src={video.getDirectURL()}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
