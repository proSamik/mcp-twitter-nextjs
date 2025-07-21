import crypto from "crypto";

const ENCRYPTION_KEY =
  process.env.BETTER_AUTH_SECRET || "default-key-change-in-production-32chars";
const ALGORITHM = "aes-256-cbc";

/**
 * Encrypts OAuth client secret for secure storage
 */
export function encryptClientSecret(clientSecret: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY).subarray(0, 32),
    iv,
  );

  let encrypted = cipher.update(clientSecret, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Combine IV and encrypted data
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypts OAuth client secret from storage
 */
export function decryptClientSecret(encryptedSecret: string): string {
  const parts = encryptedSecret.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted secret format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encryptedData = parts[1];

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY).subarray(0, 32),
    iv,
  );
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Validates Twitter OAuth credentials format
 */
export function validateTwitterOAuthCredentials(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!clientId || clientId.trim().length === 0) {
    errors.push("Client ID is required");
  }

  if (!clientSecret || clientSecret.trim().length === 0) {
    errors.push("Client Secret is required");
  }

  if (!redirectUri || redirectUri.trim().length === 0) {
    errors.push("Redirect URI is required");
  } else {
    try {
      new URL(redirectUri);
    } catch {
      errors.push("Redirect URI must be a valid URL");
    }
  }

  // Twitter OAuth 2.0 Client ID format validation
  if (clientId && !clientId.match(/^[a-zA-Z0-9_-]+$/)) {
    errors.push("Client ID contains invalid characters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verifies Twitter OAuth credentials with X API (SERVER-SIDE ONLY)
 * This function must only be called from server-side code (API routes)
 * Never call this from browser/client-side code due to CORS and security issues
 */
export async function verifyTwitterOAuthCredentials(
  clientId: string,
  clientSecret: string,
): Promise<{ valid: boolean; error?: string; warning?: string }> {
  // Security check - ensure this is running server-side
  if (typeof window !== "undefined") {
    console.error(
      "verifyTwitterOAuthCredentials called from browser - this is a security risk!",
    );
    return {
      valid: false,
      error:
        "Credential verification must be done server-side for security reasons.",
    };
  }

  try {
    // Try to get an app-only bearer token to verify the credentials using X API v2
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    const response = await fetch("https://api.x.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: "grant_type=client_credentials",
    });

    if (response.ok) {
      const data = await response.json();
      if (data.access_token && data.token_type === "bearer") {
        return { valid: true };
      }
    }

    // Log response for debugging (server-side only)
    console.error("X API verification failed:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    // Check for specific error responses
    if (response.status === 401) {
      return {
        valid: false,
        error:
          "Invalid Client ID or Client Secret. Please verify your X/Twitter app credentials in the Developer Portal.",
      };
    } else if (response.status === 403) {
      // 403 might be due to Free tier limitations or app not attached to a Project
      console.warn(
        "X API returned 403 - might be Free tier limitation or missing Project",
      );
      return {
        valid: true, // Allow saving despite verification failure
        warning:
          "Unable to verify credentials with X API (this may be due to Free tier limitations). Credentials have been saved but please verify they work when connecting Twitter accounts.",
      };
    }

    // For other errors, assume it might be tier-related and allow saving
    console.warn(
      "X API verification inconclusive, allowing save:",
      response.status,
    );
    return {
      valid: true,
      warning:
        "Credential verification was inconclusive. Credentials have been saved - please test by connecting a Twitter account.",
    };
  } catch (error) {
    console.error("Error verifying X OAuth credentials:", error);
    // On network or other errors, allow saving but warn user
    return {
      valid: true,
      warning:
        "Unable to verify credentials due to network issues. Credentials have been saved - please test by connecting a Twitter account.",
    };
  }
}
