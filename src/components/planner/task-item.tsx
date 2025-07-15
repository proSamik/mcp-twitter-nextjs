"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  MoreHorizontal,
  Edit2,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Task } from "@/types/planner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isDragging?: boolean;
}

const difficultyColors = {
  easy: "bg-emerald-500/20 text-emerald-700 border border-emerald-200/50 backdrop-blur-sm dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/30",
  medium:
    "bg-amber-500/20 text-amber-700 border border-amber-200/50 backdrop-blur-sm dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800/30",
  hard: "bg-red-500/20 text-red-700 border border-red-200/50 backdrop-blur-sm dark:bg-red-500/10 dark:text-red-400 dark:border-red-800/30",
};

export function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  isDragging,
}: TaskItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isTaskDragging = isDragging || isSortableDragging;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "group relative bg-white/60 backdrop-blur-sm rounded-lg border border-white/20 p-3 shadow-lg shadow-black/5 transition-all duration-200 cursor-pointer hover:bg-white/80 hover:shadow-xl hover:shadow-black/10 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/20",
        isTaskDragging &&
          "opacity-50 rotate-1 scale-105 z-50 bg-white/90 dark:bg-white/30",
        task.isCompleted && "opacity-60 bg-slate-100/60 dark:bg-slate-800/60",
      )}
      onDoubleClick={() => onEdit(task)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex items-start gap-3 ml-6">
        {/* Checkbox */}
        <Checkbox
          checked={task.isCompleted}
          onCheckedChange={() => onToggleComplete(task.id)}
          className="mt-0.5"
        />

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "font-medium text-sm text-foreground leading-tight",
              task.isCompleted && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.difficulty && (
              <Badge
                variant="secondary"
                className={cn("text-xs", difficultyColors[task.difficulty])}
              >
                {task.difficulty}
              </Badge>
            )}

            {task.timeRequired && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.timeRequired}
              </div>
            )}

            {task.timeBlock && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {task.timeBlock}
              </div>
            )}

            {task.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {task.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{task.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
