"use client";
import React from "react";
import { StickyScroll } from "../ui/sticky-scroll-reveal";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
  IconCash,
  IconMail,
  IconLockOpen,
  IconPalette,
  IconBolt,
  IconChartBar,
  IconRobot,
  IconWorld,
  IconRocket,
  IconLock,
} from "@tabler/icons-react";

export function FeaturesSection() {
  const content = [
    {
      title: "No Subscription Fees",
      description:
        "One-time payment, infinite uses. Stop bleeding money on monthly subscriptions that add up to thousands per year. Own your tools, own your growth. This is the future of creator economics - pay once, profit forever.",
      content: (
        <Card className="h-full w-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white rounded-lg">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">
              <IconCash className="h-16 w-16 mx-auto" />
            </div>
            <div className="text-2xl font-bold mb-2">$0/month</div>
            <div className="text-lg opacity-90">Forever</div>
          </div>
        </Card>
      ),
    },
    {
      title: "First 1,000 Emails Free",
      description:
        "Try before scaling up. Get your first 1,000 email sends completely free. No hidden costs, no surprise charges. Perfect for testing your funnels and proving ROI before you invest more. Most creators never even hit this limit in their first month.",
      content: (
        <Card className="h-full w-full bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center text-primary-foreground rounded-lg">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">
              <IconMail className="h-16 w-16 mx-auto" />
            </div>
            <div className="text-2xl font-bold mb-2">1,000 Emails</div>
            <div className="text-lg opacity-90">Completely Free</div>
          </div>
        </Card>
      ),
    },
    {
      title: "Zero Vendor Lock-in",
      description:
        "Export data, self-host email, switch providers anytime. Your audience belongs to YOU, not us. Download your subscriber list, email templates, and analytics data whenever you want. True ownership in the creator economy.",
      content: (
        <Card className="h-full w-full bg-gradient-to-br from-slate-800 to-gray-900 flex items-center justify-center text-white rounded-lg">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">
              <IconLockOpen className="h-16 w-16 mx-auto" />
            </div>
            <div className="text-2xl font-bold mb-2">Your Data</div>
            <div className="text-lg opacity-90">Your Control</div>
          </div>
        </Card>
      ),
    },
    {
      title: "Template Library",
      description:
        "Professional, mobile-ready pages that convert. 50+ battle-tested templates designed by conversion experts. From minimalist to bold, we've got styles that match your brand. All templates are mobile-first and load lightning fast.",
      content: (
        <Card className="h-full w-full bg-gradient-to-br from-gray-700 to-slate-800 flex items-center justify-center text-white rounded-lg">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">
              <IconPalette className="h-16 w-16 mx-auto" />
            </div>
            <div className="text-2xl font-bold mb-2">50+ Templates</div>
            <div className="text-lg opacity-90">Mobile-First Design</div>
          </div>
        </Card>
      ),
    },
    {
      title: "Easy Setup",
      description:
        "Start collecting leads in under 5 minutes. No coding required, no complex integrations. Pick a template, customize your copy, connect your email service, and you're live. Even your grandma could set this up (but she probably doesn't need lead magnets).",
      content: (
        <Card className="h-full w-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white rounded-lg">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">
              <IconBolt className="h-16 w-16 mx-auto" />
            </div>
            <div className="text-2xl font-bold mb-2">5 Minutes</div>
            <div className="text-lg opacity-90">From Zero to Live</div>
          </div>
        </Card>
      ),
    },
    {
      title: "Full Analytics Dashboard",
      description:
        "Pinpoint traffic sources & leak-funnels. Know exactly where your best subscribers come from. Track YouTube vs Instagram vs TikTok performance. Identify drop-off points and optimize for maximum conversion. Data-driven growth, not guesswork.",
      content: (
        <Card className="h-full w-full bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center text-primary-foreground rounded-lg">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">
              <IconChartBar className="h-16 w-16 mx-auto" />
            </div>
            <div className="text-2xl font-bold mb-2">Real-Time</div>
            <div className="text-lg opacity-90">Analytics</div>
          </div>
        </Card>
      ),
    },
    {
      title: "Custom Email Sequences",
      description:
        "Event-based and send-on-open flows. Create sophisticated email journeys that nurture leads automatically. Welcome sequences, product launches, re-engagement campaigns - all triggered by user behavior. Set it once, profit forever.",
      content: (
        <Card className="h-full w-full bg-gradient-to-br from-slate-800 to-gray-900 flex items-center justify-center text-white rounded-lg">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">
              <IconRobot className="h-16 w-16 mx-auto" />
            </div>
            <div className="text-2xl font-bold mb-2">Smart</div>
            <div className="text-lg opacity-90">Automation</div>
          </div>
        </Card>
      ),
    },
    {
      title: "Social Integration",
      description:
        "Automatically track YouTube, Instagram, X, Reddit, and more. See which platforms drive the most valuable subscribers. Optimize your content strategy based on real conversion data, not vanity metrics. Focus your energy where it actually pays off.",
      content: (
        <Card className="h-full w-full bg-gradient-to-br from-gray-700 to-slate-800 flex items-center justify-center text-white rounded-lg">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">
              <IconWorld className="h-16 w-16 mx-auto" />
            </div>
            <div className="text-2xl font-bold mb-2">Multi-Platform</div>
            <div className="text-lg opacity-90">Tracking</div>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 mb-16">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold mb-6 text-foreground"
          >
            Core <span className="text-primary">Features</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            Everything you need to turn visitors into subscribers, subscribers
            into customers
          </motion.p>
        </div>
      </div>

      <StickyScroll content={content} />

      <div className="max-w-7xl mx-auto px-4 mt-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center bg-muted/50 rounded-2xl p-12"
        >
          <h3 className="text-3xl font-bold text-foreground mb-4 flex items-center justify-center">
            Ready to own your growth? <IconRocket className="h-8 w-8 ml-2" />
          </h3>
          <p className="text-muted-foreground mb-8 text-lg">
            Stop renting your success. Start owning it.
          </p>
          <Button
            size="lg"
            className="px-10 py-6 text-xl font-bold hover:scale-105 transition-transform"
          >
            Start Your Free Trial
          </Button>
          <p className="text-muted-foreground mt-4 text-sm flex items-center justify-center gap-4">
            <span className="flex items-center gap-2">
              <IconBolt className="h-4 w-4" /> Setup in 5 minutes
            </span>
            <span className="flex items-center gap-2">
              <IconCash className="h-4 w-4" /> Starting at $3/month
            </span>
            <span className="flex items-center gap-2">
              <IconLock className="h-4 w-4" /> Own your data
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
