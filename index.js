require('dotenv').config();
const { startDiscordBot } = require('./lib/discord-bot');
const { startMasterDashboard } = require('./lib/master');

startDiscordBot();
startMasterDashboard();
console.log('✅ Master process initialized');