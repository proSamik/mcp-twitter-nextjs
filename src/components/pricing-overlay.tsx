"use client";

import { Check, Star, X } from "lucide-react";
import { authClient } from "auth/client";
import { useState } from "react";
import { toast } from "sonner";

interface PricingTier {
  name: string;
  price: string;
  originalPrice?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
  planSlug: "monthly" | "yearly";
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

export function PricingOverlay() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [isLoadingState] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (planSlug: "monthly" | "yearly") => {
    // Check if user is authenticated for paid plans
    if (!session?.user) {
      toast.error("Please sign in to purchase a plan");
      return;
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

    if (checkoutLoading === tier.planSlug) {
      return { disabled: true, text: "Processing..." };
    }

    return { disabled: false, text: tier.cta };
  };

  const handleClose = () => {
    // Redirect to home page when closing the overlay
    window.location.href = "/";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-background border-b p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Star className="h-4 w-4 mr-2" />
                Premium Access Required
              </div>
              {session?.user && (
                <button
                  onClick={async () => {
                    try {
                      await authClient.signOut();
                      window.location.href = "/";
                    } catch (_error) {
                      window.location.href = "/";
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Upgrade to Continue
            </h2>
            <p className="text-muted-foreground">
              Choose a plan to access premium features
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pricing cards */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {pricingTiers.map((tier) => {
              const buttonState = getButtonState(tier);

              return (
                <div
                  key={tier.name}
                  className={`relative bg-card rounded-2xl shadow-sm border ${
                    tier.highlighted
                      ? "border-primary shadow-lg scale-105"
                      : "border-border"
                  } p-6`}
                >
                  {tier.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                        {tier.badge}
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">
                      {tier.name}
                    </h3>
                    <div className="mb-4">
                      {tier.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through mr-2">
                          {tier.originalPrice}
                        </span>
                      )}
                      <span className="text-3xl font-bold text-card-foreground">
                        {tier.price}
                      </span>
                      {tier.name === "Monthly" && (
                        <span className="text-muted-foreground ml-1">
                          /month
                        </span>
                      )}
                      {tier.name === "Yearly" && (
                        <span className="text-muted-foreground ml-1">
                          /year
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {tier.description}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-4 w-4 text-primary mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-card-foreground text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="text-center">
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
                    <p className="text-xs text-muted-foreground mt-2">
                      {tier.name === "Monthly"
                        ? "Cancel anytime, no long-term commitment"
                        : "Annual billing, 20% savings"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom info */}
          <div className="text-center mt-8 border-t pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              All plans include documentation, examples, and community support
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary mr-2" />
                Complete source code
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary mr-2" />
                Production ready
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-primary mr-2" />
                Regular updates
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
