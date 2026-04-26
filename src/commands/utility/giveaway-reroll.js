const { SlashCommandBuilder } = require("discord.js");
const db = require("../../../db");
const { endGiveaway } = require("../../utils/giveawayUtil");

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("giveaway-reroll")
        .setDescription("Reroll a giveaway winner.")
        .addStringOption(option => 
            option.setName("message_id")
                .setDescription("The message ID of the giveaway")
                .setRequired(true)),
    async execute(interaction, client) {
        const messageId = interaction.options.getString("message_id");

        const giveaway = db.prepare("SELECT * FROM giveaways WHERE messageId = ?").get(messageId);
        if (!giveaway) {
            return interaction.reply({ content: "❌ Giveaway not found. Make sure you have the right message ID.", ephemeral: true });
        }

        // Check there are still remaining (non-winning) entries to draw from
        const remainingEntries = db.prepare("SELECT COUNT(*) as count FROM giveaway_entries WHERE messageId = ?").get(messageId);
        if (remainingEntries.count === 0) {
            return interaction.reply({ content: "❌ No remaining entries to reroll from. All participants have already won.", ephemeral: true });
        }

        // FIXED: Defer the reply immediately — endGiveaway does several async operations
        // (channel fetch, message fetch, message edit, channel.send) that can easily exceed
        // Discord's 3-second interaction response deadline.
        await interaction.deferReply({ ephemeral: true });

        // Set back to active so endGiveaway processes it
        db.prepare("UPDATE giveaways SET status = 'active' WHERE messageId = ?").run(messageId);

        await endGiveaway(client, messageId);

        // Edit the deferred reply now that the work is done
        await interaction.editReply({ content: "🎲 Giveaway has been rerolled successfully!" });
    },
};
