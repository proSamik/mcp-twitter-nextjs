"use client";

import { Check, Star } from "lucide-react";
import { authClient, enhancedAuthClient } from "auth/client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useStateWithBrowserStorage } from "@/hooks/use-state-with-browserstorage";

interface PricingTier {
  name: string;
  price: string;
  originalPrice?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
  planSlug?: "free" | "lifetime";
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "Free",
    description: "Perfect for getting started with basic features",
    features: [
      "5 lead magnet forms",
      "30-day analytics history",
      "1 project dashboard",
    ],
    cta: "Get started for free",
    planSlug: "free",
  },
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
    cta: "Get Lifetime Access",
    highlighted: true,
    badge: "75% OFF - Limited Time",
    planSlug: "lifetime",
  },
];

export function PricingSection() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const fetchInitiated = useRef(false);

  // Cache lifetime orders for 7 days
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const [lifetimeOrders, setLifetimeOrders] = useStateWithBrowserStorage<any[]>(
    `lifetime-orders-${session?.user?.id}`,
    [],
    sevenDaysInMs,
  );

  const [isLoadingState, setIsLoadingState] = useState(false);

  const fetchLifetimeOrders = async () => {
    if (!session?.user) {
      setIsLoadingState(false);
      return;
    }

    // Skip fetch if cache is already populated
    if (lifetimeOrders && lifetimeOrders.length > 0) {
      setIsLoadingState(false);
      return;
    }

    setIsLoadingState(true);
    try {
      // Fetch lifetime orders with automatic fallback
      const ordersResponse = await enhancedAuthClient.customer.orders.list({
        query: {
          page: 1,
          limit: 10,
          productBillingType: "one_time",
        },
      });

      // Check if the response from the enhanced client is valid.
      const ordersData =
        (ordersResponse as any)?.data?.result?.items ||
        (ordersResponse as any)?.data?.items;

      // If ordersData is undefined (not null or empty array), it means the call failed silently.
      if (ordersData === undefined) {
        console.warn(
          "Enhanced client did not return a valid data structure, triggering manual fallback.",
        );
        throw new Error(
          "Silent failure from enhanced client: Invalid data structure.",
        );
      }
      setLifetimeOrders(ordersData || []);
    } catch (error) {
      // This catch block will now be triggered by our manual throw
      // or by a genuine error from the authClient.
      console.warn(
        "Initiating direct fallback for orders due to error:",
        error,
      );
      try {
        const fallbackRes = await fetch(
          "/api/polar-fallback/orders?page=1&limit=10&productBillingType=one_time",
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (!fallbackRes.ok) {
          throw new Error(
            `Fallback API responded with status: ${fallbackRes.status}`,
          );
        }
        const fallbackJson = await fallbackRes.json();
        const fallbackOrders = fallbackJson?.data?.items || [];
        setLifetimeOrders(fallbackOrders);
      } catch (fallbackError) {
        console.error("Direct fallback for orders also failed:", fallbackError);
        setLifetimeOrders([]);
      }
    } finally {
      setIsLoadingState(false);
    }
  };

  // Fetch lifetime orders when user is authenticated
  useEffect(() => {
    if (session?.user && !fetchInitiated.current) {
      fetchInitiated.current = true;
      fetchLifetimeOrders();
    }
  }, [session]);

  // Refetch lifetime orders if coming back from successful checkout
  useEffect(() => {
    const checkoutSuccess = searchParams.get("checkout_success");
    if (checkoutSuccess === "true" && session?.user) {
      // Clear cache to force refetch after successful purchase
      const storageKey = `lifetime-orders-${session.user.id}`;
      localStorage.removeItem(`NEXTJS-STARTER-${storageKey}`);

      // Refetch after a delay to ensure Polar has processed the payment
      setTimeout(() => {
        fetchLifetimeOrders();
      }, 1000);
    }
  }, [searchParams, session]);

  const handleCheckout = async (planSlug: "free" | "lifetime") => {
    // Handle free plan - just redirect to dashboard
    if (planSlug === "free") {
      if (!session?.user) {
        window.location.href = "/sign-in";
        return;
      }
      window.location.href = "/app";
      return;
    }

    // Check if user is authenticated for paid plans
    if (!session?.user) {
      toast.error("Please sign in to purchase a plan");
      return;
    }

    try {
      setCheckoutLoading(planSlug);

      await authClient.checkout({
        products: [process.env.NEXT_PUBLIC_POLAR_LIFETIME_PRODUCT_ID || ""],
        slug: "lifetime",
      });
    } catch (error: any) {
      // Provide more specific error messages
      if (error?.message?.includes("ResourceNotFound")) {
        toast.error("Product not found. Please contact support.");
      } else if (error?.message?.includes("Unauthorized")) {
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
      if (tier.planSlug === "free") {
        return { disabled: false, text: "Get started for free" };
      }
      return { disabled: false, text: "Get Started" };
    }

    // Check for lifetime access
    const hasLifetimeAccess = lifetimeOrders.length > 0;

    if (hasLifetimeAccess && tier.planSlug === "lifetime") {
      return {
        disabled: false,
        text: "Go to App",
        action: () => (window.location.href = "/app"),
      };
    }

    if (hasLifetimeAccess && tier.planSlug === "free") {
      return { disabled: true, text: "You have Lifetime Access" };
    }

    // Free plan is always available for non-lifetime users
    if (tier.planSlug === "free") {
      return {
        disabled: false,
        text: session?.user ? "Go to App" : "Sign In to Start",
      };
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
            Complete Lead Generation Starter Kit
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Start with our free plan or get lifetime access to all premium
            features. Perfect for building powerful lead generation systems.
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
                } p-8 flex flex-col`}
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
                    {tier.name === "Lifetime" && (
                      <span className="text-muted-foreground ml-1">
                        {" "}
                        one-time
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{tier.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-card-foreground text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  {tier.planSlug ? (
                    <button
                      onClick={() => {
                        if (buttonState.action) {
                          buttonState.action();
                        } else if (!session?.user) {
                          window.location.href = "/sign-in";
                        } else {
                          handleCheckout(tier.planSlug!);
                        }
                      }}
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
                        if (tier.name === "Free") {
                          window.open(
                            "https://github.com/cgoinglove/nextjs-polar-starter-kit",
                            "_blank",
                          );
                        } else {
                          toast.info("Contact sales for enterprise pricing");
                        }
                      }}
                    >
                      {tier.cta}
                    </button>
                  )}
                  <p className="text-sm text-muted-foreground mt-3">
                    {tier.name === "Free"
                      ? "No credit card required"
                      : "One-time payment, lifetime access"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-20">
          <p className="text-lg text-muted-foreground mb-8">
            All plans include documentation, examples, and community support
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
              Lifetime updates
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
