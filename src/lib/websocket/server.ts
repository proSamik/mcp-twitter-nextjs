import { Task } from "@/types/planner";
import { TweetEntity } from "@/lib/db/pg/schema.pg";

// Get the global io instance set by the custom server
function getIO() {
  if (typeof global !== "undefined" && (global as any).io) {
    return (global as any).io;
  }

  console.warn("WebSocket server not initialized - operations will be skipped");
  return null;
}

export { getIO };

// Broadcast task creation to all users in the planner room
export function broadcastTaskCreated(task: Task, date: string, userId: string) {
  const io = getIO();
  if (!io) return;

  const room = `planner:${date}:${userId}`;
  console.log(`Broadcasting task:created to room ${room}:`, task);
  io.to(room).emit("task:created", task);
}

// Broadcast task update to all users in the planner room
export function broadcastTaskUpdated(task: Task, date: string, userId: string) {
  const io = getIO();
  if (!io) return;

  const room = `planner:${date}:${userId}`;
  console.log(`Broadcasting task:updated to room ${room}:`, task);
  io.to(room).emit("task:updated", task);
}

// Broadcast task deletion to all users in the planner room
export function broadcastTaskDeleted(
  taskId: string,
  date: string,
  userId: string,
) {
  const io = getIO();
  if (!io) return;

  const room = `planner:${date}:${userId}`;
  console.log(`Broadcasting task:deleted to room ${room}:`, { taskId });
  io.to(room).emit("task:deleted", { taskId });
}

// Broadcast task reorder to all users in the planner room
export function broadcastTasksReordered(
  tasks: Task[],
  date: string,
  userId: string,
) {
  const io = getIO();
  if (!io) return;

  io.to(`planner:${date}:${userId}`).emit("tasks:reordered", tasks);
}

// Broadcast tweet creation to all users in the twitter room
export function broadcastTweetCreated(tweet: TweetEntity, userId: string) {
  const io = getIO();
  if (!io) return;

  const room = `twitter:${userId}`;
  console.log(`Broadcasting tweet:created to room ${room}:`, tweet);
  io.to(room).emit("tweet:created", tweet);
}

// Broadcast tweet update to all users in the twitter room
export function broadcastTweetUpdated(tweet: TweetEntity, userId: string) {
  const io = getIO();
  if (!io) return;

  const room = `twitter:${userId}`;
  console.log(`Broadcasting tweet:updated to room ${room}:`, tweet);
  io.to(room).emit("tweet:updated", tweet);
}

// Broadcast tweet deletion to all users in the twitter room
export function broadcastTweetDeleted(tweetId: string, userId: string) {
  const io = getIO();
  if (!io) return;

  const room = `twitter:${userId}`;
  console.log(`Broadcasting tweet:deleted to room ${room}:`, { tweetId });
  io.to(room).emit("tweet:deleted", { tweetId });
}
