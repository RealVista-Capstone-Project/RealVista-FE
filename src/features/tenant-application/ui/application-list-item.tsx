import { TenantApplication } from '@/entities/tenant-application/model/types';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { FileText, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { formatDate } from '../lib/utils';

interface ApplicationListItemProps {
    application: TenantApplication;
    isSelected: boolean;
    onClick: (app: TenantApplication) => void;
}

export const ApplicationListItem = ({ application, isSelected, onClick }: ApplicationListItemProps) => {
    return (
        <div
            className={cn(
                "grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 cursor-pointer transition-all duration-200 group border-l-4 border-l-transparent",
                isSelected ? "bg-indigo-50/60 border-l-indigo-500" : "bg-white"
            )}
            onClick={() => onClick(application)}
        >
            <div className='col-span-3'>
                <div className='text-sm font-semibold text-gray-700'>
                    {formatDate(application.createdAt, 'dd MMM')}
                </div>
                <div className='text-xs text-gray-400 mt-1'>
                    {formatDate(application.createdAt, 'HH:mm')}
                </div>
            </div>
            <div className='col-span-9 flex items-center justify-between'>
                <div className='flex gap-4 items-center'>
                    <div className='relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 shadow-sm'>
                        {application.propertyImageUrl ? (
                            <Image
                                src={application.propertyImageUrl}
                                alt={application.title || "Property"}
                                fill
                                className='object-cover'
                            />
                        ) : (
                            <div className='w-full h-full flex items-center justify-center text-gray-300'>
                                <FileText className='h-6 w-6' />
                            </div>
                        )}
                    </div>
                    <div className='min-w-0'>
                        <div className='font-semibold text-gray-900 truncate text-sm mb-0.5'>{application.title || "Chưa có tiêu đề"}</div>
                        <div className='text-xs text-gray-500 truncate flex items-center gap-1'>
                            <span className='truncate'>{application.propertyAddress || "Chưa có địa chỉ"}</span>
                        </div>
                        <Badge variant='secondary' className={cn("mt-1.5 text-[10px] h-5 px-2 font-medium bg-gray-100 text-gray-600 hover:bg-gray-200",
                            application.status === 'ACTIVE' && "bg-green-100 text-green-700",
                            application.status === 'DRAFT' && "bg-gray-100 text-gray-700",
                            application.status === 'REJECTED' && "bg-red-100 text-red-700",
                            application.status === 'ARCHIVED' && "bg-gray-100 text-gray-500"
                        )}>
                            {application.status === 'ACTIVE' ? 'Hoạt động' :
                             application.status === 'DRAFT' ? 'Nháp' :
                             application.status === 'REJECTED' ? 'Từ chối' :
                             application.status === 'ARCHIVED' ? 'Lưu trữ' : application.status}
                        </Badge>
                    </div>
                </div>
                 <Button
                    variant='ghost'
                    size='sm'
                    className='text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick(application);
                    }}
                >
                    <MoreHorizontal className='h-4 w-4' />
                </Button>
            </div>
        </div>
    );
};
