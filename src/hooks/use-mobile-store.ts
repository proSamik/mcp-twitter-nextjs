import { useEffect } from "react";
import { useStoreActions } from "../app/store";
import { useIsMobile } from "./use-mobile";

/**
 * Hook that integrates mobile detection with the Zustand store
 * Automatically updates the store's mobile state when screen size changes
 */
export function useMobileStore() {
  const isMobile = useIsMobile();
  const { setMobile } = useStoreActions();

  useEffect(() => {
    setMobile(isMobile);
  }, [isMobile, setMobile]);

  return isMobile;
}
