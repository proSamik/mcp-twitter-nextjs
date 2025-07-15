"use client";
import React, { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const StickyScroll = ({
  content,
  contentClassName,
}: {
  content: {
    title: string;
    description: string;
    content?: React.ReactNode | any;
  }[];
  contentClassName?: string;
}) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const ref = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    container: ref,
    offset: ["start start", "end start"],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const cardsBreakpoints = content.map((_, index) => index / cardLength);

    let closestBreakpointIndex = 0;
    let minDistance = Math.abs(latest - cardsBreakpoints[0]);

    for (let i = 1; i < cardsBreakpoints.length; i++) {
      const distance = Math.abs(latest - cardsBreakpoints[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestBreakpointIndex = i;
      }
    }

    // Special handling for the last card
    if (latest > 0.75) {
      closestBreakpointIndex = cardLength - 1;
    }

    setActiveCard(closestBreakpointIndex);
  });

  const backgroundColors = ["white", "white", "white"];
  const linearGradients = [
    "linear-gradient(to bottom right, #3b82f6, #1d4ed8)",
    "linear-gradient(to bottom right, #eab308, #f59e0b)",
    "linear-gradient(to bottom right, #6b7280, #374151)",
  ];

  const [backgroundGradient, setBackgroundGradient] = useState(
    linearGradients[0],
  );

  useEffect(() => {
    setBackgroundGradient(linearGradients[activeCard % linearGradients.length]);
  }, [activeCard]);

  return (
    <motion.div
      animate={{
        backgroundColor: backgroundColors[activeCard % backgroundColors.length],
      }}
      className="h-[30rem] overflow-y-auto scrollbar-hide flex justify-center relative space-x-10 rounded-md p-10" // Added scrollbar-hide class to hide scrollbar
      ref={ref}
      style={{
        scrollbarWidth: "none", // For Firefox
        msOverflowStyle: "none", // For Internet Explorer and Edge
      }}
    >
      <div className="div relative flex items-start px-4">
        <div className="max-w-2xl">
          {content.map((item, index) => (
            <div key={item.title + index} className="mb-20">
              <motion.h2
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className="text-2xl font-bold text-black"
              >
                {item.title}
              </motion.h2>
              <motion.p
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className="text-kg text-gray-700 max-w-sm mt-10"
              >
                {item.description}
              </motion.p>
            </div>
          ))}
          <div className="h-48" />
        </div>
      </div>
      <div
        style={{ background: backgroundGradient }}
        className={cn(
          "hidden lg:block h-60 w-80 rounded-md bg-white sticky top-1 overflow-hidden",
          contentClassName,
        )}
      >
        {content[activeCard].content ?? null}
      </div>
    </motion.div>
  );
};
