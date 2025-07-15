"use client";

import { useState, useRef, useEffect } from "react";
import { Task, TaskQuadrant, TaskDifficulty } from "@/types/planner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, Plus } from "lucide-react";

interface InlineTaskFormProps {
  onSubmit: (taskData: Partial<Task>) => void;
  onCancel: () => void;
  task?: Task | null;
  quadrant: TaskQuadrant;
  isEditing?: boolean;
}

export function InlineTaskForm({
  onSubmit,
  onCancel,
  task,
  quadrant,
  isEditing = false,
}: InlineTaskFormProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [timeRequired, setTimeRequired] = useState(task?.timeRequired || "");
  const [timeBlock, setTimeBlock] = useState(task?.timeBlock || "");
  const [difficulty, setDifficulty] = useState<TaskDifficulty | undefined>(
    task?.difficulty,
  );
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [showDetails, setShowDetails] = useState(isEditing || Boolean(task));

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      timeRequired: timeRequired.trim() || undefined,
      timeBlock: timeBlock.trim() || undefined,
      difficulty,
      tags,
      quadrant,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter" && e.metaKey) {
      handleSubmit(e);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-lg p-3 shadow-xl shadow-black/10 space-y-3 dark:bg-white/10 dark:border-white/20">
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <div className="space-y-3">
          <Input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title (required)"
            className="font-medium"
          />

          {showDetails && (
            <>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="text-sm resize-none"
                rows={2}
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={timeRequired}
                  onChange={(e) => setTimeRequired(e.target.value)}
                  placeholder="Time required (e.g., 30min)"
                  className="text-sm"
                />
                <Input
                  value={timeBlock}
                  onChange={(e) => setTimeBlock(e.target.value)}
                  placeholder="Time block (e.g., 9-10 AM)"
                  className="text-sm"
                />
              </div>

              <Select
                value={difficulty}
                onValueChange={(value: TaskDifficulty) => setDifficulty(value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Difficulty (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag"
                    className="text-sm flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addTag}
                    className="px-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!showDetails && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(true)}
                  className="text-xs"
                >
                  Add details
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button type="submit" size="sm" disabled={!title.trim()}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
