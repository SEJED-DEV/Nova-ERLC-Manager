const { EmbedBuilder } = require("discord.js");
const config = require("../../config");

module.exports = {
    customIdPrefix: "viewvote:button",
    async execute(interaction, client) {
        const sessionId = interaction.customId.split("_")[1];
        const votes = client.voteMap?.get(sessionId);

        if (!votes || votes.size === 0) {
            return interaction.reply({ content: "No votes yet!", flags: [64] });
        }

        const votersList = [...votes.values()].map(v => `<@${v.userId}>`).join("\n");
        const embed = new EmbedBuilder()
            .setColor(config.theme.color)
            .setTitle("📋 Current Voters")
            .setDescription(votersList)
            .setFooter({ text: `${votes.size} total voter(s)` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: [64] });
    },
};
