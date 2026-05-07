'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  isLoading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: React.ReactNode;
  /** Override the "Page X of Y" label. Receives (currentPage, totalPages). */
  pageInfoText?: (current: number, total: number) => string;
  /** Callback when a row is clicked. */
  onRowClick?: (row: TData) => void;
  /** Check if a row is selected (for highlighting). */
  isRowSelected?: (row: TData) => boolean;
  className?: string;
  /** Applied to the flex column wrapper around the bordered table + pagination (below toolbar). */
  bodyClassName?: string;
}

export function DataTable<TData>({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
  isLoading = false,
  emptyIcon,
  emptyTitle = 'No results',
  emptyDescription,
  toolbar,
  pageInfoText,
  onRowClick,
  isRowSelected,
  className,
  bodyClassName,
}: DataTableProps<TData>) {
  const t = useTranslations('DataTable');
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Server-side pagination
    manualPagination: true,
    pageCount: pageCount ?? -1,
    state: {
      pagination: pagination ?? { pageIndex: 0, pageSize: 10 },
    },
    onPaginationChange: onPaginationChange,
  });

  const isEmpty = !isLoading && table.getRowModel().rows.length === 0;

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm',
        className
      )}
    >
      {/* Toolbar */}
      {toolbar && <div className='shrink-0'>{toolbar}</div>}
      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col gap-2',
          bodyClassName
        )}
      >
      {/* Table — scroll inside so parent flex layout avoids page scrollbar */}
      <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border'>
        <div className='min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            {!isEmpty && (
              <TableBody>
                {isLoading ? (
                  /* Skeleton loading rows */
                  Array.from({ length: pagination?.pageSize ?? 10 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {columns.map((_, j) => (
                        <TableCell key={`skeleton-${i}-${j}`}>
                          <div className='h-4 w-full animate-pulse rounded bg-muted' />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const isSelected = isRowSelected ? isRowSelected(row.original) : false;
                    return (
                      <TableRow
                        key={row.id}
                        className={cn(
                          onRowClick && 'cursor-pointer transition-colors hover:bg-muted/50',
                          isSelected && 'bg-primary/5'
                        )}
                        onClick={() => onRowClick?.(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            )}
          </Table>
          {/* Empty state — outside <table> so it can flex-1 to fill remaining height */}
          {isEmpty && (
            <div className='flex min-h-full flex-col items-center justify-center p-8 text-center'>
              {emptyIcon ?? <Inbox className='mb-2 h-10 w-10 text-muted-foreground' />}
              <p className='text-sm font-medium text-muted-foreground'>{emptyTitle}</p>
              {emptyDescription && (
                <p className='mt-1 text-xs text-muted-foreground'>{emptyDescription}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pageCount != null && pageCount >= 1 && (
        <div className='flex shrink-0 items-center justify-between px-4 sm:px-5'>
          <p className='text-sm text-muted-foreground'>
            {pageInfoText
              ? pageInfoText((pagination?.pageIndex ?? 0) + 1, pageCount!)
              : t('pagination.pageInfo', {
                  current: (pagination?.pageIndex ?? 0) + 1,
                  total: pageCount,
                })}
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label={t('pagination.previousPage')}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>

            {/* Page number buttons */}
            {generatePageNumbers((pagination?.pageIndex ?? 0) + 1, pageCount).map((pageNum, idx) =>
              pageNum === '...' ? (
                <span key={`ellipsis-${idx}`} className='px-1 text-muted-foreground/60'>
                  ...
                </span>
              ) : (
                <Button
                  key={pageNum}
                  variant={pageNum === (pagination?.pageIndex ?? 0) + 1 ? 'default' : 'outline'}
                  size='icon'
                  className={
                    pageNum === (pagination?.pageIndex ?? 0) + 1
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : ''
                  }
                  onClick={() => table.setPageIndex((pageNum as number) - 1)}
                >
                  {pageNum}
                </Button>
              )
            )}

            <Button
              variant='outline'
              size='icon'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label={t('pagination.nextPage')}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

/** Generate visible page numbers with ellipsis */
function generatePageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (currentPage > 3) {
    pages.push('...');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('...');
  }

  pages.push(totalPages);

  return pages;
}
