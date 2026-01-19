import { GoogleMap } from '@/shared/ui/map';

export const MapViewer = () => {
  return (
    <div className='flex h-[calc(100vh-4rem)] w-full flex-col gap-4 p-4 md:p-8'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-2xl font-bold tracking-tight'>Interactive Map</h1>
        <p className='text-muted-foreground'>Explore locations using the interactive map below.</p>
      </div>

      <div className='h-[600px] w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow'>
        <GoogleMap />
      </div>
    </div>
  );
};
