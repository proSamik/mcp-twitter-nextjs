"use client";

import { Task } from "@/types/planner";

// WebSocket-based task actions using direct API calls with session cookies
export class TaskWebSocketActions {
  // Create a new task via API call (WebSocket will broadcast the result)
  async createTask(taskData: {
    plannerId: string;
    title: string;
    description?: string;
    quadrant: string;
    priority?: number;
    timeRequired?: string;
    timeBlock?: string;
    difficulty?: string;
    tags?: string[];
  }) {
    try {
      console.log("Creating task via API:", taskData);
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.status}`);
      }

      // Don't return the result - WebSocket will handle the update
      console.log("Task creation request sent, waiting for WebSocket update");
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  // Update a task via API call (WebSocket will broadcast the result)
  async updateTask(taskId: string, updates: Partial<Task>) {
    try {
      console.log("Updating task via API:", { taskId, updates });
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.status}`);
      }

      // Don't return the result - WebSocket will handle the update
      console.log("Task update request sent, waiting for WebSocket update");
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  // Delete a task via API call (WebSocket will broadcast the result)
  async deleteTask(taskId: string) {
    try {
      console.log("Deleting task via API:", taskId);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.status}`);
      }

      // Don't return the result - WebSocket will handle the update
      console.log("Task deletion request sent, waiting for WebSocket update");
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }
}

// Hook to use WebSocket task actions
export function useTaskActions() {
  return new TaskWebSocketActions();
}
