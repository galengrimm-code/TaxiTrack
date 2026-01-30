'use client';

import { ReactNode } from 'react';
import { DataProvider } from '@/lib/DataContext';

export function Providers({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}
