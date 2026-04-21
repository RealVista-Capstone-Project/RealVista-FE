'use client';

import { Link } from '@/shared/config/i18n/navigation';
import { Home, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { useTranslations } from 'next-intl';

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className='flex flex-col gap-3'>
      <h3 className='text-xs font-semibold uppercase tracking-wider text-foreground'>{title}</h3>
      <ul className='flex flex-col gap-2'>
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className='text-sm text-muted-foreground transition-colors hover:text-primary'
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HomeFooter() {
  const t = useTranslations('Footer');

  return (
    <footer className='bg-primary/5'>
      {/* Main footer content */}
      <div className='mx-auto max-w-7xl px-6 py-12 lg:px-8'>
        <div className='grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4'>
          {/* Logo column */}
          <div className='flex flex-col gap-4'>
            <Link href='/' className='flex items-center gap-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary'>
                <Home className='h-4 w-4 text-white' />
              </div>
              <span className='text-xl font-bold text-foreground'>RealVista</span>
            </Link>
          </div>

          {/* Column 2: Sell a Home + Buy a Home */}
          <div className='flex flex-col gap-8'>
            <FooterLinkGroup
              title={t('sellAHome')}
              links={[
                { label: t('requestAnOffer'), href: '#' },
                { label: t('pricing'), href: '#' },
                { label: t('reviews'), href: '#' },
                { label: t('stories'), href: '#' },
              ]}
            />
            <FooterLinkGroup
              title={t('buyAHome')}
              links={[
                { label: t('buy'), href: '#' },
                { label: t('finance'), href: '#' },
              ]}
            />
          </div>

          {/* Column 3: Buy, Rent and Sell + Terms & Privacy */}
          <div className='flex flex-col gap-8'>
            <FooterLinkGroup
              title={t('buyRentAndSell')}
              links={[
                { label: t('buyAndSellProperties'), href: '#' },
                { label: t('rentHome'), href: '#' },
                { label: t('builderTradeUp'), href: '#' },
              ]}
            />
            <FooterLinkGroup
              title={t('termsAndPrivacy')}
              links={[
                { label: t('trustAndSafety'), href: '/policies/transaction-safety' },
                { label: t('termsOfService'), href: '/policies/terms-of-service' },
                { label: t('privacyPolicy'), href: '/policies/privacy-policy' },
              ]}
            />
          </div>

          {/* Column 4: About + Resources */}
          <div className='flex flex-col gap-8'>
            <FooterLinkGroup
              title={t('about')}
              links={[
                { label: t('company'), href: '#' },
                { label: t('howItWorks'), href: '#' },
                { label: t('contact'), href: '#' },
                { label: t('investors'), href: '#' },
              ]}
            />
            <FooterLinkGroup
              title={t('resources')}
              links={[
                { label: t('blog'), href: '#' },
                { label: t('guides'), href: '#' },
                { label: t('faq'), href: '#' },
                { label: t('helpCenter'), href: '#' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className='border-t border-border bg-muted/50'>
        <div className='mx-auto flex flex-col md:flex-row max-w-7xl items-center justify-between px-6 py-4 lg:px-8 gap-4'>
          <p className='text-sm text-muted-foreground whitespace-nowrap'>{t('copyright')}</p>
          <div className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2'>
            <Link href='/policies/terms-of-service' className='text-xs text-muted-foreground transition-colors hover:text-primary'>Điều khoản sử dụng</Link>
            <Link href='/policies/privacy-policy' className='text-xs text-muted-foreground transition-colors hover:text-primary'>Chính sách bảo mật</Link>
            <Link href='/policies/posting-regulations' className='text-xs text-muted-foreground transition-colors hover:text-primary'>Quy định đăng tin</Link>
            <Link href='/policies/fees-and-payments' className='text-xs text-muted-foreground transition-colors hover:text-primary'>Chính sách phí</Link>
            <Link href='/policies/transaction-safety' className='text-xs text-muted-foreground transition-colors hover:text-primary'>An toàn giao dịch</Link>
            <Link href='/policies/e-commerce-regulations' className='text-xs text-muted-foreground transition-colors hover:text-primary'>Quy chế TMĐT</Link>
            <Link href='/policies/cookie-policy' className='text-xs text-muted-foreground transition-colors hover:text-primary'>Chính sách Cookie</Link>
          </div>
          <div className='flex items-center gap-4 whitespace-nowrap'>
            <Link
              href='#'
              aria-label='Facebook'
              className='text-muted-foreground/60 transition-colors hover:text-primary'
            >
              <Facebook className='h-5 w-5' />
            </Link>
            <Link
              href='#'
              aria-label='Instagram'
              className='text-muted-foreground/60 transition-colors hover:text-primary'
            >
              <Instagram className='h-5 w-5' />
            </Link>
            <Link
              href='#'
              aria-label='Twitter'
              className='text-muted-foreground/60 transition-colors hover:text-primary'
            >
              <Twitter className='h-5 w-5' />
            </Link>
            <Link
              href='#'
              aria-label='LinkedIn'
              className='text-muted-foreground/60 transition-colors hover:text-primary'
            >
              <Linkedin className='h-5 w-5' />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
