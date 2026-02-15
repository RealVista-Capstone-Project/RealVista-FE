import { TenantApplication } from '@/entities/tenant-application/model/types';
import { Card, CardContent } from '@/shared/ui/card';
import { formatCurrency } from '../lib/utils';

interface OverviewCardsProps {
    applications: TenantApplication[];
}

export const OverviewCards = ({ applications }: OverviewCardsProps) => {
    return (
        <Card className='mb-8 border-none shadow-sm bg-white overflow-hidden rounded-xl'>
            <CardContent className='p-0'>
                <div className='grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100'>
                    <div className='p-6'>
                        <div className='text-sm font-semibold text-gray-900 mb-1'>Tổng quan</div>
                        <div className='text-xs text-gray-400'>30 ngày qua</div>
                    </div>
                    <div className='p-6'>
                        <div className='text-sm font-medium text-gray-500 mb-1'>Tổng đơn đk</div>
                        <div className='text-2xl font-bold text-gray-900'>{applications.length}</div>
                    </div>
                    <div className='p-6'>
                         <div className='text-sm font-medium text-gray-500 mb-1'>Phí ứng tuyển</div>
                         <div className='text-2xl font-bold text-gray-900'>{formatCurrency(applications.length * 50)}</div>
                    </div>
                     <div className='p-6'>
                         <div className='text-sm font-medium text-gray-500 mb-1'>Phản hồi</div>
                         <div className='flex items-center gap-2'>
                             <span className='text-2xl font-bold text-gray-900'>3</span>
                             <span className='text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded'>25%</span>
                         </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
