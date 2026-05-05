'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
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
 * Auto-hides when any modal/sheet is open.
 */
export function AiChatFab({ isOpen, onClick, className }: AiChatFabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkModalOpen = () => {
      // Check for Radix UI modal/dialog open state
      const hasScrollLock = document.body.hasAttribute('data-scroll-locked') ||
                            document.body.style.overflow === 'hidden';
      // Check for specific Radix dialog/sheet overlays
      const hasOpenDialog = document.querySelector('[data-state="open"][role="dialog"]') !== null;
      const hasOpenSheet = document.querySelector('[data-state="open"][data-side]') !== null;
      setIsModalOpen(hasScrollLock || hasOpenDialog || hasOpenSheet);
    };

    // Initial check
    checkModalOpen();

    // Observe body for scroll lock changes
    const observer = new MutationObserver(checkModalOpen);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked']
    });

    // Also observe for dialog/sheet additions/removals
    const domObserver = new MutationObserver(checkModalOpen);
    domObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      domObserver.disconnect();
    };
  }, []);

  // Hide when modal/sheet is open
  if (isModalOpen) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-[60] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full shadow-lg',
        'transition-all duration-200 ease-out',
        'hover:shadow-xl active:scale-95',
        isOpen
          ? 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80'
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
            src='/assistant.jpg'
            alt='AI Assistant'
            width={56}
            height={56}
            className='h-full w-full rounded-full object-contain object-center p-1'
          />
        )}
      </div>
    </button>
  );
}
