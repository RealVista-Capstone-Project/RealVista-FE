import { Card, CardContent } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

interface CrmContentSkeletonProps {
  view: 'kanban' | 'table';
}

export function CrmContentSkeleton({ view }: CrmContentSkeletonProps) {
  if (view === 'table') {
    return (
      <Card className='border-border/60 bg-white shadow-sm dark:bg-card'>
        <CardContent className='space-y-3 p-4'>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className='grid grid-cols-[1.4fr_1fr_1fr_0.8fr] items-center gap-4'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-4/5' />
              <Skeleton className='h-4 w-3/5' />
              <Skeleton className='h-7 w-20 rounded-full' />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5'>
      {Array.from({ length: 5 }).map((_, columnIndex) => (
        <Card key={columnIndex} className='border-border/60 bg-white shadow-sm dark:bg-card'>
          <CardContent className='space-y-3 p-3'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-5 w-24' />
              <Skeleton className='size-6 rounded-full' />
            </div>
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <div key={cardIndex} className='space-y-2 rounded-xl border border-border/50 p-3'>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
                <Skeleton className='h-3 w-2/3' />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
