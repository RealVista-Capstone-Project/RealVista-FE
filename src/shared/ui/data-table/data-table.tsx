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
  tableContainerClassName?: string;
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
  tableContainerClassName,
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

  return (
    <div
      className={cn(
        'space-y-2 rounded-2xl border border-border bg-background p-2 shadow-sm',
        className
      )}
    >
      {/* Toolbar */}
      {toolbar && toolbar}
      {/* Table */}
      <div className={cn('overflow-hidden rounded-xl border border-border', tableContainerClassName)}>
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
            ) : table.getRowModel().rows.length ? (
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
            ) : (
              /* Empty state */
              <TableRow>
                <TableCell colSpan={columns.length} className='h-48'>
                  <div className='flex flex-col items-center justify-center text-center'>
                    {emptyIcon ?? <Inbox className='h-10 w-10 text-muted-foreground mb-2' />}
                    <p className='text-sm font-medium text-muted-foreground'>{emptyTitle}</p>
                    {emptyDescription && (
                      <p className='text-xs text-muted-foreground mt-1'>{emptyDescription}</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pageCount != null && pageCount >= 1 && (
        <div className='flex items-center justify-between px-6'>
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
