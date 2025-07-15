"use client";
import React from "react";
import { motion } from "framer-motion";
import { LinkPreview } from "@/components/ui/link-preview";
import {
  IconCheck,
  IconX,
  IconCash,
  IconTool,
  IconTrendingUp,
  IconSettings,
  IconDeviceTv,
  IconPencil,
  IconPuzzle,
  IconFlame,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

export function ComparisonSection() {
  const features = [
    "One-time payment",
    "First 1,000 emails free",
    "Platform referral tracking",
    "Email automation built-in",
    "No vendor lock-in",
    "Real-time analytics",
    "Template library",
    "Social media integration",
  ];

  const competitors = [
    {
      name: "ConvertKit",
      url: "https://convertkit.com",
      features: [false, false, false, false, false, true, true, false],
      price: "$29/month",
    },
    {
      name: "Beehiiv",
      url: "https://www.beehiiv.com/",
      features: [false, false, false, true, false, true, true, false],
      price: "$39/month",
    },
    {
      name: "Mailchimp",
      url: "https://mailchimp.com",
      features: [false, false, false, true, false, true, false, false],
      price: "$20/month",
    },
  ];

  return (
    <section className="py-20 bg-background/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold mb-6 text-foreground"
          >
            Why We&apos;re <span className="text-primary">Different</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            Compare us with the &quot;big players&quot; and see why creators are
            making the switch
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-xl shadow-lg overflow-hidden border"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-foreground text-lg">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-primary-foreground text-lg bg-primary">
                    <div className="flex flex-col items-center">
                      <span>GrabLink</span>
                    </div>
                  </th>
                  {competitors.map((competitor, index) => (
                    <th
                      key={index}
                      className="px-6 py-4 text-center font-semibold text-muted-foreground text-lg text-primary "
                    >
                      <LinkPreview
                        url={competitor.url}
                        className="text-muted-foreground hover:text-primary"
                      >
                        {competitor.name}
                      </LinkPreview>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, featureIndex) => (
                  <tr key={featureIndex} className="border-t hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {feature}
                    </td>
                    <td className="px-6 py-4 text-center bg-primary/10">
                      <IconCheck className="h-6 w-6 text-primary mx-auto" />
                    </td>
                    {competitors.map((competitor, compIndex) => (
                      <td key={compIndex} className="px-6 py-4 text-center">
                        {competitor.features[featureIndex] ? (
                          <IconCheck className="h-6 w-6 text-primary mx-auto" />
                        ) : (
                          <IconX className="h-6 w-6 text-muted-foreground mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t-2 border-primary/50 bg-muted/50">
                  <td className="px-6 py-4 font-bold text-lg text-foreground">
                    Monthly Cost
                  </td>
                  <td className="px-6 py-4 text-center bg-primary/10">
                    <div className="text-2xl font-bold text-primary">$0</div>
                    <div className="text-sm text-primary/80">Forever</div>
                  </td>
                  {competitors.map((competitor, index) => (
                    <td key={index} className="px-6 py-4 text-center">
                      <div className="text-xl font-bold text-muted-foreground">
                        {competitor.price}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Every month
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {[
            {
              icon: <IconCash className="h-10 w-10" />,
              title: "No Monthly Surprise Fees",
              description: "You pay once and use forever.",
            },
            {
              icon: <IconTool className="h-10 w-10" />,
              title: "One Platform, One Flow",
              description: "No need for Zapier, no API headaches.",
            },
            {
              icon: <IconTrendingUp className="h-10 w-10" />,
              title: "More Insights, Better Strategy",
              description:
                "Referrer tracking tells you which platform performs.",
            },
            {
              icon: <IconSettings className="h-10 w-10" />,
              title: "Grow on Your Terms",
              description: "UsePlunk means your audience is always yours.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-4 mx-auto">{item.icon}</div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="mt-20 text-center bg-muted/50 p-8 md:p-12">
            <h3 className="text-3xl font-bold text-foreground mb-8">
              Perfect For
            </h3>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  emoji: <IconDeviceTv className="h-12 w-12 mx-auto" />,
                  title: "New YT/IG creators",
                  description: "building email lists",
                },
                {
                  emoji: <IconPencil className="h-12 w-12 mx-auto" />,
                  title: "Bloggers & course-makers",
                  description: "launching freebies",
                },
                {
                  emoji: <IconPuzzle className="h-12 w-12 mx-auto" />,
                  title: "Anyone tired of",
                  description: "juggling tools & fees",
                },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-6xl mb-4">{item.emoji}</div>
                  <h4 className="text-xl font-bold text-foreground mb-2">
                    {item.title}
                  </h4>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Button
                size="lg"
                className="px-12 py-6 text-xl hover:scale-105 transition-transform"
              >
                Join the Revolution
                <IconFlame className="h-5 w-5 ml-2" />
              </Button>
              <p className="text-muted-foreground mt-4">
                Stop paying monthly. Start owning your growth.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
