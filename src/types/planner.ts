export type TaskQuadrant =
  | "urgent-important"
  | "urgent-not-important"
  | "not-urgent-important"
  | "not-urgent-not-important";

export type TaskDifficulty = "easy" | "medium" | "hard";

export type Task = {
  id: string;
  nanoId: string; // Short unique public ID for MCP
  title: string;
  description?: string;
  isCompleted: boolean;
  quadrant: TaskQuadrant;
  priority: number;
  timeRequired?: string;
  timeBlock?: string;
  difficulty?: TaskDifficulty;
  tags: string[];
  plannerId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Planner = {
  id: string;
  date: string;
  userId: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
};

export type ViewMode = "quadrant" | "list" | "text";

export type QuadrantConfig = {
  key: TaskQuadrant;
  title: string;
  subtitle: string;
  color: string;
};

export const QUADRANTS: QuadrantConfig[] = [
  {
    key: "urgent-important",
    title: "Do",
    subtitle: "Urgent & Important",
    color:
      "bg-background/60 backdrop-blur-xl border-red-200 shadow-lg shadow-red-100/20 dark:bg-background/60 dark:border-red-800 dark:shadow-red-900/10",
  },
  {
    key: "urgent-not-important",
    title: "Delegate",
    subtitle: "Urgent & Not Important",
    color:
      "bg-background/60 backdrop-blur-xl border-amber-200 shadow-lg shadow-amber-100/20 dark:bg-background/60 dark:border-amber-800 dark:shadow-amber-900/10",
  },
  {
    key: "not-urgent-important",
    title: "Schedule",
    subtitle: "Not Urgent & Important",
    color:
      "bg-background/60 backdrop-blur-xl border-blue-200 shadow-lg shadow-blue-100/20 dark:bg-background/60 dark:border-blue-800 dark:shadow-blue-900/10",
  },
  {
    key: "not-urgent-not-important",
    title: "Eliminate",
    subtitle: "Not Urgent & Not Important",
    color:
      "bg-background/60 backdrop-blur-xl border-slate-200 shadow-lg shadow-slate-100/20 dark:bg-background/60 dark:border-slate-800 dark:shadow-slate-900/10",
  },
];
