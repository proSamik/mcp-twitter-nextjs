"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

interface CreateApiKeyData {
  name: string;
  permissions: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyData, setNewKeyData] = useState<CreateApiKeyData>({
    name: "",
    permissions: {
      read: true,
      create: true,
      update: true,
      delete: false,
    },
  });
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/api-keys");
      if (!response.ok) throw new Error("Failed to fetch API keys");
      const data = await response.json();
      setApiKeys(data.apiKeys);
    } catch (_error) {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyData.name.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newKeyData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create API key");
      }

      const data = await response.json();

      // Show the key immediately
      setRevealedKey(data.apiKey.key);

      // Reset form and refresh list
      setNewKeyData({
        name: "",
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: false,
        },
      });
      setShowCreateForm(false);
      await fetchApiKeys();

      toast.success("API key created successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create API key",
      );
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revoke: true }),
      });

      if (!response.ok) throw new Error("Failed to revoke API key");

      await fetchApiKeys();
      toast.success("API key revoked successfully");
    } catch (_error) {
      toast.error("Failed to revoke API key");
    }
  };

  const updatePermissions = async (
    keyId: string,
    permissions: Partial<ApiKey["permissions"]>,
  ) => {
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });

      if (!response.ok) throw new Error("Failed to update permissions");

      await fetchApiKeys();
      toast.success("Permissions updated successfully");
    } catch (_error) {
      toast.error("Failed to update permissions");
    }
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
      toast.success("Copied to clipboard!");
    } catch (_error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (loading) {
    return <div className="p-4">Loading API keys...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-muted-foreground">
            Manage your MCP server API keys (maximum 5 keys)
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={apiKeys.length >= 5}
        >
          Create API Key
        </Button>
      </div>

      {/* Revealed Key Display */}
      {revealedKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">
              New API Key Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-green-700">
                Copy this key now - it won&apos;t be shown again!
              </p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-green-100 rounded font-mono text-sm break-all">
                  {revealedKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(revealedKey, "new")}
                >
                  {copiedKey === "new" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRevealedKey(null)}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="keyName">Name</Label>
              <Input
                id="keyName"
                value={newKeyData.name}
                onChange={(e) =>
                  setNewKeyData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., MCP Client Key"
              />
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              {Object.entries(newKeyData.permissions).map(
                ([permission, enabled]) => (
                  <div
                    key={permission}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="capitalize">{permission}</span>
                      <p className="text-sm text-muted-foreground">
                        {permission === "read" && "View tasks and planners"}
                        {permission === "create" &&
                          "Create new tasks and planners"}
                        {permission === "update" && "Modify existing tasks"}
                        {permission === "delete" &&
                          "Delete tasks (use with caution)"}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        setNewKeyData((prev) => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            [permission]: checked,
                          },
                        }))
                      }
                    />
                  </div>
                ),
              )}
            </div>

            <div className="flex space-x-2">
              <Button onClick={createApiKey} disabled={creating}>
                {creating ? "Creating..." : "Create Key"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{apiKey.name}</h3>
                    <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                      {apiKey.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Key: {apiKey.keyPrefix}***</p>
                    <p>
                      Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                    </p>
                    {apiKey.lastUsedAt && (
                      <p>
                        Last used:{" "}
                        {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {Object.entries(apiKey.permissions).map(
                      ([permission, enabled]) =>
                        enabled && (
                          <Badge
                            key={permission}
                            variant="outline"
                            className="text-xs"
                          >
                            {permission}
                          </Badge>
                        ),
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {apiKey.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeApiKey(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Permission toggles for active keys */}
              {apiKey.isActive && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(apiKey.permissions).map(
                      ([permission, enabled]) => (
                        <div
                          key={permission}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm capitalize">
                            {permission}
                          </span>
                          <Switch
                            checked={enabled}
                            onCheckedChange={(checked) =>
                              updatePermissions(apiKey.id, {
                                [permission]: checked,
                              })
                            }
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {apiKeys.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No API keys created yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
