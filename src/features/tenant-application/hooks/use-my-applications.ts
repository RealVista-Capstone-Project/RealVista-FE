import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isSameDay } from 'date-fns';
import { tenantApplicationApi } from '@/entities/tenant-application/api';
import { TenantApplication } from '@/entities/tenant-application/model/types';

const ITEMS_PER_PAGE = 7;

export const useMyApplications = () => {
    const queryClient = useQueryClient();
    const [selectedApp, setSelectedApp] = useState<TenantApplication | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: applications, isLoading, isError } = useQuery({
        queryKey: ['my-applications'],
        queryFn: async () => {
            const data = await tenantApplicationApi.getMyApplications();
            // Sort by createdAt desc by default
            return (data || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    });

    const deleteMutation = useMutation({
        mutationFn: tenantApplicationApi.softDeleteApplication,
        onSuccess: () => {
            toast.success('Đã xóa đơn đăng ký thành công');
            queryClient.invalidateQueries({ queryKey: ['my-applications'] });
            setSelectedApp(null);
        },
        onError: () => toast.error('Xóa thất bại'),
    });

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    const getAppId = (app: TenantApplication) => app.tenantApplicationId;

    const handleAppClick = (app: TenantApplication) => {
        const appId = getAppId(app);
        const selectedId = selectedApp ? getAppId(selectedApp) : null;

        if (selectedId === appId) {
            setSelectedApp(null); // Deselect if clicking the same one
        } else {
            setSelectedApp(app);
            // Scroll to detail on mobile
            setTimeout(() => {
                const detailPanel = document.getElementById('application-detail-panel');
                if (detailPanel) {
                    detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 100);
        }
    };

    // Filter logic
    const filteredApps = useMemo(() => {
        return applications?.filter((app) => {
            const matchesSearch =
                app.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.propertyAddress?.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesDate = true;
            if (date) {
                try {
                    const appDate = new Date(app.createdAt);
                    if (!isNaN(appDate.getTime())) {
                        matchesDate = isSameDay(appDate, date);
                    }
                } catch {
                    matchesDate = false;
                }
            }

            let matchesStatus = true;
            if (statusFilter !== 'all') {
                if (statusFilter === 'active') matchesStatus = app.status === 'ACTIVE';
                if (statusFilter === 'draft') matchesStatus = app.status === 'DRAFT';
            }

            return matchesSearch && matchesDate && matchesStatus;
        }) || [];
    }, [applications, searchQuery, date, statusFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredApps.length / ITEMS_PER_PAGE);
    const paginatedApps = filteredApps.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return {
        applications,
        isLoading,
        isError,
        searchQuery, setSearchQuery,
        date, setDate,
        statusFilter, setStatusFilter,
        currentPage, setCurrentPage,
        selectedApp, setSelectedApp,
        filteredApps,
        paginatedApps,
        totalPages,
        ITEMS_PER_PAGE,
        handleDelete,
        handleAppClick
    };
};
