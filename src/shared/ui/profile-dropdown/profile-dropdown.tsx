'use client';

import { useState } from 'react';
import { User, HelpCircle, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/shared/lib/utils';

export interface ProfileMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  href?: string;
}

interface ProfileDropdownProps {
  user?: {
    name: string;
    initials: string;
    avatar?: string;
  };
  menuItems?: ProfileMenuItem[];
  align?: 'start' | 'center' | 'end';
  className?: string;
}

const defaultMenuItems: ProfileMenuItem[] = [
  { id: 'profile', label: 'profile', icon: User },
  { id: 'help', label: 'help', icon: HelpCircle },
  { id: 'logout', label: 'logout', icon: LogOut },
];

export function ProfileDropdown({
  user = { name: 'Giovanni', initials: 'GI' },
  menuItems = defaultMenuItems,
  align = 'end',
  className,
}: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Profile');

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Sign out from NextAuth (returns void when redirect: false)
      await signOut({ redirect: false });

      toast.success(t('logoutSuccess'));
      setOpen(false);
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t('logoutFailed'));
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type='button'
          className={cn(
            'flex items-center gap-2 rounded-lg border border-purple-92 bg-white px-3 py-2 shadow-[0px_0px_40px_0px_rgba(112,101,240,0.1)] transition-shadow hover:shadow-md',
            className
          )}
          aria-label='User menu'
        >
          {/* Avatar */}
          <div className='flex size-8 items-center justify-center rounded-full bg-main-primary'>
            <span className='text-sm font-bold leading-[1.5] text-white'>{user.initials}</span>
          </div>

          {/* Name */}
          <span className='text-base font-medium leading-[1.5] text-main-black'>{user.name}</span>

          {/* Chevron */}
          <svg
            className={cn('h-4 w-4 text-main-black transition-transform', open && 'rotate-180')}
            viewBox='0 0 16 16'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M4 6l4 4 4-4' />
          </svg>
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={8}
          className={cn(
            'z-50 w-[272px] rounded-lg border border-purple-92 bg-white p-0 shadow-[0px_10px_10px_0px_rgba(16,10,85,0.1)]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
          )}
        >
          <div className='flex flex-col'>
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === menuItems.length - 1;

              return (
                <div key={item.id}>
                  <button
                    type='button'
                    onClick={() => {
                      if (item.id === 'logout') {
                        handleLogout();
                      } else {
                        item.onClick?.();
                        if (item.href) {
                          window.location.href = item.href;
                        }
                        setOpen(false);
                      }
                    }}
                    disabled={isLoggingOut && item.id === 'logout'}
                    className='flex h-16 w-full items-center gap-4 px-6 opacity-70 transition-opacity hover:opacity-100 disabled:opacity-50'
                  >
                    <Icon className='h-5 w-5 text-main-black' />
                    <span className='text-base font-medium leading-[1.5] text-main-black'>
                      {isLoggingOut && item.id === 'logout' ? t('loggingOut') : t(item.label)}
                    </span>
                  </button>

                  {!isLast && <div className='mx-6 h-px border-t border-border' />}
                </div>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
