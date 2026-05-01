'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface RealVistaPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function RealVistaPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: RealVistaPaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 4) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={cn('flex items-center justify-center gap-4', className)}
      aria-label='Pagination'
    >
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className='flex h-8 w-8 items-center justify-center rounded-full bg-white text-foreground opacity-50 transition-all hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer'
        aria-label='Previous page'
      >
        <ChevronLeft className='h-4 w-4' strokeWidth={2} />
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className='flex h-8 w-8 items-center justify-center text-sm font-bold text-muted-foreground/60'
            >
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all cursor-pointer',
              isActive
                ? 'bg-primary text-white'
                : 'bg-white text-muted-foreground opacity-50 hover:opacity-100'
            )}
            aria-label={`Page ${pageNum}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className='flex h-8 w-8 items-center justify-center rounded-full bg-white text-foreground opacity-50 transition-all hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer'
        aria-label='Next page'
      >
        <ChevronRight className='h-4 w-4' strokeWidth={2} />
      </button>
    </nav>
  );
}
