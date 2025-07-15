"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  IconTemplate,
  IconCapture,
  IconChartLine,
  IconArrowRight,
  IconChartBar,
  IconRocket,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: <IconTemplate className="h-10 w-10 text-primary" />,
      title: "Build Your Landing Page",
      description:
        "Pick a template, add thumbnail/video, write a quick description, and insert your lead magnet link.",
      features: [
        "Choose from 50+ templates",
        "Drag & drop builder",
        "Mobile-responsive",
        "Custom branding",
      ],
    },
    {
      number: "02",
      icon: <IconCapture className="h-10 w-10 text-primary" />,
      title: "Capture & Automate",
      description:
        "Embeds sign-up form. On submission, UsePlunk triggers a customizable email sequence—your resource is delivered in minutes.",
      features: [
        "Smart form embedding",
        "Instant email delivery",
        "Custom sequences",
        "A/B testing",
      ],
    },
    {
      number: "03",
      icon: <IconChartLine className="h-10 w-10 text-primary" />,
      title: "Track & Optimize",
      description:
        "View real-time reports: Visitors by platform, Signup count & opt-in rate, Top referrers",
      features: [
        "Real-time analytics",
        "Platform tracking",
        "Conversion rates",
        "ROI insights",
      ],
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-background/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold mb-6 text-foreground"
          >
            How It <span className="text-primary">Works</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            Get from zero to lead-generating machine in 3 simple steps
          </motion.p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-border z-0" />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-4 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <Card className="hover:shadow-lg transition-shadow duration-300 h-full border-border/80">
                  <CardHeader>
                    <div className="absolute -top-5 left-8 bg-primary text-primary-foreground text-2xl font-bold w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                      {step.number}
                    </div>
                    <div className="mb-4 mt-8 p-3 bg-primary/10 rounded-xl w-fit">
                      {step.icon}
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-center text-sm text-muted-foreground"
                        >
                          <div
                            className={cn(
                              "w-2 h-2 bg-primary rounded-full mr-3",
                            )}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-20">
                    <div className="bg-background rounded-full p-3 shadow-lg border-2 border-border">
                      <IconArrowRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 text-center"
        >
          <h3 className="text-3xl font-bold text-foreground mb-8 flex items-center justify-center">
            <IconChartBar className="h-8 w-8 mr-2" /> Your Analytics Dashboard
          </h3>

          <Card className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  2,847
                </div>
                <div className="text-muted-foreground">Total Visitors</div>
                <div className="text-sm text-green-500 mt-1">
                  ↗ +23% this week
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">487</div>
                <div className="text-muted-foreground">Email Signups</div>
                <div className="text-sm text-green-500 mt-1">
                  ↗ +17% conversion
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  YouTube
                </div>
                <div className="text-muted-foreground">Top Referrer</div>
                <div className="text-sm text-blue-500 mt-1">64% of traffic</div>
              </Card>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Button
            size="lg"
            className="px-12 py-6 text-xl font-bold hover:scale-105 transition-transform"
          >
            Start Your 5-Minute Setup <IconRocket className="h-5 w-5 ml-2" />
          </Button>
          <p className="text-muted-foreground mt-4">
            No credit card required • First 1,000 emails free
          </p>
        </motion.div>
      </div>
    </section>
  );
}
