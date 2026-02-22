import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { TeamDTO, TeamWithMemberNamesDTO, UserProfile, Mail, ExternalBlob, BattleRequest } from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

// User Profile
export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save profile');
    },
  });
}

// Team Membership Status
export function useGetTeamMembershipStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<bigint | null>({
    queryKey: ['teamMembershipStatus'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTeamMembershipStatus();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

// Teams
export function useListTeams() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<TeamDTO[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTeams();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetTeam(teamId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<TeamDTO>({
    queryKey: ['team', teamId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTeam(BigInt(teamId));
    },
    enabled: !!actor && !actorFetching && !!teamId,
  });
}

export function useGetTeamWithMemberNames(teamId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<TeamWithMemberNamesDTO>({
    queryKey: ['teamWithMemberNames', teamId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTeamWithMemberNames(BigInt(teamId));
    },
    enabled: !!actor && !actorFetching && !!teamId,
  });
}

export function useCreateTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, initialMembers }: { name: string; initialMembers: Principal[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTeam(name, initialMembers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembershipStatus'] });
      toast.success('Team created successfully!');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to create team';
      if (message.includes('already a member of a team')) {
        toast.error('You are already on a team');
      } else {
        toast.error(message);
      }
    },
  });
}

export function useRequestJoinTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestJoinTeam(teamId);
    },
    onSuccess: (_, teamId) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teamWithMemberNames', teamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Join request sent to team leader!');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to send join request';
      if (message.includes('already a member of this team')) {
        toast.error('You are already a member of this team');
      } else if (message.includes('already requested')) {
        toast.error('You have already requested to join this team');
      } else if (message.includes('already a member of a team')) {
        toast.error('You are already on a team');
      } else {
        toast.error(message);
      }
    },
  });
}

export function useApproveJoinRequests() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, approvals }: { teamId: bigint; approvals: Principal[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveJoinRequests(teamId, approvals);
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teamWithMemberNames', teamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      toast.success('Join request approved!');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to approve join request';
      if (message.includes('exceed team size limit')) {
        toast.error('Cannot approve: Team is full (max 3 members)');
      } else if (message.includes('Only team leader')) {
        toast.error('Only the team leader can approve requests');
      } else if (message.includes('already a member of a team')) {
        toast.error('Cannot approve: User is already on another team');
      } else {
        toast.error(message);
      }
    },
  });
}

export function useDenyJoinRequests() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, denials }: { teamId: bigint; denials: Principal[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.denyJoinRequests(teamId, denials);
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teamWithMemberNames', teamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      toast.success('Join request denied');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deny join request');
    },
  });
}

// Team Icon Upload
export function useUploadTeamIcon() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      teamId, 
      filename, 
      contentType, 
      bytes 
    }: { 
      teamId: bigint; 
      filename: string; 
      contentType: string; 
      bytes: Uint8Array;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadTeamIcon(teamId, filename, contentType, bytes);
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teamWithMemberNames', teamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team icon uploaded successfully!');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to upload team icon';
      if (message.includes('Only team members')) {
        toast.error('Only team members can upload the team icon');
      } else if (message.includes('exceeds')) {
        toast.error('Image size exceeds 10 MB limit');
      } else if (message.includes('Unauthorized')) {
        toast.error('You must be logged in to upload an icon');
      } else {
        toast.error(message);
      }
    },
  });
}

// Team Disband
export function useDisbandTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.disbandTeam(teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembershipStatus'] });
      toast.success('Team disbanded successfully');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to disband team';
      if (message.includes('Only team leader')) {
        toast.error('Only the team leader can disband the team');
      } else {
        toast.error(message);
      }
    },
  });
}

// Leave Team
export function useLeaveTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.leaveTeam();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembershipStatus'] });
      toast.success('You have left the team');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to leave team';
      if (message.includes('not a member of any team')) {
        toast.error('You are not a member of any team');
      } else {
        toast.error(message);
      }
    },
  });
}

