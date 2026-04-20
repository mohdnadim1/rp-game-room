const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// ── Game state ──────────────────────────────────────────────
const players = {}; // socketId → { id, name, x, y, color, avatar, muted, admin }
const chatHistory = [];
const MAX_CHAT = 50;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    // Send existing players & chat to new joiner
    socket.emit("init", {
      players: Object.values(players),
      chatHistory,
    });

    // Player joins
    socket.on("player:join", (data) => {
      players[socket.id] = {
        id: socket.id,
        name: data.name || "Player",
        x: 400 + Math.random() * 200 - 100,
        y: 520,
        color: data.color || "#4488ff",
        avatar: data.avatar || "robot1",
        muted: false,
        admin: data.admin || false,
        dir: 1,
        anim: 0,
      };
      io.emit("player:joined", players[socket.id]);
    });

    // Player moves
    socket.on("player:move", (data) => {
      if (!players[socket.id]) return;
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].dir = data.dir;
      players[socket.id].anim = data.anim;
      socket.broadcast.emit("player:moved", { id: socket.id, ...data });
    });

    // Chat message
    socket.on("chat:message", (data) => {
      if (!players[socket.id]) return;
      const msg = {
        id: socket.id,
        name: players[socket.id].name,
        color: players[socket.id].color,
        text: data.text.substring(0, 120),
        ts: Date.now(),
      };
      chatHistory.push(msg);
      if (chatHistory.length > MAX_CHAT) chatHistory.shift();
      io.emit("chat:message", msg);
    });

    // Mute toggle (admin only)
    socket.on("admin:mute", (data) => {
      if (!players[socket.id]?.admin) return;
      if (players[data.targetId]) {
        players[data.targetId].muted = data.muted;
        io.emit("player:muted", { id: data.targetId, muted: data.muted });
      }
    });

    // Kick player (admin only)
    socket.on("admin:kick", (data) => {
      if (!players[socket.id]?.admin) return;
      const targetSocket = io.sockets.sockets.get(data.targetId);
      if (targetSocket) {
        targetSocket.emit("kicked", { reason: data.reason || "Kicked by admin" });
        targetSocket.disconnect();
      }
    });

    // Voice mute self
    socket.on("voice:mute", (data) => {
      if (!players[socket.id]) return;
      players[socket.id].muted = data.muted;
      io.emit("player:muted", { id: socket.id, muted: data.muted });
    });

    // Disconnect
    socket.on("disconnect", () => {
      delete players[socket.id];
      io.emit("player:left", { id: socket.id });
      console.log("Player disconnected:", socket.id);
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
