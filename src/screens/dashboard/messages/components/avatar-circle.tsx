import { cn } from '@/shared/lib/utils';

interface AvatarCircleProps {
  initials?: string;
  avatarBg?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarCircle({ initials, avatarBg, size = 'md' }: AvatarCircleProps) {
  const sizeClass = {
    sm: 'size-7 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-12 text-base',
  }[size];

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
