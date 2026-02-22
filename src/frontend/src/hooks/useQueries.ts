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
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'], exact: true });
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
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useGetTeam(teamId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<TeamDTO>({
    queryKey: ['team', teamId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!teamId || teamId === 'undefined' || teamId === 'null') {
        throw new Error('Invalid team ID');
      }
      return actor.getTeam(BigInt(teamId));
    },
    enabled: !!actor && !actorFetching && !!teamId && teamId !== 'undefined' && teamId !== 'null',
    retry: false,
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useGetTeamWithMemberNames(teamId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<TeamWithMemberNamesDTO>({
    queryKey: ['teamWithMemberNames', teamId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!teamId || teamId === 'undefined' || teamId === 'null') {
        throw new Error('Invalid team ID');
      }
      return actor.getTeamWithMemberNames(BigInt(teamId));
    },
    enabled: !!actor && !actorFetching && !!teamId && teamId !== 'undefined' && teamId !== 'null',
    retry: false,
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useCreateTeam() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, initialMembers }: { name: string; initialMembers: Principal[] }) => {
      if (!actor) throw new Error('Actor not available');
      if (actorFetching) throw new Error('Actor is still initializing');
      const teamId = await actor.createTeam(name, initialMembers);
      return teamId;
    },
    onSuccess: async (teamId) => {
      // Invalidate specific queries only
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teams'], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['teamMembershipStatus'], exact: true }),
      ]);
      toast.success('Team created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create team');
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
      // Only invalidate the specific team and inbox
      queryClient.invalidateQueries({ queryKey: ['team', teamId.toString()], exact: true });
      queryClient.invalidateQueries({ queryKey: ['teamWithMemberNames', teamId.toString()], exact: true });
      queryClient.invalidateQueries({ queryKey: ['inbox'], exact: true });
      toast.success('Join request sent!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send join request');
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
    onSuccess: async (_, variables) => {
      // Only invalidate specific team queries, not all teams
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['team', variables.teamId.toString()], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['teamWithMemberNames', variables.teamId.toString()], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['inbox'], exact: true }),
      ]);
      toast.success('Join requests approved!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve join requests');
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
    onSuccess: async (_, variables) => {
      // Only invalidate specific team queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['team', variables.teamId.toString()], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['teamWithMemberNames', variables.teamId.toString()], exact: true }),
        queryClient.invalidateQueries({ queryKey: ['inbox'], exact: true }),
      ]);
      toast.success('Join requests denied');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deny join requests');
    },
  });
}

export function useDisbandTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.disbandTeam(teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['teamMembershipStatus'], exact: true });
      toast.success('Team disbanded');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disband team');
    },
  });
}

export function useLeaveTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.leaveTeam();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['teamMembershipStatus'], exact: true });
      toast.success('Left team successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to leave team');
    },
  });
}

export function useRemoveMemberFromTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, member }: { teamId: bigint; member: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeMemberFromTeam(teamId, member);
    },
    onSuccess: (_, variables) => {
      // Only invalidate the specific team
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId.toString()], exact: true });
      queryClient.invalidateQueries({ queryKey: ['teamWithMemberNames', variables.teamId.toString()], exact: true });
      toast.success('Member removed from team');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove member');
    },
  });
}

export function useUploadTeamIcon() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      teamId,
      filename,
      contentType,
      bytes,
    }: {
      teamId: bigint;
      filename: string;
      contentType: string;
      bytes: Uint8Array;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadTeamIcon(teamId, filename, contentType, bytes);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team', variables.teamId.toString()], exact: true });
      queryClient.invalidateQueries({ queryKey: ['teamWithMemberNames', variables.teamId.toString()], exact: true });
      toast.success('Team icon uploaded!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload team icon');
    },
  });
}

// Mail
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
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
      queryClient.invalidateQueries({ queryKey: ['inbox'], exact: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark mail as read');
    },
  });
}

export function useDeleteMail() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mailId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMailItem(mailId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'], exact: true });
      toast.success('Mail deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete mail');
    },
  });
}

// Team Footage
export function useUploadTeamFootage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, videoId, video }: { teamId: bigint; videoId: string; video: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadTeamFootage(teamId, videoId, video);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teamFootage', variables.teamId.toString()], exact: true });
      toast.success('Footage uploaded successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload footage');
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teamFootage', variables.teamId.toString()], exact: true });
      toast.success('Footage deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete footage');
    },
  });
}

export function useGetTeamFootage(teamId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ExternalBlob[]>({
    queryKey: ['teamFootage', teamId],
    queryFn: async () => {
      if (!actor) return [];
      if (!teamId || teamId === 'undefined' || teamId === 'null') {
        return [];
      }
      return actor.getTeamFootage(BigInt(teamId));
    },
    enabled: !!actor && !actorFetching && !!teamId && teamId !== 'undefined' && teamId !== 'null',
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

// Battle Requests
export function useCreateBattleRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestingTeamId,
      targetTeamId,
      proposedDate,
    }: {
      requestingTeamId: bigint;
      targetTeamId: bigint;
      proposedDate: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createBattleRequest(requestingTeamId, targetTeamId, proposedDate);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['battleRequests', variables.requestingTeamId.toString()], exact: true });
      toast.success('Battle request sent!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send battle request');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battleRequests'], exact: false });
      toast.success('Battle request response sent!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to respond to battle request');
    },
  });
}

export function useGetBattleRequest(requestId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<BattleRequest | null>({
    queryKey: ['battleRequest', requestId],
    queryFn: async () => {
      if (!actor) return null;
      if (!requestId || requestId === 'undefined' || requestId === 'null') {
        return null;
      }
      return actor.getBattleRequest(BigInt(requestId));
    },
    enabled: !!actor && !actorFetching && !!requestId && requestId !== 'undefined' && requestId !== 'null',
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useListBattleRequestsForTeam(teamId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<BattleRequest[]>({
    queryKey: ['battleRequests', teamId],
    queryFn: async () => {
      if (!actor) return [];
      if (!teamId || teamId === 'undefined' || teamId === 'null') {
        return [];
      }
      return actor.listBattleRequestsForTeam(BigInt(teamId));
    },
    enabled: !!actor && !actorFetching && !!teamId && teamId !== 'undefined' && teamId !== 'null',
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
