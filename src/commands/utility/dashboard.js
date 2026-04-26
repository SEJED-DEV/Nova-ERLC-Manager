const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const config = require("../../../config");

let cache = null;
let cacheTimestamp = 0;

module.exports = {
    staffOnly: true,
    data: new SlashCommandBuilder()
        .setName("dashboard")
        .setDescription("View the live ER:LC server dashboard."),
    async execute(interaction, client) {
        const { erlc, theme } = config;

        if (!erlc.serverKey) {
            return interaction.reply({ content: "ERLC Server Key not configured in .env", flags: [64] });
        }

        await interaction.deferReply();

        try {
            let data;
            const now = Date.now();

            // Simple 30-second caching layer
            if (cache && now - cacheTimestamp < 30000) {
                data = cache;
            } else {
                const response = await axios.get(`${erlc.baseUrl}/server`, {
                    headers: { "Server-Key": erlc.serverKey },
                    timeout: 8000, // Prevent hanging indefinitely if the PRC API is slow
                });
                data = response.data;
                cache = data;
                cacheTimestamp = now;
            }
            
            const embed = new EmbedBuilder()
                .setColor(theme.color)
                .setTitle(`📊 Server Dashboard: ${data.Name}`)
                .addFields(
                    { name: "Status", value: "Online ✅", inline: true },
                    { name: "Players", value: `\`${data.CurrentPlayers}/${data.MaxPlayers}\``, inline: true },
                    { name: "Join Key", value: `\`${data.JoinKey || "None"}\``, inline: true },
                    { name: "Team Balance", value: data.TeamBalance ? "Enabled ⚖️" : "Disabled 🔓", inline: true },
                    { name: "Verified Only", value: data.AccVerifiedReq !== "Disabled" ? "Yes 🔐" : "No 🔓", inline: true }
                )
                .setFooter({ text: `Owner ID: ${data.OwnerId}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor(theme.danger || "#E74C3C")
                .setTitle("API Error")
                .setDescription("Failed to fetch data from the PRC API. Ensure your Server Key is correct or try again later.");
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
