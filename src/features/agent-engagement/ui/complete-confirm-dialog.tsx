'use client';

import type { AgentEngagement } from '@/entities/agent-engagement';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getEngagementTypeLabel } from '../lib/utils';

interface CompleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AgentEngagement;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CompleteConfirmDialog({
  open,
  onOpenChange,
  agent,
  onConfirm,
  isLoading = false,
}: CompleteConfirmDialogProps) {
  const t = useTranslations('AgentEngagement');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <div className='flex items-center gap-3 mb-1'>
            <div className='flex items-center justify-center h-10 w-10 rounded-full bg-green-100 flex-shrink-0'>
              <CheckCircle className='h-5 w-5 text-green-600' />
            </div>
            <DialogTitle className='text-base font-semibold text-foreground'>
              {t('completeDialog.title')}
            </DialogTitle>
          </div>
          <DialogDescription className='pl-13 text-sm leading-relaxed text-muted-foreground'>
            {t('completeDialog.description', {
              agentName: agent.agent_full_name,
              property: agent.property_address ?? agent.property_type_name ?? t('common.thisProperty'),
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Info summary */}
        <div className='space-y-2 rounded-xl border border-border/70 bg-primary/[0.04] p-4'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>{t('detailPanel.agent')}</span>
            <span className='font-semibold text-foreground'>{agent.agent_full_name}</span>
          </div>
          {(agent.property_address || agent.property_type_name) && (
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>{t('detailPanel.property')}</span>
              <span className='max-w-[200px] truncate text-right font-semibold text-foreground'>
                {agent.property_address ?? agent.property_type_name}
              </span>
            </div>
          )}
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>{t('detailPanel.engagementType')}</span>
            <span className='font-semibold text-foreground'>{getEngagementTypeLabel(agent.engagement_type, t)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className='border-border'
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className='bg-primary hover:bg-primary/90 text-white gap-2'
          >
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <CheckCircle className='h-4 w-4' />
            )}
            {t('completeDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
