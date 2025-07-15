"use client";

import { useState } from "react";
import {
  Check,
  CreditCard,
  Crown,
  Gift,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { enhancedAuthClient } from "auth/client";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { cn } from "@/lib/utils";
import { authClient } from "auth/client";

interface SubscriptionPlan {
  name: string;
  price: string;
  originalPrice?: string;
  description: string;
  features: string[];
  planSlug: "lifetime";
  icon: React.ReactNode;
  highlighted?: boolean;
  badge?: string;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    name: "Lifetime",
    price: "$49",
    originalPrice: "$199",
    description: "One-time payment, lifetime access to everything",
    features: [
      "Everything in Free, plus:",
      "Unlimited analytics events",
      "Unlimited lead magnet forms",
      "Unlimited subscribers",
      "Unlimited time tracking",
      "Unlimited link variations for tracking",
      "Unlimited project dashboards",
      "Email templates & automation",
      "Priority support",
      "Lifetime updates",
    ],
    planSlug: "lifetime",
    icon: <Crown className="h-5 w-5" />,
    highlighted: true,
    badge: "75% OFF - Limited Time",
  },
];

type UserTier = "free" | "lifetime";

interface SubscriptionManagementProps {
  currentTier: UserTier;
  lifetimeOrders: any[];
  onBack: () => void;
}

/**
 * Subscription management page component with lifetime plan purchasing
 */
export function SubscriptionManagement({
  currentTier,
  lifetimeOrders,
  onBack,
}: SubscriptionManagementProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  /**
   * Handle lifetime plan purchase via checkout or portal based on order status
   */
  const handleLifetimePurchase = async () => {
    setCheckoutLoading("lifetime");
    try {
      await authClient.checkout({
        products: [process.env.NEXT_PUBLIC_POLAR_LIFETIME_PRODUCT_ID || ""],
        slug: "lifetime",
      });
    } catch (error: any) {
      console.error("Checkout failed:", error);
      // Optionally, show a toast notification to the user
    } finally {
      setCheckoutLoading(null);
    }
  };

  /**
   * Handle billing management via customer portal with automatic fallback
   */
  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      await enhancedAuthClient.customer.portal();
    } catch (error: any) {
      console.error("Portal error:", error);
      // Fallback to pricing page if both methods fail
      window.location.href = "/pricing";
    } finally {
      setPortalLoading(false);
    }
  };

  /**
   * Get button state and text for the lifetime plan
   */
  const getButtonState = (plan: SubscriptionPlan) => {
    if (checkoutLoading === plan.planSlug) {
      return {
        disabled: true,
        text: "Loading...",
        variant: "secondary" as const,
      };
    }

    // Check for lifetime access
    const hasLifetimeAccess = lifetimeOrders.length > 0;
    if (hasLifetimeAccess) {
      return {
        disabled: true,
        text: "Current Plan",
        variant: "secondary" as const,
      };
    }

    return {
      disabled: false,
      text: "Upgrade to Lifetime",
      variant: "default" as const,
    };
  };

  /**
   * Check if user has lifetime access
   */
  const hasLifetimeAccess = () => {
    return lifetimeOrders.length > 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <CreditCard className="h-8 w-8" />
              Subscription Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your subscription and billing settings
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Current Plan Status */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                Current Plan
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your current subscription status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentTier === "free" && (
                    <Gift className="h-6 w-6 text-muted-foreground" />
                  )}
                  {currentTier === "lifetime" && (
                    <Crown className="h-6 w-6 text-primary" />
                  )}
                  <span
                    className={cn(
                      "text-lg font-medium",
                      currentTier === "lifetime"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {currentTier === "lifetime" ? "Lifetime Plan" : "Free Plan"}
                  </span>
                  {currentTier === "lifetime" && (
                    <Badge variant="secondary" className="bg-primary/10">
                      Active
                    </Badge>
                  )}
                </div>
                {hasLifetimeAccess() ? (
                  <Button
                    onClick={handleManageBilling}
                    disabled={portalLoading}
                  >
                    {portalLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Manage Billing
                  </Button>
                ) : (
                  <Button
                    onClick={handleLifetimePurchase}
                    disabled={checkoutLoading === "lifetime"}
                  >
                    {checkoutLoading === "lifetime" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Upgrade to Lifetime
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Available Plans
              </h2>
              <div className="grid md:grid-cols-1 gap-8">
                {subscriptionPlans.map((plan) => {
                  const buttonState = getButtonState(plan);
                  return (
                    <Card
                      key={plan.name}
                      className={cn(
                        "border-border bg-card",
                        plan.highlighted && "border-primary",
                      )}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                              {plan.icon}
                              {plan.name}
                            </h3>
                            <div className="mt-2">
                              <span className="text-4xl font-bold text-card-foreground">
                                {plan.price}
                              </span>
                              {plan.originalPrice && (
                                <span className="text-lg text-muted-foreground line-through ml-2">
                                  {plan.originalPrice}
                                </span>
                              )}
                              <span className="text-muted-foreground ml-1">
                                one-time
                              </span>
                            </div>
                          </div>
                          {plan.badge && (
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary"
                            >
                              {plan.badge}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-muted-foreground pt-2">
                          {plan.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-3">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start">
                              <Check className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                              <span className="text-card-foreground text-sm">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          onClick={handleLifetimePurchase}
                          disabled={buttonState.disabled}
                          className={cn(
                            "w-full font-semibold",
                            buttonState.variant === "default" &&
                              "bg-primary hover:bg-primary/90 text-primary-foreground",
                          )}
                          variant={buttonState.variant}
                        >
                          {buttonState.text}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Billing Support */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">
                Billing & Support
              </CardTitle>
              <CardDescription>
                Need help with your purchase or have questions?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {hasLifetimeAccess() && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-card-foreground">
                      Purchase History
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      View your purchase history and download receipts.
                    </p>
                    <Button
                      onClick={handleManageBilling}
                      disabled={portalLoading}
                      variant="outline"
                      className="gap-2 w-full md:w-auto"
                    >
                      {portalLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      Customer Portal
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium text-card-foreground">
                    Need Support?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Have questions about your purchase or need technical help?
                  </p>
                  <Button
                    variant="outline"
                    className="gap-2 w-full md:w-auto"
                    onClick={() =>
                      window.open("mailto:support@example.com", "_blank")
                    }
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <div className="text-center py-8 border-t border-border">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Lifetime access includes all current and future features.
              </p>
              <p className="text-sm text-muted-foreground">
                Questions? We&apos;re here to help. Contact our support team
                anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
