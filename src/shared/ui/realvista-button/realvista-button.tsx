import * as React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

/**
 * RealVista Button Component
 *
 * Custom button variants matching Figma design specifications:
 * - Primary: Solid purple background (#7065F0)
 * - Secondary: White background with purple border
 * - Sizes: small (40px), medium (48px), large (56px)
 * - Icon variants: Includes arrow icon
 */
const realVistaButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
  {
    variants: {
      /**
       * Button variant - controls visual style
       * - primary: Solid purple background with white text
       * - secondary: White background with purple border and text
       * - google: White background with gray border for OAuth
       */
      variant: {
        primary: 'bg-primary text-background hover:bg-primary/90 active:bg-primary/80',
        secondary: 'bg-background border-2 border-primary/20 text-primary hover:bg-primary/15-hover active:bg-primary/15-active',
        google: 'bg-background border border-border text-foreground hover:bg-muted',
      },
      /**
       * Button size - controls dimensions and font size
       * - small: 40px height, 14px font
       * - medium: 48px height, 16px font
       * - large: 56px height, 16px font
       */
      size: {
        small: 'h-10 px-4 py-2.5 text-[14px] leading-[1.4]',
        medium: 'h-12 px-6 py-3 text-[16px] leading-[1.5]',
        large: 'h-14 px-8 py-4 text-[16px] leading-[1.5]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'medium',
    },
  }
);

export interface RealVistaButtonProps
  extends React.ComponentProps<'button'>,
  VariantProps<typeof realVistaButtonVariants> {
  /** Render as child component (e.g., Link) */
  asChild?: boolean;
  /** Show icon after text (arrow for primary/secondary variants) */
  withIcon?: boolean;
}

/**
 * RealVistaButton component with custom styling matching Figma design
 *
 * @example
 * ```tsx
 * <RealVistaButton variant="primary" size="large">Button</RealVistaButton>
 * <RealVistaButton variant="secondary" size="medium" withIcon>Button</RealVistaButton>
 * ```
 */
function RealVistaButton({
  className,
  variant,
  size,
  asChild = false,
  withIcon = false,
  children,
  ...props
}: RealVistaButtonProps) {
  const Comp = asChild ? Slot : 'button';

  // Show icon only for primary and secondary variants when withIcon is true
  const showIcon = withIcon && (variant === 'primary' || variant === 'secondary');

  return (
    <Comp
      data-slot='real-vista-button'
      className={cn(realVistaButtonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
      {showIcon && <ChevronRight className={cn('rtl:rotate-180', size === 'small' ? 'size-4' : 'size-5')} />}
    </Comp>
  );
}

export { RealVistaButton, realVistaButtonVariants };
