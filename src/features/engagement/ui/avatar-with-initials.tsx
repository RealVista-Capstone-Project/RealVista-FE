'use client';

import { cn } from '@/shared/lib/utils';

const COLORS = [
  'bg-cyan-500',
  'bg-blue-500',
  'bg-primary/50',
  'bg-primary/50',
  'bg-pink-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface AvatarWithInitialsProps {
  name: string;
  size?: number;
  className?: string;
}

export const AvatarWithInitials = ({ name, size = 40, className }: AvatarWithInitialsProps) => {
  const bg = getColorFromName(name);
  const initial = name.trim().charAt(0).toUpperCase();
  const fontSize = Math.round(size * 0.5);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold',
        bg,
        className
      )}
      style={{ width: size, height: size, fontSize }}
    >
      {initial}
    </div>
  );
};
