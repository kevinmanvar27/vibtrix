"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import debug from "@/lib/debug";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import {
  requestNotificationPermission,
  registerFCMToken,
  onForegroundMessage,
  isPushNotificationsSupported
} from "@/lib/firebase/client";

export default function PushNotificationManager() {
  const [initialized, setInitialized] = useState(false);
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Check if push notifications are supported in this browser
  useEffect(() => {
    // Only check once
    if (isSupported !== null) return;

    const supported = isPushNotificationsSupported();
    setIsSupported(supported);

    if (!supported) {
      debug.log("Push notifications are not supported in this browser");
    }
  }, [isSupported]);

  // Get notification preferences
  const { data: preferences } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/api/users/notification-preferences");
        return response.data;
      } catch (error) {
        debug.error("Error fetching notification preferences:", error);
        return null;
      }
    },
  });

  // Get site settings to check if push notifications are enabled
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

  // Dynamically import Firebase modules only if Firebase is enabled and supported
  useEffect(() => {
    if (!settings || isSupported === null) return;

    // Don't try to load Firebase if push notifications aren't supported
    if (!isSupported) {
      debug.log("Not loading Firebase because push notifications are not supported");
      return;
    }

    if (settings.firebaseEnabled && settings.pushNotificationsEnabled && !firebaseLoaded) {
      // Set flag to avoid multiple imports
      setFirebaseLoaded(true);
      debug.log("Firebase is enabled, loading Firebase modules");
    }
  }, [settings, firebaseLoaded, isSupported]);

  useEffect(() => {
    // Only initialize once
    if (initialized || !firebaseLoaded || isSupported === null) return;

    // Don't try to initialize if push notifications aren't supported
    if (!isSupported) {
      debug.log("Not initializing push notifications because they are not supported");
      return;
    }

    // Check if push notifications are enabled in site settings
    if (!settings?.pushNotificationsEnabled || !settings?.firebaseEnabled) {
      debug.log("Push notifications are disabled in site settings");
      return;
    }

    // Check if user has enabled push notifications in their preferences
    if (preferences && !preferences.pushNotifications) {
      debug.log("User has disabled push notifications in preferences");
      return;
    }

    // Initialize push notifications
    const initPushNotifications = async () => {
      try {
        // Request permission and get FCM token
        const token = await requestNotificationPermission();

        if (token) {
          // Register token with server
          const success = await registerFCMToken(token, "WEB");

          if (success) {
            debug.log("Push notifications initialized successfully");
            setInitialized(true);
          }
        }
      } catch (error) {
        debug.error("Error initializing push notifications:", error);
      }
    };

    initPushNotifications();

    // Set up foreground message handler
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onForegroundMessage((payload) => {
        debug.log("Foreground message received:", payload);

        // Show toast notification for foreground messages
        if (payload.notification) {
          toast.info(
            `${payload.notification.title}: ${payload.notification.body}`
          );
        }
      });
    } catch (error) {
      debug.error("Error setting up foreground message handler:", error);
    }

    // Clean up
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initialized, preferences, settings, firebaseLoaded, isSupported]);

  // This component doesn't render anything
  return null;
}
