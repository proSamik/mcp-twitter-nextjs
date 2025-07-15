export interface LoggerType {
  tag: string;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export default {
  tag: "nextjs-starter-kit",
  warn: (...args: any[]) => {
    console.warn(`[nextjs-starter-kit]`, ...args);
  },
  error: (...args: any[]) => {
    console.error(`[nextjs-starter-kit]`, ...args);
  },
} as LoggerType;
