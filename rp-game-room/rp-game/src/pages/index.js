import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import styles from "../styles/game.module.css";

// ── Constants ─────────────────────────────────────────────
const MAP_W = 2400;
const MAP_H = 1200;
const VIEW_W = 900;
const VIEW_H = 560;
const FLOOR_Y = 520;
const GRAVITY = 0.55;
const JUMP_FORCE = -12;
const SPEED = 3.5;

const AVATARS = ["robot1", "robot2", "robot3", "robot4"];
const COLORS = ["#4488ff", "#ff4488", "#44ff88", "#ffaa44", "#aa44ff", "#44ffff"];

// ── Map definition ─────────────────────────────────────────
const PLATFORMS = [
  { x: 100, y: 380, w: 180, h: 18, color: "#1e4080" },
  { x: 350, y: 300, w: 140, h: 18, color: "#1e4080" },
  { x: 550, y: 220, w: 160, h: 18, color: "#6030a0" },
  { x: 750, y: 320, w: 140, h: 18, color: "#1e4080" },
  { x: 950, y: 240, w: 200, h: 18, color: "#1e4080" },
  { x: 1150, y: 360, w: 160, h: 18, color: "#6030a0" },
  { x: 1350, y: 280, w: 140, h: 18, color: "#1e4080" },
  { x: 1550, y: 200, w: 180, h: 18, color: "#1e4080" },
  { x: 1750, y: 340, w: 150, h: 18, color: "#6030a0" },
  { x: 1950, y: 260, w: 160, h: 18, color: "#1e4080" },
  { x: 2100, y: 380, w: 200, h: 18, color: "#1e4080" },
];

const ZONES = [
  { x: 0,    y: 0, w: 800,  h: MAP_H, name: "City District",   skyTop: "#0a0a1a", skyBot: "#0f2040", floorColor: "#0f3460" },
  { x: 800,  y: 0, w: 800,  h: MAP_H, name: "Forest Zone",     skyTop: "#0a1a0a", skyBot: "#0f3020", floorColor: "#143020" },
  { x: 1600, y: 0, w: 800,  h: MAP_H, name: "Space Station",   skyTop: "#050510", skyBot: "#101030", floorColor: "#0a0a25" },
];

// ── Draw robot sprite ──────────────────────────────────────
function drawRobot(ctx, x, y, color, dir, anim, isMe) {
  ctx.save();
  ctx.translate(x, y);
  if (dir < 0) ctx.scale(-1, 1);

  const sw = Math.sin(anim * 0.18) * 9;
  const aw = Math.sin(anim * 0.18 + Math.PI) * 11;

  // Shadow
  ctx.save();
  ctx.scale(1, 0.28);
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fill();
  ctx.restore();

  // Legs
  [[-8, sw], [8, -sw]].forEach(([lx, rot]) => {
    ctx.save();
    ctx.translate(lx, -18);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.fillStyle = "#ccc";
    ctx.beginPath(); ctx.roundRect(-4, 0, 8, 20, 3); ctx.fill();
    ctx.fillStyle = "#aaa";
    ctx.beginPath(); ctx.roundRect(-5, 17, 11, 7, 3); ctx.fill();
    ctx.restore();
  });

  // Body
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(-15, -58, 30, 40, 8); ctx.fill();

  // Chest glow
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath(); ctx.roundRect(-10, -54, 20, 14, 4); ctx.fill();
  ctx.fillStyle = isMe ? "#fff" : "rgba(255,255,255,0.5)";
  ctx.beginPath(); ctx.arc(0, -32, 4, 0, Math.PI * 2); ctx.fill();

  // Arms
  [[-18, aw], [18, -aw]].forEach(([ax, rot]) => {
    ctx.save();
    ctx.translate(ax, -50);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.fillStyle = "#bbb";
    ctx.beginPath(); ctx.roundRect(-4, 0, 8, 22, 4); ctx.fill();
    ctx.restore();
  });

  // Head
  ctx.fillStyle = "#f2f2f2";
  ctx.beginPath(); ctx.roundRect(-14, -90, 28, 28, 10); ctx.fill();

  // Visor
  const vc = isMe ? color : color;
  ctx.fillStyle = vc;
  ctx.beginPath(); ctx.roundRect(-10, -84, 20, 10, 4); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath(); ctx.roundRect(-9, -83, 7, 5, 2); ctx.fill();

  // Antenna
  ctx.strokeStyle = "#aaa"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(0, -103); ctx.stroke();
  ctx.fillStyle = isMe ? "#fff" : color;
  ctx.beginPath(); ctx.arc(0, -106, 5, 0, Math.PI * 2); ctx.fill();
  if (isMe) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, -106, 7, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.restore();
}

