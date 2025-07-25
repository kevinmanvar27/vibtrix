"use client";

import { useEffect } from "react";
import configureDebugUtility from "@/lib/debug-config";

/**
 * Component that initializes debug configuration on the client side
 * This ensures debug settings are applied in the browser
 */
export default function DebugConfigInitializer() {
  useEffect(() => {
    // Configure debug utility to reduce console logs
    configureDebugUtility();
  }, []);

  // This component doesn't render anything
  return null;
}
