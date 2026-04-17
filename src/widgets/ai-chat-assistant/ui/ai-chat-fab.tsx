'use client';

import Image from 'next/image';
import { cn } from '@/shared/lib/utils';
import { X } from 'lucide-react';

interface AiChatFabProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * AiChatFab - 56px purple circle FAB that toggles the AI chat window.
 * Shows Sparkles icon when closed, X icon when open.
 * Morphs between icons with a rotation transition.
 */
export function AiChatFab({ isOpen, onClick, className }: AiChatFabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-[70] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full shadow-lg',
        'transition-all duration-200 ease-out',
        'hover:shadow-xl active:scale-95',
        isOpen
          ? 'bg-primary text-white hover:bg-primary-hover active:bg-primary-active'
          : 'overflow-hidden bg-transparent p-0',
        // Mobile: slightly smaller
        'max-md:h-12 max-md:w-12',
        className
      )}
      aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
    >
      <div
        className={cn(
          'transition-transform duration-200 ease-out',
          isOpen ? 'rotate-90' : 'rotate-0'
        )}
      >
        {isOpen ? (
          <X className='h-5 w-5' />
        ) : (
          <Image
            src='/images/ai-avatar.png'
            alt='AI Assistant'
            width={56}
            height={56}
            className='h-full w-full rounded-full object-cover object-center scale-250'
          />
        )}
      </div>
    </button>
  );
}
