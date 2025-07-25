"use client";

import { useEffect, useState } from "react";
import debug from "@/lib/debug";

// Combined PWA components to reduce complexity
export function PWAInitFixed() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      debug.log("Service workers are supported");
    } else {
      debug.log("Service workers are not supported");
    }
  }, []);

  return null;
}

export function PWAInstallPromptFixed() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      debug.log("Install prompt detected");
    };

    // Add event listener for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}
