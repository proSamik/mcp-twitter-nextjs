"use client";

import { authClient } from "auth/client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { User, Mail, Calendar, Save, Edit3 } from "lucide-react";
import { useUser, useStoreActions } from "../app/store";
import { useToastNotifications } from "../components/notification-manager";

/**
 * Profile component for managing user account information
 */
export function Profile() {
  const { data: session } = authClient.useSession();
  const storeUser = useUser();
  const { setUser } = useStoreActions();
  const toastNotifications = useToastNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: storeUser?.name || session?.user?.name || "",
    email: storeUser?.email || session?.user?.email || "",
  });

  // Sync form data when user data changes
  useEffect(() => {
    setFormData({
      name: storeUser?.name || session?.user?.name || "",
      email: storeUser?.email || session?.user?.email || "",
    });
  }, [storeUser, session]);

  const user = session?.user;

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toastNotifications.error("Name is required");
      return;
    }

    setIsLoading(true);
    try {
      // Update the store with new user data
      setUser({
        name: formData.name,
        email: formData.email,
      });

      toastNotifications.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toastNotifications.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Loading profile information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences.
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and personal information
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={storeUser?.avatar || user?.image || "/pf.png"}
                alt={storeUser?.name || user?.name || ""}
                className="object-cover"
              />
              <AvatarFallback className="text-lg">
                {(storeUser?.name || user?.name)?.slice(0, 1) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-medium">
                {storeUser?.name || user?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {storeUser?.email || user?.email}
              </p>
              {user?.createdAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter your display name"
                />
              ) : (
                <div className="px-3 py-2 border border-border rounded-md bg-muted/50">
                  {user.name || "Not set"}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <div className="px-3 py-2 border border-border rounded-md bg-muted/50">
                {user.email}
                <span className="text-xs text-muted-foreground ml-2">
                  (Cannot be changed)
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Account ID</Label>
              <div className="px-3 py-2 border border-border rounded-md bg-muted/50 font-mono text-sm">
                {user.id}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>
            Manage your account security and authentication methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Password</h3>
              <p className="text-sm text-muted-foreground">
                Change your password to keep your account secure
              </p>
            </div>
            <Button variant="outline" disabled>
              Change Password
              <span className="text-xs text-muted-foreground ml-2">
                (Coming Soon)
              </span>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" disabled>
              Enable 2FA
              <span className="text-xs text-muted-foreground ml-2">
                (Coming Soon)
              </span>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Connected Accounts</h3>
              <p className="text-sm text-muted-foreground">
                Manage your social login connections
              </p>
            </div>
            <Button variant="outline" disabled>
              Manage
              <span className="text-xs text-muted-foreground ml-2">
                (Coming Soon)
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
            <div>
              <h3 className="font-medium text-red-600 dark:text-red-400">
                Delete Account
              </h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" disabled>
              Delete Account
              <span className="text-xs text-red-300 ml-2">
                (Contact Support)
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
