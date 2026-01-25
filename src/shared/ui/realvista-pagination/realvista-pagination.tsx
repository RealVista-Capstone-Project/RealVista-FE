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
    const maxVisible = 5; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
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
        className='flex h-10 w-10 items-center justify-center rounded-full bg-white text-main-secondary opacity-50 transition-all hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30'
        aria-label='Previous page'
      >
        <ChevronLeft className='h-5 w-5' strokeWidth={2} />
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className='flex h-10 w-10 items-center justify-center text-lg font-bold text-grey-400'
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
              'flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold transition-all',
              isActive
                ? 'bg-[#100A55] text-white'
                : 'bg-white text-grey-400 opacity-50 hover:opacity-100'
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
        className='flex h-10 w-10 items-center justify-center rounded-full bg-white text-main-secondary opacity-50 transition-all hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30'
        aria-label='Next page'
      >
        <ChevronRight className='h-5 w-5' strokeWidth={2} />
      </button>
    </nav>
  );
}
