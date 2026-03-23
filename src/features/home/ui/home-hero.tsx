'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function HomeHero() {
  const t = useTranslations('HomePage');
  const router = useRouter();
  const [location, setLocation] = useState('');

  const handleSearch = () => {
    if (location.trim()) {
      router.push(`/buy?location=${encodeURIComponent(location)}`);
    } else {
      router.push('/buy');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className='flex flex-col gap-[32px] items-center w-full max-w-2xl mx-auto'>
      <h1 className='text-3xl md:text-5xl font-bold text-center'>{t('title')}</h1>
      <p className='text-lg text-center text-gray-600 dark:text-gray-300'>
        Find your dream home with RealVista.
      </p>

      <div className='w-full flex flex-col md:flex-row gap-2 items-center p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700'>
        <div className='flex-1 flex items-center px-4 w-full'>
          <Search className='w-5 h-5 text-gray-400 mr-2' />
          <input
            type='text'
            placeholder="Search by location (e.g., 'Hanoi', 'District 1')"
            className='w-full py-3 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400'
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={100}
          />
        </div>
        <Button
          className='w-full md:w-auto h-12 px-8 rounded-md bg-main-primary hover:bg-main-primary/90 text-white font-medium'
          onClick={handleSearch}
        >
          Search
        </Button>
      </div>

      <div className='flex gap-4 text-sm text-gray-500'>
        <span>Popular:</span>
        <button onClick={() => router.push('/buy?location=Hanoi')} className='hover:underline'>Hanoi</button>
        <button onClick={() => router.push('/buy?location=HCM')} className='hover:underline'>Ho Chi Minh</button>
        <button onClick={() => router.push('/buy?location=Da+Nang')} className='hover:underline'>Da Nang</button>
      </div>
    </div>
  );
}
