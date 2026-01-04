/**
 * Network Status Hook - Detect online/offline state
 * Used by sync queue to process pending operations when online
 */

import { useState, useEffect, useCallback } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { logger } from "../lib/logger";

export interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * Hook to monitor network connectivity status
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: null,
    isInternetReachable: null,
    type: null,
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const newStatus: NetworkStatus = {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      };

      setStatus((prev) => {
        // Log only when connectivity changes
        if (prev.isConnected !== newStatus.isConnected) {
          logger.info("Network status changed", {
            isConnected: newStatus.isConnected,
            type: newStatus.type,
          });
        }
        return newStatus;
      });
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    const state = await NetInfo.fetch();
    setStatus({
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    });
    return state.isConnected;
  }, []);

  return {
    ...status,
    isOnline: status.isConnected === true && status.isInternetReachable !== false,
    isOffline: status.isConnected === false,
    refresh,
  };
}

/**
 * Simple function to check current network status (non-hook)
 */
export async function checkNetworkStatus(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch {
    return false;
  }
}