// Remove Member from Team
export function useRemoveMemberFromTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, member }: { teamId: bigint; member: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeMemberFromTeam(teamId, member);
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teamWithMemberNames', teamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Member removed from team');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to remove member';
      if (message.includes('Only team leader')) {
        toast.error('Only the team leader can remove members');
      } else {
        toast.error(message);
      }
    },
  });
}

// Inbox / Mail
export function useGetInbox() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Mail[]>({
    queryKey: ['inbox'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInbox();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useMarkMailAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mailId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markMailItemAsRead(mailId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark mail as read');
    },
  });
}

export function useDeleteMailItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mailId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMailItem(mailId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      toast.success('Message deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete message');
    },
  });
}

// Team Footage
export function useGetTeamFootage(teamId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ExternalBlob[]>({
    queryKey: ['teamFootage', teamId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTeamFootage(BigInt(teamId));
    },
    enabled: !!actor && !actorFetching && !!teamId,
  });
}

export function useUploadTeamFootage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, videoId, video }: { teamId: bigint; videoId: string; video: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadTeamFootage(teamId, videoId, video);
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teamFootage', teamId.toString()] });
      toast.success('Team footage uploaded successfully!');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to upload team footage';
      if (message.includes('Only team members')) {
        toast.error('Only team members can upload footage');
      } else {
        toast.error(message);
      }
    },
  });
}

export function useDeleteTeamFootage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, videoId }: { teamId: bigint; videoId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTeamFootage(teamId, videoId);
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teamFootage', teamId.toString()] });
      toast.success('Video deleted successfully');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to delete video';
      if (message.includes('Unauthorized')) {
        toast.error('Only the video uploader or team leader can delete this video');
      } else {
        toast.error(message);
      }
    },
  });
}

// Battle Requests
export function useListBattleRequestsForTeam(teamId: string) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<BattleRequest[]>({
    queryKey: ['battleRequests', teamId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listBattleRequestsForTeam(BigInt(teamId));
    },
    enabled: !!actor && !actorFetching && !!teamId && !!identity,
  });
}

export function useCreateBattleRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      requestingTeamId, 
      targetTeamId, 
      proposedDate 
    }: { 
      requestingTeamId: bigint; 
      targetTeamId: bigint; 
      proposedDate: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createBattleRequest(requestingTeamId, targetTeamId, proposedDate);
    },
    onSuccess: (_, { requestingTeamId, targetTeamId }) => {
      queryClient.invalidateQueries({ queryKey: ['battleRequests', requestingTeamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['battleRequests', targetTeamId.toString()] });
      toast.success('Battle request sent successfully!');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to create battle request';
      if (message.includes('Only requesting team leader')) {
        toast.error('Only the team leader can request battles');
      } else {
        toast.error(message);
      }
    },
  });
}

export function useRespondToBattleRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, accept }: { requestId: bigint; accept: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.respondToBattleRequest(requestId, accept);
    },
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ['battleRequests'] });
      toast.success(accept ? 'Battle request accepted!' : 'Battle request rejected');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to respond to battle request';
      if (message.includes('Only target team leader')) {
        toast.error('Only the target team leader can respond to this request');
      } else if (message.includes('no longer pending')) {
        toast.error('This battle request has already been responded to');
      } else {
        toast.error(message);
      }
    },
  });
}

// File Upload (kept for backward compatibility if needed elsewhere)
export function useUploadFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, filename, content }: { teamId: bigint; filename: string; content: Uint8Array }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadFile(teamId, filename, content);
    },
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teamWithMemberNames', teamId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('File uploaded successfully!');
    },
    onError: (error: Error) => {
      const message = error.message || 'Failed to upload file';
      if (message.includes('Only team members')) {
        toast.error('Only team members can upload files');
      } else if (message.includes('exceeds')) {
        toast.error('File size exceeds 10 MB limit');
      } else {
        toast.error(message);
      }
    },
  });
}
