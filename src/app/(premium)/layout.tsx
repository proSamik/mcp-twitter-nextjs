"use client";

import { redirect } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { authClient } from "auth/client";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { Settings } from "@/components/settings";
import { Profile } from "@/components/profile";
import { SubscriptionManagement } from "@/components/subscription-management";
import { NotificationManager } from "@/components/notification-manager";

type UserTier = "free" | "monthly" | "yearly";

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
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = authClient.useSession();

  // Fetch customer state and determine tier
  useEffect(() => {
    const fetchCustomerState = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Step 1: First fetch customer state (gets updated immediately after payment)
        let newCustomerState: any = null;
        try {
          const stateResult = await authClient.customer.state();
          newCustomerState = stateResult?.data || null;
        } catch (_error) {
          // Silent fail - customer might not be configured yet
        }

        // Determine user tier
        const MONTHLY_PRODUCT_ID =
          process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID;
        const YEARLY_PRODUCT_ID =
          process.env.NEXT_PUBLIC_POLAR_YEARLY_PRODUCT_ID;

        const activeSubscription = newCustomerState?.activeSubscriptions?.find(
          (sub: any) => {
            return (
              sub.status === "active" &&
              (sub.productId === MONTHLY_PRODUCT_ID ||
                sub.productId === YEARLY_PRODUCT_ID)
            );
          },
        );

        if (activeSubscription) {
          const tier =
            activeSubscription.productId === MONTHLY_PRODUCT_ID
              ? "monthly"
              : "yearly";

          setUserTier(tier);
        } else {
          setUserTier("free");
        }
      } catch (_error) {
        setUserTier("free");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerState();
  }, [session]);

  return { userTier, isLoading };
}

/**
 * Layout content component that handles async state
 */
function PremiumLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isAuthLoading } = authClient.useSession();
  const { userTier, isLoading: isTierLoading } = useUserTier();
  const [currentPage, setCurrentPage] = useState<
    | "dashboard"
    | "profile"
    | "settings"
    | "subscription"
    | "communities"
    | "oauth-setup"
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
      | "communities"
      | "oauth-setup",
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
