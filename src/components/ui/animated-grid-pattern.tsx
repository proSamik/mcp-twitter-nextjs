"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedGridPatternProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: number;
  numSquares?: number;
  className?: string;
  maxOpacity?: number;
  duration?: number;
  repeatDelay?: number;
}

/**
 * AnimatedGridPattern component creates an animated grid background pattern
 * @param width - Width of the pattern squares (default: 40)
 * @param height - Height of the pattern squares (default: 40)
 * @param x - X offset of the pattern (default: -1)
 * @param y - Y offset of the pattern (default: -1)
 * @param strokeDasharray - Stroke dash array of the pattern (default: 0)
 * @param numSquares - Number of squares in the pattern (default: 200)
 * @param className - Additional CSS classes
 * @param maxOpacity - Maximum opacity of the pattern (default: 0.5)
 * @param duration - Duration of the animation (default: 1)
 * @param repeatDelay - Repeat delay of the animation (default: 0.5)
 */
export function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 200,
  className,
  maxOpacity = 0.5,
  duration = 1,
  repeatDelay = 0.5,
  ...props
}: AnimatedGridPatternProps) {
  const id = useId();
  const containerRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [squares, setSquares] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);

  // Update container dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Generate random squares when dimensions change
  useEffect(() => {
    if (dimensions.width && dimensions.height) {
      const newSquares = Array.from({ length: numSquares }, (_, i) => ({
        id: i,
        x: Math.floor(Math.random() * (dimensions.width / width)),
        y: Math.floor(Math.random() * (dimensions.height / height)),
      }));
      setSquares(newSquares);
    }
  }, [dimensions, numSquares, width, height]);

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id={`${id}-pattern`}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5,${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeWidth={1}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-pattern)`} />
      {squares.map(({ id: squareId, x: squareX, y: squareY }) => (
        <rect
          key={squareId}
          width={width}
          height={height}
          x={squareX * width}
          y={squareY * height}
          fill="currentColor"
          strokeWidth={0}
        >
          <animate
            attributeName="opacity"
            values={`0;${maxOpacity};0`}
            dur={`${duration}s`}
            repeatCount="indefinite"
            begin={`${squareId * (repeatDelay / numSquares)}s`}
          />
        </rect>
      ))}
    </svg>
  );
}
