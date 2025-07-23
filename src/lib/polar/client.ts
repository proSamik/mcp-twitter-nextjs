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
    _userData?: { email?: string; name?: string },
  ): Promise<PolarCustomerSession> {
    console.log(
      "Creating customer session for external ID:",
      externalCustomerId,
    );

    try {
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
