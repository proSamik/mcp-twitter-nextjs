"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Task, TaskQuadrant, QUADRANTS } from "@/types/planner";
import { TaskItem } from "./task-item";
import { InlineTaskForm } from "./inline-task-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

function DroppableContainer({
  quadrant,
  children,
}: {
  quadrant: TaskQuadrant;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: quadrant,
    data: { quadrant },
  });

  return (
    <div ref={setNodeRef} className="space-y-3" data-quadrant={quadrant}>
      {children}
    </div>
  );
}

interface ListViewProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskCreate: (taskData: Partial<Task>) => void;
  onTaskEdit: (task: Task) => void;
}

export function ListView({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
}: ListViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<TaskQuadrant>>(
    new Set(),
  );
  const [showingFormFor, setShowingFormFor] = useState<TaskQuadrant | null>(
    null,
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task;
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = active.data.current?.task;
    const overContainer = over.data.current?.quadrant;

    if (activeTask && overContainer && activeTask.quadrant !== overContainer) {
      // Update task quadrant immediately for visual feedback
      onTaskUpdate(activeTask.id, { quadrant: overContainer });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = active.data.current?.task;
    const overContainer = over.data.current?.quadrant;
    const overTask = over.data.current?.task;

    if (!activeTask) return;

    if (overContainer && activeTask.quadrant !== overContainer) {
      // Final update with new quadrant and priority
      const quadrantTasks = getTasksByQuadrant(overContainer);
      const newPriority = quadrantTasks.length;

      onTaskUpdate(activeTask.id, {
        quadrant: overContainer,
        priority: newPriority,
      });
    } else if (overTask && activeTask.id !== overTask.id) {
      // Reorder within same quadrant
      const newPriority = overTask.priority;
      onTaskUpdate(activeTask.id, { priority: newPriority });
    }
  };

  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      onTaskUpdate(taskId, { isCompleted: !task.isCompleted });
    }
  };

  const toggleSection = (quadrant: TaskQuadrant) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(quadrant)) {
      newCollapsed.delete(quadrant);
    } else {
      newCollapsed.add(quadrant);
    }
    setCollapsedSections(newCollapsed);
  };

  const getTasksByQuadrant = (quadrant: TaskQuadrant) => {
    return tasks
      .filter((task) => task.quadrant === quadrant)
      .sort((a, b) => a.priority - b.priority);
  };

  const handleCreateTask = (quadrant: TaskQuadrant) => {
    setShowingFormFor(quadrant);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowingFormFor(null);
  };

  const handleFormSubmit = (taskData: Partial<Task>) => {
    if (editingTask) {
      onTaskUpdate(editingTask.id, taskData);
      setEditingTask(null);
    } else {
      onTaskCreate(taskData);
      setShowingFormFor(null);
    }
  };

  const handleFormCancel = () => {
    setShowingFormFor(null);
    setEditingTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4 max-w-4xl mx-auto">
        {QUADRANTS.map((quadrant) => {
          const quadrantTasks = getTasksByQuadrant(quadrant.key);
          const isCollapsed = collapsedSections.has(quadrant.key);
          const completedTasks = quadrantTasks.filter(
            (task) => task.isCompleted,
          ).length;

          return (
            <motion.div
              key={quadrant.key}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="transition-all duration-200">
                <Collapsible
                  open={!isCollapsed}
                  onOpenChange={() => toggleSection(quadrant.key)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader
                      className={cn(
                        "pb-3 cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg",
                        quadrant.color,
                      )}
                      data-quadrant={quadrant.key}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isCollapsed ? (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-lg font-semibold">
                              {quadrant.title}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {quadrant.subtitle}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-muted-foreground font-medium">
                            {completedTasks}/{quadrantTasks.length} completed
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateTask(quadrant.key);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <SortableContext
                        items={quadrantTasks.map((task) => task.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <DroppableContainer quadrant={quadrant.key}>
                          {quadrantTasks.map((task) =>
                            editingTask?.id === task.id ? (
                              <InlineTaskForm
                                key={`edit-${task.id}`}
                                task={task}
                                quadrant={quadrant.key}
                                onSubmit={handleFormSubmit}
                                onCancel={handleFormCancel}
                                isEditing={true}
                              />
                            ) : (
                              <TaskItem
                                key={task.id}
                                task={task}
                                onToggleComplete={handleToggleComplete}
                                onEdit={handleEditTask}
                                onDelete={onTaskDelete}
                              />
                            ),
                          )}

                          {showingFormFor === quadrant.key && (
                            <InlineTaskForm
                              quadrant={quadrant.key}
                              onSubmit={handleFormSubmit}
                              onCancel={handleFormCancel}
                            />
                          )}

                          {quadrantTasks.length === 0 &&
                            showingFormFor !== quadrant.key && (
                              <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="text-muted-foreground mb-2">
                                  No tasks in this section
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCreateTask(quadrant.key)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Task
                                </Button>
                              </div>
                            )}
                        </DroppableContainer>
                      </SortableContext>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskItem
            task={activeTask}
            onToggleComplete={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
