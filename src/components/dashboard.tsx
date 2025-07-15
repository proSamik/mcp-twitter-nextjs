"use client";

import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import {
  LayoutDashboard,
  Users,
  Activity,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { useUser, useLoading, useNotifications } from "../app/store";

/**
 * Dashboard component with overview statistics and recent activity
 */
export function Dashboard() {
  const user = useUser();
  const { isLoading, setLoading } = useLoading();
  const { add: addNotification } = useNotifications();

  /**
   * Simulate data loading
   */
  const handleRefresh = async () => {
    setLoading(true);
    addNotification({
      type: "info",
      message: "Refreshing dashboard data...",
    });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setLoading(false);
    addNotification({
      type: "success",
      message: "Dashboard data refreshed successfully",
    });
  };

  /**
   * Load initial data
   */
  useEffect(() => {
    if (user.id && user.name) {
      addNotification({
        type: "info",
        message: `Welcome back, ${user.name}!`,
      });
    }
  }, [user.id, user.name, addNotification]);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8" />
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            {user.name ? `Welcome back, ${user.name}!` : "Welcome back!"}{" "}
            Here&apos;s what&apos;s happening with your account.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,394</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              +8.2% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,947</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 text-red-600" />
              -2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Events This Month
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              +23.4% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest events and updates from your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "User signed up",
                  user: "john.doe@example.com",
                  time: "2 minutes ago",
                  type: "success",
                },
                {
                  action: "Payment processed",
                  user: "jane.smith@example.com",
                  time: "5 minutes ago",
                  type: "info",
                },
                {
                  action: "Profile updated",
                  user: "mike.johnson@example.com",
                  time: "12 minutes ago",
                  type: "default",
                },
                {
                  action: "Login failed",
                  user: "suspicious.user@example.com",
                  time: "15 minutes ago",
                  type: "warning",
                },
                {
                  action: "New subscription",
                  user: "sarah.wilson@example.com",
                  time: "1 hour ago",
                  type: "success",
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.user}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        activity.type === "success"
                          ? "default"
                          : activity.type === "warning"
                            ? "destructive"
                            : activity.type === "info"
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {activity.type}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <h4 className="font-medium">Create New User</h4>
                <p className="text-sm text-muted-foreground">
                  Add a new user to your organization
                </p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <h4 className="font-medium">Generate Report</h4>
                <p className="text-sm text-muted-foreground">
                  Create analytics and usage reports
                </p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <h4 className="font-medium">System Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Configure system preferences
                </p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <h4 className="font-medium">View Analytics</h4>
                <p className="text-sm text-muted-foreground">
                  Deep dive into usage statistics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>
            System usage and performance metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 rounded-lg bg-muted/50 flex items-center justify-center">
            <div className="text-center space-y-2">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Chart placeholder</p>
              <p className="text-sm text-muted-foreground">
                Analytics charts would be displayed here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
