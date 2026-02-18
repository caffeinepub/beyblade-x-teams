import { useState } from 'react';
import { useUploadTeamFootage } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ExternalBlob } from '../../backend';

interface TeamFootageUploaderProps {
  teamId: bigint;
}

export default function TeamFootageUploader({ teamId }: TeamFootageUploaderProps) {
  const uploadMutation = useUploadTeamFootage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setUploadStatus('error');
        return;
      }
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadProgress(0);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      await uploadMutation.mutateAsync({
        teamId,
        video: blob,
      });

      setUploadStatus('success');
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Reset file input
      const fileInput = document.getElementById('footage-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="space-y-2">
        <Label htmlFor="footage-upload" className="text-sm sm:text-base">Upload Team Footage</Label>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Input
            id="footage-upload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="flex-1 min-h-11 text-sm"
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="gap-2 min-h-11 w-full sm:w-auto px-6"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>

      {selectedFile && !isUploading && uploadStatus === 'idle' && (
        <Alert>
          <AlertDescription className="text-xs sm:text-sm">
            Ready to upload: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </AlertDescription>
        </Alert>
      )}

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {uploadStatus === 'success' && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 dark:text-green-100 text-xs sm:text-sm">
            Video uploaded successfully!
          </AlertDescription>
        </Alert>
      )}

      {uploadStatus === 'error' && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive text-xs sm:text-sm">
            Upload failed. Please ensure you selected a valid video file and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
