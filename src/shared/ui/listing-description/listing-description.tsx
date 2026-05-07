'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/shared/lib/utils';

export interface ListingDescriptionProps {
  content: string;
  className?: string;
  size?: 'sm' | 'base';
}

/**
 * Renders a listing/property description authored in Markdown.
 * Headings (##), bold (**), and lists (-) are styled via Tailwind Typography.
 */
export function ListingDescription({
  content,
  className,
  size = 'sm',
}: ListingDescriptionProps) {
  return (
    <div
      className={cn(
        'prose max-w-none text-foreground/80 leading-[1.7]',
        size === 'sm' ? 'prose-sm' : 'prose-base',
        // Tighten spacing to keep the description compact
        'prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-ul:my-2 prose-li:my-0.5',
        // Headings: foreground color, no extra hashtags, bold
        'prose-headings:text-foreground prose-headings:font-bold',
        'prose-h2:text-base prose-h3:text-sm',
        // Strong (bold) inherits foreground for emphasis
        'prose-strong:text-foreground prose-strong:font-semibold',
        // Lists use disc bullets
        'prose-ul:list-disc prose-ul:pl-5',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
