const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../../config");

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("session-full")
        .setDescription("Announce that the session is currently full."),
    async execute(interaction, client) {
        const { theme, channels } = config;

        const embed = new EmbedBuilder()
            .setColor(theme.color)
            .setTitle("**Session Full**")
            .setDescription(config.messages.full)
            .setFooter({ text: `${client.user.username} | Capacity Reached` });

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

        await interaction.reply({
            content: "**Successfully** announced the session is full.",
            ephemeral: true,
        });
    },
};
