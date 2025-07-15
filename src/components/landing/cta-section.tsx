"use client";
import React from "react";
import { motion } from "framer-motion";
import { LampContainer } from "@/components/ui/lamp";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

export function CTASection() {
  return (
    <section className="bg-white">
      <LampContainer>
        <motion.div
          initial={{ opacity: 0.3, y: 150 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.6,
            ease: "easeInOut",
          }}
          className="mt-8 text-center"
        >
          <h1 className="bg-gradient-to-br from-gray-900 to-gray-600 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl">
            Start Collecting Leads <br /> For Free
          </h1>
          <p className="text-gray-600 text-xl mt-8 mb-8">
            One-time payment. First 1,000 triggered emails are entirely free.
          </p>
          <HoverBorderGradient
            containerClassName="rounded-full mx-auto"
            as="button"
            className="bg-black text-white border-black flex items-center space-x-2 px-12 py-4"
          >
            <span>Get Started - It&apos;s Free</span>
          </HoverBorderGradient>
        </motion.div>
      </LampContainer>
    </section>
  );
}
