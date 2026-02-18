import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetInbox, useMarkMailAsRead, useDeleteMailItem, useApproveJoinRequests, useDenyJoinRequests } from '../hooks/useQueries';
import PageShell from '../components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, MailOpen, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import { useState } from 'react';
import type { Mail as MailType } from '../backend';

export default function InboxPage() {
  const { identity } = useInternetIdentity();
  const { data: inbox, isLoading } = useGetInbox();
  const markAsReadMutation = useMarkMailAsRead();
  const deleteMailMutation = useDeleteMailItem();
  const approveMutation = useApproveJoinRequests();
  const denyMutation = useDenyJoinRequests();

  const [selectedMail, setSelectedMail] = useState<MailType | null>(null);
  const [processingMail, setProcessingMail] = useState<Set<number>>(new Set());

  const isAuthenticated = !!identity;

  const handleSelectMail = async (mail: MailType) => {
    setSelectedMail(mail);
    if (!mail.isRead) {
      await markAsReadMutation.mutateAsync(mail.id);
    }
  };

  const handleDelete = async (mailId: bigint) => {
    const id = Number(mailId);
    setProcessingMail(prev => new Set(prev).add(id));
    try {
      await deleteMailMutation.mutateAsync(mailId);
      if (selectedMail?.id === mailId) {
        setSelectedMail(null);
      }
    } finally {
      setProcessingMail(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleApproveJoinRequest = async (mail: MailType) => {
    if (mail.content.__kind__ !== 'joinRequest') return;
    
    const id = Number(mail.id);
    setProcessingMail(prev => new Set(prev).add(id));
    
    try {
      await approveMutation.mutateAsync({
        teamId: mail.content.joinRequest.teamId,
        approvals: [mail.content.joinRequest.requester],
      });
      await deleteMailMutation.mutateAsync(mail.id);
      setSelectedMail(null);
    } finally {
      setProcessingMail(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDenyJoinRequest = async (mail: MailType) => {
    if (mail.content.__kind__ !== 'joinRequest') return;
    
    const id = Number(mail.id);
    setProcessingMail(prev => new Set(prev).add(id));
    
    try {
      await denyMutation.mutateAsync({
        teamId: mail.content.joinRequest.teamId,
        denials: [mail.content.joinRequest.requester],
      });
      await deleteMailMutation.mutateAsync(mail.id);
      setSelectedMail(null);
    } finally {
      setProcessingMail(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <PageShell title="Inbox" maxWidth="2xl">
        <Alert>
          <AlertDescription>
            Please sign in to view your inbox.
          </AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell title="Inbox" description="View and manage your messages" maxWidth="2xl">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!inbox || inbox.length === 0) {
    return (
      <PageShell title="Inbox" description="View and manage your messages" maxWidth="2xl">
        <Card>
          <CardContent className="py-12 text-center px-4">
            <Mail className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No Messages</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your inbox is empty. You'll receive messages here when someone requests to join your team.
            </p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="Inbox" description="View and manage your messages" maxWidth="2xl">
      <div className="flex flex-col md:grid md:grid-cols-3 gap-4 sm:gap-6">
        {/* Mail List */}
        <div className="space-y-3">
          {inbox.map((mail) => {
            const isSelected = selectedMail?.id === mail.id;
            const isProcessing = processingMail.has(Number(mail.id));
            
            return (
              <Card
                key={mail.id.toString()}
                className={`cursor-pointer transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                } ${!mail.isRead ? 'border-l-4 border-l-primary' : ''}`}
                onClick={() => handleSelectMail(mail)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {mail.isRead ? (
                        <MailOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      <span className="text-xs sm:text-sm font-medium">
                        {mail.mailType === 'joinRequest' ? 'Join Request' : 'Notification'}
                      </span>
                    </div>
                    {!mail.isRead && (
                      <Badge variant="default" className="text-xs">New</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {mail.content.__kind__ === 'joinRequest'
                      ? `Team ID: ${mail.content.joinRequest.teamId.toString()}`
                      : mail.content.notification}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mail Detail */}
        <div className="md:col-span-2">
          {selectedMail ? (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      {selectedMail.mailType === 'joinRequest' ? (
                        <>
                          <Users className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">Join Request</span>
                        </>
                      ) : (
                        <>
                          <Mail className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">Notification</span>
                        </>
                      )}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                      From: {selectedMail.sender.toString().slice(0, 12)}...
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(selectedMail.id)}
                    disabled={processingMail.has(Number(selectedMail.id))}
                    className="min-h-10 min-w-10 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                {selectedMail.content.__kind__ === 'joinRequest' ? (
                  <>
                    <div className="p-3 sm:p-4 bg-muted/50 rounded-lg space-y-2">
                      <p className="text-xs sm:text-sm break-words">
                        <span className="font-medium">Team ID:</span>{' '}
                        <button
                          onClick={() => window.location.hash = `/team/${selectedMail.content.__kind__ === 'joinRequest' ? selectedMail.content.joinRequest.teamId.toString() : ''}`}
                          className="text-primary hover:underline"
                        >
                          {selectedMail.content.joinRequest.teamId.toString()}
                        </button>
                      </p>
                      <p className="text-xs sm:text-sm break-all">
                        <span className="font-medium">Requester:</span>{' '}
                        {selectedMail.content.joinRequest.requester.toString().slice(0, 16)}...
                      </p>
                      <p className="text-xs sm:text-sm break-words">
                        <span className="font-medium">Message:</span>{' '}
                        {selectedMail.content.joinRequest.message}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={() => handleApproveJoinRequest(selectedMail)}
                        disabled={processingMail.has(Number(selectedMail.id))}
                        className="gap-2 flex-1 min-h-11"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {processingMail.has(Number(selectedMail.id)) ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDenyJoinRequest(selectedMail)}
                        disabled={processingMail.has(Number(selectedMail.id))}
                        className="gap-2 flex-1 min-h-11"
                      >
                        <XCircle className="h-4 w-4" />
                        {processingMail.has(Number(selectedMail.id)) ? 'Denying...' : 'Deny'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs sm:text-sm break-words">{selectedMail.content.notification}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center px-4">
                <Mail className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Select a message to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
