# 🤖 RP Game Room — Whop App

Real-time multiplayer 2D RP game with voice chat, admin controls, and 3 explorable zones.

---

## ✅ Features
- Real-time multiplayer (Socket.io)
- 3 zones: City District, Forest Zone, Space Station
- Voice chat (WebRTC microphone)
- Text chat with speech bubbles
- Admin: mute/kick players
- Platforms to jump on
- Bot-free — only real players

---

## 🚀 Setup Guide (Step by Step)

### Step 1 — GitHub এ upload করো
1. github.com এ যাও → New repository → নাম: `rp-game-room`
2. এই সব files গুলো upload করো (drag & drop করতে পারো)

### Step 2 — Vercel এ deploy করো
1. vercel.com → Add New Project
2. GitHub থেকে `rp-game-room` select করো
3. **Environment Variables** এ যোগ করো:
   - `NEXT_PUBLIC_ADMIN_PASSWORD` = তোমার পছন্দের password
   - `WHOP_API_KEY` = Whop dashboard থেকে
   - `NEXT_PUBLIC_WHOP_APP_ID` = তোমার App ID
4. Deploy করো → URL পাবে (যেমন: https://rp-game-room.vercel.app)

### Step 3 — Vercel এ Socket.io এর জন্য (IMPORTANT)
Vercel serverless এ Socket.io কাজ করে না।
তাই **Railway.app** বা **Render.com** এ deploy করতে হবে:

**Railway (Recommended — Free tier আছে):**
1. railway.app → New Project → Deploy from GitHub
2. `rp-game-room` select করো
3. Environment variables যোগ করো
4. Start command: `npm start`
5. URL পাবে → এটাই Whop App URL হবে

### Step 4 — Whop এ App URL set করো
1. whop.com/dashboard/developer → তোমার App
2. App URL = তোমার Railway/Render URL
3. Save করো
4. Community তে App টি add করো

---

## 🎮 Game Controls
- **Arrow keys / WASD** — Move
- **Space / W / Up** — Jump
- **Enter** — Chat
- **🎙️ button** — Mic on/off
- **👥 button** — Player list

## ⚙️ Admin Controls
- Join screen এ admin password দাও
- Player list থেকে যেকোনো player কে mute/kick করতে পারবে

---

## 📁 File Structure
```
rp-game-room/
├── server.js          ← Socket.io server
├── next.config.js
├── package.json
├── .env.local.example ← Copy করে .env.local বানাও
└── src/
    ├── pages/
    │   ├── index.js   ← Main game
    │   ├── _app.js
    │   └── _document.js
    └── styles/
        └── game.module.css
```
