'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useLogin } from '../model/use-login'
import type { LoginCredentials } from '@/entities/user/model/types'

export function LoginForm() {
  const t = useTranslations('Auth')
  const { mutate: login, isPending } = useLogin()
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>()

  const onSubmit = (data: LoginCredentials) => {
    setError('')
    login(data, {
      onError: (err: unknown) => {
        setError((err as any)?.message || 'Login failed')
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='email'>{t('email')}</Label>
        <Input
          id='email'
          type='email'
          placeholder='john@example.com'
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && (
          <p className='text-sm text-red-500'>{errors.email.message}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='password'>{t('password')}</Label>
        <Input
          id='password'
          type='password'
          {...register('password', { required: 'Password is required' })}
        />
        {errors.password && (
          <p className='text-sm text-red-500'>{errors.password.message}</p>
        )}
      </div>

      {error && <p className='text-sm text-red-500'>{error}</p>}

      <Button type='submit' className='w-full' disabled={isPending}>
        {isPending ? 'Logging in...' : t('login')}
      </Button>
    </form>
  )
}
