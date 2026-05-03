'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Mail,
  Phone,
  Shield,
  Calendar,
  CheckCircle2,
  XCircle,
  Ban,
  User as UserIcon,
  Fingerprint,
  Info,
} from 'lucide-react';

import { userQueries } from '@/entities/user/api';
import { UserStatus } from '@/entities/user/model/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/ui/sheet/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { cn } from '@/shared/lib/utils';

interface UserDetailSheetProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailSheet({ userId, open, onOpenChange }: UserDetailSheetProps) {
  const t = useTranslations('ManageUsers');
  const commonT = useTranslations('Common');

  const { data: user, isLoading } = useQuery(userQueries.detail(userId || ''));

  const initials = React.useMemo(() => {
    if (!user) return '';
    return (user.full_name || user.email)
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, [user]);

  const getStatusConfig = (status: string) => {
    const s = status as UserStatus;
    const variants: Record<UserStatus, { label: string; icon: any; className: string }> = {
      ACTIVE: {
        label: t('status.ACTIVE'),
        icon: CheckCircle2,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      SUSPENDED: {
        label: t('status.SUSPENDED'),
        icon: XCircle,
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
    return (
      variants[s] || {
        label: status,
        icon: Info,
        className: 'bg-gray-50 text-gray-700 border-gray-200',
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col gap-0">
        <SheetHeader className="p-6 border-b border-border/50 bg-primary/5">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-primary/10">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold tracking-tight">
                {t('detail.title')}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {t('detail.description')}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm animate-pulse">{commonT('loading')}</p>
            </div>
          ) : user ? (
            <div className="p-6 flex flex-col gap-8">
              {(() => {
                const isDeleted = Boolean(user.deleted || user.is_deleted || user.deleted_at);
                const isInactive = isDeleted || user.status === 'BANNED' || user.status === 'SUSPENDED';

                return isInactive ? (
                  <Badge variant="outline" className="self-center bg-red-50 text-red-700 border-red-200 text-[10px] font-bold uppercase tracking-wide">
                    {isDeleted ? t('accountLabels.deleted') : t('accountLabels.inactive')}
                  </Badge>
                ) : null;
              })()}
              <div className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || ''} />
                    <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    'absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white shadow-sm',
                    user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                  )} />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-bold text-foreground">
                    {user.full_name || 'No Name'}
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    {user.roles?.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="bg-primary/5 text-primary/70 border-primary/10 text-[10px] h-5 font-bold uppercase tracking-wider"
                      >
                        <Shield className="mr-1 h-3 w-3" />
                        {t(`roles.${role}` as any) || role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/50 bg-background flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t('detail.accountStatus')}
                  </span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const config = getStatusConfig(user.status);
                      const Icon = config.icon;
                      return (
                        <Badge variant="outline" className={cn('gap-1 py-0.5', config.className)}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-background flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t('detail.verification')}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {user.is_email_verified && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 py-0.5">
                        Email
                      </Badge>
                    )}
                    {user.is_phone_verified && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 py-0.5">
                        Phone
                      </Badge>
                    )}
                    {!user.is_email_verified && !user.is_phone_verified && (
                      <span className="text-xs text-muted-foreground">{t('detail.unverified')}</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="opacity-50" />

              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary/60" />
                  {t('detail.contactInfo')}
                </h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-primary/5 rounded-md text-primary/60">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('detail.emailAddress')}</span>
                      <span className="text-sm font-medium">{user.email}</span>
                      {user.email_verified_at && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {t('detail.verifiedAt', { date: new Date(user.email_verified_at).toLocaleString() })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-primary/5 rounded-md text-primary/60">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('detail.phoneNumber')}</span>
                      <span className="text-sm font-medium">{user.phone || 'N/A'}</span>
                      {user.phone_verified_at && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {t('detail.verifiedAt', { date: new Date(user.phone_verified_at).toLocaleString() })}
                        </span>
                      )}
                    </div>
                  </div>

                  {user.business_name && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 bg-primary/5 rounded-md text-primary/60">
                        <Fingerprint className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{t('detail.businessName')}</span>
                        <span className="text-sm font-medium">{user.business_name}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="opacity-50" />

              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary/60" />
                  {t('detail.accountTimeline')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{t('detail.createdAt')}</span>
                    <span className="text-xs font-medium">
                      {new Date(user.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{t('detail.lastUpdated')}</span>
                    <span className="text-xs font-medium">
                      {new Date(user.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 pb-6">
                 <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[10px] text-slate-500 overflow-hidden text-ellipsis">
                    ID: {user.user_id}
                 </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
               {t('detail.userNotFound')}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
