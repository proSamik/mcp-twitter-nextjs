"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useObjectState } from "@/hooks/use-object-state";
import { useResendCooldown } from "@/hooks/use-resend-cooldown";
import { Loader, Mail } from "lucide-react";
import { safe } from "ts-safe";
import { authClient } from "auth/client";
import { toast } from "sonner";

/**
 * Forgot Password Page Component
 * Allows users to request a password reset and reset their password
 */
export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState<"email" | "success" | "reset">(
    token ? "reset" : "email",
  );
  const [state, setState] = useObjectState({
    email: "",
    password: "",
    confirmPassword: "",
    loading: false,
  });

  const { isOnCooldown, formatCooldownTime, startCooldown } =
    useResendCooldown();

  /**
   * Handle requesting password reset
   */
  const handleRequestReset = () => {
    if (!state.email) {
      toast.error("Please enter your email address");
      return;
    }

    setState({ loading: true });

    safe(() =>
      authClient.requestPasswordReset(
        {
          email: state.email,
          redirectTo: "/forgot-password", // Redirect back to this page with token
        },
        {
          onError(ctx) {
            toast.error(
              ctx.error.message || "Failed to send password reset email",
            );
          },
          onSuccess() {
            toast.success("Password reset email sent!");
            setStep("success");
            startCooldown(); // Start the 2-minute cooldown
          },
        },
      ),
    )
      .watch(() => setState({ loading: false }))
      .unwrap();
  };

  /**
   * Handle resending password reset email
   */
  const handleResendEmail = () => {
    if (isOnCooldown) return;

    setState({ loading: true });

    safe(() =>
      authClient.requestPasswordReset(
        {
          email: state.email,
          redirectTo: "/forgot-password",
        },
        {
          onError(ctx) {
            toast.error(
              ctx.error.message || "Failed to resend password reset email",
            );
          },
          onSuccess() {
            toast.success("Password reset email resent!");
            startCooldown(); // Restart the cooldown
          },
        },
      ),
    )
      .watch(() => setState({ loading: false }))
      .unwrap();
  };

  /**
   * Handle password reset with token
   */
  const handleResetPassword = () => {
    if (!state.password) {
      toast.error("Please enter a new password");
      return;
    }

    if (state.password !== state.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (state.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    setState({ loading: true });

    safe(() =>
      authClient.resetPassword(
        {
          newPassword: state.password,
          token: token,
        },
        {
          onError(ctx) {
            toast.error(
              ctx.error.message || "Password reset failed. Please try again.",
            );
          },
          onSuccess() {
            toast.success(
              "Password reset successfully! You can now sign in with your new password.",
            );
            // Redirect to sign-in page
            window.location.href = "/sign-in?message=password-reset";
          },
        },
      ),
    )
      .watch(() => setState({ loading: false }))
      .unwrap();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === "email" && "Reset your password"}
            {step === "success" && "Check your email"}
            {step === "reset" && "Set new password"}
          </CardTitle>
          <CardDescription>
            {step === "email" &&
              "Enter your email address and we'll send you a reset link"}
            {step === "success" && `We sent a reset link to ${state.email}`}
            {step === "reset" && "Enter your new password"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={state.email}
                  onChange={(e) => setState({ email: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleRequestReset()}
                  disabled={state.loading}
                />
              </div>
              <Button
                onClick={handleRequestReset}
                disabled={state.loading || !state.email}
                className="w-full"
              >
                {state.loading && (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send reset link
              </Button>
            </>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent a password reset link to:
                </p>
                <p className="font-medium">{state.email}</p>
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to reset your password. The link
                  will expire in 5 minutes.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={handleResendEmail}
                  disabled={state.loading || isOnCooldown}
                  className="w-full"
                >
                  {state.loading && (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isOnCooldown
                    ? `Resend in ${formatCooldownTime()}`
                    : "Resend reset link"}
                </Button>
                <Button
                  variant="link"
                  onClick={() => setStep("email")}
                  className="w-full text-sm"
                >
                  Try a different email
                </Button>
              </div>
            </div>
          )}

          {step === "reset" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={state.password}
                  onChange={(e) => setState({ password: e.target.value })}
                  disabled={state.loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={state.confirmPassword}
                  onChange={(e) =>
                    setState({ confirmPassword: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                  disabled={state.loading}
                />
              </div>
              <Button
                onClick={handleResetPassword}
                disabled={
                  state.loading || !state.password || !state.confirmPassword
                }
                className="w-full"
              >
                {state.loading && (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reset password
              </Button>
            </>
          )}

          <div className="text-center">
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
