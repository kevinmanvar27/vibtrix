"use client";

import { useEffect, useState } from "react";
import debug from "@/lib/debug";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { isPushNotificationsSupported } from "@/lib/firebase/client";

export default function FirebaseInit() {
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = isPushNotificationsSupported();
    setIsSupported(supported);

    if (!supported) {
      debug.log("Push notifications are not supported in this browser");
    }
  }, []);

  // Get Firebase settings from the server
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/api/settings");
        return response.data;
      } catch (error) {
        debug.error("Error fetching site settings:", error);
        return null;
      }
    },
  });

  // Register the service worker only if push notifications are supported
  useEffect(() => {
    // Don't try to register if push notifications aren't supported
    if (!isSupported) {
      debug.log("Not registering service worker because push notifications are not supported");
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Check if service workers are supported
        if ("serviceWorker" in navigator) {
          // Register the service worker
          const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
            scope: "/",
          });

          setServiceWorkerRegistration(registration);
          debug.log("Firebase service worker registered successfully");
        } else {
          debug.log("Service workers are not supported in this browser");
        }
      } catch (error) {
        debug.error("Error registering Firebase service worker:", error);
      }
    };

    registerServiceWorker();
  }, [isSupported]);

  // Pass Firebase config to the service worker when settings are available
  useEffect(() => {
    // Don't try to configure if push notifications aren't supported
    if (!isSupported) {
      return;
    }

    if (!serviceWorkerRegistration || !settings?.firebaseEnabled) return;

    try {
      // Use settings from the database if available, otherwise use environment variables
      const firebaseConfig = {
        apiKey: settings.firebaseApiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: settings.firebaseAuthDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: settings.firebaseProjectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: settings.firebaseStorageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: settings.firebaseMessagingSenderId || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: settings.firebaseAppId || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: settings.firebaseMeasurementId || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      };

      // Pass config to the service worker
      if (serviceWorkerRegistration.active) {
        serviceWorkerRegistration.active.postMessage({
          type: "FIREBASE_CONFIG",
          config: firebaseConfig,
        });
        debug.log("Firebase config sent to service worker");
      } else {
        debug.log("Service worker is not active yet, waiting...");

        // Wait for the service worker to become active
        serviceWorkerRegistration.addEventListener("updatefound", () => {
          const newWorker = serviceWorkerRegistration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                serviceWorkerRegistration.active?.postMessage({
                  type: "FIREBASE_CONFIG",
                  config: firebaseConfig,
                });
                debug.log("Firebase config sent to newly activated service worker");
              }
            });
          }
        });
      }
    } catch (error) {
      debug.error("Error configuring service worker:", error);
    }
  }, [serviceWorkerRegistration, settings, isSupported]);

  // This component doesn't render anything
  return null;
}
