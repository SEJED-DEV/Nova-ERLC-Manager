const db = require("../../db");

module.exports = {
    customId: "giveaway_join",
    async execute(interaction) {
        const userId = interaction.user.id;
        const messageId = interaction.message.id;

        // Verify the giveaway is still active
        const giveaway = db.prepare("SELECT id FROM giveaways WHERE messageId = ? AND status = 'active'").get(messageId);
        if (!giveaway) {
            return interaction.reply({ content: "This giveaway has ended or does not exist.", ephemeral: true });
        }

        try {
            // INSERT OR IGNORE: if the UNIQUE(messageId, userId) constraint fires,
            // the row is not inserted and changes() returns 0 — no crash, no duplicate.
            const result = db.prepare(
                "INSERT OR IGNORE INTO giveaway_entries (messageId, userId) VALUES (?, ?)"
            ).run(messageId, userId);

            if (result.changes === 0) {
                return interaction.reply({ content: "You have already joined this giveaway.", ephemeral: true });
            }

            const entryCount = db.prepare("SELECT COUNT(*) as count FROM giveaway_entries WHERE messageId = ?").get(messageId).count;
            return interaction.reply({
                content: `🎉 You've successfully joined the giveaway! There are now **${entryCount}** entries.`,
                ephemeral: true,
            });
        } catch (err) {
            console.error("[GIVEAWAY JOIN ERROR]", err);
            const reply = { content: "An error occurred while joining the giveaway. Please try again.", ephemeral: true };
            if (interaction.replied || interaction.deferred) return interaction.followUp(reply).catch(() => null);
            return interaction.reply(reply).catch(() => null);
        }
    },
};
