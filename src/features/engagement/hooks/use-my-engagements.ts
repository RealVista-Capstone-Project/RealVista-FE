import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { engagementApi } from '@/entities/engagement/api';
import { Engagement } from '@/entities/engagement/model/types';

export const useMyEngagementsQuery = () => {
  return useQuery({
    queryKey: ['my-engagements'],
    queryFn: async () => {
      const data = await engagementApi.getMyEngagements();
      return (data || []).sort(
        (a: Engagement, b: Engagement) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
  });
};

export const useCancelEngagementMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: engagementApi.cancelEngagement,
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
