/**
 * Rate Limiting for Authentication Endpoints
 */

export const RATE_LIMITS = {
  AUTH_ATTEMPTS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
  },
  EMAIL_VERIFICATION: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 3,
  },
} as const;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

export function validateEmailSecurity(email: string): {
  valid: boolean;
  error?: string;
} {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /[<>]/, // HTML/XML tags
    /javascript:/i, // JavaScript protocol
    /['\"`]/, // Quote injection
    /\r|\n/, // Line breaks
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(email)) {
      return { valid: false, error: "Email contains suspicious characters" };
    }
  }

  if (email.length > 254) {
    return { valid: false, error: "Email address too long" };
  }

  return { valid: true };
}
