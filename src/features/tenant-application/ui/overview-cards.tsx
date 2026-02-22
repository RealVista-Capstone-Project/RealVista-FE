import { TenantApplication } from '@/entities/tenant-application/model/types';
import { Card, CardContent } from '@/shared/ui/card';
import { subDays, isAfter } from 'date-fns';
import { formatCurrency } from '../lib/utils';

interface OverviewCardsProps {
    applications: TenantApplication[];
}

export const OverviewCards = ({ applications }: OverviewCardsProps) => {
    // Lấy mốc thời gian 30 ngày trước
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Đơn trong 30 ngày qua
    const recentApplications = applications.filter((app) => {
        try {
            return isAfter(new Date(app.createdAt), thirtyDaysAgo);
        } catch {
            return false;
        }
    });

    const totalRecent = recentApplications.length;

    // Đơn từ khách hàng đã được nộp (bỏ qua bản nháp) để tính tỷ lệ phản hồi
    const submitApplications = recentApplications.filter((app) => app.status !== 'DRAFT');
    const totalSubmitted = submitApplications.length;

    // Đơn có phản hồi (Giả định là đơn có người xem xét, đổi trạng thái)
    const respondedApplications = submitApplications.filter((app) =>
        app.status === 'ACCEPTED' || app.status === 'REJECTED' || app.status === 'CANCELLED'
    );
    const totalResponded = respondedApplications.length;

    // Tính % phản hồi
    const responseRate = totalSubmitted > 0 ? Math.round((totalResponded / totalSubmitted) * 100) : 0;

    return (
        <Card className='mb-8 border-none shadow-sm bg-white overflow-hidden rounded-xl'>
            <CardContent className='p-0'>
                <div className='grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100'>
                    <div className='p-6'>
                        <div className='text-sm font-semibold text-gray-900 mb-1'>Tổng quan</div>
                        <div className='text-xs text-gray-400'>30 ngày qua</div>
                    </div>
                    <div className='p-6'>
                        <div className='text-sm font-medium text-gray-500 mb-1'>Tổng đơn đăng ký</div>
                        <div className='text-2xl font-bold text-gray-900'>{totalRecent}</div>
                    </div>
                     <div className='p-6'>
                         <div className='text-sm font-medium text-gray-500 mb-1'>Phí ứng tuyển</div>
                         {/* Tính phí ứng tuyển cho các đơn đã nộp (giả sử 50.000 VNĐ/đơn) */}
                         <div className='text-2xl font-bold text-gray-900'>{formatCurrency(totalSubmitted * 50000)}</div>
                    </div>
                     <div className='p-6'>
                         <div className='text-sm font-medium text-gray-500 mb-1'>Phản hồi</div>
                         <div className='flex items-center gap-2'>
                             <span className='text-2xl font-bold text-gray-900'>{totalResponded}</span>
                             <span className='text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded'>
                                 {responseRate}%
                             </span>
                         </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
