'use client';

import * as React from 'react';
import { VisuallyHidden as VisuallyHiddenPrimitive } from 'radix-ui';

/**
 * VisuallyHidden component hides its children while keeping them accessible to screen readers.
 * It uses Radix UI's VisuallyHidden primitive.
 */
function VisuallyHidden({ ...props }: React.ComponentProps<typeof VisuallyHiddenPrimitive.Root>) {
  return <VisuallyHiddenPrimitive.Root {...props} />;
}

export { VisuallyHidden };
