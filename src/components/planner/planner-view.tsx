"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Grid3X3,
  List,
  Plus,
  FileText,
} from "lucide-react";
import { Task, TaskQuadrant, ViewMode, Planner } from "@/types/planner";
import { QuadrantView } from "./quadrant-view";
import { ListView } from "./list-view";
import { TextView } from "./text-view";
import { TaskForm } from "./task-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfDay } from "date-fns";
import { useTaskWebSocket } from "@/lib/websocket/client";
import { useTaskActions } from "@/lib/websocket/task-actions";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

interface PlannerViewProps {
  initialDate?: Date;
}

export function PlannerView({ initialDate = new Date() }: PlannerViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("quadrant");
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [planner, setPlanner] = useState<Planner | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultQuadrant, setDefaultQuadrant] =
    useState<TaskQuadrant>("urgent-important");

  const { data: session } = authClient.useSession();

  // WebSocket integration for real-time updates
  const { joinDateRoom, setTasks: setWebSocketTasks } = useTaskWebSocket(
    session?.user?.id || null,
    (updatedTasks: Task[]) => {
      console.log("WebSocket tasks updated:", updatedTasks);
      setTasks(updatedTasks);
    },
  );

  // Task actions via WebSocket-aware API calls
  const taskActions = useTaskActions();

  // Format date for API calls - use start of day in local timezone
  const formatDateForAPI = (date: Date) => {
    return format(startOfDay(date), "yyyy-MM-dd");
  };

  // Fetch planner and tasks for selected date
  const fetchPlannerData = async (date: Date) => {
    setIsLoading(true);
    try {
      const formattedDate = formatDateForAPI(date);
      const response = await fetch(`/api/planner?date=${formattedDate}`);

      if (response.ok) {
        const data = await response.json();
        setPlanner(data.planner);
        const fetchedTasks = data.tasks || [];
        setTasks(fetchedTasks);
        setWebSocketTasks(fetchedTasks);

        // Join WebSocket room for this date
        if (data.planner) {
          joinDateRoom(formattedDate);
        }
      } else {
        console.error("Failed to fetch planner data");
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching planner data:", error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Handle task creation via WebSocket
  const handleTaskCreate = async (taskData: Partial<Task>) => {
    if (!planner) return;

    try {
      await taskActions.createTask({
        ...taskData,
        plannerId: planner.id,
        priority: tasks.filter((t) => t.quadrant === taskData.quadrant).length,
        title: taskData.title!,
        quadrant: taskData.quadrant!,
      });
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  // Handle task update via WebSocket
  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskActions.updateTask(taskId, updates);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Handle task deletion via WebSocket
  const handleTaskDelete = async (taskId: string) => {
    try {
      await taskActions.deleteTask(taskId);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Handle task form submission
  const handleTaskFormSubmit = (taskData: Partial<Task>) => {
    if (editingTask) {
      handleTaskUpdate(editingTask.id, taskData);
    } else {
      handleTaskCreate(taskData);
    }
    setEditingTask(null);
  };

  // Open task form for editing
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  // Handle batch updates from text view
  const handleBatchUpdate = async (updates: {
    created: Partial<Task>[];
    updated: { id: string; data: Partial<Task> }[];
    deleted: string[];
  }) => {
    try {
      // Delete tasks first
      for (const taskId of updates.deleted) {
        await handleTaskDelete(taskId);
      }

      // Update existing tasks
      for (const update of updates.updated) {
        await handleTaskUpdate(update.id, update.data);
      }

      // Create new tasks
      for (const taskData of updates.created) {
        await handleTaskCreate(taskData);
      }
    } catch (error) {
      console.error("Error in batch update:", error);
    }
  };

  // Load data when date changes
  useEffect(() => {
    fetchPlannerData(selectedDate);
  }, [selectedDate]);

  return (
    <div className="relative min-h-screen">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-purple-50/10 to-pink-50/20 dark:from-blue-950/10 dark:via-purple-950/5 dark:to-pink-950/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent dark:from-blue-900/20"></div>

      <div className="relative space-y-6 p-6">
        {/* Header with Controls */}
        <Card className="bg-white/40 backdrop-blur-xl border-white/20 shadow-xl shadow-black/5 dark:bg-black/20 dark:border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-2xl font-bold">
                  Task Planner
                </CardTitle>

                {/* Date Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex rounded-lg border border-border p-1">
                  <Button
                    variant={viewMode === "quadrant" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("quadrant")}
                    className="h-8 px-3"
                  >
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    Quadrant
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-8 px-3"
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === "text" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("text")}
                    className="h-8 px-3"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Text
                  </Button>
                </div>

                {/* Add Task Button */}
                <Button
                  onClick={() => {
                    setDefaultQuadrant("urgent-important");
                    setEditingTask(null);
                    setIsTaskFormOpen(true);
                  }}
                  className="h-9"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                {tasks.length} tasks total •{" "}
                {tasks.filter((t) => t.isCompleted).length} completed
              </div>
              <div>{format(selectedDate, "EEEE")}</div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content with View Transition */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <div className="text-muted-foreground">Loading planner...</div>
            </motion.div>
          ) : (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {viewMode === "quadrant" ? (
                <QuadrantView
                  tasks={tasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleTaskDelete}
                  onTaskCreate={handleTaskCreate}
                  onTaskEdit={handleEditTask}
                />
              ) : viewMode === "list" ? (
                <ListView
                  tasks={tasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleTaskDelete}
                  onTaskCreate={handleTaskCreate}
                  onTaskEdit={handleEditTask}
                />
              ) : (
                <TextView
                  tasks={tasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleTaskDelete}
                  onTaskCreate={handleTaskCreate}
                  onBatchUpdate={handleBatchUpdate}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Form Modal */}
        <TaskForm
          isOpen={isTaskFormOpen}
          onClose={() => {
            setIsTaskFormOpen(false);
            setEditingTask(null);
          }}
          onSubmit={handleTaskFormSubmit}
          task={editingTask}
          defaultQuadrant={defaultQuadrant}
        />
      </div>
    </div>
  );
}
