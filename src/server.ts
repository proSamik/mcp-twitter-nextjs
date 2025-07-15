import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: dev ? "http://localhost:3000" : process.env.BETTER_AUTH_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Make io available globally
  (global as any).io = io;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join user-specific room for updates (simplified for development)
    socket.on("join-user-room", (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined room`);
    });

    // Join date-specific room for planner updates (simplified for development)
    socket.on("join-date-room", (date: string, userId: string) => {
      socket.join(`planner:${date}:${userId}`);
      console.log(`User ${userId} joined planner room for ${date}`);
    });

    // Leave date-specific room
    socket.on("leave-date-room", (date: string, userId: string) => {
      socket.leave(`planner:${date}:${userId}`);
      console.log(`User ${userId} left planner room for ${date}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log("> WebSocket server initialized with room management");
    });
});
