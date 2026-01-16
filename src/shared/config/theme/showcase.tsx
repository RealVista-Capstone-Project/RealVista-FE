/**
 * Theme Showcase Component
 *
 * This component demonstrates the RealVista design system colors and tokens.
 * Use this as a reference when building UI components.
 */

import { colors } from './utils';

export function ThemeShowcase() {
  return (
    <div className='p-8 space-y-8 bg-background text-foreground'>
      {/* Main Colors */}
      <section>
        <h2 className='text-2xl font-bold mb-4 text-main-black'>Main Colors</h2>
        <div className='grid grid-cols-4 gap-4'>
          <ColorBox name='Black' color={colors.main.black} />
          <ColorBox name='Primary' color={colors.main.primary} />
          <ColorBox name='Secondary' color={colors.main.secondary} />
          <ColorBox name='White' color={colors.main.white} />
        </div>
      </section>

      {/* Greyscale */}
      <section>
        <h2 className='text-2xl font-bold mb-4 text-main-black'>Greyscale</h2>
        <div className='grid grid-cols-5 gap-4'>
          <ColorBox name='Grey 50' color={colors.grey[50]} />
          <ColorBox name='Grey 100' color={colors.grey[100]} />
          <ColorBox name='Grey 200' color={colors.grey[200]} />
          <ColorBox name='Grey 300' color={colors.grey[300]} />
          <ColorBox name='Grey 400' color={colors.grey[400]} />
          <ColorBox name='Grey 500' color={colors.grey[500]} />
          <ColorBox name='Grey 600' color={colors.grey[600]} />
          <ColorBox name='Grey 700' color={colors.grey[700]} />
          <ColorBox name='Grey 800' color={colors.grey[800]} />
          <ColorBox name='Grey 900' color={colors.grey[900]} />
        </div>
      </section>

      {/* Shades of Purple */}
      <section>
        <h2 className='text-2xl font-bold mb-4 text-main-black'>Shades of Purple</h2>
        <div className='grid grid-cols-5 gap-4'>
          <ColorBox name='Purple 90' color={colors.purple[90]} />
          <ColorBox name='Purple 92' color={colors.purple[92]} />
          <ColorBox name='Purple 94' color={colors.purple[94]} />
          <ColorBox name='Purple 96' color={colors.purple[96]} />
          <ColorBox name='Purple 98' color={colors.purple[98]} />
        </div>
      </section>

      {/* Border Radius */}
      <section>
        <h2 className='text-2xl font-bold mb-4 text-main-black'>Border Radius</h2>
        <div className='flex gap-4 items-end'>
          <RadiusBox name='sm' radius='0.375rem' />
          <RadiusBox name='md' radius='0.5rem' />
          <RadiusBox name='lg' radius='0.625rem' />
          <RadiusBox name='xl' radius='0.75rem' />
          <RadiusBox name='2xl' radius='1rem' />
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className='text-2xl font-bold mb-4 text-main-black'>Typography</h2>
        <div className='space-y-2'>
          <p className='text-xs text-grey-600'>Extra Small Text (12px)</p>
          <p className='text-sm text-grey-600'>Small Text (14px)</p>
          <p className='text-base text-grey-600'>Base Text (16px)</p>
          <p className='text-lg text-grey-600'>Large Text (18px)</p>
          <p className='text-xl text-grey-600'>Extra Large Text (20px)</p>
          <p className='text-2xl text-grey-600'>2XL Text (24px)</p>
        </div>
      </section>
    </div>
  );
}

function ColorBox({ name, color }: { name: string; color: string }) {
  return (
    <div className='space-y-2'>
      <div
        className='w-full h-24 rounded-lg border-2 border-border'
        style={{ backgroundColor: color }}
      />
      <p className='text-sm font-medium text-grey-600'>{name}</p>
      <p className='text-xs text-grey-500'>{color}</p>
    </div>
  );
}

function RadiusBox({ name, radius }: { name: string; radius: string }) {
  return (
    <div className='space-y-2'>
      <div
        className='w-20 h-20 bg-primary flex items-center justify-center'
        style={{ borderRadius: radius }}
      >
        <span className='text-primary-foreground text-sm'>{name}</span>
      </div>
      <p className='text-xs text-center text-grey-600'>{radius}</p>
    </div>
  );
}
