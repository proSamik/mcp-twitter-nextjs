"use client";

import { Check, Star } from "lucide-react";
import { authClient } from "auth/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface PricingTier {
  name: string;
  price: string;
  originalPrice?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
  planSlug?: "monthly" | "yearly";
}

const pricingTiers: PricingTier[] = [
  {
    name: "Monthly",
    price: "$3",
    description: "Best for trying premium features",
    features: [
      "Unlimited scheduling with video uploads",
      "Send unlimited tweets with your OAuth quota (max 17/day)",
      "Use it like n8n, only pay for scheduling and hosting",
      "No need to pay for Twitter API",
      "Use unlimited MCP Calls",
    ],
    cta: "Start Monthly Plan",
    planSlug: "monthly",
  },
  {
    name: "Yearly",
    price: "$30",
    originalPrice: "$36",
    description: "Best value for ongoing projects",
    features: [
      "Pay for 10 months only",
      "Unlimited scheduling with video uploads",
      "Send unlimited tweets with your OAuth quota (max 17/day)",
      "Use it like n8n, only pay for scheduling and hosting",
      "No need to pay for Twitter API",
      "Use unlimited MCP Calls",
    ],
    cta: "Get Yearly Plan",
    highlighted: true,
    badge: "Best Value",
    planSlug: "yearly",
  },
];

