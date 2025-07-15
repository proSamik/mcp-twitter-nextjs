"use client";

import { cn } from "@/lib/utils";
import {
  IconAdjustmentsBolt,
  IconCloud,
  IconCurrencyDollar,
  IconEaseInOut,
  IconHeart,
  IconHelp,
  IconRouteAltLeft,
  IconTerminal2,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function InteractiveDemoSection() {
  const features = [
    {
      title: "Complete Authentication",
      description:
        "Email/password login, social OAuth, account linking with Better Auth.",
      icon: <IconTerminal2 />,
    },
    {
      title: "Polar.sh Payments",
      description:
        "Subscription billing, one-time payments, customer portal integration.",
      icon: <IconCurrencyDollar />,
    },
    {
      title: "Type-Safe Database",
      description:
        "PostgreSQL with Drizzle ORM, automatic migrations, and type safety.",
      icon: <IconCloud />,
    },
    {
      title: "Modern UI Components",
      description: "Tailwind CSS, Radix UI primitives, dark/light themes.",
      icon: <IconEaseInOut />,
    },
    {
      title: "Production Ready",
      description:
        "Docker support, Vercel deployment, environment configuration.",
      icon: <IconRouteAltLeft />,
    },
    {
      title: "Developer Experience",
      description:
        "TypeScript, hot reload, linting, testing, and code quality tools.",
      icon: <IconHelp />,
    },
    {
      title: "Internationalization",
      description:
        "Multi-language support with next-intl, 7 languages included.",
      icon: <IconAdjustmentsBolt />,
    },
    {
      title: "Security & Best Practices",
      description:
        "HTTPS, secure cookies, input validation, and security headers.",
      icon: <IconHeart />,
    },
  ];

  return (
    <section id="demo" className="py-2 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Everything You Need Included
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Skip months of setup and start building your SaaS with our
            comprehensive Next.js starter kit. All the essential features are
            ready to go.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>

        <div className="text-center mt-20">
          <p className="text-lg text-gray-600 mb-8">
            Ready to build your next project?
          </p>
          <Link href="/app">
            <Button size="lg" className="mt-8">
              <span>Start Capturing Leads</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-neutral-200",
        (index === 0 || index === 4) && "lg:border-l border-neutral-200",
        index < 4 && "lg:border-b border-neutral-200",
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600">{icon}</div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
