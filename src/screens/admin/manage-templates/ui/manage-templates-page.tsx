'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { toast } from 'sonner';
import {
  FileText,
  Search,
  Plus,
  Mail,
  Bell,
  ChevronRight,
  Database,
  Edit,
  Trash2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

import { templateApi, NotificationTemplate } from '@/shared/api/template.api';
import { DataTable } from '@/shared/ui/data-table';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { useDebounce } from '@/shared/lib/hooks';
import { cn } from '@/shared/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { TemplateEditorSheet } from './template-editor-sheet';

export function ManageTemplatesPage() {
  const t = useTranslations('ManageTemplates');
  const queryClient = useQueryClient();

  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<NotificationTemplate | null>(null);

  const [statusTab, setStatusTab] = React.useState<string>('ALL');
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const pagination = React.useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize]);

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin', 'templates', pageIndex, pageSize, debouncedSearch, statusTab],
    queryFn: () => templateApi.getAll(pageIndex, pageSize, debouncedSearch, statusTab === 'ALL' ? undefined : statusTab),
  });

  const templates = pageData?.content || [];


  const deleteMutation = useMutation({
    mutationFn: templateApi.delete,
    onSuccess: () => {
      toast.success(t('actions.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] });
    },
    onError: () => toast.error('Failed to delete template'),
  });

  const columns = React.useMemo<ColumnDef<NotificationTemplate>[]>(
    () => [
      {
        accessorKey: 'template_key',
        header: t('table.columns.key'),
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50'>
              {row.original.type === 'EMAIL' ? <Mail className='h-5 w-5 text-blue-500' /> : <Bell className='h-5 w-5 text-purple-500' />}
            </div>
            <div className='flex flex-col min-w-0'>
              <span className='font-mono text-[10px] font-black text-primary uppercase tracking-wider mb-0.5'>
                {row.original.template_key}
              </span>
              <span className='text-sm font-bold text-slate-900 truncate'>{row.original.name}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: t('table.columns.type'),
        cell: ({ row }) => {
          const type = row.original.type;
          return (
            <Badge variant='outline' className={cn(
              'font-bold text-[10px] px-2.5 py-0.5 rounded-full border shadow-sm uppercase tracking-wider',
              type === 'EMAIL' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
            )}>
              {type}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'language',
        header: t('table.columns.language'),
        cell: ({ row }) => (
          <Badge className='bg-slate-900 text-white border-none text-[10px] h-5 px-2 font-black uppercase tracking-tighter'>
            {row.original.language}
          </Badge>
        ),
      },
      {
        accessorKey: 'updated_at',
        header: t('table.columns.updatedAt'),
        cell: ({ row }) => {
          const updatedAt = row.original.updated_at;
          const date = updatedAt ? new Date(updatedAt) : null;
          const isValidDate = date && !isNaN(date.getTime());

          return (
            <div className='flex items-center gap-2 text-slate-500 font-medium'>
              <Calendar className='h-4 w-4 opacity-40' />
              <span className='text-xs'>
                {isValidDate ? format(date, 'MMM dd, yyyy') : '---'}
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className='flex items-center justify-end gap-2'>
            <Button
              variant='ghost'
              size='icon'
              className='h-9 w-9 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 transition-all'
              onClick={(e) => {
                e.stopPropagation();
                setEditingTemplate(row.original);
                setIsFormOpen(true);
              }}
            >
              <Edit className='h-4 w-4' />
            </Button>
            <DeleteAction
              onDelete={() => deleteMutation.mutate(row.original.template_id)}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === row.original.template_id}
            />
          </div>
        ),
      },
    ],
    [t, deleteMutation]
  );

  return (
    <div className='flex-1 space-y-4 p-8 pt-6 min-h-[calc(100vh-140px)] bg-slate-50/50 dark:bg-slate-950'>
      <header className='flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-2'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2'>
            {t('title')}
          </h2>
          <p className='text-muted-foreground'>
            {t('description')}
          </p>
        </div>

        <div className='flex items-center gap-4'>
           <Button
            onClick={() => {
              setEditingTemplate(null);
              setIsFormOpen(true);
            }}
            className='h-10 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95'
          >
            <Plus className='h-4 w-4 mr-2' />
            {t('createNew')}
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8'>
        <StatsCard
          label={t('stats.total')}
          value={pageData?.total_elements || 0}
          icon={FileText}
          color='blue'
        />
        <StatsCard
          label={t('stats.email')}
          value={templates.filter((t: any) => t.type === 'EMAIL').length}
          icon={Mail}
          color='blue'
        />
        <StatsCard
          label={t('stats.inApp')}
          value={templates.filter((t: any) => t.type === 'IN_APP').length}
          icon={Bell}
          color='purple'
        />
        <StatsCard
          label={t('stats.languages')}
          value={new Set(templates.map((t: any) => t.language)).size}
          icon={Database}
          color='purple'
        />
      </div>

      {/* Search and Filters Bar */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800 p-4 px-6 mb-4'>
        <div className='flex flex-col sm:flex-row items-center gap-4 w-full'>
          <Tabs
            value={statusTab}
            onValueChange={setStatusTab}
            className='w-full sm:w-auto'
          >
            <TabsList className='h-9'>
              <TabsTrigger value='ALL' className='text-xs px-4'>{t('filters.all')}</TabsTrigger>
              <TabsTrigger value='EMAIL' className='text-xs px-4'>{t('filters.email')}</TabsTrigger>
              <TabsTrigger value='IN_APP' className='text-xs px-4'>{t('filters.inApp')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className='relative w-full sm:w-64'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none' />
            <Input
              placeholder={t('search.placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all rounded-xl'
              style={{ paddingLeft: '48px' }}
            />
          </div>
        </div>
      </div>

      {templates.length === 0 && !isLoading ? (
        <div className='flex-1 flex flex-col items-center justify-center p-16 text-center bg-white border border-slate-200 rounded-xl shadow-sm dark:bg-slate-950 dark:border-slate-800'>
          <div className='h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4'>
            <Database className='h-6 w-6 text-slate-400' />
          </div>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-50 tracking-tight'>{t('emptyState.title')}</h3>
          <p className='text-sm text-slate-500 mt-2 max-w-sm'>
            {debouncedSearch ? t('search.noResults') : t('emptyState.description')}
          </p>
           <Button
            variant='outline'
            onClick={() => {
              setEditingTemplate(null);
              setIsFormOpen(true);
            }}
            className='mt-6 h-9'
          >
            <Plus className='h-4 w-4 mr-2' />
            {t('emptyState.button')}
          </Button>
        </div>
      ) : (
        <div className='flex-1 flex flex-col overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800'>
          <div className='flex-1 overflow-auto custom-scrollbar'>
            <DataTable
              columns={columns}
              data={templates}
              pageCount={pageData?.total_pages}
              isLoading={isLoading}
              pagination={pagination}
              onPaginationChange={setPagination}
              onRowClick={(row: any) => {
                setEditingTemplate(row);
                setIsFormOpen(true);
              }}
              className='border-none'
            />
          </div>
        </div>
      )}

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

      {isFormOpen && (
        <TemplateEditorSheet
          template={editingTemplate}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
        />
      )}
    </div>
  );
}

function DeleteAction({ onDelete, isDeleting }: { onDelete: () => void; isDeleting: boolean }) {
  const t = useTranslations('ManageTemplates');
  const [isConfirming, setIsConfirming] = React.useState(false);

  React.useEffect(() => {
    if (isConfirming) {
      const timer = setTimeout(() => setIsConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirming]);

  return (
    <div className='flex items-center'>
      <div
        className={cn(
          'flex items-center overflow-hidden transition-all duration-300 ease-in-out rounded-full',
          isConfirming ? 'w-[100px] bg-red-50 pr-1' : 'w-8 bg-transparent'
        )}
      >
        <Button
          variant='ghost'
          size='icon'
          className={cn(
            'h-8 w-8 shrink-0 transition-colors',
            isConfirming ? 'text-red-600 hover:bg-red-100' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (isConfirming) {
              onDelete();
            } else {
              setIsConfirming(true);
            }
          }}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <div className='h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent' />
          ) : (
            <Trash2 className='h-4 w-4' />
          )}
        </Button>

        {isConfirming && !isDeleting && (
          <span
            className='text-[10px] font-black text-red-600 uppercase tracking-tighter cursor-pointer select-none whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300'
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            {t('actions.confirm')}
          </span>
        )}
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: 'blue' | 'purple' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className='bg-white p-2 pl-4 pr-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all'>
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        <Icon className='h-5 w-5' />
      </div>
      <div>
        <p className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>{label}</p>
        <p className='text-xl font-black text-slate-900'>{value}</p>
      </div>
    </div>
  );
}
