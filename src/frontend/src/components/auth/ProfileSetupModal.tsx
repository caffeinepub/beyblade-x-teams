import { useState, useCallback } from 'react';
import { useSaveCallerUserProfile } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const saveMutation = useSaveCallerUserProfile();

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    try {
      await saveMutation.mutateAsync({
        name: name.trim(),
        aboutMe: '',
        profilePicture: undefined,
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }, [name, saveMutation]);

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome!</DialogTitle>
          <DialogDescription>
            Please enter your name to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              disabled={saveMutation.isPending}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