// ── Draw zone background ───────────────────────────────────
function drawBackground(ctx, camX, zone) {
  const grad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  grad.addColorStop(0, zone.skyTop);
  grad.addColorStop(1, zone.skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Stars (space/city)
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  const seed = Math.floor(camX / 50);
  for (let i = 0; i < 40; i++) {
    const sx = ((seed * 37 + i * 173) % VIEW_W);
    const sy = ((seed * 13 + i * 97) % (FLOOR_Y - 80));
    ctx.beginPath(); ctx.arc(sx, sy, 0.7, 0, Math.PI * 2); ctx.fill();
  }

  // Zone buildings/trees
  if (zone.name === "City District") {
    const buildings = [
      { x: 60, w: 80, h: 140, color: "#0d2137" },
      { x: 200, w: 60, h: 100, color: "#0f2a40" },
      { x: 320, w: 100, h: 180, color: "#0a1e32" },
      { x: 500, w: 70, h: 120, color: "#0d2137" },
      { x: 650, w: 90, h: 160, color: "#0f2a40" },
    ];
    buildings.forEach(b => {
      const bx = b.x - (camX % 800);
      ctx.fillStyle = b.color;
      ctx.fillRect(bx, FLOOR_Y - 60 - b.h, b.w, b.h);
      // Windows
      ctx.fillStyle = "rgba(255,200,50,0.3)";
      for (let wy = 0; wy < b.h - 20; wy += 20) {
        for (let wx = 8; wx < b.w - 8; wx += 18) {
          if ((wy + wx) % 40 < 25) {
            ctx.fillRect(bx + wx, FLOOR_Y - 60 - b.h + wy + 5, 8, 10);
          }
        }
      }
      // Neon strip top
      ctx.fillStyle = "#3a86ff88";
      ctx.fillRect(bx, FLOOR_Y - 60 - b.h, b.w, 4);
    });
    // Neon ground strips
    const neonColors = ["#ff006e", "#8338ec", "#3a86ff", "#06ffa5"];
    neonColors.forEach((c, i) => {
      ctx.fillStyle = c + "66";
      ctx.fillRect(i * 220 - (camX % 880), FLOOR_Y - 60, 150, 5);
    });
  }

  if (zone.name === "Forest Zone") {
    // Trees
    for (let i = 0; i < 8; i++) {
      const tx = (i * 110 - (camX % 880) + 800) % VIEW_W;
      const th = 80 + (i * 37) % 60;
      ctx.fillStyle = "#1a3a1a";
      ctx.fillRect(tx - 6, FLOOR_Y - 60 - th, 12, th);
      ctx.fillStyle = "#2a5a20";
      ctx.beginPath();
      ctx.moveTo(tx, FLOOR_Y - 60 - th - 50);
      ctx.lineTo(tx - 35, FLOOR_Y - 60 - th + 10);
      ctx.lineTo(tx + 35, FLOOR_Y - 60 - th + 10);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#3a7a30";
      ctx.beginPath();
      ctx.moveTo(tx, FLOOR_Y - 60 - th - 75);
      ctx.lineTo(tx - 25, FLOOR_Y - 60 - th - 20);
      ctx.lineTo(tx + 25, FLOOR_Y - 60 - th - 20);
      ctx.closePath(); ctx.fill();
    }
    // Fireflies
    const ft = Date.now() / 800;
    for (let i = 0; i < 12; i++) {
      const fx = ((i * 193 + Math.sin(ft + i) * 30) % VIEW_W + VIEW_W) % VIEW_W;
      const fy = 100 + (i * 77 % 200) + Math.sin(ft * 1.3 + i) * 20;
      ctx.fillStyle = `rgba(100,255,150,${0.4 + Math.sin(ft * 2 + i) * 0.3})`;
      ctx.beginPath(); ctx.arc(fx, fy, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  if (zone.name === "Space Station") {
    // Planets
    ctx.fillStyle = "#1a0a30";
    ctx.beginPath(); ctx.arc(120 - (camX % 400) * 0.2, 100, 50, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#5520a0"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.ellipse(120 - (camX % 400) * 0.2, 100, 75, 20, -0.2, 0, Math.PI * 2); ctx.stroke();
    // Space debris
    for (let i = 0; i < 5; i++) {
      const dx = (i * 170 - camX * 0.3) % VIEW_W;
      ctx.fillStyle = "#333";
      ctx.save(); ctx.translate(dx, 80 + i * 30);
      ctx.rotate(Date.now() * 0.001 + i); 
      ctx.fillRect(-6, -4, 12, 8); ctx.restore();
    }
    // Grid lines on wall
    ctx.strokeStyle = "rgba(80,80,255,0.15)"; ctx.lineWidth = 1;
    for (let gx = 0; gx < VIEW_W; gx += 60) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, FLOOR_Y - 55); ctx.stroke();
    }
    for (let gy = 0; gy < FLOOR_Y - 55; gy += 60) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(VIEW_W, gy); ctx.stroke();
    }
  }

  // Floor
  ctx.fillStyle = zone.floorColor;
  ctx.fillRect(0, FLOOR_Y - 55, VIEW_W, VIEW_H - FLOOR_Y + 55);

  // Floor grid
  ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
  const gOff = camX % 60;
  for (let gx = -gOff; gx < VIEW_W; gx += 60) {
    ctx.beginPath(); ctx.moveTo(gx, FLOOR_Y - 55); ctx.lineTo(gx, VIEW_H); ctx.stroke();
  }
  for (let gy = FLOOR_Y - 55; gy < VIEW_H; gy += 40) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(VIEW_W, gy); ctx.stroke();
  }
}

// ── Draw zone sign ─────────────────────────────────────────
function drawZoneSign(ctx, text, x, y) {
  ctx.save();
  ctx.font = "bold 13px monospace";
  const w = ctx.measureText(text).width + 20;
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - 22, w, 26, 5); ctx.fill();
  ctx.strokeStyle = "#3a86ff44"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - 22, w, 26, 5); ctx.stroke();
  ctx.fillStyle = "#88ccff";
  ctx.textAlign = "center"; ctx.fillText(text, x, y - 2); ctx.restore();
}

