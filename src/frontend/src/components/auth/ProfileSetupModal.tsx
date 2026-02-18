import { useState } from 'react';
import { useActor } from '../../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ProfileSetupModal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!actor) {
      toast.error('Not connected');
      return;
    }

    setSaving(true);
    try {
      await actor.saveCallerUserProfile({ name: name.trim() });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile created!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to Beyblade X Teams!</DialogTitle>
          <DialogDescription>
            Please enter your name to get started with the tournament.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
