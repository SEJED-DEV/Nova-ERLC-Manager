const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../../../db");
const config = require("../../../config");

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("promotion-list")
        .setDescription("View promotion history for a staff member.")
        .addUserOption(option => 
            option.setName("target")
                .setDescription("The staff member to view history for")
                .setRequired(true)),
    async execute(interaction, client) {
        const target = interaction.options.getUser("target");

        const promotions = db.prepare("SELECT * FROM promotions WHERE userId = ? ORDER BY timestamp DESC").all(target.id);

        const embed = new EmbedBuilder()
            .setColor(config.theme.success)
            .setTitle(`Promotion History for ${target.username}`)
            .setThumbnail(target.displayAvatarURL());

        if (promotions.length === 0) {
            embed.setDescription("No promotion history found for this staff member.");
        } else {
            let description = "";
            promotions.forEach((promo) => {
                description += `**${promo.oldRank} → ${promo.newRank}**\nLogged by <@${promo.moderatorId}> on <t:${Math.floor(new Date(promo.timestamp).getTime() / 1000)}:f>\n\n`;
            });
            embed.setDescription(description.slice(0, 4000));
        }

        await interaction.reply({ embeds: [embed] });
    },
};
