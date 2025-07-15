/**
 * Plunk API client for email tracking and transactional emails
 * @see https://docs.useplunk.com/api-reference
 */

export interface PlunkTrackEventData {
  event: string;
  email: string;
  subscribed?: boolean;
  data?: Record<string, any>;
}

export interface PlunkSendEmailData {
  to: string;
  subject: string;
  body: string;
  type?: "html" | "markdown";
  from?: string;
  name?: string;
  subscribed?: boolean;
}

export interface PlunkResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class PlunkClient {
  private apiKey: string;
  private baseUrl = "https://api.useplunk.com/v1";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Plunk API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Track an event for a user
   * @param data Event tracking data
   * @returns Promise<PlunkResponse>
   */
  async trackEvent(data: PlunkTrackEventData): Promise<PlunkResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Plunk API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || "Event tracked successfully",
      };
    } catch (error) {
      console.error("Plunk trackEvent error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send a transactional email
   * @param data Email data
   * @returns Promise<PlunkResponse>
   */
  async sendEmail(data: PlunkSendEmailData): Promise<PlunkResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Plunk API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || "Email sent successfully",
      };
    } catch (error) {
      console.error("Plunk sendEmail error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Server-side singleton instance
let plunkClient: PlunkClient | null = null;

/**
 * Get the Plunk client instance (server-side only)
 * @returns PlunkClient instance
 */
export function getPlunkClient(): PlunkClient {
  if (!plunkClient) {
    const apiKey = process.env.PLUNK_SECRET_KEY;
    if (!apiKey) {
      throw new Error("PLUNK_SECRET_KEY environment variable is required");
    }
    plunkClient = new PlunkClient(apiKey);
  }
  return plunkClient;
}
