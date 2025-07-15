import { create } from "zustand";
import { persist } from "zustand/middleware";
import { devtools } from "zustand/middleware";

/**
 * User preferences interface
 */
export interface UserPreferences {
  theme: string;
  language: string;
  sidebarCollapsed: boolean;
  emailNotifications: boolean;
  marketingEmails: boolean;
}

/**
 * UI state interface for managing component states
 */
export interface UIState {
  isMobile: boolean;
  isLoading: boolean;
  modals: {
    settings: boolean;
    profile: boolean;
    subscription: boolean;
  };
  notifications: Array<{
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
    timestamp: number;
  }>;
}

/**
 * Main application state interface
 */
export interface AppState {
  // User data
  user: {
    id?: string;
    email?: string;
    name?: string;
    avatar?: string;
    subscription?: {
      status: "active" | "inactive" | "trial" | "canceled";
      plan: "lifetime";
      expiresAt?: string;
    };
  };

  // User preferences with defaults
  preferences: UserPreferences;

  // UI state
  ui: UIState;

  // Actions
  setUser: (user: Partial<AppState["user"]>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  toggleSidebar: () => void;
  setMobile: (isMobile: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  toggleModal: (modal: keyof UIState["modals"]) => void;
  addNotification: (
    notification: Omit<UIState["notifications"][0], "id" | "timestamp">,
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  resetState: () => void;
}

/**
 * Default preferences for new users
 */
const defaultPreferences: UserPreferences = {
  theme: "default",
  language: "en",
  sidebarCollapsed: false,
  emailNotifications: true,
  marketingEmails: false,
};

/**
 * Default UI state
 */
const defaultUIState: UIState = {
  isMobile: false,
  isLoading: false,
  modals: {
    settings: false,
    profile: false,
    subscription: false,
  },
  notifications: [],
};

/**
 * Generate unique storage key based on port to prevent localStorage collision between instances
 */
const getStorageKey = () => {
  if (typeof window !== "undefined") {
    const port = window.location.port || "3000";
    return `polar-saas-kit-store-mcp-${port}`;
  }
  return "polar-saas-kit-store-mcp-3000";
};

/**
 * Main Zustand store with persistence for user preferences
 */
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: {},
        preferences: defaultPreferences,
        ui: defaultUIState,

        // Actions
        setUser: (userData) => {
          set(
            (state) => ({
              user: { ...state.user, ...userData },
            }),
            false,
            "setUser",
          );
        },

        updatePreferences: (newPreferences) => {
          set(
            (state) => ({
              preferences: { ...state.preferences, ...newPreferences },
            }),
            false,
            "updatePreferences",
          );
        },

        toggleSidebar: () => {
          set(
            (state) => ({
              preferences: {
                ...state.preferences,
                sidebarCollapsed: !state.preferences.sidebarCollapsed,
              },
            }),
            false,
            "toggleSidebar",
          );
        },

        setMobile: (isMobile) => {
          set(
            (state) => ({
              ui: { ...state.ui, isMobile },
            }),
            false,
            "setMobile",
          );
        },

        setLoading: (isLoading) => {
          set(
            (state) => ({
              ui: { ...state.ui, isLoading },
            }),
            false,
            "setLoading",
          );
        },

        toggleModal: (modal) => {
          set(
            (state) => ({
              ui: {
                ...state.ui,
                modals: {
                  ...state.ui.modals,
                  [modal]: !state.ui.modals[modal],
                },
              },
            }),
            false,
            `toggleModal:${modal}`,
          );
        },

        addNotification: (notification) => {
          const id = Math.random().toString(36).substring(2);
          const timestamp = Date.now();

          set(
            (state) => ({
              ui: {
                ...state.ui,
                notifications: [
                  ...state.ui.notifications,
                  { ...notification, id, timestamp },
                ],
              },
            }),
            false,
            "addNotification",
          );

          // Auto-remove notification after 5 seconds
          setTimeout(() => {
            get().removeNotification(id);
          }, 5000);
        },

        removeNotification: (id) => {
          set(
            (state) => ({
              ui: {
                ...state.ui,
                notifications: state.ui.notifications.filter(
                  (n) => n.id !== id,
                ),
              },
            }),
            false,
            "removeNotification",
          );
        },

        clearNotifications: () => {
          set(
            (state) => ({
              ui: {
                ...state.ui,
                notifications: [],
              },
            }),
            false,
            "clearNotifications",
          );
        },

        resetState: () => {
          set(
            {
              user: {},
              preferences: defaultPreferences,
              ui: defaultUIState,
            },
            false,
            "resetState",
          );
        },
      }),
      {
        name: getStorageKey(),
        // Only persist user preferences, not UI state
        partialize: (state) => ({
          user: state.user,
          preferences: state.preferences,
        }),
        // Version for migration support
        version: 1,
      },
    ),
    {
      name: getStorageKey(),
    },
  ),
);

/**
 * Selector hooks for specific state slices
 */

/**
 * Hook to get user data
 */
export const useUser = () => useAppStore((state) => state.user);

/**
 * Hook to get user preferences
 */
export const usePreferences = () => useAppStore((state) => state.preferences);

/**
 * Hook to get UI state
 */
export const useUIState = () => useAppStore((state) => state.ui);

/**
 * Hook to get sidebar state
 */
export const useSidebar = () => {
  const isCollapsed = useAppStore(
    (state) => state.preferences.sidebarCollapsed,
  );
  const toggle = useAppStore((state) => state.toggleSidebar);

  return { isCollapsed, toggle };
};

/**
 * Hook to get theme preference
 */
export const useThemePreference = () => {
  const theme = useAppStore((state) => state.preferences.theme);
  const updatePreferences = useAppStore((state) => state.updatePreferences);

  const setTheme = (theme: string) => updatePreferences({ theme });

  return { theme, setTheme };
};

/**
 * Hook to get notifications
 */
export const useNotifications = () => {
  const notifications = useAppStore((state) => state.ui.notifications);
  const add = useAppStore((state) => state.addNotification);
  const remove = useAppStore((state) => state.removeNotification);
  const clear = useAppStore((state) => state.clearNotifications);

  return { notifications, add, remove, clear };
};

/**
 * Hook to get modal state
 */
export const useModals = () => {
  const modals = useAppStore((state) => state.ui.modals);
  const toggle = useAppStore((state) => state.toggleModal);

  return { modals, toggle };
};

/**
 * Hook to get loading state
 */
export const useLoading = () => {
  const isLoading = useAppStore((state) => state.ui.isLoading);
  const setLoading = useAppStore((state) => state.setLoading);

  return { isLoading, setLoading };
};

/**
 * Hook to get store actions
 */
export const useStoreActions = () => {
  const setUser = useAppStore((state) => state.setUser);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const setMobile = useAppStore((state) => state.setMobile);
  const resetState = useAppStore((state) => state.resetState);

  return { setUser, updatePreferences, setMobile, resetState };
};
