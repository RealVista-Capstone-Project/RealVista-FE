'use client';

import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { User, Users, Search, Check, AlertCircle, Loader2 } from 'lucide-react';

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { useUserSearch } from '@/entities/user/api/use-user-search';

export function PropertyRoleStep() {
  const t = useTranslations('PropertyManagement');
  const { control, setValue, clearErrors } = useFormContext();

  const selectedRole = useWatch({ control, name: 'role.role' });
  const ownerEmail = useWatch({ control, name: 'role.ownerEmail' });
  const ownerId = useWatch({ control, name: 'role.ownerId' });
  const ownerName = useWatch({ control, name: 'role.ownerName' });
  const ownerMaskedPhone = useWatch({ control, name: 'role.ownerMaskedPhone' });

  const [searchEmail, setSearchEmail] = useState('');

  const { data: searchResult, isFetching, error } = useUserSearch(searchEmail);

  const handleSearch = () => {
    if (ownerEmail && ownerEmail.includes('@')) {
      setSearchEmail(ownerEmail);
    }
  };

  useEffect(() => {
    if (searchResult) {
      // searchResult is already unwrapped UserSearchResponse: { user_id, email, full_name, masked_phone }
      setValue('role.ownerId', searchResult.user_id, { shouldValidate: true, shouldDirty: true });
      setValue('role.ownerName', searchResult.full_name, { shouldDirty: true });
      setValue('role.ownerMaskedPhone', searchResult.masked_phone, { shouldDirty: true });
      setValue('role.ownerPhone', searchResult.phone, { shouldDirty: true });
      setValue('role.ownerEmail', searchResult.email, { shouldValidate: true, shouldDirty: true });
      clearErrors('role.ownerEmail');
    }
  }, [searchResult, setValue, clearErrors]);

  const handleClearOwner = () => {
    setValue('role.ownerId', '');
    setValue('role.ownerName', '');
    setValue('role.ownerMaskedPhone', '');
    setValue('role.ownerEmail', '');
    setSearchEmail('');
  };

  return (
    <div className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      <div>
        <h2 className='text-2xl font-semibold mb-2'>{t('step0Title')}</h2>
        <p className='text-muted-foreground'>{t('step0Desc')}</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Card
          className={`cursor-pointer transition-all border-2 ${selectedRole === 'OWNER' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
          onClick={() => {
            setValue('role.role', 'OWNER', { shouldValidate: true });
            handleClearOwner();
          }}
        >
          <CardContent className='p-6 flex flex-col items-center text-center space-y-4'>
            <div
              className={`p-4 rounded-full ${selectedRole === 'OWNER' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
            >
              <User size={32} />
            </div>
            <div>
              <h3 className='font-semibold text-lg'>{t('iAmOwner')}</h3>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all border-2 ${selectedRole === 'AGENT' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
          onClick={() => setValue('role.role', 'AGENT', { shouldValidate: true })}
        >
          <CardContent className='p-6 flex flex-col items-center text-center space-y-4'>
            <div
              className={`p-4 rounded-full ${selectedRole === 'AGENT' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
            >
              <Users size={32} />
            </div>
            <div>
              <h3 className='font-semibold text-lg'>{t('iAmAgent')}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedRole === 'AGENT' && (
        <div className='space-y-6 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300'>
          {!ownerId ? (
            <FormField
              control={control}
              name='role.ownerEmail'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ownerEmail')}</FormLabel>
                  <div className='flex gap-2'>
                    <FormControl>
                      <Input
                        placeholder={t('ownerEmailPlaceholder')}
                        {...field}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearch();
                          }
                        }}
                      />
                    </FormControl>
                    <Button
                      type='button'
                      onClick={handleSearch}
                      disabled={isFetching || !field.value?.includes('@')}
                    >
                      {isFetching ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <Search className='w-4 h-4 mr-2' />
                      )}
                      {t('searchOwner')}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <Card className='bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 animate-in zoom-in-95 duration-200'>
              <CardContent className='p-4 flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400'>
                    <Check size={24} />
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-900 dark:text-slate-100'>{ownerName}</h4>
                    <p className='text-sm text-slate-500'>{ownerMaskedPhone}</p>
                    <span className='inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'>
                      {t('ownerFound')}
                    </span>
                  </div>
                </div>
                <Button variant='ghost' size='sm' onClick={handleClearOwner} className='text-slate-500 hover:text-red-500'>
                  {t('cancel')}
                </Button>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className='p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-400'>
              <AlertCircle size={20} />
              <p className='text-sm font-medium'>{t('ownerNotFound')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
