const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../../db");
const config = require("../../../config");

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("infraction")
        .setDescription("Issue an infraction to a player.")
        .addUserOption(option => 
            option.setName("target")
                .setDescription("The player to issue an infraction to")
                .setRequired(true))
        .addStringOption(option => 
            option.setName("reason")
                .setDescription("The reason for the infraction")
                .setRequired(true)
                .setMaxLength(1024)),
    async execute(interaction, client) {
        const target = interaction.options.getUser("target");
        const reason = interaction.options.getString("reason");
        const moderator = interaction.user;

        const stmt = db.prepare("INSERT INTO infractions (userId, moderatorId, reason) VALUES (?, ?, ?)");
        try {
            stmt.run(target.id, moderator.id, reason);
        } catch (e) {
            console.error("Database error in infraction.js:", e);
            return interaction.reply({ content: "Failed to issue infraction due to a database error.", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor(config.theme.danger)
            .setTitle("Infraction Issued")
            .addFields(
                { name: "Player", value: `${target} (${target.id})`, inline: true },
                { name: "Moderator", value: `${moderator}`, inline: true },
                { name: "Reason", value: reason }
            )
            .setTimestamp()
            .setFooter({ text: client.user.username });

        await interaction.reply({ embeds: [embed] });

        // DM the user
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(config.theme.danger)
                .setTitle("Notification: Infraction Issued")
                .setDescription(`You have received an infraction in **${interaction.guild.name}**.`)
                .addFields(
                    { name: "Reason", value: reason },
                    { name: "Moderator", value: moderator.username }
                )
                .setTimestamp();
            await target.send({ embeds: [dmEmbed] });
        } catch (e) {
            console.warn(`[INFRACTION DM SKIP] Could not DM user ${target.id}: ${e.message}`);
        }

        // Log to logs channel
        if (config.channels.logs) {
            const logChannel = await client.channels.fetch(config.channels.logs).catch(() => null);
            if (logChannel) {
                await logChannel.send({ 
                    content: `**New Infraction:** ${target}`,
                    embeds: [embed] 
                });
            }
        }
    },
};
