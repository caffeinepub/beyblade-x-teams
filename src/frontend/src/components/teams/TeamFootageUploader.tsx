import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Video, X } from 'lucide-react';
import { useUploadTeamFootage } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { toast } from 'sonner';

interface TeamFootageUploaderProps {
  teamId: bigint;
}

export default function TeamFootageUploader({ teamId }: TeamFootageUploaderProps) {
  const uploadMutation = useUploadTeamFootage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (50 MB limit for videos)
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      toast.error('Video size must be less than 50 MB');
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Read file as array buffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Create ExternalBlob with progress tracking
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      await uploadMutation.mutateAsync({
        teamId,
        video: blob,
      });

      // Reset state on success
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="footage-upload" className="text-sm font-medium">
          Upload Team Footage
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          Share videos of your team training, battling, or revealing new Beys (max 50 MB)
        </p>
      </div>

      {!selectedFile ? (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <input
            id="footage-upload"
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <label htmlFor="footage-upload" className="cursor-pointer">
            <Video className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Click to select a video</p>
            <p className="text-xs text-muted-foreground">
              MP4, MOV, AVI, or other video formats
            </p>
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Video className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </div>
      )}
    </div>
  );
}
