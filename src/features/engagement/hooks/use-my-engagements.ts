import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { engagementApi } from '@/entities/engagement/api';
import { Engagement } from '@/entities/engagement/model/types';
import { getAccessToken, type AuthSession } from '@/features/auth/model';

function engagementSortKey(e: Engagement): number {
  const t = new Date(e.createdAt as string | Date).getTime();
  return Number.isFinite(t) ? t : 0;
}

export const useMyEngagementsQuery = () => {
  const { data: session, status: sessionStatus } = useSession();
  const accessToken = getAccessToken(session as AuthSession | null) ?? '';

  const query = useQuery({
    queryKey: ['my-engagements', accessToken],
    enabled: sessionStatus === 'authenticated' && accessToken.length > 0,
    queryFn: async ({ queryKey }) => {
      const token = queryKey[1] as string;
      const data = await engagementApi.getMyEngagements(token);
      return [...(data || [])].sort(
        (a, b) => engagementSortKey(b) - engagementSortKey(a)
      );
    },
  });

  const isLoading =
    sessionStatus === 'loading' ||
    (sessionStatus === 'authenticated' && accessToken.length > 0 && query.isPending);

  return {
    ...query,
    isLoading,
    isError: sessionStatus === 'authenticated' && accessToken.length > 0 && query.isError,
  };
};

export const useCancelEngagementMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (id: string) => {
      const accessToken = getAccessToken(session as AuthSession | null);
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      return engagementApi.cancelEngagement(id, accessToken);
    },
    onSuccess: () => {
      toast.success('Đã hủy engagement thành công');
      queryClient.invalidateQueries({ queryKey: ['my-engagements'] });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: () => toast.error('Hủy thất bại'),
  });
};

export const useFinishEngagementMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (id: string) => {
      const accessToken = getAccessToken(session as AuthSession | null);
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      return engagementApi.finishEngagement(id, accessToken);
    },
    onSuccess: () => {
      toast.success('Đã hoàn thành engagement');
      queryClient.invalidateQueries({ queryKey: ['my-engagements'] });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: () => toast.error('Hoàn thành thất bại'),
  });
};

export const useAcceptEngagementMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (id: string) => {
      const accessToken = getAccessToken(session as AuthSession | null);
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      return engagementApi.acceptEngagement(id, accessToken);
    },
    onSuccess: () => {
      toast.success('Đã chấp nhận engagement');
      queryClient.invalidateQueries({ queryKey: ['my-engagements'] });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: () => toast.error('Chấp nhận thất bại'),
  });
};

export const useRejectEngagementMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (id: string) => {
      const accessToken = getAccessToken(session as AuthSession | null);
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      return engagementApi.rejectEngagement(id, accessToken);
    },
    onSuccess: () => {
      toast.success('Đã từ chối engagement');
      queryClient.invalidateQueries({ queryKey: ['my-engagements'] });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: () => toast.error('Từ chối thất bại'),
  });
};
