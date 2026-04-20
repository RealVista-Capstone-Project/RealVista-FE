'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Shield,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
} from 'lucide-react';

import { userQueries } from '@/entities/user/api';
import { UserProfile, UserStatus, RoleCode } from '@/entities/user/model/types';
import { DataTable } from '@/shared/ui/data-table';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useDebounce } from '@/shared/lib/hooks';
import { cn } from '@/shared/lib/utils';

import { UserDetailSheet } from './user-detail-sheet';

/**
 * Manage Users Page (Admin Only)
 *
 * Displays a paginated, searchable, and filterable list of all users.
 */
export function ManageUsersPage() {
  const t = useTranslations('ManageUsers');

  // State for filters and pagination
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [role, setRole] = React.useState<RoleCode | 'ALL'>('ALL');
  const [status, setStatus] = React.useState<UserStatus | 'ALL'>('ALL');

  // State for user detail view
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const handleViewDetails = (userId: string) => {
    setSelectedUserId(userId);
    setIsDetailOpen(true);
  };

  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  // Reset page index when filters change
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearch, role, status]);

  // Fetch users
  const {
    data: pageData,
    isLoading,
    isError,
  } = useQuery(
    userQueries.paged({
      page: pageIndex,
      size: pageSize,
      search: debouncedSearch || undefined,
      role: role === 'ALL' ? undefined : role,
      status: status === 'ALL' ? undefined : status,
      sort: 'createdAt,desc', // Default sort
    })
  );

  const columns = React.useMemo<ColumnDef<UserProfile>[]>(
    () => [
      {
        accessorKey: 'user',
        header: t('table.columns.user'),
        cell: ({ row }) => {
          const user = row.original;
          const initials = (user.full_name || user.email)
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);

          return (
            <div className='flex items-center gap-3'>
              <Avatar className='h-9 w-9 border border-primary/10 shadow-sm'>
                <AvatarImage src={user.avatar_url} alt={user.full_name || ''} />
                <AvatarFallback className='bg-primary/5 text-primary text-xs font-bold'>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className='flex flex-col'>
                <span className='text-sm font-semibold text-foreground'>
                  {user.full_name || 'N/A'}
                </span>
                <span className='text-xs text-muted-foreground flex items-center gap-1'>
                  <Mail className='h-3 w-3' />
                  {user.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'roles',
        header: t('table.columns.role'),
        cell: ({ row }) => {
          const roles = row.original.roles || [];
          return (
            <div className='flex flex-wrap gap-1'>
              {roles.map((r) => (
                <Badge
                  key={r}
                  variant='outline'
                  className='bg-secondary/30 text-[10px] font-bold uppercase tracking-wider border-primary/20'
                >
                  <Shield className='mr-1 h-3 w-3 text-primary/50' />
                  {t(`roles.${r}` as any) || r}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('table.columns.status'),
        cell: ({ row }) => {
          const status = row.original.status as UserStatus;
          const variants: Record<UserStatus, { label: string; icon: any; className: string }> = {
            ACTIVE: {
              label: t('status.ACTIVE'),
              icon: CheckCircle2,
              className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            },
            INACTIVE: {
              label: t('status.INACTIVE'),
              icon: Clock,
              className: 'bg-slate-50 text-slate-700 border-slate-200',
            },
            PENDING: {
              label: t('status.PENDING'),
              icon: Clock,
              className: 'bg-amber-50 text-amber-700 border-amber-200',
            },
            BLOCKED: {
              label: t('status.BLOCKED'),
              icon: Ban,
              className: 'bg-rose-50 text-rose-700 border-rose-200',
            },
          };
          const config = variants[status] || { label: status, icon: XCircle, className: '' };
          const Icon = config.icon;

          return (
            <Badge variant='outline' className={cn('gap-1 font-medium', config.className)}>
              <Icon className='h-3 w-3' />
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: t('table.columns.joinedAt'),
        cell: ({ row }) => {
          const date = new Date(row.original.created_at);
          return (
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap'>
              <Calendar className='h-3.5 w-3.5 opacity-40' />
              {date.toLocaleDateString()}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: t('table.columns.actions'),
        cell: ({ row }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>Open menu</span>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-[160px]'>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(row.original.user_id)}
                >
                  Copy User ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleViewDetails(row.original.user_id)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem className='text-rose-600 font-medium'>
                  Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [t]
  );

  return (
    <div className='flex h-full flex-col gap-6 p-6 overflow-hidden'>
      {/* Header section */}
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-3'>
          <div className='p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-sm shadow-primary/5'>
            <Users className='h-6 w-6 text-primary' />
          </div>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>{t('title')}</h1>
            <p className='text-sm text-muted-foreground'>{t('description')}</p>
          </div>
        </div>
      </div>

      {/* Main content - shadow and rounded borders added in DataTable wrapper */}
      <div className='flex-1 overflow-hidden flex flex-col gap-4'>
        <DataTable
          columns={columns}
          data={pageData?.content || []}
          pageCount={pageData?.total_pages}
          isLoading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          className='h-full flex flex-col'
          toolbar={
            <div className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50'>
              <div className='relative flex-1 max-w-sm group'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors' />
                <Input
                  placeholder={t('search.placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-9 h-10 border-primary/10 bg-primary/5 hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all'
                />
              </div>

              <div className='flex items-center gap-2'>
                <Select value={role} onValueChange={(v) => setRole(v as RoleCode | 'ALL')}>
                  <SelectTrigger className='w-[140px] h-10 border-primary/10 bg-white'>
                    <div className='flex items-center gap-2'>
                      <Shield className='h-4 w-4 text-muted-foreground/60' />
                      <SelectValue placeholder={t('filters.role')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>{t('filters.allRoles')}</SelectItem>
                    <SelectItem value='ADMIN'>{t('roles.ADMIN')}</SelectItem>
                    <SelectItem value='AGENT'>{t('roles.AGENT')}</SelectItem>
                    <SelectItem value='OWNER'>{t('roles.OWNER')}</SelectItem>
                    <SelectItem value='BUYER'>{t('roles.BUYER')}</SelectItem>
                    <SelectItem value='TENANT'>{t('roles.TENANT')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={status} onValueChange={(v) => setStatus(v as UserStatus | 'ALL')}>
                  <SelectTrigger className='w-[140px] h-10 border-primary/10 bg-white'>
                    <div className='flex items-center gap-2'>
                      <Filter className='h-4 w-4 text-muted-foreground/60' />
                      <SelectValue placeholder={t('filters.status')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>{t('filters.allStatuses')}</SelectItem>
                    <SelectItem value='ACTIVE'>{t('status.ACTIVE')}</SelectItem>
                    <SelectItem value='INACTIVE'>{t('status.INACTIVE')}</SelectItem>
                    <SelectItem value='PENDING'>{t('status.PENDING')}</SelectItem>
                    <SelectItem value='BLOCKED'>{t('status.BLOCKED')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
          emptyTitle={t('table.empty.title')}
          emptyDescription={t('table.empty.description')}
        />
      </div>
      <UserDetailSheet
        userId={selectedUserId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
