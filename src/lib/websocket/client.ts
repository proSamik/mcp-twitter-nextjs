"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Task } from "@/types/planner";
import { TweetEntity } from "@/lib/db/pg/schema.pg";

interface WebSocketEvents {
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (data: { taskId: string }) => void;
  onTasksReordered?: (tasks: Task[]) => void;
}

interface TwitterWebSocketEvents {
  onTweetCreated?: (tweet: TweetEntity) => void;
  onTweetUpdated?: (tweet: TweetEntity) => void;
  onTweetDeleted?: (data: { tweetId: string }) => void;
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

// Global socket connection for Twitter WebSocket
let globalTwitterSocket: Socket | null = null;
let globalSocketUserId: string | null = null;

export function useTwitterWebSocket(
  userId: string | null,
  events: TwitterWebSocketEvents = {},
) {
  const eventsRef = useRef(events);

  // Update events ref when events change (but don't reconnect)
  eventsRef.current = events;

  useEffect(() => {
    if (!userId) return;

    // Only create socket if it doesn't exist or if userId changed
    if (!globalTwitterSocket || globalSocketUserId !== userId) {
      console.log("Creating new Twitter WebSocket connection for user:", userId);

      // Disconnect existing socket if userId changed
      if (globalTwitterSocket && globalSocketUserId !== userId) {
        globalTwitterSocket.disconnect();
      }

      const socket = io(
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_BETTER_AUTH_URL || ""
          : "http://localhost:3000",
        {
          transports: ["websocket", "polling"],
        },
      );

      globalTwitterSocket = socket;
      globalSocketUserId = userId;

      // Join Twitter user room
      socket.emit("join-user-room", userId);

      // Set up Twitter event listeners
      socket.on("tweet:created", (tweet: TweetEntity) => {
        console.log("WebSocket: Tweet created", tweet);
        // Notify all components that have registered event handlers
        window.dispatchEvent(new CustomEvent("tweet:created", { detail: tweet }));
      });

      socket.on("tweet:updated", (tweet: TweetEntity) => {
        console.log("WebSocket: Tweet updated", tweet);
        // Notify all components that have registered event handlers
        window.dispatchEvent(new CustomEvent("tweet:updated", { detail: tweet }));
      });

      socket.on("tweet:deleted", (data: { tweetId: string }) => {
        console.log("WebSocket: Tweet deleted", data);
        // Notify all components that have registered event handlers
        window.dispatchEvent(new CustomEvent("tweet:deleted", { detail: data }));
      });

      socket.on("auth-error", (message: string) => {
        console.error("Twitter WebSocket authentication error:", message);
      });

      socket.on("connect", () => {
        console.log("Connected to Twitter WebSocket server");
        // Rejoin user room on reconnection
        socket.emit("join-user-room", userId);
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from Twitter WebSocket server");
      });
    }

    // Set up custom event listeners for this component
    const handleTweetCreated = (event: CustomEvent) => {
      eventsRef.current.onTweetCreated?.(event.detail);
    };

    const handleTweetUpdated = (event: CustomEvent) => {
      eventsRef.current.onTweetUpdated?.(event.detail);
    };

    const handleTweetDeleted = (event: CustomEvent) => {
      eventsRef.current.onTweetDeleted?.(event.detail);
    };

    window.addEventListener("tweet:created", handleTweetCreated as EventListener);
    window.addEventListener("tweet:updated", handleTweetUpdated as EventListener);
    window.addEventListener("tweet:deleted", handleTweetDeleted as EventListener);

    return () => {
      // Clean up event listeners on unmount
      window.removeEventListener("tweet:created", handleTweetCreated as EventListener);
      window.removeEventListener("tweet:updated", handleTweetUpdated as EventListener);
      window.removeEventListener("tweet:deleted", handleTweetDeleted as EventListener);
    };
  }, [userId]); // Only depend on userId, not events

  return {
    socket: globalTwitterSocket,
  };
}

export function useTweetListWebSocket(
  userId: string | null,
  onTweetsChange: (tweets: TweetEntity[]) => void,
) {
  const tweetsRef = useRef<TweetEntity[]>([]);

  const updateTweets = (newTweets: TweetEntity[]) => {
    tweetsRef.current = newTweets;
    onTweetsChange(newTweets);
  };

  const { socket } = useTwitterWebSocket(userId, {
    onTweetCreated: (tweet: TweetEntity) => {
      // Insert new tweet at the top of the list
      const updatedTweets = [tweet, ...tweetsRef.current];
      updateTweets(updatedTweets);
    },

    onTweetUpdated: (updatedTweet: TweetEntity) => {
      const existingTweetIndex = tweetsRef.current.findIndex(
        (tweet) => 
          tweet.nanoId === updatedTweet.nanoId || 
          tweet.id === updatedTweet.id
      );
      
      if (existingTweetIndex !== -1) {
        // Update existing tweet
        const updatedTweets = tweetsRef.current.map((tweet) =>
          tweet.nanoId === updatedTweet.nanoId || tweet.id === updatedTweet.id ? updatedTweet : tweet,
        );
        updateTweets(updatedTweets);
      } else {
        // Add new tweet (newly created)
        const updatedTweets = [...tweetsRef.current, updatedTweet];
        updateTweets(updatedTweets);
      }
    },

    onTweetDeleted: ({ tweetId }) => {
      const updatedTweets = tweetsRef.current.filter(
        (tweet) => tweet.nanoId !== tweetId && tweet.id !== tweetId,
      );
      updateTweets(updatedTweets);
    },
  });

  // Update tweets reference when external tweets change
  const setTweets = (tweets: TweetEntity[]) => {
    tweetsRef.current = tweets;
  };

  return {
    socket,
    setTweets,
  };
}
