/**
 * Plunk Email Service Integration
 *
 * This module provides transactional email functionality for user authentication flows:
 * - Email verification emails with verification links
 * - Password reset emails with reset links
 * - User signup event tracking
 *
 * EMAIL TEMPLATES:
 * - Modern shadcn-inspired designs with responsive layout
 * - Branded with Polar SaaS Kit styling
 * - Clear call-to-action buttons with verification links
 * - Professional styling using system fonts and modern colors
 *
 * CONFIGURATION:
 * Required environment variables:
 * - PLUNK_SECRET_KEY: Your Plunk API secret key
 *
 * USAGE:
 * ```typescript
 * // Send email verification link
 * const result = await sendEmailVerificationLink("user@example.com", "https://app.com/verify?token=...");
 *
 * // Send password reset link
 * const result = await sendPasswordResetLink("user@example.com", "https://app.com/reset?token=...");
 *
 * // Check result
 * if (result.success) {
 *   console.log("Email sent successfully");
 * } else {
 *   console.error("Failed to send email:", result.error);
 * }
 * ```
 *
 * BETTER-AUTH INTEGRATION:
 * These functions are automatically called by better-auth's email verification
 * and password reset systems.
 */

import { getPlunkClient } from "./client";
import type { PlunkResponse } from "./client";
import { validateEmailSecurity } from "@/lib/auth/rate-limiter";

/**
 * Generate email verification HTML
 * @param verificationUrl The verification URL to include in the email
 * @returns HTML email template
 */
