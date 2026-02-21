import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { useUploadTeamFootage } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';

interface TeamFootageUploaderProps {
  teamId: bigint;
}

export default function TeamFootageUploader({ teamId }: TeamFootageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadMutation = useUploadTeamFootage();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadProgress(0);

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    // Validate file size (max 100MB for videos)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Video must be smaller than 100MB');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Create ExternalBlob with progress tracking
      const videoBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      // Generate a unique video ID
      const videoId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await uploadMutation.mutateAsync({
        teamId,
        videoId,
        video: videoBlob,
      });

      // Reset form
      e.target.value = '';
      setUploadProgress(0);
    } catch (err: any) {
      setError(err.message || 'Failed to upload video');
      console.error(err);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <Label htmlFor="footage-upload" className="text-sm sm:text-base">Upload Team Footage</Label>
      
      <div className="flex flex-col gap-3">
        <Input
          id="footage-upload"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={uploadMutation.isPending}
          className="min-h-11 text-sm"
        />
        
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {uploadMutation.isPending && uploadProgress === 100 && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing video...</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Supported formats: MP4, WebM, MOV. Max 100MB.
        </p>
      </div>

      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive text-xs sm:text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
