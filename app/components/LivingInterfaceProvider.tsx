'use client';

import { useLivingInterface } from '../hooks/useLivingInterface';

export function LivingInterfaceProvider({ children }: { children: React.ReactNode }) {
  useLivingInterface();
  
  return <>{children}</>;
}
