const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../../config");

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("session-boost")
        .setDescription("Send a session boost announcement."),
    async execute(interaction, client) {
        const { session, theme, roles, channels } = config;

        const pings = roles.notifications.map(id => {
            if (id.toLowerCase() === "everyone") return "@everyone";
            if (id.toLowerCase() === "here") return "@here";
            return `<@&${id}>`;
        }).join(" ");

        const embed = new EmbedBuilder()
            .setColor(theme.color)
            .setTitle("**Session Boost**")
            .setDescription(config.messages.boost)
            .setFooter({ text: `${client.user.username} | Boost` });
        if (session.images?.header?.startsWith("http")) embed.setImage(session.images.header);
        

        let channel;
        if (channels.session) {
            channel = await client.channels.fetch(channels.session).catch(() => null);
        }
        if (!channel) {
            channel = interaction.channel;
        }

        if (channel) {
            await channel.send({
                content: pings || null,
                embeds: [embed],
            });
        }

        await interaction.reply({
            content: "**Successfully** sent a session boost.",
            flags: [64],
        });
    },
};
