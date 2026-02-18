import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Video } from 'lucide-react';
import type { ExternalBlob } from '../../backend';

interface TeamFootageGalleryProps {
  footage: ExternalBlob[];
  isLoading: boolean;
}

export default function TeamFootageGallery({ footage, isLoading }: TeamFootageGalleryProps) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="aspect-video w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!footage || footage.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">
          No team footage uploaded yet. Team members can upload videos to showcase their skills!
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {footage.map((video, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-0">
            <video
              controls
              className="w-full aspect-video bg-black"
              src={video.getDirectURL()}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