// ── Main game component ────────────────────────────────────
export default function GamePage() {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const gameStateRef = useRef({
    me: null,
    players: {},
    camX: 0,
    keys: {},
    vy: 0,
    onGround: true,
    anim: 0,
    chatBubbles: {},
  });
  const animFrameRef = useRef(null);

  const [joined, setJoined] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerColor, setPlayerColor] = useState(COLORS[0]);
  const [playerAvatar, setPlayerAvatar] = useState(AVATARS[0]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [micMuted, setMicMuted] = useState(true);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [kicked, setKicked] = useState(null);
  const [currentZone, setCurrentZone] = useState("City District");

  const voiceRef = useRef({ stream: null, peerConnections: {}, audioCtx: null });
  const chatLogRef = useRef([]);

  // ── Socket setup ─────────────────────────────────────────
  useEffect(() => {
    if (!joined) return;
    const gs = gameStateRef.current;
    const socket = io(window.location.origin, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("player:join", {
        name: playerName || "Player",
        color: playerColor,
        avatar: playerAvatar,
        admin: isAdmin,
      });
    });

    socket.on("init", ({ players, chatHistory }) => {
      players.forEach(p => { if (p.id !== socket.id) gs.players[p.id] = p; });
      chatLogRef.current = chatHistory;
      setChatLog([...chatHistory]);
      setOnlinePlayers(Object.values(gs.players));
    });

    socket.on("player:joined", (p) => {
      if (p.id === socket.id) {
        gs.me = p;
      } else {
        gs.players[p.id] = p;
      }
      setOnlinePlayers(Object.values(gs.players));
    });

    socket.on("player:moved", (data) => {
      if (gs.players[data.id]) Object.assign(gs.players[data.id], data);
    });

    socket.on("player:left", ({ id }) => {
      delete gs.players[id];
      setOnlinePlayers(Object.values(gs.players));
    });

    socket.on("chat:message", (msg) => {
      chatLogRef.current = [...chatLogRef.current, msg].slice(-50);
      setChatLog([...chatLogRef.current]);
      gs.chatBubbles[msg.id] = { text: msg.text, ts: Date.now() };
    });

    socket.on("player:muted", ({ id, muted }) => {
      if (gs.players[id]) gs.players[id].muted = muted;
      if (id === socket.id) setMicMuted(muted);
    });

    socket.on("kicked", ({ reason }) => setKicked(reason));

    return () => socket.disconnect();
  }, [joined]);

  // ── Game loop ─────────────────────────────────────────────
  useEffect(() => {
    if (!joined) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const gs = gameStateRef.current;

    const onKey = (e) => { gs.keys[e.key] = e.type === "keydown"; };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    function getZone(x) {
      return ZONES.find(z => x >= z.x && x < z.x + z.w) || ZONES[0];
    }

    function loop() {
      if (!gs.me) { animFrameRef.current = requestAnimationFrame(loop); return; }

      const me = gs.me;
      const k = gs.keys;

      // Movement
      let moving = false;
      if (k["ArrowLeft"] || k["a"]) { me.x -= SPEED; me.dir = -1; moving = true; }
      if (k["ArrowRight"] || k["d"]) { me.x += SPEED; me.dir = 1; moving = true; }
      if ((k["ArrowUp"] || k["w"] || k[" "]) && gs.onGround) {
        gs.vy = JUMP_FORCE; gs.onGround = false;
      }

      gs.vy += GRAVITY;
      me.y += gs.vy;

      // Floor collision
      if (me.y >= FLOOR_Y) { me.y = FLOOR_Y; gs.vy = 0; gs.onGround = true; }

      // Platform collision
      PLATFORMS.forEach(p => {
        if (me.x > p.x && me.x < p.x + p.w && me.y >= p.y && me.y <= p.y + 20 && gs.vy >= 0) {
          me.y = p.y; gs.vy = 0; gs.onGround = true;
        }
      });

      // Bounds
      me.x = Math.max(20, Math.min(MAP_W - 20, me.x));

      if (moving || !gs.onGround) gs.anim += 2;

      // Camera
      gs.camX = Math.max(0, Math.min(MAP_W - VIEW_W, me.x - VIEW_W / 2));

      // Emit movement
      if (socketRef.current) {
        socketRef.current.emit("player:move", {
          x: me.x, y: me.y, dir: me.dir, anim: gs.anim,
        });
      }

      // Current zone
      const zone = getZone(me.x);
      setCurrentZone(zone.name);

      // ── Draw ─────────────────────────────────────────────
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      drawBackground(ctx, gs.camX, zone);

      // Draw platforms
      PLATFORMS.forEach(p => {
        const px = p.x - gs.camX;
        if (px < -p.w || px > VIEW_W) return;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.roundRect(px, p.y, p.w, p.h, 5); ctx.fill();
        ctx.fillStyle = "rgba(80,150,255,0.3)";
        ctx.fillRect(px, p.y, p.w, 3);
      });

      // Zone signs at boundaries
      ZONES.forEach(z => {
        const sx = z.x + z.w / 2 - gs.camX;
        if (sx > -100 && sx < VIEW_W + 100) {
          drawZoneSign(ctx, z.name, sx, 50);
        }
      });

      // All players sorted by Y
      const allPlayers = [
        ...Object.values(gs.players),
        { ...me, isMe: true },
      ].sort((a, b) => a.y - b.y);

      allPlayers.forEach(p => {
        const px = p.x - gs.camX;
        if (px < -60 || px > VIEW_W + 60) return;

        drawRobot(ctx, px, p.y, p.color, p.dir || 1, p.anim || 0, p.isMe);

        // Name tag
        ctx.font = "11px sans-serif";
        const nameW = ctx.measureText(p.name || "Player").width + 14;
        const tagX = px - nameW / 2;
        const tagY = p.y - 120;
        ctx.fillStyle = p.isMe ? "rgba(80,200,80,0.8)" : "rgba(0,0,0,0.65)";
        ctx.beginPath(); ctx.roundRect(tagX, tagY, nameW, 17, 4); ctx.fill();
        ctx.fillStyle = p.isMe ? "#000" : (p.color || "#fff");
        ctx.textAlign = "center"; ctx.fillText(p.name || "Player", px, tagY + 12);
        ctx.textAlign = "left";

        // Muted icon
        if (p.muted) {
          ctx.font = "13px sans-serif";
          ctx.fillText("🔇", px + 10, tagY);
        }

        // Chat bubble
        const bubble = gs.chatBubbles[p.id || (p.isMe && socketRef.current?.id)];
        if (bubble && Date.now() - bubble.ts < 4000) {
          ctx.font = "12px sans-serif";
          const bw = Math.min(ctx.measureText(bubble.text).width + 18, 200);
          const bx = px - bw / 2;
          const by = p.y - 140;
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          ctx.beginPath(); ctx.roundRect(bx, by - 18, bw, 22, 8); ctx.fill();
          ctx.fillStyle = "#111";
          ctx.textAlign = "center";
          ctx.fillText(bubble.text.length > 28 ? bubble.text.substring(0, 25) + "…" : bubble.text, px, by);
          ctx.textAlign = "left";
        }
      });

      // Online count HUD
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath(); ctx.roundRect(10, 10, 160, 22, 6); ctx.fill();
      ctx.fillStyle = "#88ccff"; ctx.font = "11px monospace";
      ctx.fillText(`● ${Object.keys(gs.players).length + 1} online  |  ${zone.name}`, 18, 24);

      animFrameRef.current = requestAnimationFrame(loop);
    }

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [joined]);

  // ── Voice chat ────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    const vr = voiceRef.current;
    if (micMuted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        vr.stream = stream;
        setMicMuted(false);
        socketRef.current?.emit("voice:mute", { muted: false });
      } catch (e) {
        alert("Microphone access denied!");
      }
    } else {
      vr.stream?.getTracks().forEach(t => t.stop());
      vr.stream = null;
      setMicMuted(true);
      socketRef.current?.emit("voice:mute", { muted: true });
    }
  }, [micMuted]);

  // ── Chat send ─────────────────────────────────────────────
  const sendChat = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit("chat:message", { text: chatInput });
    gameStateRef.current.chatBubbles[socketRef.current.id] = { text: chatInput, ts: Date.now() };
    setChatInput("");
  };

  // ── Admin actions ─────────────────────────────────────────
  const kickPlayer = (id) => socketRef.current?.emit("admin:kick", { targetId: id, reason: "Kicked by admin" });
  const mutePlayer = (id, muted) => socketRef.current?.emit("admin:mute", { targetId: id, muted });

  // ── Kicked screen ─────────────────────────────────────────
  if (kicked) {
    return (
      <div className={styles.overlay}>
        <div className={styles.kickBox}>
          <h2>You were removed</h2>
          <p>{kicked}</p>
        </div>
      </div>
    );
  }

  // ── Join screen ───────────────────────────────────────────
  if (!joined) {
    return (
      <div className={styles.joinScreen}>
        <div className={styles.joinCard}>
          <h1 className={styles.joinTitle}>🤖 RP Game Room</h1>
          <p className={styles.joinSub}>Multiplayer • Voice Chat • Explore</p>

          <label className={styles.label}>Your Name</label>
          <input
            className={styles.input}
            placeholder="Enter your name..."
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            maxLength={20}
          />

          <label className={styles.label}>Character Color</label>
          <div className={styles.colorRow}>
            {COLORS.map(c => (
              <div key={c}
                className={styles.colorSwatch}
                style={{ background: c, outline: playerColor === c ? `3px solid #fff` : "none" }}
                onClick={() => setPlayerColor(c)}
              />
            ))}
          </div>

          <label className={styles.label}>Admin Password (optional)</label>
          <input
            className={styles.input}
            type="password"
            placeholder="Leave blank if not admin"
            value={adminPassword}
            onChange={e => {
              setAdminPassword(e.target.value);
              setIsAdmin(e.target.value === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"));
            }}
          />

          <button
            className={styles.joinBtn}
            onClick={() => playerName.trim() && setJoined(true)}
            disabled={!playerName.trim()}
          >
            Enter Room →
          </button>
        </div>
      </div>
    );
  }

  // ── Game UI ───────────────────────────────────────────────
  return (
    <div className={styles.gameWrap}>
      {/* Canvas */}
      <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} className={styles.canvas} />

      {/* Zone badge */}
      <div className={styles.zoneBadge}>{currentZone}</div>

      {/* Controls hint */}
      <div className={styles.controlsHint}>WASD / Arrow keys · Space = Jump</div>

      {/* Top right buttons */}
      <div className={styles.topRight}>
        <button className={styles.iconBtn} onClick={toggleMic} title={micMuted ? "Unmute mic" : "Mute mic"}>
          {micMuted ? "🔇" : "🎙️"}
        </button>
        <button className={styles.iconBtn} onClick={() => setShowPlayerList(v => !v)} title="Players">
          👥 {Object.keys(gameStateRef.current.players).length + 1}
        </button>
        {isAdmin && (
          <button className={`${styles.iconBtn} ${styles.adminBtn}`} onClick={() => setShowAdmin(v => !v)}>
            ⚙️ Admin
          </button>
        )}
      </div>

      {/* Player list panel */}
      {showPlayerList && (
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Players Online</div>
          {[gameStateRef.current.me, ...Object.values(gameStateRef.current.players)].filter(Boolean).map(p => (
            <div key={p.id} className={styles.playerRow}>
              <div className={styles.playerDot} style={{ background: p.color }} />
              <span>{p.name} {p.id === socketRef.current?.id ? "(You)" : ""}</span>
              {p.muted && <span className={styles.mutedTag}>muted</span>}
              {isAdmin && p.id !== socketRef.current?.id && (
                <div className={styles.adminActions}>
                  <button onClick={() => mutePlayer(p.id, !p.muted)}>
                    {p.muted ? "Unmute" : "Mute"}
                  </button>
                  <button className={styles.kickBtn} onClick={() => kickPlayer(p.id)}>Kick</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin panel */}
      {showAdmin && isAdmin && (
        <div className={styles.panel}>
          <div className={styles.panelTitle}>⚙️ Admin Controls</div>
          <p className={styles.adminNote}>You have admin access. Use the Players list to mute/kick.</p>
          <button className={styles.dangerBtn} onClick={() => {
            if (confirm("Mute ALL players?")) {
              Object.keys(gameStateRef.current.players).forEach(id => mutePlayer(id, true));
            }
          }}>Mute All Players</button>
        </div>
      )}

      {/* Chat */}
      <div className={styles.chatBox}>
        <div className={styles.chatLog}>
          {chatLog.slice(-20).map((m, i) => (
            <div key={i}>
              <span style={{ color: m.color, fontWeight: 600 }}>{m.name}: </span>
              <span style={{ color: "#ddd" }}>{m.text}</span>
            </div>
          ))}
        </div>
        <div className={styles.chatInputRow}>
          <input
            className={styles.chatInput}
            placeholder="Press Enter to chat..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { sendChat(); e.stopPropagation(); } e.stopPropagation(); }}
            maxLength={120}
          />
          <button className={styles.sendBtn} onClick={sendChat}>Send</button>
        </div>
      </div>
    </div>
  );
}
