import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetInbox, useMarkMailAsRead, useDeleteMail, useApproveJoinRequests, useDenyJoinRequests } from '../hooks/useQueries';
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
  const deleteMutation = useDeleteMail();
  const approveMutation = useApproveJoinRequests();
  const denyMutation = useDenyJoinRequests();
  const [selectedMail, setSelectedMail] = useState<MailType | null>(null);

  const isAuthenticated = !!identity;

  const handleSelectMail = async (mail: MailType) => {
    setSelectedMail(mail);
    if (!mail.isRead) {
      try {
        await markAsReadMutation.mutateAsync(mail.id);
      } catch (error) {
        console.error('Failed to mark mail as read:', error);
      }
    }
  };

  const handleDelete = async (mailId: bigint) => {
    try {
      await deleteMutation.mutateAsync(mailId);
      if (selectedMail?.id === mailId) {
        setSelectedMail(null);
      }
    } catch (error) {
      console.error('Failed to delete mail:', error);
    }
  };

  const handleApproveJoinRequest = async (teamId: bigint, requester: any) => {
    try {
      await approveMutation.mutateAsync({
        teamId,
        approvals: [requester],
      });
      if (selectedMail) {
        await handleDelete(selectedMail.id);
      }
    } catch (error) {
      console.error('Failed to approve join request:', error);
    }
  };

  const handleDenyJoinRequest = async (teamId: bigint, requester: any) => {
    try {
      await denyMutation.mutateAsync({
        teamId,
        denials: [requester],
      });
      if (selectedMail) {
        await handleDelete(selectedMail.id);
      }
    } catch (error) {
      console.error('Failed to deny join request:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <PageShell title="Inbox">
        <Alert>
          <AlertDescription>Please log in to view your inbox.</AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  if (isLoading) {
    return (
      <PageShell title="Inbox">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </PageShell>
    );
  }

  const unreadCount = inbox?.filter(m => !m.isRead).length || 0;

  return (
    <PageShell 
      title="Inbox" 
      description={unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'No unread messages'}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Mail List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!inbox || inbox.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-muted-foreground text-sm sm:text-base">
                No messages yet
              </div>
            ) : (
              <div className="divide-y">
                {inbox.map((mail) => (
                  <button
                    key={mail.id.toString()}
                    onClick={() => handleSelectMail(mail)}
                    className={`w-full text-left p-3 sm:p-4 hover:bg-muted/50 transition-colors ${
                      selectedMail?.id === mail.id ? 'bg-muted' : ''
                    } ${!mail.isRead ? 'font-semibold' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {mail.isRead ? (
                          <MailOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <Mail className="h-4 w-4 text-primary shrink-0" />
                        )}
                        <span className="text-xs sm:text-sm truncate">
                          {mail.mailType === 'joinRequest' ? 'Join Request' : 'Notification'}
                        </span>
                      </div>
                      {!mail.isRead && (
                        <Badge variant="default" className="shrink-0 text-xs">New</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mail Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Message Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedMail ? (
              <div className="py-12 text-center text-muted-foreground text-sm sm:text-base">
                Select a message to view details
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold">
                      {selectedMail.mailType === 'joinRequest' ? 'Team Join Request' : 'Notification'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground break-all">
                      From: {selectedMail.sender.toString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(selectedMail.id)}
                    disabled={deleteMutation.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 min-h-[44px] min-w-[44px]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {selectedMail.content.__kind__ === 'joinRequest' && (
                  <div className="space-y-4 p-4 sm:p-6 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm sm:text-base">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-medium">Join Request Details</span>
                    </div>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <p><strong>Team ID:</strong> {selectedMail.content.joinRequest.teamId.toString()}</p>
                      <p><strong>Requester:</strong> <span className="break-all">{selectedMail.content.joinRequest.requester.toString()}</span></p>
                      <p><strong>Message:</strong> {selectedMail.content.joinRequest.message}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        onClick={() => {
                          if (selectedMail.content.__kind__ === 'joinRequest') {
                            handleApproveJoinRequest(
                              selectedMail.content.joinRequest.teamId,
                              selectedMail.content.joinRequest.requester
                            );
                          }
                        }}
                        disabled={approveMutation.isPending || denyMutation.isPending}
                        className="flex-1 gap-2 min-h-[44px]"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {approveMutation.isPending ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (selectedMail.content.__kind__ === 'joinRequest') {
                            handleDenyJoinRequest(
                              selectedMail.content.joinRequest.teamId,
                              selectedMail.content.joinRequest.requester
                            );
                          }
                        }}
                        disabled={approveMutation.isPending || denyMutation.isPending}
                        className="flex-1 gap-2 min-h-[44px]"
                      >
                        <XCircle className="h-4 w-4" />
                        {denyMutation.isPending ? 'Denying...' : 'Deny'}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedMail.content.__kind__ === 'notification' && (
                  <div className="p-4 sm:p-6 bg-muted/50 rounded-lg">
                    <p className="text-sm sm:text-base">{selectedMail.content.notification}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
