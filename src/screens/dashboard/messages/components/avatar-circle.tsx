import Image from 'next/image';
import { cn } from '@/shared/lib/utils';

interface AvatarCircleProps {
  initials?: string;
  avatarBg?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarCircle({ initials, avatarBg, src, size = 'md' }: AvatarCircleProps) {
  const sizeClass = {
    sm: 'size-7 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-12 text-base',
  }[size];

  const pixelSize = { sm: 28, md: 40, lg: 48 }[size];

  if (src) {
    return (
      <div className={cn('relative shrink-0 overflow-hidden rounded-full', sizeClass)}>
        <Image
          src={src}
          alt={initials ?? ''}
          fill
          className='object-cover'
          sizes={`${pixelSize}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        avatarBg ?? 'bg-grey-400',
        sizeClass
      )}
    >
      {initials}
    </div>
  );
}
