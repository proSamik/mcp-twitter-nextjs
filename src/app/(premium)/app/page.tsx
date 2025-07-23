"use client";

import { authClient } from "auth/client";
import { useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader } from "ui/card";
import { Button } from "ui/button";
import { Calendar, Users } from "lucide-react";
import { Skeleton } from "ui/skeleton";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ConnectedAccounts } from "@/components/twitter/connected-accounts";
import { MediaTweetComposer } from "@/components/twitter/media-composer/media-tweet-composer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { TweetList } from "@/components/twitter/tweet-list";

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
 * Dashboard content component that handles the data fetching
 */
function DashboardContent() {
  const { data: session } = authClient.useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle URL parameters (checkout success, Twitter connection results)
  useEffect(() => {
    const checkoutSuccess = searchParams.get("checkout_success");
    const checkoutId = searchParams.get("checkout_id");
    const twitterConnected = searchParams.get("twitter_connected");
    const twitterAccount = searchParams.get("account");
    const twitterError = searchParams.get("twitter_error");

    if (checkoutSuccess === "true" && checkoutId && session?.user) {
      // Show success message
      toast.success("🎉 Payment successful! Welcome to premium access!");

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout_success");
      url.searchParams.delete("checkout_id");
      url.searchParams.delete("customer_session_token");
      router.replace(url.pathname);
    }

    // Handle Twitter connection success
    if (twitterConnected === "true") {
      const accountName = twitterAccount
        ? decodeURIComponent(twitterAccount)
        : "account";
      toast.success(
        `🎉 Twitter account @${accountName} connected successfully!`,
      );

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("twitter_connected");
      url.searchParams.delete("account");
      router.replace(url.pathname);
    }

    // Handle Twitter connection errors
    if (twitterError) {
      const errorMessage = decodeURIComponent(twitterError);
      toast.error(`Twitter connection failed: ${errorMessage}`);

      // Show additional guidance for OAuth credential errors
      if (
        errorMessage.toLowerCase().includes("client") ||
        errorMessage.toLowerCase().includes("credential") ||
        errorMessage.toLowerCase().includes("unauthorized")
      ) {
        setTimeout(() => {
          toast.info(
            "💡 Check your OAuth credentials in Settings → OAuth Setup",
            {
              duration: 6000,
              action: {
                label: "Go to OAuth Setup",
                onClick: () => router.push("/oauth-user-setup"),
              },
            },
          );
        }, 2000);
      }

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("twitter_error");
      router.replace(url.pathname);
    }
  }, [searchParams, session, router]);

  /**
   * Returns a personalized welcome message
   */
  const getWelcomeMessage = () => {
    return "Welcome to your Twitter/X management dashboard! You have premium access to all features.";
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">{getWelcomeMessage()}</p>
      </div>

      {/* Twitter Management Dashboard */}
      <div className="space-y-6">
        {/* Desktop Layout */}
        <div className="hidden lg:flex gap-8">
          {/* Left Column - Management Cards */}
          <div className="flex flex-col gap-6 w-80">
            {/* Connected Accounts Card */}
            <ConnectedAccounts />

            {/* Social Calendar Card */}
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Social Calendar</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  View and manage your scheduled posts in calendar view
                </p>
                <Link href="/social-calendar">
                  <Button className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Open Calendar
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Communities Card */}
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Communities</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage your Twitter communities for targeted posting
                </p>
                <Link href="/communities">
                  <Button className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Communities
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tweet Composer */}
          <div className="flex-1 pl-4">
            <MediaTweetComposer userId={session?.user?.id} />
          </div>
        </div>

        {/* Mobile Layout with Tabs */}
        <div className="lg:hidden">
          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="communities">Communities</TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="mt-6">
              <ConnectedAccounts />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Social Calendar</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    View and manage your scheduled posts in calendar view
                  </p>
                  <Link href="/social-calendar">
                    <Button className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Open Calendar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communities" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Communities</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Manage your Twitter communities for targeted posting
                  </p>
                  <Link href="/communities">
                    <Button className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Communities
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Mobile Tweet Composer */}
          <div className="mt-6">
            <MediaTweetComposer userId={session?.user?.id} />
          </div>
        </div>

        {/* Tweet Management - Dynamic list with real data */}
        <TweetList userId={session?.user?.id || ""} />
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
