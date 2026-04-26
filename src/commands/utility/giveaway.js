const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ms = require("ms");
const db = require("../../../db");
const config = require("../../../config");

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Start a giveaway.")
        .addStringOption(option => 
            option.setName("prize")
                .setDescription("What is being given away?")
                .setRequired(true))
        .addStringOption(option => 
            option.setName("duration")
                .setDescription("How long (e.g. 1h, 1d, 30m)")
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName("winners")
                .setDescription("Number of winners")
                .setRequired(false)
                .setMinValue(1)),
    async execute(interaction, client) {
        const prize = interaction.options.getString("prize");
        const durationStr = interaction.options.getString("duration");
        const winnersCount = interaction.options.getInteger("winners") || 1;
        
        const durationMs = ms(durationStr);
        if (!durationMs) {
            return interaction.reply({ content: "Invalid duration format. Use 1h, 1d, 30m, etc.", ephemeral: true });
        }
        
        // Fix Node.js setTimeout 32-bit integer overflow bug (max ~24.8 days)
        if (durationMs > 2147483647) {
            return interaction.reply({ content: "Giveaway duration cannot exceed 24 days.", ephemeral: true });
        }

        const endTime = Date.now() + durationMs;
        const endTimestamp = Math.floor(endTime / 1000);

        const embed = new EmbedBuilder()
            .setColor(config.theme.color)
            .setTitle(`${config.emojis.gift} NEW GIVEAWAY`)
            .setDescription(
                `**Prize:** ${prize}\n` +
                `**Winners:** ${winnersCount}\n` +
                `**Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)\n\n` +
                `Click the button below to enter!`
            )
            .setFooter({ text: `Hosted by ${interaction.user.username}` })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("giveaway_join")
                .setLabel("Join Giveaway")
                .setEmoji(config.emojis.tada)
                .setStyle(ButtonStyle.Primary)
        );

        const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        // FIXED: setTimeout now lives inside the try block. If the DB write fails,
        // the timer is never registered and the broken join-button message is edited
        // to notify the error — rather than silently leaving a dead giveaway on screen.
        try {
            db.prepare(
                "INSERT INTO giveaways (messageId, channelId, prize, winnersCount, endTime) VALUES (?, ?, ?, ?, ?)"
            ).run(msg.id, interaction.channel.id, prize, winnersCount, endTime);

            // Only schedule the end after a confirmed DB write
            setTimeout(() => client.emit("giveawayEnd", msg.id), durationMs);
        } catch (e) {
            console.error("[GIVEAWAY] Database error in giveaway.js:", e);
            // Disable the join button so users can't interact with a giveaway that isn't tracked
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("giveaway_join")
                    .setLabel("Giveaway Failed")
                    .setEmoji(config.emojis.tada)
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );
            await msg.edit({ components: [disabledRow] }).catch(() => null);
            return interaction.followUp({ content: "❌ Failed to start giveaway due to a database error. The message has been disabled.", ephemeral: true });
        }
    },
};
