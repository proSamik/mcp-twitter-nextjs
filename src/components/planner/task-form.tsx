"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Task, TaskQuadrant, TaskDifficulty, QUADRANTS } from "@/types/planner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<Task>) => void;
  task?: Task | null;
  defaultQuadrant?: TaskQuadrant;
}

export function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  task,
  defaultQuadrant,
}: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    quadrant: task?.quadrant || defaultQuadrant || "urgent-important",
    timeRequired: task?.timeRequired || "",
    timeBlock: task?.timeBlock || "",
    difficulty: task?.difficulty || "",
    tags: task?.tags || [],
  });

  const [newTag, setNewTag] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onSubmit({
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      timeRequired: formData.timeRequired.trim() || undefined,
      timeBlock: formData.timeBlock.trim() || undefined,
      difficulty: (formData.difficulty as TaskDifficulty) || undefined,
    });

    // Reset form
    setFormData({
      title: "",
      description: "",
      quadrant: defaultQuadrant || "urgent-important",
      timeRequired: "",
      timeBlock: "",
      difficulty: "",
      tags: [],
    });
    setNewTag("");
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  const selectedQuadrant = QUADRANTS.find((q) => q.key === formData.quadrant);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <DialogHeader>
            <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
            <DialogDescription>
              {task
                ? "Update your task details and settings."
                : "Add a new task to your planner and organize it in the right quadrant."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter task title..."
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional task description..."
                rows={3}
              />
            </div>

            {/* Quadrant */}
            <div className="space-y-2">
              <Label htmlFor="quadrant">Quadrant *</Label>
              <Select
                value={formData.quadrant}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    quadrant: value as TaskQuadrant,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {selectedQuadrant && (
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-sm border ${selectedQuadrant.color}`}
                        />
                        <span>
                          {selectedQuadrant.title} - {selectedQuadrant.subtitle}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {QUADRANTS.map((quadrant) => (
                    <SelectItem key={quadrant.key} value={quadrant.key}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-sm border ${quadrant.color}`}
                        />
                        <div>
                          <div className="font-medium">{quadrant.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {quadrant.subtitle}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Management */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeRequired">Time Required</Label>
                <Input
                  id="timeRequired"
                  value={formData.timeRequired}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      timeRequired: e.target.value,
                    }))
                  }
                  placeholder="e.g., 2 hours"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeBlock">Time Block</Label>
                <Input
                  id="timeBlock"
                  value={formData.timeBlock}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      timeBlock: e.target.value,
                    }))
                  }
                  placeholder="e.g., 3-5 PM"
                />
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTag}
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.title.trim()}>
                {task ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
