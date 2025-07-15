"use client";

import React from "react";
import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Button } from "ui/button";
import { Switch } from "ui/switch";
import { Label } from "ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { Separator } from "ui/separator";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Palette,
  Globe,
} from "lucide-react";
import { BASE_THEMES } from "lib/const";
import { usePreferences, useStoreActions } from "../app/store";
import { toast } from "sonner";

/**
 * Settings component for app preferences and configuration
 */
export function Settings() {
  const { theme, setTheme } = useTheme();
  const preferences = usePreferences();
  const { updatePreferences } = useStoreActions();

  /**
   * Handle preference updates with toast notifications
   */
  const handlePreferenceChange = (key: string, value: any) => {
    updatePreferences({ [key]: value });
    toast.success(
      `${key.charAt(0).toUpperCase() + key.slice(1)} updated successfully`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your application preferences and configuration.
        </p>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Theme</Label>
              <div className="text-sm text-muted-foreground">
                Choose your preferred color theme
              </div>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASE_THEMES.map((baseTheme) => (
                  <React.Fragment key={baseTheme}>
                    <SelectItem value={baseTheme}>
                      {baseTheme.charAt(0).toUpperCase() +
                        baseTheme.slice(1).replace(/-/g, " ")}{" "}
                      (Light)
                    </SelectItem>
                    <SelectItem value={`${baseTheme}-dark`}>
                      {baseTheme.charAt(0).toUpperCase() +
                        baseTheme.slice(1).replace(/-/g, " ")}{" "}
                      (Dark)
                    </SelectItem>
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Sidebar Animation</Label>
              <div className="text-sm text-muted-foreground">
                Enable smooth animations for sidebar transitions
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Compact Mode</Label>
              <div className="text-sm text-muted-foreground">
                Reduce spacing and padding for a more compact layout
              </div>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Desktop Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Show notifications on your desktop
              </div>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) =>
                handlePreferenceChange("emailNotifications", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive notifications via email
              </div>
            </div>
            <Switch
              checked={preferences.marketingEmails}
              onCheckedChange={(checked) =>
                handlePreferenceChange("marketingEmails", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Sound Alerts</Label>
              <div className="text-sm text-muted-foreground">
                Play sound for important notifications
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
          <CardDescription>
            Set your language and regional preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Language</Label>
              <div className="text-sm text-muted-foreground">
                Choose your preferred language
              </div>
            </div>
            <Select
              value={preferences.language}
              onValueChange={(value) =>
                handlePreferenceChange("language", value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Timezone</Label>
              <div className="text-sm text-muted-foreground">
                Your local timezone for date and time display
              </div>
            </div>
            <Select defaultValue="auto">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="est">Eastern Time</SelectItem>
                <SelectItem value="pst">Pacific Time</SelectItem>
                <SelectItem value="gmt">Greenwich Mean Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Manage your privacy and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Analytics</Label>
              <div className="text-sm text-muted-foreground">
                Help improve the app by sharing anonymous usage data
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Auto-save Data</Label>
              <div className="text-sm text-muted-foreground">
                Automatically save your preferences and data
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Data Management</h4>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                Clear Cache
              </Button>
              <Button variant="destructive" size="sm">
                Reset Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button>Save All Settings</Button>
      </div>
    </div>
  );
}