function generateEmailVerificationHTML(verificationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Polar SaaS Kit</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #020817; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
    <div style="background: #ffffff; border-radius: 12px; padding: 48px 40px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 40px;">
            <div style="font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 8px; letter-spacing: -0.025em;">🚀 Polar SaaS Kit</div>
            <h1 style="font-size: 32px; font-weight: 700; color: #0f172a; margin-bottom: 8px; line-height: 1.2; letter-spacing: -0.025em;">Verify Your Email</h1>
            <p style="color: #64748b; font-size: 16px; margin-bottom: 0;">Complete your account setup</p>
        </div>
        <div style="margin: 32px 0;">
            <p style="color: #475569; font-size: 16px; line-height: 1.7; margin-bottom: 32px;">
                Welcome to Polar SaaS Kit! To complete your account setup and start using our platform, please verify your email address by clicking the button below.
            </p>
            <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; border: 1px solid #0f172a;">
                    Verify Email Address
                </a>
            </div>
            <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px;">
                    If the button doesn&apos;t work, copy and paste this link into your browser:
                </p>
                <div style="word-break: break-all; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 12px; color: #3730a3; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    ${verificationUrl}
                </div>
            </div>
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-left: 4px solid #f59e0b; padding: 20px; margin: 32px 0; border-radius: 8px;">
                <h4 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">🔒 Security Notice</h4>
                <p style="color: #a16207; font-size: 14px; margin: 0; line-height: 1.5;">
                    This verification link will expire in 15 minutes for your security. If you didn&apos;t create an account with us, please ignore this email.
                </p>
            </div>
        </div>
        <div style="text-align: center; margin-top: 48px; padding-top: 32px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 8px 0;">Need help? Contact our support team for assistance.</p>
            <div style="margin-top: 16px;">
                <a href="#" style="color: #64748b; text-decoration: none; font-size: 14px; margin: 0 16px;">Privacy Policy</a>
                <a href="#" style="color: #64748b; text-decoration: none; font-size: 14px; margin: 0 16px;">Terms of Service</a>
                <a href="#" style="color: #64748b; text-decoration: none; font-size: 14px; margin: 0 16px;">Support</a>
            </div>
            <p style="color: #64748b; font-size: 14px; margin: 8px 0; margin-top: 24px;">© 2024 Polar SaaS Kit. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate password reset HTML
 * @param resetUrl The password reset URL to include in the email
 * @returns HTML email template
 */
function generatePasswordResetHTML(resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Polar SaaS Kit</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #020817; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
    <div style="background: #ffffff; border-radius: 12px; padding: 48px 40px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 40px;">
            <div style="font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 8px; letter-spacing: -0.025em;">🚀 Polar SaaS Kit</div>
            <h1 style="font-size: 32px; font-weight: 700; color: #0f172a; margin-bottom: 8px; line-height: 1.2; letter-spacing: -0.025em;">Reset Your Password</h1>
            <p style="color: #64748b; font-size: 16px; margin-bottom: 0;">Secure password reset request</p>
        </div>
        <div style="margin: 32px 0;">
            <p style="color: #475569; font-size: 16px; line-height: 1.7; margin-bottom: 32px;">
                We received a request to reset your password for your Polar SaaS Kit account. Click the button below to create a new password. If you didn&apos;t request this, you can safely ignore this email.
            </p>
            <div style="text-align: center; margin: 40px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; border: 1px solid #dc2626;">
                    Reset My Password
                </a>
            </div>
            <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px;">
                    If the button doesn&apos;t work, copy and paste this link into your browser:
                </p>
                <div style="word-break: break-all; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 12px; color: #3730a3; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    ${resetUrl}
                </div>
            </div>
            <div style="background: #fef2f2; border: 1px solid #ef4444; border-left: 4px solid #ef4444; padding: 20px; margin: 32px 0; border-radius: 8px;">
                <h4 style="color: #991b1b; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">⚠️ Security Alert</h4>
                <p style="color: #b91c1c; font-size: 14px; margin: 0; line-height: 1.5;">
                    This password reset link will expire in 5 minutes for your security. If you didn&apos;t request a password reset, please contact our support team immediately.
                </p>
            </div>
        </div>
        <div style="text-align: center; margin-top: 48px; padding-top: 32px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 8px 0;">Need help? Contact our support team for assistance.</p>
            <div style="margin-top: 16px;">
                <a href="#" style="color: #64748b; text-decoration: none; font-size: 14px; margin: 0 16px;">Privacy Policy</a>
                <a href="#" style="color: #64748b; text-decoration: none; font-size: 14px; margin: 0 16px;">Terms of Service</a>
                <a href="#" style="color: #64748b; text-decoration: none; font-size: 14px; margin: 0 16px;">Support</a>
            </div>
            <p style="color: #64748b; font-size: 14px; margin: 8px 0; margin-top: 24px;">© 2024 Polar SaaS Kit. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Send email verification link as transactional email
 * @param email User's email address
 * @param verificationUrl The verification URL containing the token
 * @returns Promise<PlunkResponse> Success/failure result with error details
 */
export async function sendEmailVerificationLink(
  email: string,
  verificationUrl: string,
): Promise<PlunkResponse> {
  try {
    // Validate email security
    const emailValidation = validateEmailSecurity(email);
    if (!emailValidation.valid) {
      console.error(
        `Security validation failed for email ${email}:`,
        emailValidation.error,
      );
      return {
        success: false,
        error: emailValidation.error || "Invalid email address",
      };
    }

    console.log(`Sending email verification link to ${email}`);
    const plunk = getPlunkClient();

    const result = await plunk.sendEmail({
      to: email,
      subject: "Verify Your Email - Polar SaaS Kit",
      body: generateEmailVerificationHTML(verificationUrl),
      type: "html",
      from: "noreply@prosamik.in",
      name: "Polar SaaS Kit",
      subscribed: false, // Email verification emails don't affect subscription status
    });

    if (result.success) {
      console.log(`Email verification link sent successfully to ${email}`);
    } else {
      console.error(
        `Failed to send email verification link to ${email}:`,
        result.error,
      );
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Failed to send email verification link to ${email}:`,
      errorMessage,
    );
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send password reset link as transactional email
 * @param email User's email address
 * @param resetUrl The password reset URL containing the token
 * @returns Promise<PlunkResponse> Success/failure result with error details
 */
export async function sendPasswordResetLink(
  email: string,
  resetUrl: string,
): Promise<PlunkResponse> {
  try {
    // Validate email security
    const emailValidation = validateEmailSecurity(email);
    if (!emailValidation.valid) {
      console.error(
        `Security validation failed for email ${email}:`,
        emailValidation.error,
      );
      return {
        success: false,
        error: emailValidation.error || "Invalid email address",
      };
    }

    console.log(`Sending password reset link to ${email}`);
    const plunk = getPlunkClient();

    const result = await plunk.sendEmail({
      to: email,
      subject: "Reset Your Password - Polar SaaS Kit",
      body: generatePasswordResetHTML(resetUrl),
      type: "html",
      from: "noreply@prosamik.in",
      name: "Polar SaaS Kit",
      subscribed: false, // Password reset emails don't affect subscription status
    });

    if (result.success) {
      console.log(`Password reset link sent successfully to ${email}`);
    } else {
      console.error(
        `Failed to send password reset link to ${email}:`,
        result.error,
      );
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Failed to send password reset link to ${email}:`,
      errorMessage,
    );
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Track user signup event for analytics
 * @param email User's email address
 * @param fullName User's full name (optional)
 * @returns Promise<PlunkResponse> Success/failure result with error details
 */
export async function trackUserSignup(
  email: string,
  fullName?: string,
): Promise<PlunkResponse> {
  try {
    console.log(`Tracking user signup for ${email}`);
    const plunk = getPlunkClient();

    const result = await plunk.trackEvent({
      event: "user-signup",
      email: email,
      subscribed: true, // New users are subscribed by default
      data: fullName
        ? {
            fullName: fullName,
          }
        : {},
    });

    if (result.success) {
      console.log(`User signup tracked successfully for ${email}`);
    } else {
      console.error(`Failed to track user signup for ${email}:`, result.error);
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to track user signup for ${email}:`, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
