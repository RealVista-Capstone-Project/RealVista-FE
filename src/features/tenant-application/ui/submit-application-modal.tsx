'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RealVistaButton } from '@/shared/ui/realvista-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantRentalProfileApi, tenantApplicationApi } from '@/entities/tenant-application/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Loader2,
  Plus,
  FileText,
  CheckCircle2,
  ChevronLeft,
  DollarSign,
  Calendar,
  Clock,
  Layout,
  Pencil
} from 'lucide-react';
import { formatVND } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/config/routes';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { DatePickerInput } from '@/shared/ui/realvista-input-date-picker';

interface SubmitApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
}

type ModalView = 'list' | 'create';

export function SubmitApplicationModal({ isOpen, onClose, listingId }: SubmitApplicationModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('SubmitApplication');
  const [view, setView] = useState<ModalView>('list');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    monthlyIncome: '',
    moveInDate: new Date(),
    leaseTermMonths: '12',
    note: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['my-rental-profiles'],
    queryFn: tenantRentalProfileApi.getMyProfiles,
    enabled: isOpen,
  });

  const submitMutation = useMutation({
    mutationFn: (profileId: string) => tenantApplicationApi.submitApplication(listingId, profileId),
    onSuccess: () => {
      toast.success(t('successSubmit'));
      onClose();
    },
    onError: () => {
      toast.error(t('errorSubmit'));
    },
  });

  const createAndSubmitMutation = useMutation({
    mutationFn: async () => {
      const profile = await tenantRentalProfileApi.createProfile({
        title: formData.title || 'Hồ sơ thuê nhà',
        monthlyIncome: Number(formData.monthlyIncome) || 0,
        moveInDate: formData.moveInDate.toISOString().split('T')[0],
        leaseTermMonths: Number(formData.leaseTermMonths) || 12,
        note: formData.note,
      });
      return tenantApplicationApi.submitApplication(listingId, profile.profileId);
    },
    onSuccess: () => {
      toast.success(t('successCreate'));
      queryClient.invalidateQueries({ queryKey: ['my-rental-profiles'] });
      onClose();
    },
    onError: (error) => {
      console.error('Create and submit error:', error);
      toast.error(t('errorCreate'));
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = t('errorTitleRequired');
    if (!formData.monthlyIncome) {
      newErrors.monthlyIncome = t('errorIncomeRequired');
    } else if (Number(formData.monthlyIncome) <= 0) {
      newErrors.monthlyIncome = t('errorIncomePositive');
    }

    if (!formData.leaseTermMonths) {
      newErrors.leaseTermMonths = t('errorLeaseRequired');
    } else if (Number(formData.leaseTermMonths) <= 0) {
      newErrors.leaseTermMonths = t('errorLeasePositive');
    } else if (Number(formData.leaseTermMonths) > 120) {
      newErrors.leaseTermMonths = t('errorLeaseMax');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.moveInDate < today) {
      newErrors.moveInDate = t('errorDatePast');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (view === 'list' && selectedProfileId) {
      submitMutation.mutate(selectedProfileId);
    } else if (view === 'create') {
      if (validateForm()) {
        createAndSubmitMutation.mutate();
      }
    }
  };

  const handleBack = () => setView('list');

  const isLoadingProfiles = isLoading || submitMutation.isPending || createAndSubmitMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoadingProfiles && onClose()}>
      <DialogContent className='max-w-lg w-full sm:rounded-2xl p-0 overflow-hidden'>
        <DialogHeader className='p-6 pb-4 border-b border-gray-100 flex flex-row items-center justify-between space-y-0'>
          <div className='flex items-center gap-3'>
            {view === 'create' && (
              <button
                onClick={handleBack}
                className='p-1 hover:bg-gray-100 rounded-full transition-colors'
                disabled={isLoadingProfiles}
              >
                <ChevronLeft className='h-5 w-5 text-gray-500' />
              </button>
            )}
            <div>
              <DialogTitle className='text-xl font-bold'>
                {view === 'list' ? t('titleList') : t('titleCreate')}
              </DialogTitle>
              <p className='text-sm text-gray-500 mt-1'>
                {view === 'list'
                  ? t('descList')
                  : t('descCreate')}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className='p-6 max-h-[65vh] overflow-y-auto'>
          {isLoading && view === 'list' ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-main-primary mb-4' />
              <p className='text-sm text-gray-500'>{t('loadingProfiles')}</p>
            </div>
          ) : view === 'list' ? (
            <>
              {profiles && profiles.length > 0 ? (
                <div className='flex flex-col gap-4'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-sm font-medium text-gray-700'>{t('yourProfiles')} ({profiles.length})</span>
                    <button
                      onClick={() => setView('create')}
                      className='text-sm text-main-primary font-semibold hover:underline flex items-center gap-1'
                    >
                      <Plus className='h-3.5 w-3.5' />
                      {t('createNew')}
                    </button>
                  </div>
                  <div className='grid gap-3'>
                    {profiles.map((profile) => (
                      <div
                        key={profile.profileId}
                        onClick={() => setSelectedProfileId(profile.profileId)}
                        className={`
                          p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                          flex flex-col gap-3 relative
                          ${selectedProfileId === profile.profileId
                            ? 'border-main-primary bg-main-primary/5 shadow-md ring-1 ring-main-primary/20'
                            : 'border-gray-100 hover:border-main-primary/30 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className='flex justify-between items-start'>
                          <div className='flex items-center gap-2'>
                            <div className={`p-2 rounded-lg ${selectedProfileId === profile.profileId ? 'bg-main-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                              <Layout className='h-4 w-4' />
                            </div>
                            <h4 className='font-bold text-gray-900 line-clamp-1'>{profile.title}</h4>
                          </div>
                          {selectedProfileId === profile.profileId && (
                            <CheckCircle2 className='h-5 w-5 text-main-primary' />
                          )}
                        </div>

                        <div className='grid grid-cols-2 gap-y-2 gap-x-4'>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <DollarSign className='h-3.5 w-3.5 text-gray-400' />
                            <span className='font-medium'>{profile.monthlyIncome ? formatVND(profile.monthlyIncome) : t('notAvailable')}/{t('perMonth')}</span>
                          </div>
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <Calendar className='h-3.5 w-3.5 text-gray-400' />
                            <span>{profile.moveInDate ? format(new Date(profile.moveInDate), 'dd/MM/yyyy') : t('notAvailable')}</span>
                          </div>
                          <div className='flex items-center gap-2 text-sm text-gray-600 col-span-2'>
                            <Clock className='h-3.5 w-3.5 text-gray-400' />
                            <span>{t('leaseTerm')}: <span className='font-medium'>{profile.leaseTermMonths || 12} {t('perMonth')}</span></span>
                          </div>
                        </div>

                        {selectedProfileId === profile.profileId && (
                          <div className='mt-2 pt-2 border-t border-main-primary/10 flex justify-end'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData({
                                  title: profile.title,
                                  monthlyIncome: profile.monthlyIncome?.toString() || '',
                                  moveInDate: profile.moveInDate ? new Date(profile.moveInDate) : new Date(),
                                  leaseTermMonths: profile.leaseTermMonths?.toString() || '12',
                                  note: profile.note || '',
                                });
                                setView('create');
                              }}
                              className='flex items-center gap-1.5 text-xs font-bold text-main-primary hover:bg-main-primary/10 px-2 py-1 rounded-md transition-colors'
                            >
                              <Pencil className='h-3 w-3' />
                              {t('quickTweak')}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 rounded-2xl'>
                  <div className='h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4'>
                    <FileText className='h-8 w-8 text-gray-400' />
                  </div>
                  <h3 className='font-bold text-gray-900 mb-2'>{t('noProfiles')}</h3>
                  <p className='text-sm text-gray-500 max-w-[280px] mb-8'>
                    {t('noProfilesDesc')}
                  </p>
                  <RealVistaButton variant='primary' size='medium' onClick={() => setView('create')}>
                    <Plus className='h-4 w-4 mr-2' />
                    {t('createNow')}
                  </RealVistaButton>
                </div>
              )}
            </>
          ) : (
            <div className='flex flex-col gap-5'>
              <div className='space-y-1.5'>
                <label className='text-sm font-semibold text-gray-700'>{t('profileTitleLabel')}</label>
                <Input
                  placeholder={t('profileTitlePlaceholder')}
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({...formData, title: e.target.value});
                    if (errors.title) setErrors({...errors, title: ''});
                  }}
                  className={errors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.title && <p className='text-xs text-red-500 mt-1 font-medium'>{errors.title}</p>}
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <label className='text-sm font-semibold text-gray-700'>{t('monthlyIncomeLabel')}</label>
                  <Input
                    type='number'
                    placeholder={t('monthlyIncomePlaceholder')}
                    value={formData.monthlyIncome}
                    onChange={(e) => {
                      setFormData({...formData, monthlyIncome: e.target.value});
                      if (errors.monthlyIncome) setErrors({...errors, monthlyIncome: ''});
                    }}
                    className={errors.monthlyIncome ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.monthlyIncome && <p className='text-xs text-red-500 mt-1 font-medium'>{errors.monthlyIncome}</p>}
                </div>
                <div className='space-y-1.5'>
                  <label className='text-sm font-semibold text-gray-700'>{t('leaseTermLabel')}</label>
                  <Input
                    type='number'
                    placeholder='12'
                    value={formData.leaseTermMonths}
                    onChange={(e) => {
                      setFormData({...formData, leaseTermMonths: e.target.value});
                      if (errors.leaseTermMonths) setErrors({...errors, leaseTermMonths: ''});
                    }}
                    className={errors.leaseTermMonths ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  />
                  {errors.leaseTermMonths && <p className='text-xs text-red-500 mt-1 font-medium'>{errors.leaseTermMonths}</p>}
                </div>
              </div>

              <div className='space-y-1.5'>
                <label className='text-sm font-semibold text-gray-700'>{t('moveInDateLabel')}</label>
                <DatePickerInput
                   value={formData.moveInDate.toISOString().split('T')[0]}
                   onChange={(_, date) => {
                     setFormData({...formData, moveInDate: date || new Date()});
                     if (errors.moveInDate) setErrors({...errors, moveInDate: ''});
                   }}
                   className={errors.moveInDate ? 'border-red-500' : ''}
                />
                {errors.moveInDate && <p className='text-xs text-red-500 mt-1 font-medium'>{errors.moveInDate}</p>}
              </div>

              <div className='space-y-1.5'>
                <label className='text-sm font-semibold text-gray-700'>{t('noteLabel')}</label>
                <Textarea
                  placeholder={t('notePlaceholder')}
                  className='min-h-[100px] resize-none'
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>

        <div className='p-6 pt-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end'>
          <RealVistaButton
            variant='secondary'
            size='medium'
            onClick={onClose}
            disabled={isLoadingProfiles}
          >
            {t('cancel')}
          </RealVistaButton>
          <RealVistaButton
            variant='primary'
            size='medium'
            onClick={handleSubmit}
            disabled={(view === 'list' && !selectedProfileId) || (view === 'create' && !formData.title) || isLoadingProfiles}
            className='min-w-[140px]'
          >
            {isLoadingProfiles ? (
               <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : null}
            {view === 'list' ? t('submit') : t('saveAndSubmit')}
          </RealVistaButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
