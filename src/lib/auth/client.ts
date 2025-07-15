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

    /**
     * Enhanced orders list method - directly calls fallback API
     */
    orders: {
      list: async (options: {
        query: {
          page: number;
          limit: number;
          productBillingType: "one_time" | "recurring";
        };
      }) => {
        console.log(
          "Enhanced orders.list: Using direct fallback API with options:",
          options,
        );

        try {
          const params = new URLSearchParams({
            page: options.query.page.toString(),
            limit: options.query.limit.toString(),
            productBillingType: options.query.productBillingType,
          });

          const response = await fetch(`/api/polar-fallback/orders?${params}`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });

          if (!response.ok) {
            throw new Error(
              `Orders API failed with status: ${response.status}`,
            );
          }

          const result = await response.json();
          console.log("Orders fallback API response:", result);

          if (result.success) {
            // Format response to match Better Auth structure
            return {
              data: {
                result: result.data,
              },
            };
          } else {
            throw new Error(result.error || "Orders API returned error");
          }
        } catch (error) {
          console.error("Orders fallback API error:", error);
          // Return empty data structure instead of throwing
          return {
            data: {
              result: {
                items: [],
                pagination: {
                  total_count: 0,
                  max_page: 0,
                },
              },
            },
          };
        }
      },
    },

    // Remove the state method since we're not using customer.state anymore
    // state: authClient.customer.state,
  },
};

export type AuthClient = typeof authClient;
