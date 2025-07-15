"use client";

import { enhancedAuthClient } from "auth/client";
import { authClient } from "auth/client";
import { useEffect, useState, Suspense, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Badge } from "ui/badge";
import { Crown, CreditCard, Calendar as CalendarIcon, MessageSquare, FileText } from "lucide-react";
import { Skeleton } from "ui/skeleton";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConnectedAccounts } from "@/components/twitter/connected-accounts";
import { TweetComposer } from "@/components/twitter/tweet-composer";
import { TweetList } from "@/components/twitter/tweet-list";

type Order = {
  id: string;
  amount: number;
  currency: string;
  productId: string;
  createdAt: string;
  status: string;
  product?: {
    id: string;
    name: string;
    description: string;
  };
};

type UserTier = "free" | "lifetime";

/**
 * Loading skeleton for dashboard content
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook to fetch lifetime orders and determine user tier
 */
function useCustomerState() {
  const [lifetimeOrders, setLifetimeOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userTier, setUserTier] = useState<UserTier>("free");
  const { data: session } = authClient.useSession();
  const fetchInitiated = useRef(false);

  const fetchLifetimeOrders = async () => {
    try {
      setIsLoading(true);

      // Fetch lifetime orders with automatic fallback
      let newLifetimeOrders: any[] = [];
      try {
        const ordersResult = await enhancedAuthClient.customer.orders.list({
          query: {
            page: 1,
            limit: 10,
            productBillingType: "one_time",
          },
        });

        const rawOrders = ordersResult?.data?.result?.items || [];
        if (rawOrders.length > 0) {
          // Map to our Order type structure
          const mappedOrders: Order[] = rawOrders.map((order: any) => ({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            productId: order.productId,
            createdAt: order.createdAt,
            status: order.status,
            product: order.product
              ? {
                  id: order.product.id,
                  name: order.product.name,
                  description: order.product.description,
                }
              : undefined,
          }));

          setLifetimeOrders(mappedOrders);
          newLifetimeOrders = rawOrders;
        } else {
          setLifetimeOrders([]);
        }
      } catch (_error) {
        setLifetimeOrders([]);
      }

      // Determine user tier based on lifetime orders
      if (newLifetimeOrders.length > 0) {
        setUserTier("lifetime");
      } else {
        setUserTier("free");
      }
    } catch (_error: any) {
      setLifetimeOrders([]);
      setUserTier("free");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch lifetime orders on mount and when session changes
  useEffect(() => {
    if (session?.user && !fetchInitiated.current) {
      fetchInitiated.current = true;
      fetchLifetimeOrders();
    }
  }, [session]);

  return {
    lifetimeOrders,
    isLoading,
    userTier,
    refetch: fetchLifetimeOrders,
  };
}

/**
 * Dashboard content component that handles the data fetching
 */
function DashboardContent() {
  const { isLoading, userTier, refetch } = useCustomerState();
  const { data: session } = authClient.useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle successful checkout
  useEffect(() => {
    const checkoutSuccess = searchParams.get("checkout_success");
    const checkoutId = searchParams.get("checkout_id");

    if (checkoutSuccess === "true" && checkoutId && session?.user) {
      // Show success message
      toast.success("🎉 Payment successful! Welcome to lifetime access!");

      // Refetch lifetime orders after a short delay to ensure Polar has processed the payment
      setTimeout(() => {
        refetch();
      }, 2000);

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout_success");
      url.searchParams.delete("checkout_id");
      url.searchParams.delete("customer_session_token");
      router.replace(url.pathname);
    }
  }, [searchParams, session, router, refetch]);

  /**
   * Determines the user's subscription tier
   */
  const getUserTier = (): UserTier => {
    return userTier;
  };

  /**
   * Returns a personalized welcome message based on user tier
   */
  const getWelcomeMessage = () => {
    const tier = getUserTier();
    const tierMessages = {
      free: "Welcome to your Twitter/X management dashboard! Upgrade to unlock unlimited features.",
      lifetime:
        "Welcome back, Lifetime Member! You have full access to Twitter/X management with AI features, forever.",
    };
    return tierMessages[tier];
  };

  /**
   * Returns tier-specific content and features
   */
  const getTierSpecificContent = () => {
    const tier = getUserTier();

    const tierContent = {
      free: {
        title: "Free Plan",
        icon: <CreditCard className="h-5 w-5 text-muted-foreground" />,
        badge: { text: "Free", variant: "secondary" as const },
        features: [
          { name: "Connected Accounts", enabled: true, limit: "1 account max" },
          { name: "Tweet Scheduling", enabled: true, limit: "10 tweets/month" },
          { name: "Tweet Drafts", enabled: true, limit: "Basic drafts" },
          { name: "Thread Creation", enabled: false, limit: "Not included" },
          { name: "Analytics Dashboard", enabled: true, limit: "Basic stats" },
          { name: "MCP Integration", enabled: false, limit: "Not included" },
          { name: "Bulk Operations", enabled: false, limit: "Not included" },
          { name: "Premium Features", enabled: false, limit: "Locked" },
        ],
        description:
          "Perfect for getting started with basic Twitter/X management.",
        upgradeMessage:
          "Upgrade to lifetime for unlimited tweets, analytics, and MCP integration!",
      },
      lifetime: {
        title: "Lifetime Access",
        icon: <Crown className="h-5 w-5 text-accent-foreground" />,
        badge: { text: "Lifetime", variant: "default" as const },
        features: [
          { name: "Connected Accounts", enabled: true, limit: "Unlimited" },
          {
            name: "Tweet Scheduling",
            enabled: true,
            limit: "Unlimited tweets",
          },
          { name: "Tweet Analytics", enabled: true, limit: "Full analytics" },
          { name: "Thread Creation", enabled: true, limit: "Unlimited" },
          { name: "MCP Integration", enabled: true, limit: "Claude AI access" },
          { name: "Bulk Operations", enabled: true, limit: "Mass scheduling" },
          { name: "Content Calendar", enabled: true, limit: "Full planning" },
          { name: "AI Optimization", enabled: true, limit: "Smart suggestions" },
          { name: "Priority Support", enabled: true, limit: "Dedicated line" },
          {
            name: "Lifetime Updates",
            enabled: true,
            limit: "Forever included",
          },
        ],
        description:
          "The ultimate Twitter/X management platform with unlimited everything, forever. Perfect for serious content creators.",
        upgradeMessage:
          "You have lifetime access to everything! Enjoy all premium features forever.",
      },
    };

    return tierContent[tier];
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const tierContent = getTierSpecificContent();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Badge
            variant={tierContent.badge.variant}
            className="flex items-center gap-1"
          >
            {tierContent.icon}
            {tierContent.badge.text}
          </Badge>
        </div>
        <p className="text-muted-foreground">{getWelcomeMessage()}</p>
      </div>

      {/* Twitter Management Dashboard */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Connected X Accounts */}
        <div className="col-span-full lg:col-span-1">
          <ConnectedAccounts />
        </div>

        {/* Tweet Composer & Scheduler */}
        <div className="col-span-full lg:col-span-2">
          <TweetComposer userId={session?.user?.id} />
        </div>

        {/* Tweet Management - Dynamic list with real data */}
        <div className="col-span-full">
          <TweetList userId={session?.user?.id || ""} />
        </div>
      </div>
    </div>
  );
}

/**
 * Main dashboard page component with suspense wrapper
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
