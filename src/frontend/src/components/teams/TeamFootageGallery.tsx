import { useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, Video } from 'lucide-react';
import { useDeleteTeamFootage } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import type { ExternalBlob, TeamDTO } from '../../backend';
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

interface TeamFootageGalleryProps {
  footage: ExternalBlob[];
  isLoading: boolean;
  team: TeamDTO;
}

export default function TeamFootageGallery({ footage, isLoading, team }: TeamFootageGalleryProps) {
  const { identity } = useInternetIdentity();
  const deleteMutation = useDeleteTeamFootage();

  const isLeader = useMemo(() => {
    if (!identity || !team.leader) return false;
    return team.leader.toString() === identity.getPrincipal().toString();
  }, [identity, team.leader]);

  const handleDelete = useCallback(async (videoUrl: string) => {
    const videoId = videoUrl.split('/').pop() || '';
    try {
      await deleteMutation.mutateAsync({
        teamId: team.id,
        videoId,
      });
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  }, [deleteMutation, team.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!footage || footage.length === 0) {
    return (
      <div className="py-12 text-center">
        <Video className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">
          No footage uploaded yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {footage.map((video) => {
        const videoUrl = video.getDirectURL();
        
        return (
          <div key={videoUrl} className="flex gap-3 sm:gap-4 pb-6 border-b last:border-b-0">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                {team.icon?.bytes ? (
                  <AvatarImage
                    src={`data:${team.icon.contentType};base64,${btoa(String.fromCharCode(...team.icon.bytes))}`}
                    alt={team.name}
                  />
                ) : null}
                <AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">{team.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Team footage</p>
                </div>
                {isLeader && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 min-h-[44px] min-w-[44px]"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Video</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this video? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(videoUrl)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <video
                controls
                className="w-full rounded-lg border bg-black max-h-[400px] sm:max-h-[500px]"
                preload="metadata"
              >
                <source src={videoUrl} type="video/mp4" />
                <source src={videoUrl} type="video/webm" />
                <source src={videoUrl} type="video/quicktime" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        );
      })}
    </div>
  );
}
