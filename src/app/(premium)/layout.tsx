"use client";

import { redirect } from "next/navigation";
import { useEffect, useState, Suspense, useRef } from "react";
import { enhancedAuthClient } from "auth/client";
import { authClient } from "auth/client";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { Settings } from "@/components/settings";
import { Profile } from "@/components/profile";
import { SubscriptionManagement } from "@/components/subscription-management";
import { NotificationManager } from "@/components/notification-manager";

type UserTier = "free" | "lifetime";

/**
 * Loading skeleton for premium layout
 */
function PremiumLayoutSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

/**
 * Hook to manage user tier state
 */
function useUserTier() {
  const [userTier, setUserTier] = useState<UserTier>("free");
  const [lifetimeOrders, setLifetimeOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = authClient.useSession();
  const fetchInitiated = useRef(false);

  // Fetch lifetime orders and determine tier
  useEffect(() => {
    const fetchUserTier = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

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
          setLifetimeOrders(rawOrders); // Store the orders
          newLifetimeOrders = rawOrders;
        } catch (error) {
          // Silent fail - customer might not be configured yet
          console.log("Failed to fetch lifetime orders:", error);
        }

        // Determine user tier based on lifetime orders
        if (newLifetimeOrders.length > 0) {
          setUserTier("lifetime");
        } else {
          setUserTier("free");
        }
      } catch (_error) {
        setUserTier("free");
      } finally {
        setIsLoading(false);
      }
    };

    if (session && !fetchInitiated.current) {
      fetchInitiated.current = true;
      fetchUserTier();
    }
  }, [session]);

  return { userTier, lifetimeOrders, isLoading };
}

/**
 * Layout content component that handles async state
 */
function PremiumLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isAuthLoading } = authClient.useSession();
  const { userTier, lifetimeOrders, isLoading: isTierLoading } = useUserTier();
  const [currentPage, setCurrentPage] = useState<
    | "dashboard"
    | "profile"
    | "settings"
    | "subscription"
    | "api-keys"
    | "communities"
  >("dashboard");

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !session) {
      redirect("/sign-in");
    }
  }, [session, isAuthLoading]);

  const handleNavigation = (
    page:
      | "dashboard"
      | "profile"
      | "settings"
      | "subscription"
      | "api-keys"
      | "communities",
  ) => {
    setCurrentPage(page);
  };

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return children; // Render the original dashboard page
      case "profile":
        return <Profile />;
      case "settings":
        return <Settings />;
      case "subscription":
        return (
          <SubscriptionManagement
            currentTier={userTier}
            lifetimeOrders={lifetimeOrders}
            onBack={() => setCurrentPage("dashboard")}
          />
        );
      case "communities":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Communities</h1>
              <p className="text-muted-foreground">
                Manage your Twitter communities and participation.
              </p>
            </div>
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Communities management coming soon.
              </p>
            </div>
          </div>
        );
      default:
        return children;
    }
  };

  // Show loading while auth or tier is loading
  if (isAuthLoading || isTierLoading) {
    return <PremiumLayoutSkeleton />;
  }

  if (!session) {
    return null; // Handled by redirect
  }

  return (
    <>
      <NotificationManager />
      <AppSidebar onNavigate={handleNavigation} userTier={userTier}>
        {renderContent()}
      </AppSidebar>
    </>
  );
}

/**
 * Premium layout with sidebar navigation and dynamic content rendering
 */
export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<PremiumLayoutSkeleton />}>
      <PremiumLayoutContent>{children}</PremiumLayoutContent>
    </Suspense>
  );
}
