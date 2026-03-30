// ============================================================
// index.js - MAIN ENTRY POINT FOR MASTER PROCESS
// ============================================================
// Run with: node index.js

require('dotenv').config();

// Initialize Discord bot (singleton, safe to call once)
const { startDiscordBot } = require('./lib/discord-bot.js');
const { startMasterDashboard } = require('./lib/master.js');

// Start Discord bot (only in master process)
startDiscordBot();

// Start master dashboard aggregator
startMasterDashboard();

console.log('✅ Master process initialized');
