const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../../config");
const crypto = require("crypto");

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("session-start")
        .setDescription("Host a session start up."),
    async execute(interaction, client) {
        // Defer immediately to prevent "Unknown Interaction" (10062) if API is slow
        await interaction.deferReply({ flags: [64] }).catch(() => null);

        const { session, theme, roles, channels } = config;


        let joinBlock = "> **Server Name**: " + (session.serverName || "Not Configured") + "\n" +
            "> **Server Owner**: " + (session.serverOwner || "Not Configured") + "\n" +
            "> **Join Code**: " + (session.joinCode || "Not Configured") + "\n\n";

        if (!session.quickJoinUrl) {
            joinBlock += "> *Note: No quick join link configured. Use the Join Code directly in-game.*";
        }

        const embedHeader = new EmbedBuilder().setColor(theme.color);
        if (session.images?.header?.startsWith("http")) embedHeader.setImage(session.images.header);

        const embedMain = new EmbedBuilder()
            .setColor(theme.color)
            .setTitle("**Session Startup**")
            .setDescription(
                "> A server start-up has been initiated! Please ensure you have read and understood our regulations prior to joining.\n\n" +
                "**Game Information**\n" +
                joinBlock
            )
            .setFooter({ text: client.user.username });
        if (session.images?.footer?.startsWith("http")) embedMain.setImage(session.images.footer);

        const components = [];
        if (session.quickJoinUrl) {
            const startLinkButton = new ButtonBuilder()
                .setLabel("Quick Join")
                .setURL(session.quickJoinUrl)
                .setStyle(ButtonStyle.Link);
            components.push(new ActionRowBuilder().addComponents(startLinkButton));
        }

        // Fetch voters if any
        let votersList = "**No voters recorded!**";
        if (client.voteMap && client.activePollId) {
            const voters = client.voteMap.get(client.activePollId);
            if (voters && voters.size > 0) {
                const votersArray = [...voters.values()];
                votersList = votersArray.map((v) => `<@${v.userId}>`).join(", ");
            }
        }

        try {
            let channel;
            if (channels.session) {
                channel = await client.channels.fetch(channels.session).catch(() => null);
            }
            if (!channel) {
                channel = interaction.channel; // Fallback to current channel if not configured
            }

            if (channel) {
                const pings = roles.notifications.map(id => {
                    if (id.toLowerCase() === "everyone") return "@everyone";
                    if (id.toLowerCase() === "here") return "@here";
                    return `<@&${id}>`;
                }).join(" ");

                const msg = await channel.send({
                    content: `${pings}\n-# ${votersList}`,
                    embeds: embedHeader.data.image ? [embedHeader, embedMain] : [embedMain],
                    components: components
                });

                // Save to DB for Live Auto-Updating Panel
                const db = require("../../../db");
                const sessionIdStr = client.activePollId || crypto.randomBytes(6).toString("hex");
                try {
                    db.prepare("INSERT INTO sessions (id, channelId, messageId) VALUES (?, ?, ?)").run(sessionIdStr, channel.id, msg.id);
                } catch (err) {
                    console.error("Failed to insert session tracking:", err);
                }
            }

            await interaction.editReply({
                content: "**Successfully** hosted a session start up.",
            });
        } catch (error) {
            console.error("[STARTUP COMMAND ERROR]", error);
            await interaction.editReply({
                content: "❌ An error occurred while starting the session. Please check the logs channel.",
            }).catch(() => null);
        }
    },
};