export function PricingSection() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [customerState, _setCustomerState] = useState<any>(null);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const fetchCustomerState = async () => {
    if (!session?.user) {
      setIsLoadingState(false);
      return;
    }

    setIsLoadingState(true);
    try {
      // Fetch customer state first
      await authClient.customer.state();
    } catch (error) {
      // This catch block will now be triggered by our manual throw
      // or by a genuine error from the authClient.
      console.warn(
        "Initiating direct fallback for orders due to error:",
        error,
      );
    } finally {
      setIsLoadingState(false);
    }
  };

  // Fetch customer state when user is authenticated
  useEffect(() => {
    if (session?.user) {
      fetchCustomerState();
    }
  }, [session]);

  // Refetch customer state if coming back from successful checkout
  useEffect(() => {
    const checkoutSuccess = searchParams.get("checkout_success");
    if (checkoutSuccess === "true" && session?.user) {
      // Refetch after a delay to ensure Polar has processed the payment
      setTimeout(() => {
        fetchCustomerState();
      }, 1000);
    }
  }, [searchParams, session]);

  const handleCheckout = async (planSlug: "monthly" | "yearly") => {
    // Check if user is authenticated for paid plans
    if (!session?.user) {
      toast.error("Please sign in to purchase a plan");
      return;
    }

    // Check if user already has an active subscription
    // Only check if we have customer state (customer exists in Polar)
    if (customerState) {
      // Get product IDs from environment
      const MONTHLY_PRODUCT_ID =
        process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID;
      const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_YEARLY_PRODUCT_ID;

      const hasActiveSubscription = customerState?.activeSubscriptions?.some(
        (sub: any) =>
          sub.status === "active" &&
          (sub.productId === MONTHLY_PRODUCT_ID ||
            sub.productId === YEARLY_PRODUCT_ID),
      );

      // Prevent downgrading or duplicate subscriptions
      if (
        hasActiveSubscription &&
        (planSlug === "monthly" || planSlug === "yearly")
      ) {
        return;
      }
    }

    try {
      setCheckoutLoading(planSlug);

      // Use checkout for new purchases
      await authClient.checkout({
        slug: planSlug,
      });
    } catch (error: any) {
      if (error?.message?.includes("Unauthorized")) {
        toast.error("Please sign in again and try checkout.");
      } else {
        toast.error("Failed to start checkout. Please try again.");
      }
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getButtonState = (tier: PricingTier) => {
    if (!tier.planSlug) return { disabled: false, text: tier.cta };

    if (sessionLoading || isLoadingState) {
      return { disabled: true, text: "Loading..." };
    }

    if (!session?.user) {
      return { disabled: false, text: "Sign In to Purchase" };
    }

    if (customerState) {
      // Get product IDs from environment
      const MONTHLY_PRODUCT_ID =
        process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID;
      const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_YEARLY_PRODUCT_ID;

      const hasActiveSubscription = customerState?.activeSubscriptions?.some(
        (sub: any) =>
          sub.status === "active" &&
          (sub.productId === MONTHLY_PRODUCT_ID ||
            sub.productId === YEARLY_PRODUCT_ID),
      );

      // Handle different subscription states
      if (hasActiveSubscription) {
        // Check which specific subscription is active
        const activeMonthlySubscription =
          customerState?.activeSubscriptions?.find(
            (sub: any) =>
              sub.status === "active" && sub.productId === MONTHLY_PRODUCT_ID,
          );
        const activeYearlySubscription =
          customerState?.activeSubscriptions?.find(
            (sub: any) =>
              sub.status === "active" && sub.productId === YEARLY_PRODUCT_ID,
          );

        // Show "Currently Active" only for the actual active subscription
        if (tier.planSlug === "monthly" && activeMonthlySubscription) {
          return { disabled: true, text: "Currently Active" };
        }
        if (tier.planSlug === "yearly" && activeYearlySubscription) {
          return { disabled: true, text: "Currently Active" };
        }

        // For non-active subscriptions, show change plan options
        if (tier.planSlug === "monthly" && activeYearlySubscription) {
          return { disabled: false, text: "Change Plan" };
        }
        if (tier.planSlug === "yearly" && activeMonthlySubscription) {
          return { disabled: false, text: "Upgrade to Yearly" };
        }
      }
    }

    if (checkoutLoading === tier.planSlug) {
      return { disabled: true, text: "Processing..." };
    }

    return { disabled: false, text: tier.cta };
  };

  return (
    <section className="py-2 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-12">
            <Star className="h-4 w-4 mr-2" />
            Complete Next.js Starter Kit
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Choose Your Development Package
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From open source basics to enterprise-ready features. Start building
            your SaaS application with the tools you need.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingTiers.map((tier, _index) => {
            const buttonState = getButtonState(tier);

            return (
              <div
                key={tier.name}
                className={`relative bg-card rounded-2xl shadow-sm border ${
                  tier.highlighted
                    ? "border-primary shadow-lg scale-105"
                    : "border-border"
                } p-8`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      {tier.badge}
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-card-foreground mb-2">
                    {tier.name}
                  </h3>
                  <div className="mb-4">
                    {tier.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through mr-2">
                        {tier.originalPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-card-foreground">
                      {tier.price}
                    </span>
                    {tier.name === "Monthly" && (
                      <span className="text-muted-foreground ml-1">/month</span>
                    )}
                    {tier.name === "Yearly" && (
                      <span className="text-muted-foreground ml-1">/year</span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{tier.description}</p>
                </div>

                <ul className="space-y-6 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-card-foreground text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  {tier.planSlug ? (
                    <button
                      onClick={() =>
                        !session?.user
                          ? (window.location.href = "/sign-in")
                          : handleCheckout(tier.planSlug!)
                      }
                      disabled={buttonState.disabled}
                      className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
                        buttonState.disabled
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : tier.highlighted
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      }`}
                    >
                      {buttonState.text}
                    </button>
                  ) : (
                    <button
                      className="w-full bg-foreground hover:bg-foreground/90 text-background font-semibold py-3 px-6 rounded-lg transition-colors"
                      onClick={() => {
                        toast.info("Contact sales for enterprise pricing");
                      }}
                    >
                      {tier.cta}
                    </button>
                  )}
                  <p className="text-sm text-muted-foreground mt-3">
                    {tier.name === "Monthly"
                      ? "Cancel anytime, no long-term commitment"
                      : "Annual billing, 20% savings"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-20">
          <p className="text-lg text-muted-foreground mb-8">
            All packages include documentation, examples, and community support
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="flex items-center text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary mr-2" />
              Complete source code
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary mr-2" />
              Production ready
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary mr-2" />
              Regular updates
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
