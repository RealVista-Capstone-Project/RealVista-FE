'use client';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MyApplicationsProvider, useMyApplicationsContext } from '@/features/tenant-application/model/my-applications-context';
import { OverviewCards } from '@/features/tenant-application/ui/overview-cards';
import { ApplicationDetailPanel } from '@/features/tenant-application/ui/application-detail-panel';
import { ApplicationListItem } from '@/features/tenant-application/ui/application-list-item';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Calendar } from '@/shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select/select";
import { Search, FileText, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

function MyApplicationsContent() {
    const {
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
    } = useMyApplicationsContext();

    if (isLoading) return <div className='p-8 text-center text-muted-foreground'>Đang tải dữ liệu...</div>;
    if (isError) return <div className='p-8 text-center text-red-500'>Lỗi không tải được dữ liệu</div>;

    return (
        <div className='container mx-auto py-8 px-4 bg-muted/50 font-sans'>
             {/* Header */}
             <div className='flex justify-between items-center mb-8'>
                <div>
                   <h1 className='text-2xl font-bold text-foreground'>Quản lý đơn thuê nhà</h1>
                   <p className='text-muted-foreground text-sm mt-1'>Danh sách các đơn bạn đã gửi đi</p>
                </div>
            </div>

            <OverviewCards applications={applications || []} />

            <div className='flex flex-col lg:flex-row gap-8 items-start'>
                {/* Left Panel: List */}
                <div className={cn("flex-1 flex flex-col transition-all duration-300 w-full", selectedApp ? "lg:w-2/3" : "w-full")}>
                     {/* Filter Bar */}
                    <Card className='mb-6 border-none shadow-sm rounded-xl'>
                        <CardContent className='p-4 flex flex-col sm:flex-row gap-4 items-center'>
                             <div className='w-full sm:w-48'>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className='w-full bg-primary/5 border-transparent rounded-lg'>
                                        <SelectValue placeholder='Tất cả đơn' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='all'>Tất cả đơn</SelectItem>
                                        <SelectItem value='active'>Hoạt động</SelectItem>
                                        <SelectItem value='draft'>Nháp</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>

                            <div className='relative flex-1 w-full'>
                                <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                                <Input
                                    placeholder='Tìm kiếm theo tên nhà...'
                                    className='pl-9 bg-primary/5 border-transparent rounded-lg'
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant='outline' className={cn("w-full sm:w-auto justify-start text-left font-normal bg-primary/5 border-transparent rounded-lg", !date && "text-muted-foreground")}>
                                        <CalendarIcon className='mr-2 h-4 w-4' />
                                        {date ? format(date, "d MMM, yyyy", { locale: vi }) : <span>Chọn ngày</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className='w-auto p-0' align='end'>
                                    <Calendar
                                        mode='single'
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        locale={vi}
                                    />
                                    {date && (
                                        <div className='p-2 border-t border-primary/10'>
                                            <Button variant='ghost' className='w-full text-xs h-8' onClick={() => setDate(undefined)}>Xóa lọc ngày</Button>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </CardContent>
                    </Card>

                    {/* List Header */}
                     <div className='bg-white rounded-t-xl border-b border-primary/10 p-4 grid grid-cols-12 gap-4 text-xs font-semibold text-foreground uppercase tracking-wide'>
                        <div className='col-span-3'>Ngày nộp</div>
                        <div className='col-span-9'>Thông tin nhà</div>
                    </div>

                    {/* List Items */}
                    <div className='bg-white rounded-b-xl shadow-sm overflow-hidden min-h-[400px]'>
                        {filteredApps.length === 0 ? (
                            <div className='p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full'>
                                <FileText className='h-12 w-12 text-gray-300 mb-4' />
                                <p>Không tìm thấy đơn nào.</p>
                                {date && <Button variant='link' onClick={() => setDate(undefined)} className='text-primary'>Xóa bộ lọc ngày</Button>}
                            </div>
                        ) : (
                            <div className='divide-y divide-primary/5'>
                                {paginatedApps.map((app, index) => (
                                    <ApplicationListItem
                                        key={app.tenantApplicationId || index}
                                        application={app}
                                        isSelected={selectedApp?.tenantApplicationId === app.tenantApplicationId}
                                        onClick={handleAppClick}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                     {/* Pagination Controls */}
                     {filteredApps.length > 0 && (
                         <div className='flex items-center justify-between mt-4 px-2'>
                             <div className='text-sm text-muted-foreground font-medium'>
                                 Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredApps.length)} trên tổng {filteredApps.length}
                             </div>
                             <div className='flex gap-2'>
                                 <Button
                                    variant='outline'
                                    size='icon'
                                    className='h-8 w-8 rounded-lg border-primary/20 hover:bg-white hover:border-gray-300'
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                 >
                                     <ChevronLeft className='h-4 w-4' />
                                 </Button>
                                 <Button
                                    variant='outline'
                                    size='icon'
                                    className='h-8 w-8 rounded-lg border-primary/20 hover:bg-white hover:border-gray-300'
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                 >
                                     <ChevronRight className='h-4 w-4' />
                                 </Button>
                             </div>
                         </div>
                     )}
                </div>

                {/* Right Panel: Detail */}
                {selectedApp && (
                    <ApplicationDetailPanel
                        application={selectedApp}
                        onClose={() => setSelectedApp(null)}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        </div>
    );
}

export default function MyApplicationsPage() {
    return (
        <MyApplicationsProvider>
            <MyApplicationsContent />
        </MyApplicationsProvider>
    );
}
