# Zustand Store Usage Guide - Polar SaaS Kit

This guide explains how to use the Zustand store implementation in the Polar SaaS Kit for state management.

## Overview

The Polar SaaS Kit uses **Zustand 5.0.5** for lightweight, type-safe state management. The store is located at `src/app/store.ts` and provides:

- **User Data Management** - User info, preferences, subscription status
- **UI State Management** - Loading states, modal states, notifications
- **Persistent Storage** - User preferences automatically saved to localStorage
- **Type Safety** - Fully typed with TypeScript interfaces
- **Development Tools** - Redux DevTools integration for debugging

## Store Structure

### Main Interfaces

```typescript
// User preferences (persisted to localStorage)
interface UserPreferences {
  theme: string;
  language: string;
  sidebarCollapsed: boolean;
  emailNotifications: boolean;
  marketingEmails: boolean;
}

// UI state (not persisted)
interface UIState {
  isMobile: boolean;
  isLoading: boolean;
  modals: {
    settings: boolean;
    profile: boolean;
    subscription: boolean;
  };
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
}

// Main app state
interface AppState {
  user: {
    id?: string;
    email?: string;
    name?: string;
    avatar?: string;
    subscription?: {
      status: 'active' | 'inactive' | 'trial' | 'canceled';
      plan: 'monthly' | 'yearly' | 'lifetime';
      expiresAt?: string;
    };
  };
  preferences: UserPreferences;
  ui: UIState;
  // ... actions
}
```

## Available Hooks

### User Data Hooks

```typescript
// Get user data
const user = useUser();
console.log(user.name, user.email, user.subscription);

// Get user preferences
const preferences = usePreferences();
console.log(preferences.theme, preferences.language);

// Update user data and preferences
const { setUser, updatePreferences } = useStoreActions();
setUser({ name: 'John Doe', email: 'john@example.com' });
updatePreferences({ theme: 'dark', language: 'en' });
```

### UI State Hooks

```typescript
// Loading state management
const { isLoading, setLoading } = useLoading();
setLoading(true); // Show loading spinner
setLoading(false); // Hide loading spinner

// Sidebar state management
const { isCollapsed, toggle } = useSidebar();
toggle(); // Toggle sidebar open/closed

// Mobile detection (auto-synced with screen size)
const { setMobile } = useStoreActions();
// This is automatically handled by useMobileStore hook
```

### Modal Management

```typescript
const { modals, toggle } = useModals();

// Open/close modals
toggle('settings'); // Toggle settings modal
toggle('profile');  // Toggle profile modal
toggle('subscription'); // Toggle subscription modal

// Check modal state
if (modals.settings) {
  console.log('Settings modal is open');
}
```

### Notification System

```typescript
const { notifications, add, remove, clear } = useNotifications();

// Add notifications (auto-displayed as toasts)
add({ type: 'success', message: 'Profile updated successfully!' });
add({ type: 'error', message: 'Failed to save changes' });
add({ type: 'warning', message: 'Session will expire soon' });
add({ type: 'info', message: 'Welcome back!' });

// Remove specific notification
remove(notificationId);

// Clear all notifications
clear();

// Access all notifications
notifications.forEach(notification => {
  console.log(notification.message, notification.type);
});
```

### Theme Management

```typescript
const { theme, setTheme } = useThemePreference();

// Change theme
setTheme('cyberpunk-neon-dark');
setTheme('default');
setTheme('tropical-paradise');

// Current theme
console.log(theme); // e.g., 'default'
```

## Usage Examples

### 1. Component with Loading State

```typescript
"use client";

import { useLoading, useNotifications } from "../app/store";

export function MyComponent() {
  const { isLoading, setLoading } = useLoading();
  const { add } = useNotifications();

  const handleAction = async () => {
    setLoading(true);
    add({ type: 'info', message: 'Processing request...' });

    try {
      await someApiCall();
      add({ type: 'success', message: 'Action completed successfully!' });
    } catch (error) {
      add({ type: 'error', message: 'Action failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleAction} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Click Me'}
    </button>
  );
}
```

### 2. User Profile Update

