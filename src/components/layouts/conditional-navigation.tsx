"use client";

import { usePathname } from "next/navigation";
import { LandingNavigation } from "./landing-navigation";

export function ConditionalNavigation() {
  const pathname = usePathname();

  // Show landing navigation on public pages
  const publicRoutes = [
    "/",
    "/pricing",
    "/terms-of-service",
    "/privacy-policy",
  ];
  const shouldShowLandingNav = publicRoutes.includes(pathname);

  return shouldShowLandingNav ? <LandingNavigation /> : null;
}
