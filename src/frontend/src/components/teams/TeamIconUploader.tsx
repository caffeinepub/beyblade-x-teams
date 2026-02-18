import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, AlertCircle } from 'lucide-react';
import { imageToDataUrl } from '../../utils/imageDataUrl';

interface TeamIconUploaderProps {
  onFileSelect: (file: File, content: Uint8Array) => void;
  disabled?: boolean;
  currentIcon?: { bytes: Uint8Array; contentType: string } | null;
  compact?: boolean;
}

export default function TeamIconUploader({ onFileSelect, disabled, currentIcon, compact }: TeamIconUploaderProps) {
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

      onFileSelect(file, bytes);
    } catch (err) {
      setError('Failed to read file');
      console.error(err);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    const fileInput = document.getElementById('icon-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const displayImage = preview || (currentIcon ? imageToDataUrl(currentIcon.bytes, currentIcon.contentType) : null);

  return (
    <div className="space-y-3 sm:space-y-4">
      {!compact && <Label htmlFor="icon-upload" className="text-sm sm:text-base">Team Icon</Label>}
      
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        {displayImage && (
          <div className="relative flex-shrink-0">
            <img
              src={displayImage}
              alt="Team icon preview"
              className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg border-2 border-border"
            />
            {preview && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 sm:h-7 sm:w-7 rounded-full min-h-10 min-w-10"
                onClick={handleClear}
                disabled={disabled}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        )}
        
        <div className="flex-1 w-full space-y-2">
          <Input
            id="icon-upload"
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
