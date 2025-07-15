import { Task, TaskQuadrant, TaskDifficulty } from "@/types/planner";

export interface ParsedTaskLine {
  task: Partial<Task>;
  isValid: boolean;
  errors: string[];
}

export interface TaskMarkdownDiff {
  added: string[];
  removed: string[];
  modified: { old: string; new: string }[];
}

// Parse a single markdown task line
export function parseTaskLine(
  line: string,
  quadrant: TaskQuadrant,
): ParsedTaskLine {
  const errors: string[] = [];

  // Basic checkbox format: - [ ] or - [x] Task Title
  const checkboxMatch = line.match(/^-\s*\[(\s*x?\s*)\]\s*(.*)$/);

  if (!checkboxMatch) {
    return {
      task: {},
      isValid: false,
      errors: ["Invalid task format. Use: - [ ] Task Title"],
    };
  }

  const [, isCompletedChar, content] = checkboxMatch;
  const isCompleted = isCompletedChar.trim() === "x";

  if (!content.trim()) {
    return {
      task: {},
      isValid: false,
      errors: ["Task title cannot be empty"],
    };
  }

  // Parse metadata from content (tags, difficulty, time)
  const task: Partial<Task> = {
    title: content.trim(),
    isCompleted,
    quadrant,
    tags: [],
  };

  // Extract difficulty #easy #medium #hard
  const difficultyMatch = content.match(/#(easy|medium|hard)\b/i);
  if (difficultyMatch) {
    task.difficulty = difficultyMatch[1].toLowerCase() as TaskDifficulty;
    task.title = (task.title || "")
      .replace(/#(easy|medium|hard)\b/gi, "")
      .trim();
  }

  // Extract time required @30min @1h @2hours
  const timeMatch = content.match(/@(\d+(?:min|h|hours?|m))\b/i);
  if (timeMatch) {
    task.timeRequired = timeMatch[1];
    task.title = (task.title || "")
      .replace(/@\d+(?:min|h|hours?|m)\b/gi, "")
      .trim();
  }

  // Extract time block [9-10 AM] [14:00-15:30]
  const timeBlockMatch = content.match(/\[([^\]]+)\]/);
  if (timeBlockMatch) {
    task.timeBlock = timeBlockMatch[1];
    task.title = (task.title || "").replace(/\[[^\]]+\]/g, "").trim();
  }

  // Extract tags (remaining # items that aren't difficulty)
  const tagMatches = (task.title || "").match(/#\w+/g);
  if (tagMatches) {
    task.tags = tagMatches.map((tag) => tag.substring(1));
    task.title = (task.title || "").replace(/#\w+/g, "").trim();
  }

  // Clean up extra spaces
  task.title = (task.title || "").replace(/\s+/g, " ").trim();

  if (!task.title) {
    errors.push("Task title cannot be empty after parsing metadata");
  }

  return {
    task,
    isValid: errors.length === 0,
    errors,
  };
}

// Convert task to markdown line
export function taskToMarkdown(task: Task): string {
  const checkbox = task.isCompleted ? "[x]" : "[ ]";
  let line = `- ${checkbox} ${task.title}`;

  if (task.difficulty) {
    line += ` #${task.difficulty}`;
  }

  if (task.timeRequired) {
    line += ` @${task.timeRequired}`;
  }

  if (task.timeBlock) {
    line += ` [${task.timeBlock}]`;
  }

  if (task.tags && task.tags.length > 0) {
    line += " " + task.tags.map((tag) => `#${tag}`).join(" ");
  }

  if (task.description) {
    line += `\n\`\`\`\n${task.description}\n\`\`\``;
  }

  return line;
}

// Parse multiple lines of markdown
export function parseMarkdownTasks(
  markdown: string,
  quadrant: TaskQuadrant,
): {
  tasks: Partial<Task>[];
  errors: { line: number; message: string }[];
} {
  const lines = markdown.split("\n");
  const tasks: Partial<Task>[] = [];
  const errors: { line: number; message: string }[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      i++;
      continue; // Skip empty lines
    }
    if (trimmedLine.startsWith("#")) {
      i++;
      continue; // Skip header lines
    }

    // Check if this is a task line
    if (trimmedLine.match(/^-\s*\[(\s*x?\s*)\]\s*(.*)$/)) {
      const parsed = parseTaskLine(trimmedLine, quadrant);

      // Check for description code block
      if (i + 1 < lines.length && lines[i + 1].trim() === "```") {
        // Found start of code block for description
        i += 2; // Skip the opening ```
        const descriptionLines: string[] = [];

        // Read until closing ```
        while (i < lines.length && lines[i].trim() !== "```") {
          descriptionLines.push(lines[i]);
          i++;
        }

        if (i < lines.length && lines[i].trim() === "```") {
          // Found closing ```, set description
          if (parsed.isValid && parsed.task) {
            parsed.task.description = descriptionLines.join("\n");
          }
          // i will be incremented at the end of the loop to skip the closing ```
        } else {
          // No closing ``` found
          errors.push({
            line: i + 1,
            message: "Unclosed code block for description",
          });
        }
      }

      if (parsed.isValid) {
        tasks.push({ ...parsed.task, priority: tasks.length });
      } else {
        parsed.errors.forEach((error) => {
          errors.push({ line: i + 1, message: error });
        });
      }
    } else if (trimmedLine === "```") {
      // Skip standalone code blocks that aren't part of task descriptions
      i++;
      while (i < lines.length && lines[i].trim() !== "```") {
        i++;
      }
    } else {
      errors.push({
        line: i + 1,
        message: "Invalid task format. Use: - [ ] Task Title",
      });
    }

    i++;
  }

  return { tasks, errors };
}

// Convert tasks to markdown
export function tasksToMarkdown(tasks: Task[]): string {
  return tasks
    .sort((a, b) => a.priority - b.priority)
    .map(taskToMarkdown)
    .join("\n");
}

// Calculate diff between two markdown strings
export function calculateMarkdownDiff(
  oldMarkdown: string,
  newMarkdown: string,
): TaskMarkdownDiff {
  const oldLines = oldMarkdown.split("\n").filter((line) => line.trim());
  const newLines = newMarkdown.split("\n").filter((line) => line.trim());

  const added: string[] = [];
  const removed: string[] = [];
  const modified: { old: string; new: string }[] = [];

  // Simple diff algorithm
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  // Find added lines
  newLines.forEach((line) => {
    if (!oldSet.has(line)) {
      added.push(line);
    }
  });

  // Find removed lines
  oldLines.forEach((line) => {
    if (!newSet.has(line)) {
      removed.push(line);
    }
  });

  // For simplicity, we'll treat modifications as removals + additions
  // A more sophisticated diff could detect line modifications

  return { added, removed, modified };
}

// Validate markdown format
export function validateMarkdown(markdown: string): {
  isValid: boolean;
  errors: string[];
} {
  const lines = markdown.split("\n").filter((line) => line.trim());
  const errors: string[] = [];

  if (lines.length === 0) {
    return { isValid: true, errors: [] }; // Empty is valid
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip header lines (lines starting with #)
    if (trimmedLine.startsWith("#")) {
      i++;
      continue;
    }

    // Handle code blocks for descriptions
    if (trimmedLine === "```") {
      i++; // Skip opening ```
      let foundClosing = false;

      // Read until closing ```
      while (i < lines.length) {
        if (lines[i].trim() === "```") {
          foundClosing = true;
          break;
        }
        i++;
      }

      if (!foundClosing) {
        errors.push(`Line ${i + 1}: Unclosed code block`);
      }

      i++; // Skip closing ``` or continue if not found
      continue;
    }

    const checkboxMatch = trimmedLine.match(/^-\s*\[(\s*x?\s*)\]\s*(.*)$/);
    if (!checkboxMatch) {
      // Allow any content inside code blocks
      if (i > 0 && lines.some((l, idx) => idx < i && l.trim() === "```")) {
        // We're potentially inside a code block, this is handled above
        i++;
        continue;
      }
      errors.push(`Line ${i + 1}: Invalid format. Use: - [ ] Task Title`);
    } else if (!checkboxMatch[2].trim()) {
      errors.push(`Line ${i + 1}: Task title cannot be empty`);
    }

    i++;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
