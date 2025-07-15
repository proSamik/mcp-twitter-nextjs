"use client";

import { useState } from "react";
import Link from "next/link";
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
import { cn } from "lib/utils";
import { ChevronLeft, Loader, Mail } from "lucide-react";
import { toast } from "sonner";
import { safe } from "ts-safe";
import { UserZodSchema } from "app-types/user";
import { existsByEmailAction } from "@/app/api/auth/actions";
import { authClient } from "auth/client";
import { GoogleIcon } from "ui/google-icon";
import { useTranslations } from "next-intl";

export default function SignUpPage() {
  const t = useTranslations("Auth.SignUp");

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useObjectState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const steps = [
    "Enter your email to get started",
    "Choose a secure password",
    "Tell us your name",
    "Check your email",
  ];

  /**
   * Go back to previous step
   */
  const goBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  /**
   * Handle email submission and check if user already exists
   */
  const handleEmailStep = async () => {
    if (!formData.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate email format
    const emailResult = UserZodSchema.shape.email.safeParse(formData.email);
    if (!emailResult.success) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const userExists = await existsByEmailAction(formData.email);
      if (userExists) {
        toast.error(
          "An account with this email already exists. Please sign in instead.",
        );
        setIsLoading(false);
        return;
      }

      setStep(2);
    } catch (error) {
      console.error("Error checking email:", error);
      toast.error("Failed to verify email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle password submission and validation
   */
  const handlePasswordStep = () => {
    if (!formData.password.trim()) {
      toast.error("Please enter a password");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setStep(3);
  };

  /**
   * Handle name submission and create account
   */
  const handleNameStep = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    // Create the account which will automatically send verification email
    createAccount();
  };

  /**
   * Create user account with email verification
   */
  const createAccount = () => {
    setIsLoading(true);

    safe(() =>
      authClient.signUp.email(
        {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          callbackURL: "/sign-in?message=check-email", // Redirect to sign-in with message
        },
        {
          onError(ctx) {
            toast.error(ctx.error.message || "Failed to create account");
          },
          onSuccess() {
            toast.success(
              "Account created! Please check your email for verification.",
            );
            setStep(4); // Move to success step
          },
        },
      ),
    )
      .watch(() => setIsLoading(false))
      .unwrap();
  };

  /**
   * Handle OAuth sign-up
   */
  const handleOAuthSignUp = (provider: "google") => {
    safe(() =>
      authClient.signIn.social(
        {
          provider,
          callbackURL: "/app",
        },
        {
          onError(_ctx) {
            toast.error(`Failed to sign up with ${provider}`);
          },
        },
      ),
    ).unwrap();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            {step > 1 && step < 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="p-1 h-auto"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-center">
                {step === 4 ? "Check Your Email" : t("title")}
              </CardTitle>
              <CardDescription className="text-center">
                {step === 4
                  ? "We've sent you a verification link"
                  : steps[step - 1]}
              </CardDescription>
            </div>
          </div>

          {/* Progress indicator */}
          {step < 4 && (
            <div className="flex gap-2 justify-center pt-2">
              {[1, 2, 3].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    step >= stepNumber ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ email: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailStep()}
                />
              </div>

              <Button
                onClick={handleEmailStep}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>

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
                  onClick={() => handleOAuthSignUp("google")}
                  disabled={isLoading}
                >
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ confirmPassword: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordStep()}
                />
              </div>

              <Button
                onClick={handlePasswordStep}
                disabled={isLoading}
                className="w-full"
              >
                Continue
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleNameStep()}
                />
              </div>

              <Button
                onClick={handleNameStep}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                {t("createAccount")}
              </Button>
            </>
          )}

          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent a verification link to:
                </p>
                <p className="font-medium">{formData.email}</p>
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to verify your account and
                  complete the signup process.
                </p>
              </div>
              <div className="pt-4">
                <Link href="/sign-in">
                  <Button variant="outline" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Link
                href="/sign-in"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