```typescript
"use client";

import { useUser, useStoreActions } from "../app/store";
import { useToastNotifications } from "../components/notification-manager";

export function ProfileForm() {
  const user = useUser();
  const { setUser } = useStoreActions();
  const toast = useToastNotifications();

  const handleSave = (formData: { name: string; email: string }) => {
    // Update store
    setUser({
      name: formData.name,
      email: formData.email,
    });

    // Show success notification
    toast.success('Profile updated successfully!');
  };

  return (
    <form onSubmit={handleSave}>
      <input defaultValue={user.name} name="name" />
      <input defaultValue={user.email} name="email" />
      <button type="submit">Save</button>
    </form>
  );
}
```

### 3. Theme Selector Component

```typescript
"use client";

import { useThemePreference } from "../app/store";
import { BASE_THEMES } from "lib/const";

export function ThemeSelector() {
  const { theme, setTheme } = useThemePreference();

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      {BASE_THEMES.map((baseTheme) => (
        <option key={baseTheme} value={baseTheme}>
          {baseTheme.charAt(0).toUpperCase() + baseTheme.slice(1)}
        </option>
      ))}
    </select>
  );
}
```

### 4. Modal Management

```typescript
"use client";

import { useModals } from "../app/store";

export function MyComponent() {
  const { modals, toggle } = useModals();

  return (
    <div>
      <button onClick={() => toggle('settings')}>
        Open Settings
      </button>
      
      {modals.settings && (
        <div className="modal">
          <h2>Settings</h2>
          <button onClick={() => toggle('settings')}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
```

### 5. Mobile-Responsive Component

```typescript
"use client";

import { useUIState } from "../app/store";
import { useMobileStore } from "../hooks/use-mobile-store";

export function ResponsiveComponent() {
  // This hook automatically updates the store with mobile state
  useMobileStore();
  
  const { isMobile } = useUIState();

  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </div>
  );
}
```

## Persistence

### What Gets Persisted
- **User Data** - `user` object (id, email, name, avatar, subscription)
- **User Preferences** - `preferences` object (theme, language, sidebar state, notifications)

### What Doesn't Get Persisted
- **UI State** - Loading states, modal states, mobile detection
- **Notifications** - Cleared on page refresh

### Storage Key
The store uses `polar-saas-kit-store` as the localStorage key.

## Best Practices

### 1. Use Specific Selector Hooks
```typescript
// ✅ Good - Only re-renders when user data changes
const user = useUser();

// ❌ Avoid - Re-renders on any store change
const { user } = useAppStore();
```

### 2. Batch State Updates
```typescript
// ✅ Good - Single update
const { setUser } = useStoreActions();
setUser({
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://example.com/avatar.jpg'
});

// ❌ Avoid - Multiple updates
setUser({ name: 'John Doe' });
setUser({ email: 'john@example.com' });
setUser({ avatar: 'https://example.com/avatar.jpg' });
```

### 3. Use Toast Notifications Hook
```typescript
// ✅ Good - Uses store notifications
import { useToastNotifications } from "../components/notification-manager";
const toast = useToastNotifications();
toast.success('Success!');

// ❌ Avoid - Direct toast usage (bypasses store)
import { toast } from "sonner";
toast.success('Success!');
```

### 4. Reset State on Logout
```typescript
const { resetState } = useStoreActions();

const handleLogout = async () => {
  await authClient.signOut();
  resetState(); // Clear all user data
};
```

## Debugging

### Redux DevTools
The store is configured with Redux DevTools. Open your browser's DevTools and look for the "Redux" tab to:
- Inspect current state
- Track action history
- Time-travel debug

### Action Names
All actions have descriptive names for easy debugging:
- `setUser`
- `updatePreferences`
- `toggleSidebar`
- `addNotification`
- `toggleModal:settings`

## Integration with Components

### NotificationManager
Place in your root layout to handle all store notifications:

```typescript
// src/app/(premium)/layout.tsx
import { NotificationManager } from "@/components/notification-manager";

export default function Layout({ children }) {
  return (
    <>
      <NotificationManager />
      {children}
    </>
  );
}
```

### Mobile Detection
Use the mobile store hook in your root layout:

```typescript
// src/app/layout.tsx
import { useMobileStore } from "@/hooks/use-mobile-store";

export default function RootLayout({ children }) {
  useMobileStore(); // Automatically syncs mobile state
  
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

This comprehensive guide covers all aspects of using the Zustand store in the Polar SaaS Kit. The store provides a clean, type-safe, and performant way to manage application state across components. 