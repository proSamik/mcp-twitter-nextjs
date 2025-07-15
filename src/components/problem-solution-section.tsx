"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  IconTarget,
  IconMail,
  IconTool,
  IconCheck,
  IconMail as IconMailOpen,
  IconLink,
  IconChartBar,
} from "@tabler/icons-react";

export function ProblemSolutionSection() {
  const problems = [
    {
      icon: <IconTarget className="h-8 w-8 text-red-500" />,
      title: "Platform Dependency Risk",
      description:
        "Relying on rented platforms for audience runs the risk you'll lose them overnight.",
    },
    {
      icon: <IconMail className="h-8 w-8 text-red-500" />,
      title: "Hidden Monthly Costs",
      description:
        "Most email tools hide costs—hidden monthly plans hit creators hard.",
    },
    {
      icon: <IconTool className="h-8 w-8 text-red-500" />,
      title: "Tool Overload",
      description: "Too many tools means clunky workflows and time lost.",
    },
  ];

  const solutions = [
    {
      icon: <IconCheck className="h-8 w-8 text-green-500" />,
      title: "One‑time purchase",
      description: "lifetime access",
      highlight: true,
    },
    {
      icon: <IconMailOpen className="h-8 w-8 text-blue-500" />,
      title: "First 1,000 emails are free",
      description: "seamless scale after",
      highlight: true,
    },
    {
      icon: <IconLink className="h-8 w-8 text-purple-500" />,
      title: "Plug-and-play integration",
      description: "with UsePlunk—no lock‑in",
      highlight: false,
    },
    {
      icon: <IconChartBar className="h-8 w-8 text-cyan-500" />,
      title: "Full‑funnel analytics",
      description:
        "Track referrers (YouTube, Instagram, X, Reddit), sign‑ups, drop‑off rates",
      highlight: false,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-red-500">Problems</span> →{" "}
            <span className="text-blue-600">Solutions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We&apos;ve identified the pain points that creators face and built
            the perfect solution
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Problems */}
          <div className="space-y-8">
            <h3 className="text-3xl font-bold text-red-500 mb-8 text-center lg:text-left">
              😤 Pain Points
            </h3>
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex items-start space-x-4 p-6 bg-red-50 rounded-2xl border border-red-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex-shrink-0 p-3 bg-red-100 rounded-full">
                  {problem.icon}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    {problem.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Solutions */}
          <div className="space-y-8">
            <h3 className="text-3xl font-bold text-green-500 mb-8 text-center lg:text-left">
              ✅ Our Solution
            </h3>
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className={`flex items-start space-x-4 p-6 rounded-2xl border transition-all hover:scale-105 ${
                  solution.highlight
                    ? "bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-lg"
                    : "bg-white border-gray-200 hover:shadow-lg"
                }`}
              >
                <div className="flex-shrink-0 p-3 bg-white rounded-full shadow-md">
                  {solution.icon}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    {solution.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {solution.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mt-16 p-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to ditch the monthly fees? 🚀
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of creators who&apos;ve made the switch to ownership
            over rental
          </p>
          <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-transform shadow-lg">
            Start Building Your Audience
          </button>
        </motion.div>
      </div>
    </section>
  );
}
