"use client"

export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from 'next/dynamic';

// Define a simple loading component for fallbacks
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <p>페이지를 불러오는 중...</p>
  </div>
);

// Dynamically import the LoginContent component from its new file
const LoginContent = dynamic(() => import('./LoginContent'), {
  ssr: false,
  loading: () => <PageLoadingFallback /> // Fallback for the dynamic import itself
});

export default function LoginPage() {
  const searchParams = useSearchParams();
  const pendingDataInitially = searchParams.get('pending_data') === 'true';
  const redirectPathInitially = searchParams.get('redirect') || '/profile';

  return (
    // Suspense here is primarily for the useSearchParams hook's resolution,
    // though dynamic import also interacts with Suspense.
    <Suspense fallback={<PageLoadingFallback />}>
      <LoginContent
        pendingDataInitially={pendingDataInitially}
        redirectPathInitially={redirectPathInitially}
      />
    </Suspense>
  );
}