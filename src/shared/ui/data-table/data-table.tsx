'use client'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { cn } from '@/shared/lib/utils'

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  pageCount?: number
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  isLoading?: boolean
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  className?: string
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
  className,
}: DataTableProps<TData>) {
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
  })

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table */}
      <div className='rounded-lg border border-grey-200'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              /* Skeleton loading rows */
              Array.from({ length: pagination?.pageSize ?? 10 }).map(
                (_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((_, j) => (
                      <TableCell key={`skeleton-${i}-${j}`}>
                        <div className='h-4 w-full animate-pulse rounded bg-grey-200' />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              )
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              /* Empty state */
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-48'
                >
                  <div className='flex flex-col items-center justify-center text-center'>
                    {emptyIcon ?? (
                      <Inbox className='h-10 w-10 text-grey-400 mb-2' />
                    )}
                    <p className='text-sm font-medium text-grey-600'>
                      {emptyTitle}
                    </p>
                    {emptyDescription && (
                      <p className='text-xs text-grey-400 mt-1'>
                        {emptyDescription}
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pageCount != null && pageCount > 1 && (
        <div className='flex items-center justify-between px-2'>
          <p className='text-sm text-grey-500'>
            Page {(pagination?.pageIndex ?? 0) + 1} of {pageCount}
          </p>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-grey-200 bg-white text-sm transition-colors',
                'hover:bg-grey-50 disabled:opacity-40 disabled:cursor-not-allowed'
              )}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label='Previous page'
            >
              <ChevronLeft className='h-4 w-4' />
            </button>

            {/* Page number buttons */}
            {generatePageNumbers(
              (pagination?.pageIndex ?? 0) + 1,
              pageCount
            ).map((pageNum, idx) =>
              pageNum === '...' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className='px-1 text-grey-400'
                >
                  ...
                </span>
              ) : (
                <button
                  key={pageNum}
                  type='button'
                  className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    pageNum === (pagination?.pageIndex ?? 0) + 1
                      ? 'bg-[#100A55] text-white'
                      : 'border border-grey-200 bg-white text-grey-600 hover:bg-grey-50'
                  )}
                  onClick={() =>
                    table.setPageIndex((pageNum as number) - 1)
                  }
                >
                  {pageNum}
                </button>
              )
            )}

            <button
              type='button'
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-grey-200 bg-white text-sm transition-colors',
                'hover:bg-grey-50 disabled:opacity-40 disabled:cursor-not-allowed'
              )}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label='Next page'
            >
              <ChevronRight className='h-4 w-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Generate visible page numbers with ellipsis */
function generatePageNumbers(
  currentPage: number,
  totalPages: number
): (number | '...')[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1]

  if (currentPage > 3) {
    pages.push('...')
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) {
    pages.push('...')
  }

  pages.push(totalPages)

  return pages
}
