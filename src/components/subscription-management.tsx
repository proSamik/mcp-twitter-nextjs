"use client";

import { useState, useEffect } from "react";
import {
  Check,
  X,
  CreditCard,
  Star,
  Calendar,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { authClient, enhancedAuthClient } from "auth/client";
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

interface SubscriptionPlan {
  name: string;
  price: string;
  originalPrice?: string;
  description: string;
  features: string[];
  planSlug: "monthly" | "yearly";
  icon: React.ReactNode;
  highlighted?: boolean;
  badge?: string;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    name: "Monthly",
    price: "$19",
    description: "Best for trying premium features",
    features: [
      "Polar.sh payment integration",
      "Advanced auth configurations",
      "Premium UI components",
      "Email templates & automation",
      "Priority support",
      "Commercial license",
    ],
    planSlug: "monthly",
    icon: <Star className="h-5 w-5" />,
  },
  {
    name: "Yearly",
    price: "$180",
    originalPrice: "$228",
    description: "Best value for ongoing projects",
    features: [
      "Everything in Monthly",
      "20% yearly discount",
      "Extended support",
      "Early access to new features",
      "Advanced documentation",
      "Priority bug fixes",
      "Team collaboration tools",
    ],
    planSlug: "yearly",
    icon: <Calendar className="h-5 w-5" />,
    highlighted: true,
    badge: "Best Value",
  },
];

type UserTier = "monthly" | "yearly";

interface SubscriptionManagementProps {
  currentTier: UserTier;
  onBack: () => void;
}

/**
 * Subscription management page component with plan changing and cancellation
 */
