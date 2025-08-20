"use client";
import React from "react";
import { HeroParallax } from "./ui/hero-parallax";
import { HoverBorderGradient } from "./ui/hover-border-gradient";
import { IconSparkles, IconRocket, IconFlame } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const products = [
    {
      title: "Tweet Composer & Scheduler",
      link: "#",
      thumbnail:
        "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&h=600&fit=crop&crop=entropy&auto=format",
    },
    {
      title: "Twitter Analytics Dashboard",
      link: "#",
      thumbnail:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=entropy&auto=format",
    },
    {
      title: "Multi-Account Management",
      link: "#",
      thumbnail:
        "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=600&fit=crop&crop=entropy&auto=format",
    },
    {
      title: "Claude MCP Integration",
      link: "#",
      thumbnail:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&crop=entropy&auto=format",
    },
    {
      title: "Thread Creator",
      link: "#",
      thumbnail:
        "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=600&fit=crop&crop=entropy&auto=format",
    },
    {
      title: "Engagement Tracking",
      link: "#",
      thumbnail:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=entropy&auto=format",
    },
    {
      title: "Content Calendar",
      link: "#",
      thumbnail:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=entropy&auto=format",
    },
    {
      title: "AI-Powered Suggestions",
      link: "#",
      thumbnail:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop&crop=entropy&auto=format",
    },
    {
      title: "Tweet Performance Reports",
      link: "#",
      thumbnail:
        "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop&crop=entropy&auto=format",
    },
    {
      title: "Automated Posting",
      link: "#",
      thumbnail:
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop&crop=entropy&auto=format",
    },
  ];

  return (
    <section id="home" className="relative bg-background">
      <HeroParallax products={products}>
        <div className="relative z-10 w-full min-h-[90vh] mx-auto px-4 bg-white-100 rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-20 mx-auto p-4">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-7xl font-bold text-foreground leading-tight tracking-tighter">
              Master Twitter/X with{" "}
              <span
                className={cn(
                  "bg-gradient-to-b from-primary/80 to-primary",
                  "text-transparent bg-clip-text",
                )}
              >
                AI Power
              </span>
            </h1>
            <div className="">
              <p className="max-w-3xl mx-auto text-lg md:text-xl leading-relaxed">
                The ultimate Twitter/X management platform with <br />
                <span className="font-semibold text-foreground">
                  Claude MCP integration
                </span>
                ,{" "}
                <span className="font-semibold text-foreground">
                  smart scheduling
                </span>
                , and{" "}
                <span className="font-semibold text-foreground">
                  analytics tracking
                  <br />
                </span>
                Automate your social media presence with AI-powered insights and{" "}
                <span className="font-bold text-amber-500">
                  unlimited scheduling
                </span>{" "}
                <IconSparkles className="inline-block h-5 w-5 text-amber-500" />
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <HoverBorderGradient
                containerClassName="rounded-full"
                as="button"
                className="bg-primary text-primary-foreground flex items-center space-x-2 px-8 py-4 text-lg font-semibold hover:scale-105 transition-transform"
              >
                <IconRocket className="h-5 w-5" />
                <span>Start Managing Twitter/X</span>
              </HoverBorderGradient>
              <HoverBorderGradient
                containerClassName="rounded-full"
                as="button"
                className="bg-background text-foreground border-2 border-border flex items-center space-x-2 px-8 py-4 text-lg font-semibold hover:scale-105 transition-transform"
              >
                <IconSparkles className="h-5 w-5" />
                <span>Watch Demo</span>
              </HoverBorderGradient>
            </div>
            <div className="pt-8">
              <p className="text-sm text-primary font-medium flex items-center justify-center">
                <IconFlame className="h-5 w-5 text-red-500 mr-2" />
                Join thousands of creators automating their Twitter presence
              </p>
            </div>
          </div>
        </div>
      </HeroParallax>
    </section>
  );
}
