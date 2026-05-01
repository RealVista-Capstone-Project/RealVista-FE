'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Flag,
  AlertCircle,
  ShieldAlert,
  User,
  LayoutGrid,
  Calendar,
  ChevronRight,
  ClipboardList,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { reportApi, Report, ReportStatus, ReportTargetType } from '@/entities/report/api/report.api';
import { DataTable } from '@/shared/ui/data-table/data-table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/shared/ui/dropdown-menu';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { ReportDetailSheet } from './report-detail-sheet';
import { cn } from '@/shared/lib/utils';
import { format, differenceInHours } from 'date-fns';

export function ManageReportsPage() {
  const t = useTranslations('ManageReports');
  const [selectedReport, setSelectedReport] = React.useState<Report | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [statusTab, setStatusTab] = React.useState<string>('ALL');
  const [search, setSearch] = React.useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', statusTab, search, pagination.pageIndex, pagination.pageSize],
    queryFn: () => reportApi.getPaged({
      status: statusTab === 'ALL' ? undefined : statusTab,
      page: pagination.pageIndex,
      size: pagination.pageSize,
      search: search || undefined
    }),
  });

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  const statusMap: Record<string, { label: string, color: string }> = {
    PENDING: { label: t('stats.pending'), color: 'bg-amber-50 text-amber-700 border-amber-100' },
    REVIEWING: { label: t('stats.reviewing'), color: 'bg-blue-50 text-blue-700 border-blue-100' },
    RESOLVED: { label: t('stats.resolved'), color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    DISMISSED: { label: t('stats.dismissed'), color: 'bg-slate-50 text-slate-600 border-slate-100' },
  };

  const columns = [
    {
      accessorKey: 'report_target',
      header: t('table.columns.target'),
      cell: ({ row }: any) => (
        <div className='flex flex-col'>
          <div className='flex items-center gap-2'>
            <span className='text-[10px] font-bold text-slate-400 uppercase tracking-tighter'>
              {row.original.report_target_type}
            </span>
            {row.original.report_reason === 'SCAM' && (
               <span className='w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse' title={t('detail.highPriority')} />
            )}
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-semibold text-slate-900 truncate max-w-[200px]'>
              {row.original.report_target_type === 'LISTING'
                ? row.original.reported_listing_name
                : row.original.reported_user_name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const url = row.original.report_target_type === 'LISTING'
                  ? `/buy/${row.original.report_target_id}`
                  : `/admin?search=${row.original.report_target_id}`;
                window.open(url, '_blank');
              }}
              className='p-1 rounded-md hover:bg-slate-100 text-primary transition-colors'
              title={t('detail.actions.viewTarget')}
            >
              <ExternalLink className='h-3 w-3' />
            </button>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'report_reason',
      header: t('table.columns.reason'),
      cell: ({ row }: any) => (
        <span className='text-xs font-medium text-slate-600'>
          {t(`detail.reasons.${row.original.report_reason}`)}
        </span>
      )
    },
    {
      accessorKey: 'reporter',
      header: t('table.columns.reporter'),
      cell: ({ row }: any) => (
        <div className='flex flex-col'>
          <span className='text-xs font-semibold text-slate-700'>{row.original.reporter_name}</span>
          <span className='text-[10px] text-slate-400'>{row.original.reporter_email}</span>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: t('table.columns.status'),
      cell: ({ row }: any) => {
        const status = row.original.status || 'PENDING';
        const s = statusMap[status] || { label: status, color: 'bg-slate-50 text-slate-600 border-slate-100' };

        return (
          <Badge variant='outline' className={cn('font-bold text-[10px] px-2 py-0 h-5 rounded-md border shadow-none uppercase', s.color)}>
            {s.label}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'created_at',
      header: t('table.columns.date'),
      cell: ({ row }: any) => (
        <span className='text-[11px] text-slate-500 font-medium'>
          {row.original.created_at ? format(new Date(row.original.created_at), 'dd/MM/yyyy') : '---'}
        </span>
      )
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <div className='flex items-center justify-end'>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 text-primary font-bold gap-1 hover:bg-primary/5'
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(row.original);
            }}
          >
            <Eye className='h-3.5 w-3.5' />
            {t('detail.reviewFullReport')}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className='flex-1 space-y-4 p-8 pt-6 min-h-[calc(100vh-140px)] bg-slate-50/50 dark:bg-slate-950'>
      <div className='flex items-center justify-between space-y-2 mb-8'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50'>
            {t('title')}
          </h2>
          <p className='text-muted-foreground mt-2'>
            {t('description')}
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <Badge className='bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50'>
            {t('header.liveSystem')}
          </Badge>
        </div>
      </div>

      <div className='flex-1 flex flex-col overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800'>
        <DataTable
          columns={columns}
          data={data?.payload.data.content || []}
          pageCount={data?.payload.data.total_pages}
          isLoading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          className='border-none'
          toolbar={
            <div className='flex flex-col sm:flex-row items-center justify-between p-4 px-6 border-b border-slate-100'>
              <Tabs value={statusTab} onValueChange={setStatusTab} className='w-full sm:w-auto'>
                <TabsList className='h-9'>
                  <TabsTrigger value='ALL' className='px-4 text-xs font-medium'>
                    {t('filters.allReports')}
                  </TabsTrigger>
                  {['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'].map((status) => (
                    <TabsTrigger
                      key={status}
                      value={status}
                      className='px-4 text-xs font-medium'
                    >
                      {statusMap[status].label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className='flex items-center gap-2 mt-4 sm:mt-0'>
                <div className='relative w-full sm:w-64'>
                  <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-slate-500' />
                  <Input
                    placeholder={t('filters.searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='h-9 pl-9 bg-transparent border-slate-200'
                  />
                </div>
              </div>
            </div>
          }
        />

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>

      <ReportDetailSheet
        report={selectedReport}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
