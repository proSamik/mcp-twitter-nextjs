"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { Sidebar, SidebarBody, SidebarLink } from "ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconCreditCard,
  IconCrown,
  IconGift,
  IconUsers,
  IconKey,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { authClient } from "auth/client";
import { useSidebar, useStoreActions } from "../../app/store";

type UserTier = "free" | "lifetime";

/**
 * App sidebar component with navigation links and user profile
 */
export function AppSidebar({
  children,
  onNavigate,
  userTier = "free",
}: {
  children: React.ReactNode;
  onNavigate: (
    page:
      | "dashboard"
      | "profile"
      | "settings"
      | "subscription"
      | "communities"
      | "oauth-setup",
  ) => void;
  userTier?: UserTier;
}) {
  const { data: session } = authClient.useSession();
  const { isCollapsed, toggle } = useSidebar();
  const { setUser } = useStoreActions();

  // Sync user data with store when session changes
  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.image || undefined,
      });
    }
  }, [session, setUser]);

  const user = session?.user;

  /**
   * Get tier-specific icon and color
   */
  const getTierIcon = () => {
    switch (userTier) {
      case "free":
        return <IconGift className="h-4 w-4 text-gray-500" />;
      case "lifetime":
        return <IconCrown className="h-4 w-4 text-yellow-500" />;
      default:
        return <IconGift className="h-4 w-4 text-gray-500" />;
    }
  };

  /**
   * Get tier display name
   */
  const getTierName = () => {
    switch (userTier) {
      case "free":
        return "Free";
      case "lifetime":
        return "Lifetime";
      default:
        return "Free";
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      // Redirect to home page after sign out
      window.location.href = "/";
    } catch (_error) {
      // Redirect anyway in case of error
      window.location.href = "/";
    }
  };

  /**
   * Handle subscription management by navigating to subscription page
   */
  const handleSubscriptionManagement = () => {
    onNavigate("subscription");
  };

  const links = [
    {
      label: "Dashboard",
      href: "/app",
      icon: (
        <div className="flex items-center gap-2">
          <IconBrandTabler className="h-5 w-5 shrink-0 text-sidebar-foreground" />
          {getTierIcon()}
        </div>
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-sidebar-foreground" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-sidebar-foreground" />
      ),
    },
    {
      label: "OAuth Setup",
      href: "/oauth-user-setup",
      icon: <IconKey className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
    },
    {
      label: "Communities",
      href: "/communities",
      icon: <IconUsers className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
    },
    {
      label:
        userTier === "lifetime" ? "Manage Purchase" : "Upgrade to Lifetime",
      href: "#",
      icon: (
        <IconCreditCard className="h-5 w-5 shrink-0 text-sidebar-foreground" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0 text-sidebar-foreground" />
      ),
    },
  ];

  return (
    <>
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col bg-background md:flex-row",
          "h-screen",
        )}
      >
        <Sidebar
          open={!isCollapsed}
          setOpen={(open) => {
            // If the new open state is different from current, toggle
            if (open !== !isCollapsed) {
              toggle();
            }
          }}
        >
          <SidebarBody className="justify-between gap-10 overflow-x-hidden overflow-y-auto">
            <div className="flex flex-1 flex-col ">
              {!isCollapsed ? <Logo /> : <LogoIcon />}

              {/* Tier Badge */}
              {!isCollapsed && (
                <div className="mt-4 px-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-border/50">
                    {getTierIcon()}
                    <span className="text-xs font-medium text-sidebar-foreground/70">
                      {getTierName()} Plan
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2">
                {links.map((link, idx) => {
                  const isLogout = link.label === "Logout";
                  const isSubscription =
                    link.label.includes("Manage Purchase") ||
                    link.label.includes("Upgrade");
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isLogout) {
                          handleSignOut();
                        } else if (isSubscription) {
                          handleSubscriptionManagement();
                        } else if (link.label === "OAuth Setup") {
                          onNavigate("oauth-setup");
                        } else {
                          const pageName = link.label
                            .toLowerCase()
                            .replace(/\s+/g, "-") as
                            | "dashboard"
                            | "profile"
                            | "settings"
                            | "subscription"
                            | "communities";
                          onNavigate(pageName);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <SidebarLink link={link} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              onClick={() => onNavigate("profile")}
              className="cursor-pointer"
            >
              <SidebarLink
                link={{
                  label: user?.name || "User",
                  href: "#",
                  icon: (
                    <Image
                      src={user?.image || "/pf.png"}
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                      width={28}
                      height={28}
                      alt="Avatar"
                    />
                  ),
                }}
              />
            </div>
          </SidebarBody>
        </Sidebar>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-sidebar-border bg-background p-2 md:p-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Logo component for expanded sidebar
 */
export const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-sidebar-foreground"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-sidebar-foreground" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-sidebar-foreground"
      >
        MCP Twitter
      </motion.span>
    </a>
  );
};

/**
 * Logo icon component for collapsed sidebar
 */
export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-sidebar-foreground"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-sidebar-foreground" />
    </a>
  );
};
