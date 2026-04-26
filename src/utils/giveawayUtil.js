const { EmbedBuilder } = require("discord.js");
const db = require("../../db");       // FIXED: was ../db (module not found)
const config = require("../../config"); // FIXED: was ../config (module not found)

// --- Fair winner selection ---
// Math.random()-based sort() is statistically biased (earlier entries win more often).
// Fisher-Yates produces a truly uniform shuffle.
function fisherYatesShuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

async function endGiveaway(client, messageId) {
    const giveaway = db.prepare("SELECT * FROM giveaways WHERE messageId = ? AND status = 'active'").get(messageId);
    if (!giveaway) return;

    // Mark as ended immediately to prevent double-triggers from the reroll command or restarts
    db.prepare("UPDATE giveaways SET status = 'ended' WHERE messageId = ?").run(messageId);

    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel) return;

    const message = await channel.messages.fetch(messageId).catch(() => null);

    // Fetch all entries from the relational table
    const allEntries = db.prepare("SELECT userId FROM giveaway_entries WHERE messageId = ?").all(messageId);

    // --- No entries ---
    if (allEntries.length === 0) {
        if (message) {
            try {
                const embed = EmbedBuilder.from(message.embeds[0])
                    .setDescription("No one entered the giveaway. 😔")
                    .setColor(config.theme.danger)
                    .setFooter({ text: "Giveaway Ended" });
                await message.edit({ embeds: [embed], components: [] });
            } catch (e) {
                console.warn(`[GIVEAWAY] Could not edit no-entries message ${messageId}:`, e.message);
            }
        }
        try {
            await channel.send(`The giveaway for **${giveaway.prize}** ended with no entries.`);
        } catch (e) {
            console.warn(`[GIVEAWAY] Could not send no-entries message to channel ${giveaway.channelId}:`, e.message);
        }
        return;
    }

    // --- Pick winners (Fisher-Yates — no repeats possible) ---
    const entryPool = allEntries.map(r => r.userId);
    const shuffled = fisherYatesShuffle(entryPool);
    const winners = shuffled.slice(0, Math.min(giveaway.winnersCount, shuffled.length));

    // Remove winners from the entry pool so rerolls can't pick the same people
    db.prepare(
        `DELETE FROM giveaway_entries WHERE messageId = ? AND userId IN (${winners.map(() => "?").join(",")})`
    ).run(messageId, ...winners);

    const winnerMentions = winners.map(id => `<@${id}>`).join(", ");

    if (message) {
        try {
            const embed = EmbedBuilder.from(message.embeds[0])
                .setDescription(`**Giveaway Ended!**\n\n**Winners:** ${winnerMentions}\n**Prize:** ${giveaway.prize}`)
                .setColor(config.theme.success)
                .setFooter({ text: "Giveaway Concluded" });
            await message.edit({ embeds: [embed], components: [] });
        } catch (e) {
            console.warn(`[GIVEAWAY] Could not edit giveaway message ${messageId}:`, e.message);
        }
    }

    try {
        await channel.send(`🎉 Congratulations ${winnerMentions}! You won the **${giveaway.prize}**! ${config.emojis.tada}`);
    } catch (e) {
        console.error(`[GIVEAWAY] Could not announce winner in channel ${giveaway.channelId}:`, e.message);
    }
}

module.exports = { endGiveaway };
