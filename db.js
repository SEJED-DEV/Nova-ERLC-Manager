const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "database.sqlite"));
db.pragma('journal_mode = WAL'); // Enable Write-Ahead Logging for better concurrency
db.pragma('foreign_keys = ON');  // Enable FK enforcement so ON DELETE CASCADE fires

// Initialize tables
db.exec(`
    CREATE TABLE IF NOT EXISTS infractions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        moderatorId TEXT NOT NULL,
        reason TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        moderatorId TEXT NOT NULL,
        oldRank TEXT,
        newRank TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        channelId TEXT NOT NULL,
        messageId TEXT NOT NULL,
        status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS giveaways (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        messageId TEXT NOT NULL UNIQUE,
        channelId TEXT NOT NULL,
        prize TEXT NOT NULL,
        winnersCount INTEGER NOT NULL,
        endTime INTEGER NOT NULL,
        status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS giveaway_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        messageId TEXT NOT NULL,
        userId TEXT NOT NULL,
        enteredAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        UNIQUE(messageId, userId),
        FOREIGN KEY(messageId) REFERENCES giveaways(messageId) ON DELETE CASCADE
    );
`);

module.exports = db;
