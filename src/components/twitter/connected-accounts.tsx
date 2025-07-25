"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Button } from "ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { Badge } from "ui/badge";
import { Twitter, Plus, Trash2, ExternalLink, Settings } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TwitterAccount {
  id: string;
  twitterUserId: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export function ConnectedAccounts() {
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [hasOAuthCredentials, setHasOAuthCredentials] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAccounts();
    checkOAuthCredentials();
  }, []);

  const checkOAuthCredentials = async () => {
    try {
      const response = await fetch("/api/oauth/credentials");
      if (response.ok) {
        const data = await response.json();
        const twitterCredentials = data.credentials?.find(
          (cred: any) => cred.provider === "twitter",
        );
        setHasOAuthCredentials(!!twitterCredentials);
      }
    } catch (error) {
      console.error("Error checking OAuth credentials:", error);
      setHasOAuthCredentials(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/twitter/accounts");
      const data = await response.json();

      if (data.success) {
        setAccounts(data.accounts);
      } else {
        toast.error("Failed to fetch Twitter accounts");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to fetch Twitter accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAccount = async () => {
    // Always require OAuth credentials - no environment variable fallback
    if (!hasOAuthCredentials) {
      toast.error("Please set up your Twitter OAuth credentials first");
      router.push("/oauth-user-setup");
      return;
    }

    try {
      setConnecting(true);

      const response = await fetch("/api/auth/twitter/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Twitter OAuth
        window.location.href = data.authUrl;
      } else {
        toast.error(data.error || "Failed to initiate Twitter connection");
      }
    } catch (error) {
      console.error("Error connecting Twitter account:", error);
      toast.error("Failed to connect Twitter account");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to disconnect this Twitter account?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/twitter/accounts?accountId=${accountId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Twitter account disconnected successfully");
        fetchAccounts(); // Refresh the list
      } else {
        toast.error(data.error || "Failed to disconnect account");
      }
    } catch (error) {
      console.error("Error disconnecting account:", error);
      toast.error("Failed to disconnect account");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Twitter className="h-5 w-5 text-primary" />
            <CardTitle>Connected X Accounts</CardTitle>
          </div>
          <CardDescription>
            Manage your connected Twitter/X accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-md">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Twitter className="h-5 w-5 text-primary" />
            <CardTitle>Connected X Accounts</CardTitle>
          </div>
          <CardDescription>
            Manage your connected Twitter/X accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accounts.length === 0 ? (
              <div className="text-center py-8">
                <Twitter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  No accounts connected
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Connect your Twitter/X account to start managing tweets
                </p>
                <Button
                  onClick={handleConnectAccount}
                  disabled={connecting}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {connecting ? "Connecting..." : "Connect Twitter Account"}
                </Button>
              </div>
            ) : (
              <>
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={account.profileImageUrl}
                          alt={account.displayName}
                        />
                        <AvatarFallback>
                          {account.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{account.displayName}</p>
                          <Badge variant="secondary" className="text-xs">
                            @{account.username}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Connected on{" "}
                          {new Date(account.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://twitter.com/${account.username}`,
                            "_blank",
                          )
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnectAccount(account.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleConnectAccount}
                    disabled={connecting}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {connecting ? "Connecting..." : "Connect Another Account"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {!hasOAuthCredentials && (
        <Card className="border-destructive/50 bg-destructive/10 dark:bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-destructive-foreground mb-1">
                  OAuth Setup Required
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {accounts.length > 0
                    ? "Your existing accounts were connected with environment credentials and are now invalid. Please set up your own Twitter OAuth credentials to reconnect."
                    : "To connect Twitter accounts, you must provide your own Twitter OAuth credentials."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/oauth-user-setup")}
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Setup OAuth Credentials
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
