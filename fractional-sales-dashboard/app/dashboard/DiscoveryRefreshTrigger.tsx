"use client";

import { useEffect } from "react";
import { triggerDiscoveryRefresh } from "./actions";

/**
 * Fires a background GHL discovery refresh on mount.
 * - No clientId: refresh for all clients with GHL configured (use on portfolio).
 * - clientId: refresh for that client only (use on client funnel).
 */
export function DiscoveryRefreshTrigger({ clientId }: { clientId?: string }) {
  useEffect(() => {
    triggerDiscoveryRefresh(clientId).catch(() => {});
  }, [clientId]);
  return null;
}
