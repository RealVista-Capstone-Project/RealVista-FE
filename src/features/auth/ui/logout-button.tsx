'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui/button'
import { useAuth } from '../model/use-auth'

export function LogoutButton() {
  const t = useTranslations('Auth')
  const { logout, user } = useAuth()

  if (!user) return null

  return (
    <Button variant='outline' size='sm' onClick={logout}>
      {t('logout')}
    </Button>
  )
}
