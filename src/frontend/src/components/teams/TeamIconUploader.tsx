import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

interface TeamIconUploaderProps {
  onFileSelect: (file: File, content: Uint8Array) => void;
  disabled?: boolean;
  currentIcon?: { bytes: Uint8Array; contentType: string } | null;
  compact?: boolean;
}

export default function TeamIconUploader({ 
  onFileSelect, 
  disabled, 
  currentIcon,
  compact = false 
}: TeamIconUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Please select an image file (PNG, JPG, or WebP)');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image size exceeds 10 MB limit');
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Read file as Uint8Array
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      onFileSelect(file, uint8Array);
    } catch (error) {
      toast.error('Failed to read image file');
      console.error(error);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Display current icon if no new file selected
  const displayUrl = previewUrl || (currentIcon ? 
    URL.createObjectURL(new Blob([new Uint8Array(currentIcon.bytes)], { type: currentIcon.contentType })) : 
    null
  );

  return (
    <div className="space-y-3">
      {!compact && <Label htmlFor="icon-upload">Team Icon</Label>}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          id="icon-upload"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {currentIcon && !selectedFile ? 'Replace Icon' : 'Choose Image'}
        </Button>
        {(selectedFile || displayUrl) && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md flex-1">
            {displayUrl && (
              <img 
                src={displayUrl} 
                alt="Team icon preview" 
                className="h-10 w-10 object-cover rounded"
              />
            )}
            {!displayUrl && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm truncate flex-1">
              {selectedFile?.name || 'Current icon'}
            </span>
            {selectedFile && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      {!compact && (
        <p className="text-xs text-muted-foreground">
          Maximum file size: 10 MB. Accepted formats: PNG, JPG, WebP.
        </p>
      )}
    </div>
  );
}
