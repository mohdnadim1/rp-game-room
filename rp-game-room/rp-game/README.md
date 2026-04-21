# 🤖 RP Game Room

> Real-time multiplayer 2D roleplay game with voice chat, admin controls, and 3 explorable zones — built as a [Whop](https://whop.com) App.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-white?logo=socket.io&logoColor=black)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🌐 Real-time multiplayer | Powered by Socket.io — all players sync instantly |
| 🗺️ 3 explorable zones | City District, Forest Zone, Space Station |
| 🎙️ Voice chat | WebRTC microphone support |
| 💬 Text chat | In-game chat log + floating speech bubbles |
| 🤖 Custom avatars | Animated robot sprites with player colors |
| 🏔️ Platforms | Jumpable platforms across all zones |
| 🛡️ Admin controls | Mute / kick players from the player list |
| 🚫 Bot-free | Only real players — no bots |

---

## 🎮 Game Controls

| Input | Action |
|---|---|
| `Arrow Keys` / `WASD` | Move left / right |
| `Space` / `W` / `↑` | Jump |
| `Enter` | Open / send chat |
| `🎙️` button | Toggle microphone |
| `👥` button | Toggle player list |

---

## 📁 Project Structure

```
rp-game-room/
├── server.js                  ← Socket.io + Next.js HTTP server
├── next.config.js
├── package.json
├── .env.local.example         ← Copy to .env.local and fill in values
└── src/
    ├── pages/
    │   ├── index.js           ← Main game canvas + UI
    │   ├── _app.js
    │   └── _document.js
    └── styles/
        └── game.module.css
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/rp-game-room.git
cd rp-game-room

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your values

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Create a `.env.local` file based on `.env.local.example`:

```env
NEXT_PUBLIC_ADMIN_PASSWORD=your_admin_password
WHOP_API_KEY=your_whop_api_key
NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Password to unlock admin controls in-game |
| `WHOP_API_KEY` | Found in your Whop developer dashboard |
| `NEXT_PUBLIC_WHOP_APP_ID` | Your Whop App ID |

---

## 🌐 Deployment

> ⚠️ **Important:** Vercel's serverless environment does **not** support persistent Socket.io connections. Deploy to a platform with long-running Node.js processes.

### Recommended: Railway.app (free tier available)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select your `rp-game-room` repository
3. Add your environment variables in the Railway dashboard
4. Set the start command to: `npm start`
5. Copy the generated URL — this becomes your **Whop App URL**

### Alternative: Render.com

Follow the same steps on [render.com](https://render.com) using **Web Service** → Node runtime → start command `npm start`.

---

## 🔗 Whop Integration

1. Go to [whop.com/dashboard/developer](https://whop.com/dashboard/developer)
2. Open your App settings
3. Set **App URL** to your Railway / Render deployment URL
4. Save and add the App to your community

Players will see the game embedded directly in your Whop community.

---

## 🛡️ Admin Controls

- Enter your admin password on the join screen to unlock admin mode
- Open the **Players** panel (`👥`) to view all online players
- From the player list, you can:
  - **Mute / Unmute** any player's voice
  - **Kick** a player from the room
- Use the **⚙️ Admin** panel to mute all players at once

---

## 🔧 Tech Stack

- **[Next.js 14](https://nextjs.org/)** — React framework
- **[Socket.io 4](https://socket.io/)** — Real-time WebSocket communication
- **[Whop SDK](https://whop.com/developers)** — Platform integration
- **HTML5 Canvas** — Game rendering
- **WebRTC** — Browser voice chat

---

## 📜 License

MIT — free to use, modify, and deploy.
