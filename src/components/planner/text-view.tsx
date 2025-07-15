"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Edit, Save, Check, AlertCircle } from "lucide-react";
import { Task, TaskQuadrant, QUADRANTS } from "@/types/planner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  parseMarkdownTasks,
  tasksToMarkdown,
  calculateMarkdownDiff,
  validateMarkdown,
} from "@/lib/planner/markdown-utils";

interface TextViewProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (taskData: Partial<Task>) => void;
  onBatchUpdate: (updates: {
    created: Partial<Task>[];
    updated: { id: string; data: Partial<Task> }[];
    deleted: string[];
  }) => void;
}

export function TextView({ tasks, onBatchUpdate }: TextViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [originalMarkdown, setOriginalMarkdown] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate markdown from tasks
  useEffect(() => {
    const groupedTasks = QUADRANTS.reduce(
      (acc, quadrant) => {
        acc[quadrant.key] = tasks
          .filter((task) => task.quadrant === quadrant.key)
          .sort((a, b) => a.priority - b.priority);
        return acc;
      },
      {} as Record<TaskQuadrant, Task[]>,
    );

    const markdownSections = QUADRANTS.map((quadrant) => {
      const quadrantTasks = groupedTasks[quadrant.key];
      if (quadrantTasks.length === 0) return `# ${quadrant.title}\n\n`;

      const taskLines = tasksToMarkdown(quadrantTasks);
      return `# ${quadrant.title}\n${taskLines}\n\n`;
    });

    const generated = markdownSections.join("").trim();
    setMarkdown(generated);
    setOriginalMarkdown(generated);
  }, [tasks]);

  const handleEdit = () => {
    setIsEditing(true);
    setOriginalMarkdown(markdown);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(0, 0);
      }
    }, 100);
  };

  const handleCancel = () => {
    setMarkdown(originalMarkdown);
    setValidationErrors([]);
    setIsEditing(false);
  };

  const handleSave = async () => {
    // Validate markdown
    const validation = validateMarkdown(markdown);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);

    // Calculate diff (for future use)
    calculateMarkdownDiff(originalMarkdown, markdown);

    // Parse sections
    const sections = markdown.split(/^#\s+(.+)$/gm);
    const updates = {
      created: [] as Partial<Task>[],
      updated: [] as { id: string; data: Partial<Task> }[],
      deleted: [] as string[],
    };

    for (let i = 1; i < sections.length; i += 2) {
      const sectionTitle = sections[i].trim();
      const sectionContent = sections[i + 1] || "";

      // Find matching quadrant
      const quadrant = QUADRANTS.find(
        (q) => q.title.toLowerCase() === sectionTitle.toLowerCase(),
      );

      if (!quadrant) continue;

      const { tasks: parsedTasks, errors } = parseMarkdownTasks(
        sectionContent.trim(),
        quadrant.key,
      );

      if (errors.length > 0) {
        setValidationErrors(
          errors.map((e) => `${sectionTitle} line ${e.line}: ${e.message}`),
        );
        return;
      }

      // Get existing tasks for this quadrant
      const existingTasks = tasks.filter((t) => t.quadrant === quadrant.key);

      // Simple matching - tasks that exist vs new tasks
      parsedTasks.forEach((parsedTask, index) => {
        const existingTask = existingTasks.find(
          (et) =>
            et.title === parsedTask.title &&
            et.isCompleted === parsedTask.isCompleted,
        );

        if (existingTask) {
          // Update existing task if metadata changed
          const hasChanges = Object.keys(parsedTask).some((key) => {
            const k = key as keyof Task;
            return parsedTask[k] !== existingTask[k];
          });

          if (hasChanges) {
            updates.updated.push({
              id: existingTask.id,
              data: { ...parsedTask, priority: index },
            });
          }
        } else {
          // Create new task
          updates.created.push({
            ...parsedTask,
            priority: index,
          });
        }
      });

      // Mark tasks for deletion if they're not in the new markdown
      existingTasks.forEach((existingTask) => {
        const stillExists = parsedTasks.some(
          (pt) =>
            pt.title === existingTask.title &&
            pt.isCompleted === existingTask.isCompleted,
        );

        if (!stillExists) {
          updates.deleted.push(existingTask.id);
        }
      });
    }

    // Apply batch updates
    if (
      updates.created.length > 0 ||
      updates.updated.length > 0 ||
      updates.deleted.length > 0
    ) {
      onBatchUpdate(updates);
    }

    setIsEditing(false);
    setOriginalMarkdown(markdown);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleMarkdownChange = (value: string) => {
    setMarkdown(value);
    setValidationErrors([]);
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={markdown}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            placeholder="# Do
- [ ] Task title #difficulty @time [timeblock] #tags
- [x] Completed task

# Delegate
- [ ] Another task"
            className="min-h-[600px] font-mono text-sm resize-none border-0 bg-background focus:ring-0 focus:border-0"
            style={{
              lineHeight: "1.6",
              padding: "1.5rem",
              fontSize: "14px",
            }}
          />

          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Cancel</span>✕
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="h-8 w-8 p-0"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative">
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0"
          >
            {isCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        <div
          className="bg-background border border-border rounded-lg p-6 min-h-[600px] font-mono text-sm whitespace-pre-wrap cursor-text"
          style={{ lineHeight: "1.6" }}
          onClick={handleEdit}
        >
          {markdown || "No tasks yet. Click edit to add some tasks."}
        </div>
      </div>
    </div>
  );
}
