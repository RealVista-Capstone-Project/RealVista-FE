'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Building2, LayoutDashboard, Plus, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuthSession } from '@/features/auth/model';
import { LoginRequiredModal } from '@/shared/ui/login-required-modal/login-required-modal';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog/dialog';
import { userApi } from '@/entities/user/api';
import { ROUTES } from '@/shared/config/routes';

type PropertyType = { label: string; desc: string };

export function SellPage() {
  const t = useTranslations('Sell');
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useAuthSession();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const backendRoles: string[] = session?.user?.backendRoles ?? [];
  const isOwner = backendRoles.includes('OWNER');

  const propertyTypes = t.raw('types') as PropertyType[];

  const handleAddNewClick = () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleDashboardClick = () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    router.push(`/${locale}${ROUTES.dashboard.property}`);
  };

  const handleConfirmYes = async () => {
    setIsProcessing(true);
    try {
      if (!isOwner) {
        await userApi.addOwnerRole();
      }
      setShowConfirmDialog(false);
      router.push(`/${locale}${ROUTES.dashboard.property}/create`);
    } catch (err) {
      console.error('Failed to add owner role', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-col'>
      <main className='flex-1 px-6 py-10 max-w-4xl mx-auto w-full space-y-12'>
        {/* Section header */}
        <div>
          <h1 className='mt-2 text-2xl font-bold text-gray-900 mb-1'>{t('sectionTitle')}</h1>
          <p className='text-sm text-gray-500'>
            {t('sectionSubtitle')}
            {!isOwner && <> {t('typesSubtitle')}</>}
          </p>
        </div>

        {/* Two-column card layout — only for owners */}
        {isOwner && (
          <div className='mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2'>
            {/* Card 1 – Create new property */}
            <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4'>
              <div>
                <div className='flex items-center gap-2 text-gray-800 font-semibold text-base mb-1'>
                  <Building2 className='size-5 text-main-primary' />
                  {t('card1Title')}
                </div>
                <p className='text-sm text-gray-500'>{t('card1Desc')}</p>
              </div>
              <RealVistaButton
                variant='primary'
                size='medium'
                className='w-full'
                onClick={handleAddNewClick}
              >
                <Plus className='size-4' />
                {t('card1Button')}
              </RealVistaButton>
            </div>

            {/* Card 2 – Already have a property */}
            <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4'>
              <div>
                <div className='flex items-center gap-2 text-gray-800 font-semibold text-base mb-1'>
                  <LayoutDashboard className='size-5 text-main-primary' />
                  {t('card2Title')}
                </div>
                <p className='text-sm text-gray-500'>{t('card2Desc')}</p>
              </div>
              <RealVistaButton
                variant='primary'
                size='medium'
                className='w-full'
                onClick={handleDashboardClick}
              >
                {t('card2Button')}
              </RealVistaButton>
            </div>
          </div>
        )}

        {/* Property types + CTA — only for non-owners */}
        {!isOwner && (
          <>
            {/* Property types section */}
            <div>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {propertyTypes.map((item) => (
                  <div key={item.label} className='flex items-start gap-3'>
                    <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-main-primary' />
                    <div>
                      <p className='text-sm font-semibold text-gray-800'>{item.label}</p>
                      <p className='text-xs text-gray-500'>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA banner */}
            <div className='rounded-2xl bg-main-primary px-8 py-10 flex flex-col items-center text-center gap-4'>
              <h2 className='text-xl font-bold text-white'>{t('ctaTitle')}</h2>
              <p className='text-sm text-white max-w-md'>{t('ctaSubtitle')}</p>
              <RealVistaButton variant='secondary' size='large' onClick={handleAddNewClick}>
                {t('ctaButton')}
                <ArrowRight className='size-5' />
              </RealVistaButton>
            </div>
          </>
        )}
      </main>

      {/* Login required modal */}
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Confirm navigate to dashboard dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={(v) => !v && setShowConfirmDialog(false)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>{t('confirmTitle')}</DialogTitle>
            <DialogDescription>{t('confirmDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-4 flex flex-col gap-2 sm:flex-col'>
            <RealVistaButton
              variant='primary'
              size='medium'
              className='w-full'
              onClick={handleConfirmYes}
              disabled={isProcessing}
            >
              {isProcessing ? t('addingRole') : t('confirmYes')}
            </RealVistaButton>
            <RealVistaButton
              variant='secondary'
              size='medium'
              className='w-full'
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
            >
              {t('confirmNo')}
            </RealVistaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