export function SubscriptionManagement({
  currentTier,
  onBack,
}: SubscriptionManagementProps) {
  const [customerState, setCustomerState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  /**
   * Fetch customer state and orders from Polar
   */
  const fetchCustomerData = async () => {
    setIsLoading(true);
    try {
      // Fetch customer state for active subscriptions
      const stateResponse = await authClient.customer.state();
      const stateData = (stateResponse as any)?.data;
      setCustomerState(stateData || null);
    } catch (_error: any) {
      // Handle case where customer doesn't exist yet
      setCustomerState(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  /**
   * Handle plan change via customer portal with automatic fallback
   */
  const handlePlanChange = async (planSlug: "monthly" | "yearly") => {
    setCheckoutLoading(planSlug);
    try {
      // Use enhanced customer portal with automatic fallback
      await enhancedAuthClient.customer.portal();
    } catch (error: any) {
      console.error("Portal error:", error);
      // Fallback to pricing page if both methods fail
      window.location.href = "/pricing";
    } finally {
      setCheckoutLoading(null);
    }
  };

  /**
   * Handle subscription management via customer portal with automatic fallback
   */
  const handleManageSubscription = async () => {
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
   * Get button state and text for each plan
   */
  const getButtonState = (plan: SubscriptionPlan) => {
    if (isLoading || checkoutLoading === plan.planSlug) {
      return {
        disabled: true,
        text: "Loading...",
        variant: "secondary" as const,
      };
    }

    // Get product IDs for comparison
    const MONTHLY_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID;
    const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_YEARLY_PRODUCT_ID;

    // Check active subscriptions
    const activeMonthlySubscription = customerState?.activeSubscriptions?.find(
      (sub: any) =>
        sub.status === "active" && sub.productId === MONTHLY_PRODUCT_ID,
    );
    const activeYearlySubscription = customerState?.activeSubscriptions?.find(
      (sub: any) =>
        sub.status === "active" && sub.productId === YEARLY_PRODUCT_ID,
    );

    if (plan.planSlug === "monthly") {
      if (activeMonthlySubscription) {
        return {
          disabled: true,
          text: "Current Plan",
          variant: "secondary" as const,
        };
      }
      if (activeYearlySubscription) {
        return {
          disabled: false,
          text: "Change Plan",
          variant: "outline" as const,
        };
      }
      return {
        disabled: false,
        text: "Change Plan",
        variant: "default" as const,
      };
    }

    if (plan.planSlug === "yearly") {
      if (activeYearlySubscription) {
        return {
          disabled: true,
          text: "Current Plan",
          variant: "secondary" as const,
        };
      }
      if (activeMonthlySubscription) {
        return {
          disabled: false,
          text: "Upgrade Plan",
          variant: "default" as const,
        };
      }
      return {
        disabled: false,
        text: "Change Plan",
        variant: "default" as const,
      };
    }

    return {
      disabled: false,
      text: "Select Plan",
      variant: "default" as const,
    };
  };

  /**
   * Check if user has any active subscription
   */
  const hasActiveSubscription = () => {
    return (
      customerState?.activeSubscriptions?.some(
        (sub: any) => sub.status === "active",
      ) || false
    );
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
              Manage your subscription, change plans, and billing settings
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
                  {currentTier === "monthly" && (
                    <Star className="h-6 w-6 text-primary" />
                  )}
                  {currentTier === "yearly" && (
                    <Calendar className="h-6 w-6 text-primary" />
                  )}
                  <div>
                    <p className="text-lg font-semibold text-card-foreground capitalize">
                      {currentTier} Plan
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentTier === "monthly" &&
                        "Monthly billing, cancel anytime"}
                      {currentTier === "yearly" &&
                        "Annual billing with 20% savings"}
                    </p>
                  </div>
                </div>

                {/* Manage Subscription Button */}
                {hasActiveSubscription() && (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    variant="outline"
                    className="gap-2"
                  >
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    Manage Billing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Available Plans
              </h2>
              <p className="text-muted-foreground">
                All plan changes are prorated and applied to your next billing
                cycle.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {subscriptionPlans.map((plan) => {
                const buttonState = getButtonState(plan);

                return (
                  <Card
                    key={plan.planSlug}
                    className={cn(
                      "border-border bg-card relative transition-all duration-200 hover:shadow-lg",
                      plan.highlighted && "ring-2 ring-primary shadow-lg",
                    )}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 py-1">
                          {plan.badge}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-primary p-2 bg-primary/10 rounded-lg">
                          {plan.icon}
                        </div>
                        <CardTitle className="text-card-foreground text-xl">
                          {plan.name}
                        </CardTitle>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          {plan.originalPrice && (
                            <span className="text-muted-foreground line-through text-lg">
                              {plan.originalPrice}
                            </span>
                          )}
                          <span className="text-3xl font-bold text-card-foreground">
                            {plan.price}
                          </span>
                          <span className="text-muted-foreground">
                            {plan.planSlug === "monthly" && "/month"}
                            {plan.planSlug === "yearly" && "/year"}
                          </span>
                        </div>
                        <CardDescription className="text-base">
                          {plan.description}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <span className="text-card-foreground">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handlePlanChange(plan.planSlug)}
                        disabled={buttonState.disabled}
                        variant={buttonState.variant}
                        className="w-full py-3 text-base font-semibold"
                        size="lg"
                      >
                        {checkoutLoading === plan.planSlug && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {buttonState.text}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Subscription Management */}
          {hasActiveSubscription() && (
            <div className="space-y-6">
              {/* Cancel Subscription Section */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <X className="h-5 w-5 text-destructive" />
                    Cancel Subscription
                  </CardTitle>
                  <CardDescription>
                    You can cancel your subscription at any time. You&apos;ll
                    continue to have access until the end of your billing
                    period.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    variant="destructive"
                    size="lg"
                    className="gap-2"
                  >
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Cancel Subscription
                  </Button>
                </CardContent>
              </Card>

              {/* Other Actions */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground">
                    Billing & Support
                  </CardTitle>
                  <CardDescription>
                    Manage your billing settings or get help
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-medium text-card-foreground">
                        Manage Billing
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Update payment methods, view invoices, or change billing
                        cycle.
                      </p>
                      <Button
                        onClick={handleManageSubscription}
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

                    <div className="space-y-2">
                      <h4 className="font-medium text-card-foreground">
                        Need Support?
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Have questions about your subscription or need help with
                        billing?
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
            </div>
          )}

          {/* Footer Note */}
          <div className="text-center py-8 border-t border-border">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                All plan changes are prorated automatically. You&apos;ll only
                pay the difference.
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
