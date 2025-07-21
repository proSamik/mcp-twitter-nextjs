"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Key, Shield, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface TwitterOAuthCredentials {
  id: string;
  clientId: string;
  redirectUri: string;
  isActive: boolean;
  createdAt: string;
}

export default function OAuthUserSetupPage() {
  const [credentials, setCredentials] =
    useState<TwitterOAuthCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [_verifying, setVerifying] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    clientSecret: "",
    redirectUri: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const searchParams = useSearchParams();

  // Load existing credentials and handle error parameters on page load
  useEffect(() => {
    loadCredentials();

    // Check for error parameters from OAuth callback redirects
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setErrors([decodeURIComponent(errorParam)]);
      setSuccess(""); // Clear any success messages
      toast.error("OAuth connection failed");
    }
  }, [searchParams]);

  const loadCredentials = async () => {
    try {
      const response = await fetch("/api/oauth/credentials");
      if (response.ok) {
        const data = await response.json();
        const twitterCredentials = data.credentials?.find(
          (cred: any) => cred.provider === "twitter",
        );
        if (twitterCredentials) {
          setCredentials(twitterCredentials);
        }
      }
    } catch (error) {
      console.error("Error loading credentials:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setVerifying(true);
    setErrors([]);
    setSuccess("");

    try {
      const response = await fetch("/api/oauth/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: "twitter",
          clientId: formData.clientId,
          clientSecret: formData.clientSecret,
          redirectUri: appRedirectUri, // Always use the correct redirect URI
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || [data.error || "Failed to save credentials"]);
        return;
      }

      setCredentials(data.credentials);
      setSuccess(
        "Twitter OAuth credentials saved successfully! Connecting your Twitter account...",
      );
      setFormData({ clientId: "", clientSecret: "", redirectUri: "" });

      // Auto-initiate Twitter account connection to test credentials
      setTimeout(() => {
        initiateTwitterConnection();
      }, 1500); // Small delay to show success message
    } catch (_error) {
      setErrors(["Failed to save credentials. Please try again."]);
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (
      !credentials ||
      !confirm(
        "Are you sure you want to delete your Twitter OAuth credentials?",
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/oauth/credentials", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider: "twitter" }),
      });

      if (response.ok) {
        setCredentials(null);
        setSuccess("Twitter OAuth credentials deleted successfully!");
      } else {
        const data = await response.json();
        setErrors([data.error || "Failed to delete credentials"]);
      }
    } catch (_error) {
      setErrors(["Failed to delete credentials. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  // Generate the correct redirect URI for this app
  const appRedirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/twitter/callback`;

  const handleCopyRedirectUri = async () => {
    try {
      await navigator.clipboard.writeText(appRedirectUri);
      setCopied(true);
      toast.success("Redirect URI copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const initiateTwitterConnection = async () => {
    try {
      toast.info("Testing your OAuth credentials by connecting Twitter...");

      const response = await fetch("/api/auth/twitter/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Twitter OAuth - this will test the credentials
        window.location.href = data.authUrl;
      } else {
        setErrors([
          data.error ||
            "Failed to test credentials. Please check your OAuth settings.",
        ]);
        setSuccess(""); // Clear success message on error
      }
    } catch (_error) {
      setErrors([
        "Failed to test credentials. Please check your OAuth settings.",
      ]);
      setSuccess(""); // Clear success message on error
      toast.error("Failed to test OAuth credentials");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">OAuth Credentials Setup</h1>
        <p className="text-muted-foreground">
          Configure your own Twitter OAuth credentials for enhanced security and
          control.
        </p>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            How to Get Twitter OAuth Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">
                1
              </Badge>
              <div>
                <p className="font-medium">
                  Create a Twitter Developer Account
                </p>
                <p className="text-sm text-muted-foreground">
                  Visit{" "}
                  <a
                    href="https://developer.twitter.com/en/portal/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Twitter Developer Portal
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  and create a developer account if you don&apos;t have one.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">
                2
              </Badge>
              <div>
                <p className="font-medium">Create a New App</p>
                <p className="text-sm text-muted-foreground">
                  Click &quot;Create App&quot; and fill out the required
                  information about your application.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">
                3
              </Badge>
              <div>
                <p className="font-medium">Configure OAuth 2.0 Settings</p>
                <p className="text-sm text-muted-foreground">
                  In your app settings, enable OAuth 2.0 and set the redirect
                  URI to:
                </p>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <code className="text-sm break-all">{appRedirectUri}</code>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">
                4
              </Badge>
              <div>
                <p className="font-medium">Get Your Credentials</p>
                <p className="text-sm text-muted-foreground">
                  Copy your Client ID and Client Secret from the &quot;Keys and
                  Tokens&quot; tab.
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your Client Secret will be securely encrypted and stored in our
              database. After saving, we&apos;ll automatically test your
              credentials by initiating a Twitter connection.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Current Credentials Status */}
      {credentials && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Current Twitter OAuth Credentials
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={initiateTwitterConnection}
                  disabled={loading}
                >
                  Test Connection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Client ID
              </Label>
              <p className="font-mono text-sm">{credentials.clientId}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Redirect URI
              </Label>
              <p className="font-mono text-sm">{credentials.redirectUri}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Status
              </Label>
              <div>
                <Badge variant={credentials.isActive ? "default" : "secondary"}>
                  {credentials.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Created
              </Label>
              <p className="text-sm">
                {new Date(credentials.createdAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {credentials ? "Update" : "Add"} Twitter OAuth Credentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                type="text"
                value={formData.clientId}
                onChange={(e) =>
                  setFormData({ ...formData, clientId: e.target.value })
                }
                placeholder="Enter your Twitter OAuth Client ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={formData.clientSecret}
                onChange={(e) =>
                  setFormData({ ...formData, clientSecret: e.target.value })
                }
                placeholder="Enter your Twitter OAuth Client Secret"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="redirectUri">Redirect URI</Label>
              <div className="relative">
                <Input
                  id="redirectUri"
                  value={appRedirectUri}
                  readOnly
                  className="pr-12 font-mono text-sm bg-muted/50"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyRedirectUri}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Copy this URI and paste it exactly in your Twitter app settings.
                This cannot be changed as it must match your app&apos;s
                configuration.
              </p>
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? "Saving..."
                : credentials
                  ? "Update Credentials"
                  : "Save Credentials"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
