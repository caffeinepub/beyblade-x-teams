import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useCreateBattleRequest } from '../../hooks/useQueries';

interface BattleRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestingTeamId: bigint;
  targetTeamId: bigint;
  targetTeamName: string;
}

export default function BattleRequestDialog({
  open,
  onOpenChange,
  requestingTeamId,
  targetTeamId,
  targetTeamName,
}: BattleRequestDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const createBattleRequestMutation = useCreateBattleRequest();

  const handleSubmit = async () => {
    if (!selectedDate) return;

    try {
      await createBattleRequestMutation.mutateAsync({
        requestingTeamId,
        targetTeamId,
        proposedDate: format(selectedDate, 'yyyy-MM-dd'),
      });
      onOpenChange(false);
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Failed to create battle request:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Battle with {targetTeamName}</DialogTitle>
          <DialogDescription>
            Choose a date for the proposed battle. The team leader will review your request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Proposed Battle Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={createBattleRequestMutation.isPending}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedDate || createBattleRequestMutation.isPending}
            className="w-full sm:w-auto"
          >
            {createBattleRequestMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
