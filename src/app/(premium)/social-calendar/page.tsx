"use client";

import { Suspense } from "react";
import { authClient } from "auth/client";
import { SocialCalendar } from "@/components/social-calendar";
import { Card, CardContent } from "ui/card";
import { Skeleton } from "ui/skeleton";

/**
 * Loading skeleton for social calendar
 */
function SocialCalendarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Social Calendar content component
 */
function SocialCalendarContent() {
  const { data: session } = authClient.useSession();

  if (!session?.user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Please sign in to view your social calendar.
        </p>
      </div>
    );
  }

  return <SocialCalendar userId={session.user.id} />;
}

/**
 * Main social calendar page component with suspense wrapper
 */
export default function SocialCalendarPage() {
  return (
    <Suspense fallback={<SocialCalendarSkeleton />}>
      <SocialCalendarContent />
    </Suspense>
  );
}
