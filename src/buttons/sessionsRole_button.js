const config = require("../../config");

module.exports = {
    // Matches on the full customId
    customId: "sessionsRole:button",
    async execute(interaction) {
        const roleId = config.roles.notifications;
        if (!roleId) {
            return interaction.reply({ content: "⚠️ Notification role is not configured.", ephemeral: true });
        }

        if (!interaction.member) {
            return interaction.reply({ content: "⚠️ This button can only be used within a server.", ephemeral: true });
        }

        try {
            const hasRole = interaction.member.roles.cache.has(roleId);
            if (hasRole) {
                await interaction.member.roles.remove(roleId);
                return interaction.reply({ content: "🔕 Notification role removed.", ephemeral: true });
            } else {
                await interaction.member.roles.add(roleId);
                return interaction.reply({ content: "🔔 Notification role added.", ephemeral: true });
            }
        } catch (err) {
            console.error(`[ROLE TOGGLE ERROR] Could not update role ${roleId} for user ${interaction.user.id}:`, err.message);
            // Specific, helpful user-facing message
            const msg = err.code === 50013
                ? "I don't have permission to manage that role. Please check my role hierarchy."
                : "An error occurred while toggling your notification role. Please try again.";
            return interaction.reply({ content: `⚠️ ${msg}`, ephemeral: true });
        }
    },
};
