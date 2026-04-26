const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config");
require("./db"); // Initialize DB

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.commands = new Collection();
client.buttons = new Collection(); // Key: customId or customIdPrefix
client.config = config;

// --- Load Commands ---
const foldersPath = path.join(__dirname, "src/commands");
const commandFolders = fs.readdirSync(foldersPath);
const commands = [];

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        }
    }
}

// --- Load Buttons ---
const buttonsPath = path.join(__dirname, "src/buttons");
const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith(".js"));
for (const file of buttonFiles) {
    const button = require(path.join(buttonsPath, file));
    // Support exact customId OR a prefix match (customIdPrefix)
    const key = button.customId || button.customIdPrefix;
    if (key && button.execute) {
        client.buttons.set(key, button);
    }
}

// --- Load Events ---
const eventsPath = path.join(__dirname, "src/events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client, commands));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// --- Global Button Cooldown (per-user, anti-spam) ---
// Prevents any user from clicking any button faster than 1.5 seconds
client.buttonCooldowns = new Map();
client.BUTTON_COOLDOWN_MS = 1500;

// --- Global error safety net ---
// Catches any async errors that slip past local try/catch blocks.
// Without this, Node 22+ will terminate the process on unhandled rejections.
process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err);
    process.exit(1);
});

// --- Final sanity check ---
if (!config.bot.token) {
    console.error("\x1b[31m%s\x1b[0m", "[CRITICAL ERROR] No Discord Token provided! Please update your .env file or config.js with a valid TOKEN.");
    process.exit(1);
}

client.login(config.bot.token).catch(err => {
    if (err.message.includes("Used disallowed intents")) {
        console.error("\x1b[31m%s\x1b[0m", "\n[CONFIGURATION ERROR] Privileged Intents Not Enabled!");
        console.error("\x1b[33m%s\x1b[0m", "The bot requires 'Server Members Intent' and 'Message Content Intent' to function.");
        console.error("\x1b[33m%s\x1b[0m", "Please enable them in the Discord Developer Portal (Bot Tab -> Privileged Gateway Intents).");
        console.error("Application Link: https://discord.com/developers/applications\n");
    } else {
        console.error("\x1b[31m%s\x1b[0m", "[LOGIN ERROR]", err.message);
    }
    process.exit(1);
});
