const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const crypto = require("crypto");
const config = require("../../../config");

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("session-vote")
        .setDescription("Host a session vote.")
        .addIntegerOption(option => 
            option.setName("required_votes")
                .setDescription("The number of votes required to automatically start the session.")
                .setRequired(true)
                .setMinValue(1)),
    generateSessionId() {
        return crypto.randomBytes(6).toString("hex");
    },
    async execute(interaction, client) {
        const pollSessionId = this.generateSessionId();
        const requiredVotes = interaction.options.getInteger("required_votes");
        const { session, theme, roles, channels, emojis } = config;

        // Register this poll as the active one immediately (before anyone clicks).
        // vote_button.js will skip overwriting if activePollId is already set,
        // so the first /session-vote always wins.
        if (!client.voteMap) client.voteMap = new Map();
        client.voteMap.set(pollSessionId, new Map());
        client.activePollId = pollSessionId;

        // GC: abandon the poll if it never reaches the vote threshold within 1 hour
        setTimeout(() => {
            if (client.voteMap?.has(pollSessionId)) {
                client.voteMap.delete(pollSessionId);
                if (client.activePollId === pollSessionId) client.activePollId = null;
            }
        }, 3600000);

        const pings = roles.notifications.map(id => {
            if (id.toLowerCase() === "everyone") return "@everyone";
            if (id.toLowerCase() === "here") return "@here";
            return `<@&${id}>`;
        }).join(" ");

        const embedHeader = new EmbedBuilder().setColor(theme.color);
        if (session.images.header) embedHeader.setImage(session.images.header);

        const embedMain = new EmbedBuilder()
            .setColor(theme.color)
            .setTitle("Session Vote")
            .setDescription(
                `> Please cast your vote below for the upcoming session. We require **${requiredVotes} votes** to start a session. \n\n` +
                `> If you vote, you are committing to join. Failure to participate after voting will result in moderation.`
            )
            .setFooter({ text: client.user.username });
        
        if (session.images.footer) embedMain.setImage(session.images.footer);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`vote:button_${pollSessionId}_${requiredVotes}`)
                .setEmoji(emojis.check)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`viewvote:button_${pollSessionId}`)
                .setLabel("View Voters")
                .setEmoji(emojis.users)
                .setStyle(ButtonStyle.Secondary)
        );

        let channel;
        if (channels.session) {
            channel = await client.channels.fetch(channels.session).catch(() => null);
        }
        
        if (!channel) {
            channel = interaction.channel; // Fallback to current channel if not configured
        }

        await channel.send({
            content: pings || null,
            embeds: embedHeader.data.image ? [embedHeader, embedMain] : [embedMain],
            components: [row],
        });

        await interaction.reply({
            content: `**Successfully** hosted a session vote requiring ${requiredVotes} votes.`,
            ephemeral: true,
        });
    },
};
