"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Dynamically import components with no SSR
const FirebaseInit = dynamic(() => import("@/app/firebase-init"), { 
  ssr: false,
  loading: () => null 
});

const PushNotificationManager = dynamic(() => import("@/components/PushNotificationManager"), { 
  ssr: false,
  loading: () => null 
});

const PWAInstallPrompt = dynamic(() => import("@/components/PWAInstallPrompt"), { 
  ssr: false,
  loading: () => null 
});

const PWAInit = dynamic(() => import("@/app/pwa-init"), { 
  ssr: false,
  loading: () => null 
});

const DebugConfigInitializer = dynamic(() => import("@/components/DebugConfigInitializer"), { 
  ssr: false,
  loading: () => null 
});

export default function ClientComponents({ children }: { children: ReactNode }) {
  return (
    <>
      <DebugConfigInitializer />
      <FirebaseInit />
      <PushNotificationManager />
      <PWAInit />
      <PWAInstallPrompt />
      {children}
    </>
  );
}
