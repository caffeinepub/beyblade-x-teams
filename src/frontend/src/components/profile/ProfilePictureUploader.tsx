import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalBlob } from '../../backend';

interface ProfilePictureUploaderProps {
  onFileSelect: (blob: ExternalBlob) => void;
  disabled?: boolean;
  currentPicture?: ExternalBlob | null;
}

export default function ProfilePictureUploader({ onFileSelect, disabled, currentPicture }: ProfilePictureUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setError('Please select a PNG, JPG, or WebP image');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Create preview
      const blob = new Blob([bytes], { type: file.type });
      const url = URL.createObjectURL(blob);
      setPreview(url);

      // Create ExternalBlob and pass to parent
      const externalBlob = ExternalBlob.fromBytes(bytes);
      onFileSelect(externalBlob);
    } catch (err) {
      setError('Failed to read file');
      console.error(err);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    const fileInput = document.getElementById('profile-picture-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const displayImage = preview || currentPicture?.getDirectURL();

  return (
    <div className="space-y-3 sm:space-y-4">
      <Label htmlFor="profile-picture-upload" className="text-sm sm:text-base">Profile Picture</Label>
      
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        {displayImage && (
          <div className="relative flex-shrink-0">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-border">
              <AvatarImage src={displayImage} alt="Profile picture preview" />
              <AvatarFallback>
                <Upload className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            {preview && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                onClick={handleClear}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        
        <div className="flex-1 w-full space-y-2">
          <Input
            id="profile-picture-upload"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            disabled={disabled}
            className="min-h-11 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            PNG, JPG, or WebP. Max 2MB.
          </p>
        </div>
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
