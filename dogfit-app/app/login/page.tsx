"use client"

export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from 'next/dynamic';

// The PageLoadingFallback component is removed.

// Dynamically import the LoginContent component (which should be the minimal version)
const LoginContent = dynamic(() => import('./LoginContent'), {
  ssr: false,
  loading: () => <p>Loading content...</p> // Simplified loading for dynamic import
});

export default function LoginPage() {
  const searchParams = useSearchParams();
  const pendingDataInitially = searchParams.get('pending_data') === 'true';
  const redirectPathInitially = searchParams.get('redirect') || '/profile';

  return (
    <Suspense fallback={<p>Loading page data...</p>}> {/* Simplified fallback for Suspense */}
      <LoginContent
        pendingDataInitially={pendingDataInitially}
        redirectPathInitially={redirectPathInitially}
      />
    </Suspense>
  );
}