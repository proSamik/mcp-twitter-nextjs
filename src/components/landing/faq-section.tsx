"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "What's included in this Next.js starter kit?",
    answer:
      "Our starter kit includes complete authentication with Better Auth (email/password + social login), Polar.sh payment integration, PostgreSQL database with Drizzle ORM, responsive UI with Tailwind CSS, internationalization support, Docker deployment, and production-ready configuration.",
  },
  {
    question: "Do I need experience with these technologies to use it?",
    answer:
      "Basic Next.js knowledge is helpful, but the starter kit is designed to be developer-friendly with clear documentation. Each component is well-documented, and we provide setup guides for authentication, payments, and database configuration.",
  },
  {
    question: "How quickly can I get started?",
    answer:
      "You can have a fully functional application running in under 5 minutes. Clone the repo, install dependencies, set environment variables, and run the development server. Database migrations and initial setup are automated.",
  },
  {
    question: "Is this production-ready?",
    answer:
      "Absolutely! The starter kit follows Next.js best practices, includes security measures, environment configuration, Docker support, and is optimized for deployment on Vercel, Railway, or any hosting platform that supports Node.js.",
  },
  {
    question: "What payment features are included with Polar.sh?",
    answer:
      "The Polar.sh integration includes subscription billing, one-time payments, customer portal, webhook handling, payment success/failure flows, and support for multiple pricing tiers. Everything needed for a SaaS billing system.",
  },
  {
    question: "Can I customize the authentication system?",
    answer:
      "Yes! Better Auth is highly configurable. You can add more OAuth providers, customize the sign-up flow, add custom fields, implement role-based access, and modify the authentication UI to match your brand.",
  },
  {
    question: "What database and ORM features are included?",
    answer:
      "We use PostgreSQL with Drizzle ORM for type-safe database operations. The kit includes pre-built schemas for users, sessions, and payments, automatic migrations, connection pooling, and easy query building with full TypeScript support.",
  },
  {
    question: "How is the code organized and what's the license?",
    answer:
      "The code follows Next.js App Router conventions with clean separation of concerns. It's MIT licensed, so you can use it for commercial projects, modify it freely, and there are no ongoing licensing fees or restrictions.",
  },
];

export function FAQSection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-sm font-semibold text-primary mb-4 tracking-wider">
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Everything you need to know about our Next.js starter kit.
            Can&apos;t find what you&apos;re looking for?
            <a href="#" className="text-primary hover:underline ml-1">
              Contact our support team.
            </a>
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-border/80"
            >
              <AccordionTrigger className="text-lg text-left font-semibold text-foreground hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-20">
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground">
                Need help getting started?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Can&apos;t find the answer you&apos;re looking for? Check our
                documentation or reach out for technical support.
              </p>
              <Button size="lg">Get in Touch</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
