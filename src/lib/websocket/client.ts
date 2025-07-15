"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Task } from "@/types/planner";

interface WebSocketEvents {
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (data: { taskId: string }) => void;
  onTasksReordered?: (tasks: Task[]) => void;
}

export function useWebSocket(
  userId: string | null,
  events: WebSocketEvents = {},
) {
  const socketRef = useRef<Socket | null>(null);
  const currentDateRoomRef = useRef<string | null>(null);
  const eventsRef = useRef(events);

  // Update events ref when events change (but don't reconnect)
  eventsRef.current = events;

  useEffect(() => {
    if (!userId) return;

    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      console.log("Creating new WebSocket connection for user:", userId);

      const socket = io(
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_BETTER_AUTH_URL || ""
          : "http://localhost:3000",
        {
          transports: ["websocket", "polling"],
        },
      );

      socketRef.current = socket;

      // Join user room
      socket.emit("join-user-room", userId);

      // Set up event listeners using refs to avoid recreation
      socket.on("task:created", (task: Task) => {
        console.log("WebSocket: Task created", task);
        eventsRef.current.onTaskCreated?.(task);
      });

      socket.on("task:updated", (task: Task) => {
        console.log("WebSocket: Task updated", task);
        eventsRef.current.onTaskUpdated?.(task);
      });

      socket.on("task:deleted", (data: { taskId: string }) => {
        console.log("WebSocket: Task deleted", data);
        eventsRef.current.onTaskDeleted?.(data);
      });

      socket.on("tasks:reordered", (tasks: Task[]) => {
        console.log("WebSocket: Tasks reordered", tasks);
        eventsRef.current.onTasksReordered?.(tasks);
      });

      socket.on("auth-error", (message: string) => {
        console.error("WebSocket authentication error:", message);
      });

      socket.on("connect", () => {
        console.log("Connected to WebSocket server");
        // Rejoin user room on reconnection
        socket.emit("join-user-room", userId);
        // Rejoin date room if we had one
        if (currentDateRoomRef.current) {
          socket.emit("join-date-room", currentDateRoomRef.current, userId);
        }
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from WebSocket server");
      });
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
      // socket.disconnect();
    };
  }, [userId]); // Only depend on userId, not events

  // Join date-specific room with proper room management
  const joinDateRoom = useCallback(
    (date: string) => {
      if (socketRef.current && userId) {
        // Leave current date room if we're in one
        if (currentDateRoomRef.current && currentDateRoomRef.current !== date) {
          console.log("Leaving old date room:", currentDateRoomRef.current);
          socketRef.current.emit(
            "leave-date-room",
            currentDateRoomRef.current,
            userId,
          );
        }

        // Join new date room
        console.log("Joining date room:", date);
        socketRef.current.emit("join-date-room", date, userId);
        currentDateRoomRef.current = date;
      }
    },
    [userId],
  );

  return {
    socket: socketRef.current,
    joinDateRoom,
  };
}

export function useTaskWebSocket(
  userId: string | null,
  onTasksChange: (tasks: Task[]) => void,
) {
  const tasksRef = useRef<Task[]>([]);

  const updateTasks = (newTasks: Task[]) => {
    tasksRef.current = newTasks;
    onTasksChange(newTasks);
  };

  const { socket, joinDateRoom } = useWebSocket(userId, {
    onTaskCreated: (task: Task) => {
      const updatedTasks = [...tasksRef.current, task];
      updateTasks(updatedTasks);
    },

    onTaskUpdated: (updatedTask: Task) => {
      const updatedTasks = tasksRef.current.map((task) =>
        task.id === updatedTask.id ? updatedTask : task,
      );
      updateTasks(updatedTasks);
    },

    onTaskDeleted: ({ taskId }) => {
      const updatedTasks = tasksRef.current.filter(
        (task) => task.id !== taskId,
      );
      updateTasks(updatedTasks);
    },

    onTasksReordered: (reorderedTasks: Task[]) => {
      updateTasks(reorderedTasks);
    },
  });

  // Update tasks reference when external tasks change
  const setTasks = (tasks: Task[]) => {
    tasksRef.current = tasks;
  };

  return {
    socket,
    joinDateRoom,
    setTasks,
  };
}
