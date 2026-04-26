const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../../db");
const config = require("../../../config");

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("promote")
        .setDescription("Log a promotion for a staff member.")
        .addUserOption(option => 
            option.setName("target")
                .setDescription("The staff member who was promoted")
                .setRequired(true))
        .addStringOption(option => 
            option.setName("new_rank")
                .setDescription("The new rank of the staff member")
                .setRequired(true)
                .setMaxLength(1024))
        .addStringOption(option => 
            option.setName("old_rank")
                .setDescription("The previous rank (optional)")
                .setRequired(false)
                .setMaxLength(1024)),
    async execute(interaction, client) {
        const target = interaction.options.getUser("target");
        const newRank = interaction.options.getString("new_rank");
        const oldRank = interaction.options.getString("old_rank") || "N/A";
        const moderator = interaction.user;

        const stmt = db.prepare("INSERT INTO promotions (userId, moderatorId, oldRank, newRank) VALUES (?, ?, ?, ?)");
        try {
            stmt.run(target.id, moderator.id, oldRank || "None", newRank);
        } catch (e) {
            console.error("Database error in promote.js:", e);
            return interaction.reply({ content: "Failed to log promotion due to a database error.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(config.theme.success)
            .setTitle("Staff Promotion Logged")
            .addFields(
                { name: "Staff Member", value: `${target} (${target.id})`, inline: true },
                { name: "Promoted By", value: `${moderator}`, inline: true },
                { name: "Old Rank", value: oldRank, inline: true },
                { name: "New Rank", value: newRank, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: client.user.username });

        await interaction.reply({ embeds: [embed] });

        // Log to announcements or logs
        const announceChannel = await client.channels.fetch(config.channels.announcements).catch(() => null);
        if (announceChannel) {
            await announceChannel.send({
                content: `Congratulations to ${target} on their promotion to **${newRank}**!`,
            });
        }
    },
};
