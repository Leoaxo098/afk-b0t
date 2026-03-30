// ============================================================
// lib/bot-init.js - SINGLE ENTRY POINT FOR BOT INITIALIZATION
// ============================================================
// This file MUST be imported/required exactly once by the main process.
// Do NOT import this in services (dashboard, monitor, viewer).

const { startDiscordBot } = require('./discord-bot.js');

// Start the Discord bot (only if this is the master process)
if (!process.env.BOT_ID) {
    startDiscordBot();
}

module.exports = {};
