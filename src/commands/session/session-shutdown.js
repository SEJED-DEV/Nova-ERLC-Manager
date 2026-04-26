const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../../config");

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("session-shutdown")
        .setDescription("Announce the session shutdown."),
    async execute(interaction, client) {
        // Defer immediately to prevent "Unknown Interaction" (10062) if API is slow
        await interaction.deferReply({ flags: [64] }).catch(() => null);

        const { theme, channels } = config;

        const embed = new EmbedBuilder()
            .setColor(config.theme.danger)
            .setTitle("**Session Shutdown**")
            .setDescription(config.messages.shutdown)
            .setFooter({ text: `${client.user.username} | Session Over` });

        try {
            let channel;
            if (channels.session) {
                channel = await client.channels.fetch(channels.session).catch(() => null);
            }
            if (!channel) {
                channel = interaction.channel;
            }

            if (channel) {
                await channel.send({ embeds: [embed] });
            }

            // Clean up voting map and live session tracking
            if (client.voteMap) {
                client.voteMap.clear();
                client.activePollId = null;
            }

            const db = require("../../../db");
            try {
                db.prepare("UPDATE sessions SET status = 'ended' WHERE status = 'active'").run();
            } catch (e) {
                console.error("Database error in session-shutdown.js:", e);
            }

            await interaction.editReply({
                content: "**Successfully** announced the session shutdown and stopped the live tracking panel.",
            });
        } catch (error) {
            console.error("[SHUTDOWN COMMAND ERROR]", error);
            await interaction.editReply({
                content: "❌ An error occurred during shutdown. Please check the logs channel.",
            }).catch(() => null);
        }
    },
};
