import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook to manage resend code cooldown functionality
 * Provides a 2-minute cooldown period between resend attempts
 */
export function useResendCooldown() {
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isOnCooldown, setIsOnCooldown] = useState(false);

  /**
   * Start the 2-minute cooldown timer
   */
  const startCooldown = useCallback(() => {
    const cooldownDuration = 120; // 2 minutes in seconds
    setCooldownTime(cooldownDuration);
    setIsOnCooldown(true);
  }, []);

  /**
   * Reset the cooldown timer
   */
  const resetCooldown = useCallback(() => {
    setCooldownTime(0);
    setIsOnCooldown(false);
  }, []);

  // Effect to handle the countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isOnCooldown && cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            setIsOnCooldown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOnCooldown, cooldownTime]);

  /**
   * Format the cooldown time as MM:SS
   */
  const formatCooldownTime = useCallback(() => {
    const minutes = Math.floor(cooldownTime / 60);
    const seconds = cooldownTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [cooldownTime]);

  return {
    isOnCooldown,
    cooldownTime,
    formatCooldownTime,
    startCooldown,
    resetCooldown,
  };
}
