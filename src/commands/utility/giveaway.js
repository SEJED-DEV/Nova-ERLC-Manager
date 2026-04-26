const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ms = require("ms");
const db = require("../../../db");
const config = require("../../../config");

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Giveaway management commands.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("start")
                .setDescription("Start a new giveaway.")
                .addStringOption(option => option.setName("prize").setDescription("What is being given away?").setRequired(true))
                .addStringOption(option => option.setName("duration").setDescription("How long (e.g. 1h, 1d, 30m)").setRequired(true))
                .addIntegerOption(option => option.setName("winners").setDescription("Number of winners").setRequired(false).setMinValue(1))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("end")
                .setDescription("End an active giveaway early.")
                .addStringOption(option => option.setName("message_id").setDescription("The message ID of the giveaway to end").setRequired(true))
        ),
    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === "start") {
            const prize = interaction.options.getString("prize");
            const durationStr = interaction.options.getString("duration");
            const winnersCount = interaction.options.getInteger("winners") || 1;
            
            const durationMs = ms(durationStr);
            if (!durationMs) {
                return interaction.reply({ content: "Invalid duration format. Use 1h, 1d, 30m, etc.", flags: [64] });
            }
            
            if (durationMs > 2147483647) {
                return interaction.reply({ content: "Giveaway duration cannot exceed 24 days.", flags: [64] });
            }

            const endTime = Date.now() + durationMs;
            const endTimestamp = Math.floor(endTime / 1000);

            const embed = new EmbedBuilder()
                .setColor(config.theme.color)
                .setTitle("🎉 NEW GIVEAWAY")
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

            // Handle multiple notification pings
            const pings = config.roles.notifications.map(id => {
                if (id.toLowerCase() === "everyone") return "@everyone";
                if (id.toLowerCase() === "here") return "@here";
                return `<@&${id}>`;
            }).join(" ");

            const msg = await interaction.reply({ 
                content: pings || null,
                embeds: [embed], 
                components: [row], 
                fetchReply: true 
            });

            try {
                db.prepare(
                    "INSERT INTO giveaways (messageId, channelId, prize, winnersCount, endTime) VALUES (?, ?, ?, ?, ?)"
                ).run(msg.id, interaction.channel.id, prize, winnersCount, endTime);

                setTimeout(() => client.emit("giveawayEnd", msg.id), durationMs);
            } catch (e) {
                console.error("[GIVEAWAY] Database error in giveaway.js:", e);
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("giveaway_join")
                        .setLabel("Giveaway Failed")
                        .setEmoji(config.emojis.tada)
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                );
                await msg.edit({ components: [disabledRow] }).catch(() => null);
            }

        } else if (sub === "end") {
            const messageId = interaction.options.getString("message_id");
            
            const giveaway = db.prepare("SELECT * FROM giveaways WHERE messageId = ?").get(messageId);
            if (!giveaway) {
                return interaction.reply({ content: "Could not find an active giveaway with that message ID.", flags: [64] });
            }

            if (giveaway.status !== "active") {
                return interaction.reply({ content: "That giveaway has already ended.", flags: [64] });
            }

            // Trigger the end event immediately
            client.emit("giveawayEnd", messageId);

            await interaction.reply({ content: `**Successfully** ended giveaway \`${messageId}\`.`, flags: [64] });
        }
    },
};
