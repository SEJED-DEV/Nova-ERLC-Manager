const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../../db");
const config = require("../../../config");

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("infractions-list")
        .setDescription("View infractions for a specific player.")
        .addUserOption(option => 
            option.setName("target")
                .setDescription("The player to view infractions for")
                .setRequired(true)),
    async execute(interaction, client) {
        const target = interaction.options.getUser("target");

        const infractions = db.prepare("SELECT * FROM infractions WHERE userId = ? ORDER BY timestamp DESC").all(target.id);

        const embed = new EmbedBuilder()
            .setColor(config.theme.color)
            .setTitle(`Infractions for ${target.username}`)
            .setThumbnail(target.displayAvatarURL());

        if (infractions.length === 0) {
            embed.setDescription("This player has no infractions.");
        } else {
            let description = "";
            infractions.forEach((inf, index) => {
                description += `**ID: ${inf.id}** | Reason: ${inf.reason}\nIssued by <@${inf.moderatorId}> on <t:${Math.floor(new Date(inf.timestamp).getTime() / 1000)}:f>\n\n`;
            });
            embed.setDescription(description.slice(0, 4000)); // Limit to avoid size issues
            embed.setFooter({ text: `${infractions.length} total infractions` });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
