import { ReactNode } from 'react';

// Required by Next.js since we have a root not-found.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
