const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const config = require("../../config");

// Tracks pending message edit timers per sessionId to debounce rapid updates
const editDebounceTimers = new Map();

// Sends DMs to voters one at a time to avoid triggering Discord's DM rate limits
async function sendDMQueue(client, votersArray, startLinkButton) {
    for (const v of votersArray) {
        try {
            const user = await client.users.fetch(v.userId);
            const dmEmbed = new EmbedBuilder()
                .setColor(config.theme.color)
                .setDescription(
                    `Hey <@${v.userId}>, thanks for voting! The session is starting now. ` +
                    `Please join to avoid moderation.`
                );
            await user.send({ embeds: [dmEmbed], components: [startLinkButton] });
        } catch (e) {
            // DMs can be closed — this is expected and not a critical error
            console.warn(`[DM SKIP] Could not DM user ${v.userId}: ${e.message}`);
        }
        // 1-second gap between each DM to stay well within Discord's rate limits
        await new Promise(res => setTimeout(res, 1000));
    }
}

module.exports = {
    // Matches on the action prefix (split by "_")
    customIdPrefix: "vote:button",
    async execute(interaction, client) {
        // Parse the customId: "vote:button_<sessionId>_<requiredVotes>"
        const parts = interaction.customId.split("_");
        const sessionId = parts[1];
        const REQUIRED_VOTES = parseInt(parts[2]) || 7;

        // Initialise vote map for this session if needed
        if (!client.voteMap) client.voteMap = new Map();
        if (!client.voteMap.has(sessionId)) {
            client.voteMap.set(sessionId, new Map());

            // FIXED: Only register activePollId if nothing else is currently active.
            // Previously this unconditionally overwrote activePollId, so back-to-back
            // /session-vote calls would cause session-start to read voters from the wrong poll.
            if (!client.activePollId) {
                client.activePollId = sessionId;
            }

            // GC: abandon polls that never reach the vote threshold
            setTimeout(() => {
                if (client.voteMap?.has(sessionId)) {
                    client.voteMap.delete(sessionId);
                    if (client.activePollId === sessionId) client.activePollId = null;
                }
            }, 3600000); // 1 hour
        }

        const votes = client.voteMap.get(sessionId);

        // If session was already triggered by another concurrent click, bail out
        if (!votes) {
            return interaction.reply({ content: "This vote has already concluded!", ephemeral: true });
        }

        const userId = interaction.user.id;
        const hasVoted = votes.has(userId);

        if (hasVoted) {
            votes.delete(userId);
            await interaction.reply({ content: "Your vote has been removed.", ephemeral: true });
        } else {
            votes.set(userId, { userId, timestamp: Date.now() });
            await interaction.reply({ content: "Your vote has been counted!", ephemeral: true });
        }

        const count = votes.size;

        // --- DEBOUNCED message edit ---
        // Cancel any pending edit timer for this session and set a fresh one.
        // This means no matter how many people click at once, the message is
        // only ever edited once per 1.5 seconds, protecting against rate limits.
        if (editDebounceTimers.has(sessionId)) {
            clearTimeout(editDebounceTimers.get(sessionId));
        }
        editDebounceTimers.set(sessionId, setTimeout(async () => {
            editDebounceTimers.delete(sessionId);

            // Re-read the live vote count at the time of editing (may have changed)
            const liveVotes = client.voteMap?.get(sessionId);
            const liveCount = liveVotes ? liveVotes.size : count;

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`vote:button_${sessionId}_${REQUIRED_VOTES}`)
                    .setEmoji(config.emojis.check)
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`viewvote:button_${sessionId}`)
                    .setLabel(`View Voters (${liveCount})`)
                    .setEmoji(config.emojis.users)
                    .setStyle(ButtonStyle.Secondary)
            );

            await interaction.message.edit({ components: [row] }).catch(() => null);
        }, 1500));

        // --- ATOMIC session start ---
        // Check threshold THEN atomically delete the state before doing any async work.
        // Any concurrent click that reaches here after the delete will hit the guard above (votes is null).
        if (count >= REQUIRED_VOTES && client.voteMap.has(sessionId)) {
            const votersArray = [...votes.values()];

            // Immediately clear the state — this is the thread lock. Any concurrent
            // execution that reaches the vote.has(sessionId) check after this line will bail.
            client.voteMap.delete(sessionId);
            if (client.activePollId === sessionId) client.activePollId = null;

            // Cancel any pending debounced edit since we're deleting the message anyway
            if (editDebounceTimers.has(sessionId)) {
                clearTimeout(editDebounceTimers.get(sessionId));
                editDebounceTimers.delete(sessionId);
            }

            const votersMentions = votersArray.map(v => `<@${v.userId}>`).join(", ");
            const { session, theme, roles } = config;

            const embedMain = new EmbedBuilder()
                .setColor(theme.success)
                .setTitle("**Session Started!**")
                .setDescription(
                    "> The session has reached the required votes and is now starting!\n\n" +
                    "**Game Information**\n" +
                    "> **Server Name**: " + (session.serverName || "N/A") + "\n" +
                    "> **Join Code**: " + (session.joinCode || "N/A") + "\n\n"
                );
            
            if (session.images.header) embedMain.setImage(session.images.header);

            const quickJoinLink = session.quickJoinUrl || "https://policeroleplay.community/";
            const startLinkButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Quick Join")
                    .setURL(quickJoinLink)
                    .setStyle(ButtonStyle.Link)
            );

            const pings = roles.notifications.map(id => {
                if (id.toLowerCase() === "everyone") return "@everyone";
                if (id.toLowerCase() === "here") return "@here";
                return `<@&${id}>`;
            }).join(" ");

            try {
                await interaction.channel.send({
                    content: `${pings} Session is starting thanks to: ${votersMentions}`,
                    embeds: [embedMain],
                    components: [startLinkButton],
                });
            } catch (e) {
                console.error("[SESSION START ERROR] Could not send session started message:", e.message);
            }

            // Delete the voting panel
            try { await interaction.message.delete(); } catch (e) {}

            // Fire and forget the DM queue — doesn't block the interaction response.
            // FIXED: Added .catch() so errors from sendDMQueue don't become unhandled rejections.
            sendDMQueue(client, votersArray, startLinkButton).catch(e =>
                console.error("[DM QUEUE ERROR] sendDMQueue threw unexpectedly:", e.message)
            );
        }
    },
};
