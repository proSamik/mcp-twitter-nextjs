"use client";

import { createAuthClient } from "better-auth/react";

import { toast } from "sonner";
import { handleErrorWithToast } from "ui/shared-toast";
import { polarClient } from "@polar-sh/better-auth";
import { emailHarmony } from "better-auth-harmony";

/**
 * Enhanced auth client with direct fallback API calls for Polar functionality
 */
export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "",
  plugins: [polarClient(), emailHarmony()],
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
        return;
      }

      // Show toast for other errors (but not Polar-specific ones)
      if (
        !e.error.code?.includes("ORDERS_LIST_FAILED") &&
        !e.error.code?.includes("CUSTOMER_PORTAL_CREATION_FAILED") &&
        !e.error.message?.includes("Orders list failed") &&
        !e.error.message?.includes("Customer portal creation failed")
      ) {
        handleErrorWithToast(e.error);
      }
    },
  },
});

/**
 * Enhanced customer methods with direct fallback API calls
 */
export const enhancedAuthClient = {
  ...authClient,
  customer: {
    ...authClient.customer,

    /**
     * Enhanced portal method - directly calls fallback API
     */
    portal: async () => {
      console.log("Enhanced portal: Using direct fallback API");

      try {
        const response = await fetch("/api/polar-fallback/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Portal API failed with status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.url) {
          console.log("Portal API success, redirecting to:", result.url);
          window.location.href = result.url;
          return;
        } else {
          throw new Error(result.error || "Portal API returned no URL");
        }
      } catch (error) {
        console.error("Portal fallback API error:", error);
        // Fallback to pricing page as last resort
        console.log("Portal fallback failed, redirecting to pricing");
        window.location.href = "/pricing";
        throw error;
      }
    },

    // Keep original state method unchanged
    state: authClient.customer.state,
  },
};

export type AuthClient = typeof authClient;
