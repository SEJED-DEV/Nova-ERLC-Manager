require("dotenv").config();

module.exports = {
    bot: {
        token: process.env.TOKEN,
        name: process.env.BOT_NAME || "Nova ERLC Manager",
        statusText: process.env.BOT_STATUS_TEXT || "Watching ER:LC Private Server",
    },
    erlc: {
        apiKey: process.env.ERLC_API_KEY,
        serverKey: process.env.ERLC_SERVER_KEY,
        baseUrl: "https://api.policeroleplay.community/v2",
    },
    guildId: process.env.GUILD_ID,
    channels: {
        logs: process.env.LOGS_CHANNEL_ID,
        session: process.env.SESSION_CHANNEL_ID,
        announcements: process.env.ANNOUNCEMENTS_CHANNEL_ID,
    },
    roles: {
        staff: process.env.STAFF_ROLE_ID,
        notifications: process.env.NOTIFICATIONS_ROLE_ID,
    },
    session: {
        serverName: process.env.SERVER_NAME,
        serverOwner: process.env.SERVER_OWNER,
        joinCode: process.env.JOIN_CODE,
        quickJoinUrl: process.env.QUICK_JOIN_URL,
        images: {
            header: process.env.HEADER_IMAGE,
            footer: process.env.FOOTER_IMAGE,
        },
        times: {
            weekday: process.env.WEEKDAY_TIME,
            weekend: process.env.WEEKEND_TIME,
        }
    },
    emojis: {
        check: process.env.EMOJI_CHECK || "✅",
        users: process.env.EMOJI_USERS || "👥",
        tada: process.env.EMOJI_TADA || "🎉",
        gift: process.env.EMOJI_GIFT || "🎁",
    },
    messages: {
        boost: (process.env.MSG_SESSION_BOOST || "**The session is currently slow!**\\nWe need more players to keep the session active and high quality.\\nPlease consider joining to support the community!").replace(/\\n/g, '\n'),
        full: (process.env.MSG_SESSION_FULL || "**The server is currently full!**\\nIf you're trying to join, please wait in the queue.\\nPlayers are advised to stay in the queue to ensure their spot when someone leaves.").replace(/\\n/g, '\n'),
        shutdown: (process.env.MSG_SESSION_SHUTDOWN || "**The session has officially concluded.**\\nThank you to everyone who participated and made the RP great!\\nPlease leave the server immediately. Continuous play after shutdown is not permitted.").replace(/\\n/g, '\n'),
    },
    theme: {
        color: "#37373E", // Warm Midnight
        success: "#2ECC71",
        danger: "#E74C3C",
        info: "#3498DB",
    }
};
