import { HomeHero, HomeSection, HomeFooter } from '@/features/home';

export function HomePage() {
  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
      <h1>Welcome</h1>
      <main className='flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full'>
        <HomeHero />
        <HomeSection />
      </main>
      <HomeFooter />
    </div>
  );
}

export default HomePage;
