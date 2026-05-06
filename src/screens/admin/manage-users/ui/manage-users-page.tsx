'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { ColumnDef, PaginationState } from '@tanstack/react-table';
import { toast } from 'sonner';
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
  Ban,
  UserX,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { userQueries, userApi, userKeys } from '@/entities/user/api';
import { UserProfile, UserStatus, RoleCode } from '@/entities/user/model/types';
import { agentProfileKeys } from '@/entities/agent-profile';
import { listingKeys } from '@/entities/listing/api/keys';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
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
  const queryClient = useQueryClient();

  // State for filters and pagination
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [search, setSearch] = React.useState(urlSearch);
  const debouncedSearch = useDebounce(search, 500);
  const [role, setRole] = React.useState<RoleCode | 'ALL'>('ALL');
  const [status, setStatus] = React.useState<UserStatus | 'ALL'>('ALL');

  // State for user detail view
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  // State for suspension confirmation
  const [userToSuspend, setUserToSuspend] = React.useState<{ id: string; name: string } | null>(
    null
  );
  const [isSuspendConfirmOpen, setIsSuspendConfirmOpen] = React.useState(false);

  const handleOpenSuspendConfirm = (userId: string, userName: string) => {
    setUserToSuspend({ id: userId, name: userName });
    setIsSuspendConfirmOpen(true);
  };

  // State for ban confirmation
  const [userToBan, setUserToBan] = React.useState<{ id: string; name: string; email: string } | null>(null);
  const [isBanConfirmOpen, setIsBanConfirmOpen] = React.useState(false);
  const [confirmEmail, setConfirmEmail] = React.useState('');

  const handleOpenBanConfirm = (userId: string, userName: string, userEmail: string) => {
    setUserToBan({ id: userId, name: userName, email: userEmail });
    setConfirmEmail('');
    setIsBanConfirmOpen(true);
  };

  // State for delete confirmation
  const [userToDelete, setUserToDelete] = React.useState<{ id: string; name: string; email: string } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = React.useState('');

  const handleOpenDeleteConfirm = (userId: string, userName: string, userEmail: string) => {
    setUserToDelete({ id: userId, name: userName, email: userEmail });
    setConfirmDeleteEmail('');
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmSuspend = () => {
    if (userToSuspend) {
      suspendMutation.mutate(userToSuspend.id);
      setIsSuspendConfirmOpen(false);
    }
  };

  const handleConfirmBan = () => {
    if (userToBan) {
      banMutation.mutate(userToBan.id);
      setIsBanConfirmOpen(false);
    }
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id);
      setIsDeleteConfirmOpen(false);
    }
  };

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

  const invalidateAccountSideEffects = React.useCallback(
    (userId?: string) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      }
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
      queryClient.invalidateQueries({ queryKey: agentProfileKeys.all });
    },
    [queryClient]
  );

  // Mutations for user actions
  const suspendMutation = useMutation({
    mutationFn: userApi.suspend,
    onSuccess: () => {
      toast.success(t('actions.suspendSuccess'));
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: () => {
      toast.error(t('actions.suspendError'));
    },
  });

  const activateMutation = useMutation({
    mutationFn: userApi.activate,
    onSuccess: () => {
      toast.success(t('actions.activateSuccess'));
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: () => {
      toast.error(t('actions.activateError'));
    },
  });

  const banMutation = useMutation({
    mutationFn: userApi.ban,
    onSuccess: (_data, userId) => {
      toast.success(t('actions.banSuccess'));
      invalidateAccountSideEffects(userId);
    },
    onError: () => {
      toast.error(t('actions.banError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userApi.deleteAccount,
    onSuccess: (_data, userId) => {
      toast.success(t('actions.deleteSuccess'));
      if (selectedUserId === userId) {
        setIsDetailOpen(false);
        setSelectedUserId(null);
      }
      invalidateAccountSideEffects(userId);
    },
    onError: () => {
      toast.error(t('actions.deleteError'));
    },
  });

  const columns = React.useMemo<ColumnDef<UserProfile>[]>(
    () => [
      {
        accessorKey: 'user',
        header: t('table.columns.user'),
        cell: ({ row }) => {
          const user = row.original;
          const isDeleted = Boolean(user.deleted || user.is_deleted || user.deleted_at);
          const isInactive = isDeleted || user.status === 'BANNED' || user.status === 'SUSPENDED';
          const initials = (user.full_name || user.email)
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);

          return (
            <div className='flex items-center gap-3'>
              <Avatar className='h-10 w-10 border border-primary/15 shadow-sm'>
                <AvatarImage src={user.avatar_url} alt={user.full_name || ''} />
                <AvatarFallback className='bg-primary/5 text-primary text-xs font-bold'>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className='flex min-w-0 flex-col'>
                <span className='truncate text-sm font-semibold text-foreground'>
                  {user.full_name || 'N/A'}
                </span>
                <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <Mail className='h-3 w-3 shrink-0' />
                  <span className='truncate'>{user.email}</span>
                </span>
                {isInactive && (
                  <span className='mt-1 text-[10px] font-semibold uppercase tracking-wide text-red-600'>
                    {isDeleted ? t('accountLabels.deleted') : t('accountLabels.inactive')}
                  </span>
                )}
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
                  className='border-primary/20 bg-secondary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider'
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
            SUSPENDED: {
              label: t('status.SUSPENDED'),
              icon: UserX,
              className: 'bg-amber-50 text-amber-700 border-amber-200',
            },
            BANNED: {
              label: t('status.BANNED'),
              icon: Ban,
              className: 'bg-red-50 text-red-700 border-red-200',
            },
            VERIFIED: {
              label: t('status.VERIFIED'),
              icon: CheckCircle2,
              className: 'bg-blue-50 text-blue-700 border-blue-200',
            },
          };
          const config = variants[status] || { label: status, icon: XCircle, className: '' };
          const Icon = config.icon;

          return (
            <Badge variant='outline' className={cn('gap-1 px-2 py-0.5 font-semibold', config.className)}>
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
            <div className='flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground'>
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
          const isDeleted = Boolean(row.original.deleted || row.original.is_deleted || row.original.deleted_at);
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-muted/60 hover:text-foreground'>
                  <span className='sr-only'>Open menu</span>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-[200px]'>
                <DropdownMenuLabel>{t('table.columns.actions')}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(row.original.user_id);
                    toast.success(t('actions.copyIdSuccess'));
                  }}
                  className='gap-2'
                >
                  <Mail className='h-4 w-4 opacity-70' />
                  {t('actions.copyId')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleViewDetails(row.original.user_id)}
                  className='gap-2'
                >
                  <Users className='h-4 w-4 opacity-70' />
                  {t('actions.viewDetails')}
                </DropdownMenuItem>

                {row.original.status !== 'SUSPENDED' && row.original.status !== 'BANNED' ? (
                  <DropdownMenuItem
                    onClick={() => handleOpenSuspendConfirm(row.original.user_id, row.original.full_name || row.original.email)}
                    className='text-amber-600 font-medium gap-2'
                    disabled={isDeleted || suspendMutation.isPending || banMutation.isPending || deleteMutation.isPending}
                  >
                    <UserX className='h-4 w-4' />
                    {t('actions.suspend')}
                  </DropdownMenuItem>
                ) : row.original.status === 'SUSPENDED' ? (
                  <DropdownMenuItem
                    onClick={() => activateMutation.mutate(row.original.user_id)}
                    className='text-emerald-600 font-medium gap-2'
                    disabled={isDeleted || activateMutation.isPending || banMutation.isPending || deleteMutation.isPending}
                  >
                    <UserCheck className='h-4 w-4' />
                    {t('actions.activate')}
                  </DropdownMenuItem>
                ) : null}

                {!isDeleted && row.original.status !== 'BANNED' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleOpenBanConfirm(row.original.user_id, row.original.full_name || row.original.email, row.original.email)}
                      className='text-red-600 font-bold gap-2'
                      disabled={banMutation.isPending || deleteMutation.isPending}
                    >
                      <Ban className='h-4 w-4' />
                      {t('actions.ban')}
                    </DropdownMenuItem>
                  </>
                )}
                {!isDeleted && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleOpenDeleteConfirm(row.original.user_id, row.original.full_name || row.original.email, row.original.email)}
                      className='text-red-700 font-bold gap-2'
                      disabled={deleteMutation.isPending || banMutation.isPending}
                    >
                      <Trash2 className='h-4 w-4' />
                      {t('actions.delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [t, activateMutation, suspendMutation.isPending, banMutation.isPending, deleteMutation.isPending]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='relative mx-auto flex h-full min-h-[calc(100vh-140px)] max-w-[1700px] flex-col gap-6 overflow-hidden px-4 py-6 sm:px-6 lg:px-8'
    >
      {/* Subtle Background Orbs */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -left-[10%] top-[20%] h-[32rem] w-[32rem] rounded-full bg-primary/5 blur-[140px] dark:bg-primary/10' />
        <div className='absolute -right-[10%] top-[-10%] h-[24rem] w-[24rem] rounded-full bg-emerald-500/5 blur-[120px] dark:bg-emerald-500/10' />
      </div>

      <header className='relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
        <div className='flex items-start gap-4 sm:items-center'>
          <div className='rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-3.5 shadow-xl shadow-primary/5 backdrop-blur-xl'>
            <div className='bg-primary p-3 rounded-2xl shadow-xl shadow-primary/20'>
              <Users className='h-7 w-7 text-white' />
            </div>
          </div>
          <div className='space-y-1'>
            <h1 className='text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]'>{t('title')}</h1>
            <p className='max-w-3xl text-sm leading-relaxed text-muted-foreground'>{t('description')}</p>
          </div>
        </div>
      </header>

      {/* Main content - shadow and rounded borders added in DataTable wrapper */}
      <div className='flex flex-1 flex-col gap-4 overflow-hidden'>
        <DataTable
          columns={columns}
          data={pageData?.content || []}
          pageCount={pageData?.total_pages}
          isLoading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          className='h-full flex flex-col'
          toolbar={
            <div className='flex flex-col gap-3 border-b border-border/60 p-4 md:flex-row md:items-center md:justify-between'>
              <div className='group relative w-full max-w-xl flex-1'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-primary' />
                <Input
                  placeholder={t('search.placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='h-10 rounded-xl border-primary/10 bg-primary/5 pl-9 pr-3 text-sm shadow-sm transition-all hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/5'
                />
              </div>

              <div className='grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2'>
                <Select value={role} onValueChange={(v) => setRole(v as RoleCode | 'ALL')}>
                  <SelectTrigger className='h-10 w-full min-w-[180px] rounded-xl border-primary/10 bg-white shadow-sm'>
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
                    <SelectItem value='VERIFIER'>{t('roles.VERIFIER')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={status} onValueChange={(v) => setStatus(v as UserStatus | 'ALL')}>
                  <SelectTrigger className='h-10 w-full min-w-[180px] rounded-xl border-primary/10 bg-white shadow-sm'>
                    <div className='flex items-center gap-2'>
                      <Filter className='h-4 w-4 text-muted-foreground/60' />
                      <SelectValue placeholder={t('filters.status')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>{t('filters.allStatuses')}</SelectItem>
                    <SelectItem value='ACTIVE'>{t('status.ACTIVE')}</SelectItem>
                    <SelectItem value='VERIFIED'>{t('status.VERIFIED')}</SelectItem>
                    <SelectItem value='SUSPENDED'>{t('status.SUSPENDED')}</SelectItem>
                    <SelectItem value='BANNED'>{t('status.BANNED')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
          emptyTitle={t('table.empty.title')}
          emptyDescription={t('table.empty.description')}
        />

        <div className='flex flex-col gap-4 border-t border-slate-100 bg-slate-50/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
          <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
            <p className='text-[11px] text-slate-400 font-bold uppercase tracking-widest'>
              Population Index {pageIndex * pageSize + 1} - {Math.min((pageIndex + 1) * pageSize, pageData?.total_elements || 0)}
            </p>
            <Badge variant='outline' className='bg-white text-[10px] border-slate-200 px-2'>
              Total {pageData?.total_elements || 0}
            </Badge>
          </div>
          <div className='flex items-center gap-2 self-end sm:self-auto'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
              disabled={pageData?.first || isLoading}
              className='h-9 rounded-xl border-slate-200 bg-white px-5 font-bold shadow-sm transition-all hover:translate-x-[-2px] disabled:opacity-40'
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
              disabled={pageData?.last || isLoading}
              className='h-9 rounded-xl border-slate-200 bg-white px-5 font-bold shadow-sm transition-all hover:translate-x-[2px] disabled:opacity-40'
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      <UserDetailSheet userId={selectedUserId} open={isDetailOpen} onOpenChange={setIsDetailOpen} />

      {/* Suspension Confirmation Dialog */}
      <Dialog open={isSuspendConfirmOpen} onOpenChange={setIsSuspendConfirmOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-amber-600'>
              <UserX className='h-5 w-5' />
              {t('actions.suspendConfirmTitle')}
            </DialogTitle>
            <DialogDescription className='pt-2'>
              {t('actions.suspendConfirmDescription')}
              {userToSuspend && (
                <span className='block mt-2 font-bold text-foreground'>{userToSuspend.name}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-4 grow sm:justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => setIsSuspendConfirmOpen(false)}
              disabled={suspendMutation.isPending}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              variant='destructive'
              className='bg-amber-600 hover:bg-amber-700 border-none'
              onClick={handleConfirmSuspend}
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending ? t('actions.suspending' as any) || '...' : t('actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Confirmation Dialog */}
      <Dialog open={isBanConfirmOpen} onOpenChange={setIsBanConfirmOpen}>
        <DialogContent className='sm:max-w-md border-red-100 shadow-2xl shadow-red-100/50'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-600'>
              <div className='p-2 bg-red-50 rounded-lg'>
                <Ban className='h-5 w-5' />
              </div>
              {t('actions.banConfirmTitle')}
            </DialogTitle>
            <DialogDescription className='pt-4 text-sm leading-relaxed'>
              {t('actions.banConfirmDescription')}
            </DialogDescription>
          </DialogHeader>

          {userToBan && (
            <div className='space-y-4 py-2'>
              <div className='bg-red-50/50 p-4 rounded-xl border border-red-100/50 flex flex-col gap-2'>
                 <div className='flex items-center gap-3'>
                    <Avatar className='h-10 w-10 border-2 border-white shadow-sm'>
                      <AvatarFallback className='bg-red-100 text-red-700 text-xs font-bold'>
                        {userToBan.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col'>
                      <span className='text-sm font-bold text-red-900'>{userToBan.name}</span>
                      <span className='text-xs text-red-700/70'>{userToBan.email}</span>
                    </div>
                 </div>
              </div>

              <div className='rounded-lg bg-orange-50 border border-orange-100 p-3 flex gap-3'>
                <Shield className='h-5 w-5 text-orange-600 shrink-0' />
                <p className='text-xs text-orange-800 font-medium leading-normal'>
                  {t('actions.banWarning')}
                </p>
              </div>

              <div className='space-y-2'>
                <p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider'>
                  {t('actions.confirmBanInstruction', { email: userToBan.email })}
                </p>
                <Input
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={t('actions.confirmBanPlaceholder')}
                  className={cn(
                    'h-11 border-red-100 focus:ring-red-100 focus:border-red-300 transition-all',
                    confirmEmail && confirmEmail !== userToBan.email && 'border-red-300 bg-red-50/30'
                  )}
                />
                {confirmEmail && confirmEmail !== userToBan.email && (
                  <p className='text-[10px] text-red-500 font-medium'>
                    {t('actions.confirmBanMismatch')}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className='mt-2 sm:justify-end gap-2'>
            <Button
              variant='ghost'
              onClick={() => setIsBanConfirmOpen(false)}
              disabled={banMutation.isPending}
              className='hover:bg-slate-100'
            >
              {t('actions.cancel')}
            </Button>
            <Button
              variant='destructive'
              className='bg-red-600 hover:bg-red-700 h-11 px-8 shadow-lg shadow-red-200 font-bold'
              onClick={handleConfirmBan}
              disabled={banMutation.isPending || (userToBan !== null && confirmEmail !== userToBan.email)}
            >
              {banMutation.isPending ? t('actions.banning') : t('actions.confirmBan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className='sm:max-w-md border-red-100 shadow-2xl shadow-red-100/50'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-700'>
              <div className='p-2 bg-red-50 rounded-lg'>
                <Trash2 className='h-5 w-5' />
              </div>
              {t('actions.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className='pt-4 text-sm leading-relaxed'>
              {t('actions.deleteConfirmDescription')}
            </DialogDescription>
          </DialogHeader>

          {userToDelete && (
            <div className='space-y-4 py-2'>
              <div className='bg-red-50/50 p-4 rounded-xl border border-red-100/50 flex flex-col gap-2'>
                <div className='flex items-center gap-3'>
                  <Avatar className='h-10 w-10 border-2 border-white shadow-sm'>
                    <AvatarFallback className='bg-red-100 text-red-700 text-xs font-bold'>
                      {userToDelete.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col'>
                    <span className='text-sm font-bold text-red-900'>{userToDelete.name}</span>
                    <span className='text-xs text-red-700/70'>{userToDelete.email}</span>
                  </div>
                </div>
              </div>

              <div className='rounded-lg bg-orange-50 border border-orange-100 p-3 flex gap-3'>
                <Shield className='h-5 w-5 text-orange-600 shrink-0' />
                <p className='text-xs text-orange-800 font-medium leading-normal'>
                  {t('actions.deleteWarning')}
                </p>
              </div>

              <div className='space-y-2'>
                <p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider'>
                  {t('actions.confirmDeleteInstruction', { email: userToDelete.email })}
                </p>
                <Input
                  value={confirmDeleteEmail}
                  onChange={(e) => setConfirmDeleteEmail(e.target.value)}
                  placeholder={t('actions.confirmDeletePlaceholder')}
                  className={cn(
                    'h-11 border-red-100 focus:ring-red-100 focus:border-red-300 transition-all',
                    confirmDeleteEmail && confirmDeleteEmail !== userToDelete.email && 'border-red-300 bg-red-50/30'
                  )}
                />
                {confirmDeleteEmail && confirmDeleteEmail !== userToDelete.email && (
                  <p className='text-[10px] text-red-500 font-medium'>
                    {t('actions.confirmDeleteMismatch')}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className='mt-2 sm:justify-end gap-2'>
            <Button
              variant='ghost'
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={deleteMutation.isPending}
              className='hover:bg-slate-100'
            >
              {t('actions.cancel')}
            </Button>
            <Button
              variant='destructive'
              className='bg-red-700 hover:bg-red-800 h-11 px-8 shadow-lg shadow-red-200 font-bold'
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending || (userToDelete !== null && confirmDeleteEmail !== userToDelete.email)}
            >
              {deleteMutation.isPending ? t('actions.deleting') : t('actions.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
