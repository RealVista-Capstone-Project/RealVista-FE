import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tenantApplicationApi } from '@/entities/tenant-application/api';
import { TenantApplication } from '@/entities/tenant-application/model/types';

export const useMyApplicationsQuery = () => {
    return useQuery({
        queryKey: ['my-applications'],
        queryFn: async () => {
            const data = await tenantApplicationApi.getMyApplications();
            // Sort by createdAt desc by default
            return (data || []).sort((a: TenantApplication, b: TenantApplication) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
    });
};

export const useDeleteApplicationMutation = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: tenantApplicationApi.softDeleteApplication,
        onSuccess: () => {
            toast.success('Đã xóa đơn đăng ký thành công');
            queryClient.invalidateQueries({ queryKey: ['my-applications'] });
            if (onSuccessCallback) {
                onSuccessCallback();
            }
        },
        onError: () => toast.error('Xóa thất bại'),
    });
};
