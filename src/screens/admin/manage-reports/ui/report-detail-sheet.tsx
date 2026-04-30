'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Calendar,
  ExternalLink,
  AlertTriangle,
  UserX,
  ClipboardList,
  X,
  Flag,
  User,
  Eye
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { Textarea } from '@/shared/ui/textarea';
import { cn } from '@/shared/lib/utils';
import { format } from 'date-fns';
import { reportApi, Report } from '@/entities/report/api/report.api';

interface ReportDetailSheetProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDetailSheet({ report, open, onOpenChange }: ReportDetailSheetProps) {
  const t = useTranslations('ManageReports');
  const queryClient = useQueryClient();
  const [adminNote, setAdminNote] = React.useState(report?.admin_note || '');

  React.useEffect(() => {
    if (report) setAdminNote(report.admin_note || '');
  }, [report]);

  const startReviewMutation = useMutation({
    mutationFn: () => reportApi.startReview(report!.report_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      toast.success(t('toast.startedReview'));
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () => reportApi.resolve(report!.report_id, adminNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      toast.success(t('toast.resolved'));
      onOpenChange(false);
    },
  });

  const dismissMutation = useMutation({
    mutationFn: () => reportApi.dismiss(report!.report_id, adminNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      toast.success(t('toast.dismissed'));
      onOpenChange(false);
    },
  });

  if (!report) return null;

  const isPending = report.status === 'PENDING';
  const isReviewing = report.status === 'REVIEWING';
  const isResolved = report.status === 'RESOLVED';
  const isDismissed = report.status === 'DISMISSED';

  const statusColors = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
    REVIEWING: 'bg-blue-50 text-blue-700 border-blue-100',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    DISMISSED: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl'>
        <div className='bg-white'>
          <DialogHeader className='px-8 py-5 border-b border-slate-100 flex flex-row items-center justify-between space-y-0'>
            <div className='flex items-center gap-3'>
              <div className='bg-slate-100 p-2 rounded-lg'>
                <Flag className='h-5 w-5 text-slate-600' />
              </div>
              <div>
                <DialogTitle className='text-lg font-bold text-slate-900'>
                  {t('detail.title')}
                </DialogTitle>
                <p className='text-[10px] font-medium text-slate-400 uppercase tracking-tight'>
                  Reference: {report.report_id.slice(0, 8)}
                </p>
              </div>
            </div>
            <Badge variant='outline' className={cn('font-bold text-[10px] px-2 py-0.5 rounded-md border shadow-none uppercase', statusColors[report.status])}>
              {t(`stats.${report.status.toLowerCase()}`)}
            </Badge>
          </DialogHeader>

          <div className='px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar'>
            {/* Section: Overview Grid */}
            <div className='grid grid-cols-2 gap-3'>
              <div className='p-4 rounded-xl border border-slate-100 bg-slate-50/50'>
                <p className='text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider'>{t('detail.reporterInfo')}</p>
                <div className='space-y-0.5'>
                  <p className='text-sm font-bold text-slate-900'>{report.reporter_name}</p>
                  <p className='text-[11px] text-slate-500 truncate'>{report.reporter_email}</p>
                  <div className='pt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400'>
                    <Calendar className='h-3 w-3' />
                    {report.created_at ? format(new Date(report.created_at), 'dd/MM/yyyy HH:mm') : '---'}
                  </div>
                </div>
              </div>

              <div className='p-4 rounded-xl border border-slate-100 bg-slate-50/50'>
                <p className='text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider'>{t('detail.reportedTarget')}</p>
                <div className='space-y-0.5'>
                   <div className='flex items-center gap-2 mb-0.5'>
                     <Badge variant='outline' className='text-[9px] font-bold bg-white text-slate-500 uppercase h-4 px-1'>
                      {report.report_target_type}
                     </Badge>
                     <div className='flex items-center gap-1 text-[10px] text-primary font-bold hover:underline cursor-pointer'>
                        {t('detail.actions.viewTarget')}
                        <ExternalLink className='h-2.5 w-2.5' />
                     </div>
                   </div>
                  <p className='text-sm font-bold text-slate-900 line-clamp-1'>
                     {report.report_target_type === 'LISTING' ? report.reported_listing_name : report.reported_user_name}
                  </p>
                  <p className='text-[11px] font-medium text-red-600'>
                     {t(`detail.reasons.${report.report_reason}`)}
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Content */}
            <div className='space-y-3'>
              <h4 className='text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1'>{t('detail.evidence')}</h4>
              <div className='text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-xl border border-slate-200'>
                {report.description || t('detail.noDescription')}
              </div>

              {report.evidence_media_url && (
                <div className='relative aspect-video rounded-xl overflow-hidden border border-slate-200 group cursor-zoom-in'>
                  <img
                    src={report.evidence_media_url}
                    alt="Evidence"
                    className='object-cover w-full h-full'
                  />
                </div>
              )}
            </div>

            <Separator className='bg-slate-100' />

            {/* Section: Admin Resolution */}
            <div className='space-y-3 pb-2'>
              <h4 className='text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1'>{t('detail.resolution')}</h4>
              <div className='space-y-3'>
                <Textarea
                  placeholder={t('detail.confirm.placeholder')}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  disabled={isResolved || isDismissed}
                  className='min-h-[100px] rounded-lg border-slate-200 bg-slate-50/30 focus-visible:bg-white text-sm p-3'
                />
                
                {isPending && (
                  <Button
                    className='w-full h-10 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all text-sm'
                    onClick={() => startReviewMutation.mutate()}
                    disabled={startReviewMutation.isPending}
                  >
                    {t('detail.actions.startReview')}
                  </Button>
                )}

                {isReviewing && (
                  <div className='flex gap-3 pt-1'>
                    <Button
                      variant='outline'
                      className='flex-1 h-10 rounded-lg border-slate-200 text-slate-600 font-bold hover:bg-slate-50'
                      onClick={() => dismissMutation.mutate()}
                      disabled={dismissMutation.isPending}
                    >
                      {t('detail.actions.dismiss')}
                    </Button>
                    <Button
                      className='flex-1 h-10 rounded-lg bg-primary text-white font-bold'
                      onClick={() => resolveMutation.mutate()}
                      disabled={resolveMutation.isPending}
                    >
                      {t('detail.actions.resolve')}
                    </Button>
                  </div>
                )}

                {(isResolved || isDismissed) && (
                   <div className='p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center gap-2 text-slate-400'>
                      <span className='text-[10px] font-bold uppercase italic tracking-wider'>{t('detail.finalized')}</span>
                   </div>
                )}
              </div>
            </div>
          </div>

          <div className='px-8 py-4 border-t border-slate-100 flex justify-end'>
            <Button
              variant='ghost'
              size='sm'
              className='text-slate-400 font-bold'
              onClick={() => onOpenChange(false)}
            >
              {t('form.cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
