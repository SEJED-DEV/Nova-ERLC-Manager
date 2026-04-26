<div align="center">

# 🚔 Nova ERLC Manager

**The Ultimate Private Server Infrastructure for Discord**

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![SQLite](https://img.shields.io/badge/SQLite-Local-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Performance](https://img.shields.io/badge/Performance-Optimized-orange?style=for-the-badge)](#)

<br/>

> **Nova ERLC Manager** is a premium, feature-rich bot engineered directly for communities running **Emergency Response: Liberty County** Private Servers. Built for stability, it integrates the PRC API with local persistence, high-end aesthetics, and enterprise-grade error handling.

[Setup Guide](#-setup--installation) • [Commands](#-command-encyclopedia) • [Config Docs](#-configuration-variables) • [Changelog](./CHANGELOG.md)

</div>

---

## 🛠️ Stability Update (v1.0.1)
The latest version includes critical stability fixes:
- **Zero-Error Architecture**: Fixed all relative pathing issues that caused `MODULE_NOT_FOUND` errors in command subdirectories.
- **Enhanced Security**: Obfuscated internal bypass identifiers to protect server ownership logic.
- **Improved Performance**: Optimized interaction handlers for faster response times.

---

## 🚀 Key Features

### 🎮 Industrial-Grade Session Management
Trigger hyper-engaged roleplay sessions with a single command. 
- **Automated Startup**: Threshold-based voting systems that auto-launch sessions.
- **Live Status Panel**: Continuous server monitoring embedded into your Discord channel, powered by a safe recursive loop that prevents API call pile-ups.
- **Dynamic Quick-Join**: One-tap joining directly from Discord to the Roblox server.
- **DM Notifications**: Voters receive a direct message when their session officially starts, delivered via a safe 1-second-gapped queue to respect Discord's rate limits.

### 🛡️ Secure Staff & Moderation
Retain pristine operations with a lightweight, local SQLite database.
- **Persistence**: Every infraction and promotion is stored locally—no external API dependencies.
- **History Tracking**: Pull comprehensive timelines for any user to identify repeat offenders or dedicated staff.
- **Permission Locked**: Integrated role-based security ensuring only authorized staff can access sensitive commands.

### 🎉 Mathematically Shielded Giveaways
A giveaway framework that actually works.
- **Crash Persistence**: Active giveaways resume automatically even after a bot restart.
- **Relational Entry Storage**: Entries are stored in a dedicated `giveaway_entries` SQL table with a `UNIQUE` constraint — duplicate joins are prevented at the database level.
- **Anti-Duplicate Rerolls**: Winners are removed from the entry pool after selection, so rerolls always pick valid, new participants.
- **Performance Optimized**: Handles thousands of entries without lagging the Discord heartbeat.

### ⚙️ Professional Engineering
- **Modular Button System**: All button interactions live in dedicated `src/buttons/` files for clean, maintainable code.
- **Global Anti-Spam Cooldown**: A per-user 1.5-second cooldown enforced across all buttons to prevent spam and accidental double-clicks.
- **Debounced Vote Updates**: Voting panel message edits are debounced — no matter how many users click at once, the panel updates at most once per 1.5 seconds, keeping the bot well within Discord's rate limits.
- **Atomic Race Condition Prevention**: Session vote tabulation uses an atomic state-delete lock to guarantee a session can only be triggered once, even under heavy concurrent load.
- **Rate Limit Resilience**: Staggered API calls and a 10-second axios timeout prevent Discord and PRC rate limit bans.
- **Global Error Logging**: Real-time stack traces forwarded to a dedicated Discord channel for developers.
- **Garbage Collection**: Automated memory management for expired polls and temporary caches.

---

## 📁 Project Structure

```
Nova-ERLC-Manager/
├── index.js              # Entry point — loads commands, buttons, events & cooldowns
├── config.js             # Centralised config (reads from .env)
├── db.js                 # SQLite schema initialisation
└── src/
    ├── commands/
    │   ├── session/      # session-start, session-vote, session-boost, -full, -shutdown
    │   ├── staff/        # infraction, infractions-list, promote, promotion-list
    │   └── utility/      # giveaway, giveaway-reroll, dashboard
    ├── buttons/          # Modular button handlers (one file per interaction type)
    │   ├── vote_button.js
    │   ├── viewvote_button.js
    │   ├── giveaway_join_button.js
    │   └── sessionsRole_button.js
    ├── events/
    │   ├── ready.js          # Startup, slash command registration, live panel loop
    │   ├── interactionCreate.js  # Interaction router + cooldown enforcement
    │   └── giveawayEnd.js    # Internal giveaway timer event
    └── utils/
        └── giveawayUtil.js   # Giveaway winner logic (SQL-based)
```

---

## 📖 Command Encyclopedia

### 🚨 Session Operations
| Command | Description | Recommended Usage |
|:--- |:--- |:--- |
| `/session-vote` | Starts a threshold poll for a session. | Use before a scheduled RP. |
| `/session-start` | Starts the session and initializes the Live Panel. | Use when players are ready. |
| `/session-boost` | Alerts players that the server is currently slow. | Use during low-activity hours. |
| `/session-full` | Notifies the community the server is full/queueing. | Use when server hits cap. |
| `/session-shutdown` | Concludes the session and stops live tracking. | Use at the end of every RP. |

### 🔨 Staff Management
| Command | Description | Options |
|:--- |:--- |:--- |
| `/infraction` | Issue a permanent strike against a user. | `target`, `reason` |
| `/infractions-list`| View every strike recorded for a user. | `target` |
| `/promote` | Formalize and log a staff promotion. | `target`, `new_rank`, `(old_rank)` |
| `/promotion-list` | View a user's entire team timeline. | `target` |

### 🎁 Utility & Dashboards
| Command | Description | Details |
|:--- |:--- |:--- |
| `/giveaway` | Host a timed giveaway with buttons. | `prize`, `duration`, `(winners)` |
| `/giveaway-reroll`| Roll a new winner for an existing giveaway. | `message_id` |
| `/dashboard` | Instant view of live RPC Node stats. | Shows join code, player count, etc. |

---

## 🛠️ Setup & Installation

Follow these steps to deploy Nova to your community within 5 minutes.

### 1. Prerequisites
- **Node.js**: v16.14.0 or higher.
- **Git**: (Optional) For cloning the repository.
- **Discord Bot Token**: From the [Discord Developer Portal](https://discord.com/developers/applications).

### 2. Manual Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd Nova-ERLC-Manager

# Install dependencies
npm install
```

### 3. Configuration (`.env`)
Configuration is handled via environment variables. Rename `.env.example` to `.env` and fill in the following:

| Variable | Description | Requirement |
|:--- |:--- |:--- |
| `TOKEN` | Your Discord Bot Token. | **Crucial** |
| `GUILD_ID` | The ID of your Discord Server. | **Crucial** |
| `STAFF_ROLE_ID`| The ID of the role allowed to use staff commands. | Required |
| `NOTIFICATIONS_ROLE_ID`| Comma-separated list of IDs to ping. Supports `everyone` and `here`. | Optional |
| `ERLC_SERVER_KEY`| The API Key from your PRC Private Server Panel. | Highly Recommended |
| `LOGS_CHANNEL_ID`| Channel where infractions and **errors** are sent. | Recommended |

### 4. Custom Branding
You can customize the **Warm Midnight** aesthetic (`#37373E`) and all bot emojis inside the `.env` file or `config.js`. Replacing generic emojis with your server's custom ones is fully supported!

### 5. Start the Bot
```bash
node index.js
```

---

## 🛡️ Reliability & Security
Nova's core engine is built with safety in mind:
- **Write-Ahead Logging (WAL)**: Enabled by default to prevent SQLite database corruption during high-traffic events.
- **Relational Database Design**: Giveaway entries use a proper `UNIQUE` constrained table, making duplicates structurally impossible.
- **Ephemerality**: Sensitive error information is kept private to staff members.
- **Atomic Thread Safety**: Session votes use an immediate state-delete lock to prevent multiple simultaneous session starts, even with concurrent button clicks.
- **Debounce & Cooldowns**: A 1.5s per-user global button cooldown and a debounced vote panel updater protect against Discord API rate limits.
- **Safe Recursive Live Panel**: The live panel uses a `while + await` loop instead of `setInterval`, ensuring API calls can never overlap or pile up during slow network periods.

---

## 📞 Dev & Support

Created and maintained for the high-end ERLC community.

<div align="center">

[![Discord Support](https://img.shields.io/badge/Discord-Join_Community-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/5avw5xbBdV)
[![Instagram](https://img.shields.io/badge/Instagram-@http.sejed.official-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/http.sejed.official/)

</div>
