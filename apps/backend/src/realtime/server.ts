import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import Redis from "ioredis";
import jwt from "jsonwebtoken";

// Decoupled from the Next.js API process — see docs/02-architecture.md ADR-002.
// Scales independently; uses the Redis adapter so events fan out across
// multiple instances instead of only reaching clients on the same node.

const PORT = Number(process.env.REALTIME_PORT ?? 4001);

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: { origin: process.env.ALLOWED_ORIGINS?.split(",") ?? [] },
  adapter: createAdapter(redis),
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token || typeof token !== "string") {
    return next(new Error("UNAUTHENTICATED"));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_PUBLIC_KEY ?? "", { algorithms: ["RS256"] });
    socket.data.userId = (payload as { sub: string }).sub;
    next();
  } catch {
    next(new Error("UNAUTHENTICATED"));
  }
});

io.on("connection", (socket) => {
  // Chat, live tracking, and notification event handlers register here,
  // one module per bounded context — mirrors the src/domain module split.
  socket.on("conversation:join", (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Realtime service listening on :${PORT}`);
});
