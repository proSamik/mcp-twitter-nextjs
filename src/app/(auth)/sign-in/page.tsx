"use client";

import { useState, useEffect } from "react";
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
import { Loader } from "lucide-react";
import { safe } from "ts-safe";
import { authClient } from "auth/client";
import { toast } from "sonner";
import { GoogleIcon } from "ui/google-icon";
import { useTranslations } from "next-intl";

export default function SignInPage() {
  const t = useTranslations("Auth.SignIn");
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useObjectState({
    email: "",
    password: "",
  });

  // Show success message based on query parameters
  useEffect(() => {
    const verified = searchParams.get("verified");
    const message = searchParams.get("message");

    if (verified === "true") {
      toast.success("Email verified successfully! You can now sign in.");
    }
    if (message === "check-email") {
      toast.info(
        "Please check your email and click the verification link to activate your account.",
      );
    }
    if (message === "password-reset") {
      toast.success(
        "Password reset successfully! You can now sign in with your new password.",
      );
    }
  }, [searchParams]);

  /**
   * Handle email and password sign in
   */
  const emailAndPasswordSignIn = () => {
    if (!formData.email || !formData.password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    safe(() =>
      authClient.signIn.email(
        {
          email: formData.email,
          password: formData.password,
          callbackURL: "/app",
        },
        {
          onError(ctx) {
            if (ctx.error.status === 403) {
              toast.error(
                "Please verify your email address before signing in.",
              );
            } else {
              toast.error(ctx.error.message || "Sign in failed");
            }
          },
          onSuccess() {
            toast.success("Welcome back!");
          },
        },
      ),
    )
      .watch(() => setLoading(false))
      .unwrap();
  };

  /**
   * Handle OAuth sign in
   */
  const handleOAuthSignIn = (provider: "google") => {
    safe(() =>
      authClient.signIn.social(
        {
          provider,
          callbackURL: "/app",
        },
        {
          onError(_ctx) {
            toast.error(`Failed to sign in with ${provider}`);
          },
        },
      ),
    ).unwrap();
  };

  /**
   * Handle resend verification email
   */
  const handleResendVerification = () => {
    if (!formData.email) {
      toast.error("Please enter your email address first");
      return;
    }

    setLoading(true);
    safe(() =>
      authClient.sendVerificationEmail(
        {
          email: formData.email,
          callbackURL: "/sign-in?verified=true",
        },
        {
          onError(ctx) {
            toast.error(
              ctx.error.message || "Failed to send verification email",
            );
          },
          onSuccess() {
            toast.success("Verification email sent! Please check your inbox.");
          },
        },
      ),
    )
      .watch(() => setLoading(false))
      .unwrap();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("description")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ email: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && emailAndPasswordSignIn()}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && emailAndPasswordSignIn()}
            />
          </div>

          <Button
            onClick={emailAndPasswordSignIn}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={handleResendVerification}
              disabled={loading}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Didn&apos;t receive verification email? Resend
            </Button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading}
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              Don&apos;t have an account?{" "}
            </span>
            <Link
              href="/sign-up"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
