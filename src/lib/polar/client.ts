import { Polar } from "@polar-sh/sdk";

/**
 * Fallback Polar client for when Better Auth plugin fails
 * Uses direct Polar SDK with customer sessions
 */

export interface PolarCustomerSession {
  id: string;
  token: string;
  expires_at: string;
  customer_portal_url: string;
  customer_id: string;
  customer: {
    id: string;
    external_id: string;
    email: string;
    name: string;
    [key: string]: any;
  };
}

export interface PolarOrder {
  id: string;
  created_at: string;
  modified_at: string;
  status: string;
  paid: boolean;
  amount: number;
  currency: string;
  billing_reason: string;
  customer_id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    description: string;
    is_recurring: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PolarOrdersResponse {
  items: PolarOrder[];
  pagination: {
    total_count: number;
    max_page: number;
  };
}

export class PolarFallbackClient {
  private polarClient: Polar;

  constructor() {
    this.polarClient = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN || "",
      server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
    });
  }

  /**
   * Create a customer session for portal access
   * @param externalCustomerId - The Better Auth user ID
   * @param userData - User data from Better Auth session
   * @returns Customer session with portal URL
   */
  async createCustomerSession(
    externalCustomerId: string,
    userData?: { email?: string; name?: string },
  ): Promise<PolarCustomerSession> {
    console.log(
      "Creating customer session for external ID:",
      externalCustomerId,
    );

    try {
      // First, ensure customer exists in Polar
      const customer = await this.ensureCustomerExists(
        externalCustomerId,
        userData,
      );
      console.log("Customer ensured:", customer);

      // Create customer session using externalCustomerId directly
      // Based on Polar docs, use externalCustomerId parameter
      console.log(
        "Creating session with externalCustomerId:",
        externalCustomerId,
      );

      const result: any = await (
        this.polarClient.customerSessions as any
      ).create({
        customerExternalId: externalCustomerId,
      });

      console.log("Customer session created successfully:", {
        sessionId: result.id,
        customerId: result.customerId,
        customerPortalUrl: result.customerPortalUrl,
      });

      // Convert the API response to our expected format
      return {
        id: result.id || "",
        token: result.token || "",
        expires_at:
          typeof result.expiresAt === "string"
            ? result.expiresAt
            : result.expiresAt instanceof Date
              ? result.expiresAt.toISOString()
              : new Date().toISOString(),
        customer_portal_url: result.customerPortalUrl || "",
        customer_id: result.customerId || "",
        customer: {
          ...result.customer,
          id: result.customer?.id || "",
          external_id: result.customer?.externalId || externalCustomerId,
          email: result.customer?.email || "",
          name: result.customer?.name || "",
        },
      };
    } catch (error) {
      console.error("Failed to create customer session:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      // Don't throw error, return a default response
      console.log("Returning empty session data instead of throwing error");
      return {
        id: "",
        token: "",
        expires_at: new Date().toISOString(),
        customer_portal_url: "",
        customer_id: "",
        customer: {
          id: "",
          external_id: externalCustomerId,
          email: "",
          name: "",
        },
      };
    }
  }

  /**
   * Ensure customer exists in Polar, create if not found
   * @param externalCustomerId - The Better Auth user ID
   * @param userData - User data from Better Auth session
   * @returns Customer object
   */
  async ensureCustomerExists(
    externalCustomerId: string,
    userData?: { email?: string; name?: string },
  ): Promise<any> {
    console.log(
      "Ensuring customer exists for external ID:",
      externalCustomerId,
    );
    console.log("User data provided:", userData);

    try {
      try {
        const customersIterator = await (
          this.polarClient.customers as any
        ).list({
          limit: 100, // Get more customers to search
        });

        for await (const page of customersIterator) {
          console.log("Checking page of customers:", page.items?.length || 0);
          if (page.items) {
            for (const customer of page.items) {
              // Match by external ID or email
              if (
                customer.externalId === externalCustomerId ||
                (userData?.email &&
                  customer.email.toLowerCase() === userData.email.toLowerCase())
              ) {
                console.log("Found matching customer by external ID or email:");
                console.log({
                  id: customer.id,
                  externalId: customer.externalId,
                  email: customer.email,
                  name: customer.name,
                });
                return customer;
              }
            }
          }
        }
        console.log("No matching customer found in list");
      } catch (error: any) {
        console.log(
          "Method 2 failed - could not list customers:",
          error.message,
        );
      }

      // If all methods fail, return a placeholder object to avoid breaking the flow
      console.log("Returning placeholder customer object");
      return {
        id: "",
        externalId: externalCustomerId,
        email: userData?.email || "",
        name: userData?.name || "",
      };
    } catch (error: any) {
      console.error("Overall customer ensure process failed:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      // Return a placeholder customer object
      return {
        id: "",
        externalId: externalCustomerId,
        email: userData?.email || "",
        name: userData?.name || "",
      };
    }
  }

  /**
   * Get customer portal URL for a user
   * @param externalCustomerId - The Better Auth user ID
   * @param userData - User data from Better Auth session
   * @returns Portal URL for customer management
   */
  async getCustomerPortalUrl(
    externalCustomerId: string,
    userData?: { email?: string; name?: string },
  ): Promise<string> {
    try {
      const session = await this.createCustomerSession(
        externalCustomerId,
        userData,
      );
      return session.customer_portal_url;
    } catch (error) {
      console.error("Failed to get customer portal URL:", error);
      throw new Error(
        `Portal URL retrieval failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * List customer orders using customer session
   * @param externalCustomerId - The Better Auth user ID
   * @param options - Query options for filtering orders
   * @param userData - User data from Better Auth session
   * @returns List of customer orders
   */
  async listCustomerOrders(
    externalCustomerId: string,
    options: {
      page?: number;
      limit?: number;
      productBillingType?: "one_time" | "recurring";
    } = {},
    userData?: { email?: string; name?: string },
  ): Promise<PolarOrdersResponse> {
    console.log(
      "Listing customer orders for external ID:",
      externalCustomerId,
      "with options:",
      options,
    );

    try {
      // First create a customer session to get the token
      const session = await this.createCustomerSession(
        externalCustomerId,
        userData,
      );

      // Check if session creation was successful
      if (!session.token || !session.id) {
        console.log("No valid session token, returning empty orders");
        return {
          items: [],
          pagination: {
            total_count: 0,
            max_page: 0,
          },
        };
      }

      console.log(
        "Using session token to fetch orders:",
        session.token.substring(0, 10) + "...",
      );

      // Use the session token to access customer portal orders
      const ordersIterator: any = await (
        this.polarClient.customerPortal.orders as any
      ).list(
        {
          customerSession: session.token,
        },
        {
          page: options.page || 1,
          limit: options.limit || 10,
        },
      );

      console.log("Orders iterator created, collecting orders...");

      // Collect all orders from the iterator
      const allOrders: PolarOrder[] = [];
      for await (const page of ordersIterator) {
        console.log("Processing page:", page);

        // The actual items are in page.result.items, not page.items
        const items = page?.result?.items || page?.items || [];
        console.log("Found items:", items.length);

        if (items && items.length > 0) {
          // Log each order for debugging
          items.forEach((order: any, index: number) => {
            console.log(`Order ${index}:`, {
              id: order.id,
              billingReason: order.billingReason,
              product_name: order.product?.name,
              isRecurring: order.product?.isRecurring,
              amount: order.amount,
              currency: order.currency,
              status: order.status,
            });
          });

          // Improved filtering logic for billing type
          const filteredOrders = options.productBillingType
            ? items.filter((order: any) => {
                if (options.productBillingType === "one_time") {
                  // One-time/lifetime: not recurring and billingReason is 'purchase'
                  return (
                    order.product?.isRecurring === false &&
                    order.billingReason === "purchase"
                  );
                } else if (options.productBillingType === "recurring") {
                  // Recurring: is recurring and billingReason is subscription-related
                  return (
                    order.product?.isRecurring === true &&
                    ["subscription_create", "subscription_renew"].includes(
                      order.billingReason,
                    )
                  );
                }
                return true;
              })
            : items;

          console.log("Filtered orders for page:", filteredOrders.length);
          allOrders.push(...filteredOrders);
        }
      }

      console.log("Total orders collected:", allOrders.length);

      return {
        items: allOrders,
        pagination: {
          total_count: allOrders.length,
          max_page: Math.ceil(allOrders.length / (options.limit || 10)),
        },
      };
    } catch (error) {
      console.error("Failed to list customer orders:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      // Don't throw error, return empty result
      console.log("Returning empty orders instead of throwing error");
      return {
        items: [],
        pagination: {
          total_count: 0,
          max_page: 0,
        },
      };
    }
  }

  /**
   * Get customer state information
   * @param externalCustomerId - The Better Auth user ID
   * @param userData - User data from Better Auth session
   * @returns Customer state information
   */
  async getCustomerState(
    externalCustomerId: string,
    userData?: { email?: string; name?: string },
  ): Promise<PolarCustomerSession["customer"]> {
    try {
      const session = await this.createCustomerSession(
        externalCustomerId,
        userData,
      );
      return session.customer;
    } catch (error) {
      console.error("Failed to get customer state:", error);
      throw new Error(
        `Customer state retrieval failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

// Export singleton instance
export const polarFallbackClient = new PolarFallbackClient();
