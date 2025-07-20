"use client";

import React, { useState, useEffect } from "react";
import { Card } from "ui/card";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface UsageData {
  cap: {
    reset: string;
    reset_at: string;
  };
  project_usage: {
    daily: number;
    monthly: number;
  };
  usage: Array<{
    date: string;
    count: number;
  }>;
}

interface UsageDisplayProps {
  className?: string;
}

export function UsageDisplay({ className }: UsageDisplayProps) {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchUsageData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsageData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsageData = async () => {
    try {
      const response = await fetch("/api/twitter/usage");
      const data = await response.json();

      if (data.success) {
        setUsageData(data.usage);
        setLastUpdated(new Date());
      } else if (data.code === "USAGE_NOT_AVAILABLE") {
        // Usage not available for this API tier - this is normal
        console.warn("Usage data not available for this Twitter API tier");
        setUsageData(null);
      } else {
        console.error("Failed to fetch usage data:", data.error);
        setUsageData(null);
      }
    } catch (error) {
      console.error("Error fetching usage data:", error);
      setUsageData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchUsageData();
  };

  if (loading && !usageData) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">
              Loading usage data...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!usageData) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Usage analytics not available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This feature requires Twitter API Pro access
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const dailyUsage = usageData.project_usage?.daily || 0;
  const monthlyUsage = usageData.project_usage?.monthly || 0;
  const resetDate = usageData.cap?.reset_at
    ? new Date(usageData.cap.reset_at)
    : null;

  // Calculate usage percentages (assuming limits)
  const dailyLimit = 300; // Example daily limit
  const monthlyLimit = 10000; // Example monthly limit
  const dailyPercentage = Math.min((dailyUsage / dailyLimit) * 100, 100);
  const monthlyPercentage = Math.min((monthlyUsage / monthlyLimit) * 100, 100);

  // Prepare chart data
  const chartData =
    usageData.usage?.slice(-7).map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count: item.count,
    })) || [];

  const pieData = [
    { name: "Used Today", value: dailyUsage, color: "#3b82f6" },
    {
      name: "Remaining Today",
      value: Math.max(dailyLimit - dailyUsage, 0),
      color: "#e5e7eb",
    },
  ];

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90)
      return { color: "destructive", icon: AlertTriangle, text: "Critical" };
    if (percentage >= 70)
      return { color: "orange", icon: TrendingUp, text: "High" };
    return { color: "green", icon: CheckCircle, text: "Normal" };
  };

  const dailyStatus = getUsageStatus(dailyPercentage);
  const monthlyStatus = getUsageStatus(monthlyPercentage);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Twitter API Usage</h3>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Usage Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Usage */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Daily Usage</h4>
              <Badge
                variant={
                  dailyStatus.color === "destructive"
                    ? "destructive"
                    : "secondary"
                }
                className="flex items-center gap-1"
              >
                <dailyStatus.icon className="h-3 w-3" />
                {dailyStatus.text}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {dailyUsage.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {dailyLimit.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    dailyPercentage >= 90
                      ? "bg-destructive"
                      : dailyPercentage >= 70
                        ? "bg-orange-500"
                        : "bg-primary"
                  }`}
                  style={{ width: `${dailyPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {dailyPercentage.toFixed(1)}% of daily limit used
              </p>
            </div>
          </div>

          {/* Monthly Usage */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Monthly Usage</h4>
              <Badge
                variant={
                  monthlyStatus.color === "destructive"
                    ? "destructive"
                    : "secondary"
                }
                className="flex items-center gap-1"
              >
                <monthlyStatus.icon className="h-3 w-3" />
                {monthlyStatus.text}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {monthlyUsage.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {monthlyLimit.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    monthlyPercentage >= 90
                      ? "bg-destructive"
                      : monthlyPercentage >= 70
                        ? "bg-orange-500"
                        : "bg-primary"
                  }`}
                  style={{ width: `${monthlyPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {monthlyPercentage.toFixed(1)}% of monthly limit used
              </p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Usage Chart */}
          <div>
            <h4 className="font-medium mb-4">Last 7 Days</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Usage Pie Chart */}
          <div>
            <h4 className="font-medium mb-4">Today&apos;s Usage</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={450}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <span className="text-xs text-muted-foreground">Used</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-muted rounded-full" />
                <span className="text-xs text-muted-foreground">Remaining</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Information */}
        {resetDate && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Usage resets on {resetDate.toLocaleDateString()} at{" "}
              {resetDate.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
