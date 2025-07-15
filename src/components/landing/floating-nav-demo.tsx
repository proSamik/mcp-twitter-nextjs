"use client";
import React from "react";
import { FloatingNav } from "../ui/floating-navbar";
import { IconHome, IconStar, IconRocket } from "@tabler/icons-react";

export function FloatingNavDemo() {
  const navItems = [
    {
      name: "Home",
      link: "/",
      icon: <IconHome className="h-4 w-4 text-gray-600" />,
    },
    {
      name: "Pricing",
      link: "/pricing",
      icon: <IconStar className="h-4 w-4 text-gray-600" />,
    },
    {
      name: "App",
      link: "/app",
      icon: <IconRocket className="h-4 w-4 text-gray-600" />,
    },
  ];

  return <FloatingNav navItems={navItems} />;
}
