require('dotenv').config();
const path = require('path');
const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const monitor = require('./lib/monitor.js');
const dashboard = require('./lib/dashboard.js');
const viewer = require('./lib/viewer.js');

const botId = process.env.BOT_ID;
let bot;

function createBot() {
    bot = mineflayer.createBot({
        host: process.env.SERVER_IP,
        port: parseInt(process.env.SERVER_PORT) || 25565,
        version: process.env.SERVER_VERSION,
        username: process.env.BOT_USERNAME,
        password: process.env.BOT_PASSWORD,
        auth: process.env.AUTH_TYPE,
        profilesFolder: path.join(__dirname, 'nmp-cache')
    });

    bot.loadPlugin(pathfinder);

    bot.once('spawn', () => {
        console.log(`[${botId}] Spawned in server.`);
        viewer.start(bot, process.env.VIEWER_PORT);
        if (process.env.SHARD_CHECK === 'true') monitor.startShardMonitor(bot);
        dashboard.start(bot, process.env.PORT);
        
        if (process.send) {
            process.send({ type: 'status', data: { id: botId, status: 'online' } });
        }
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        dashboard.pushChat({ ts: Date.now(), type: 'chat', username, message });
        
        if (process.send) {
            process.send({ type: 'log', data: { id: botId, msg: `<${username}> ${message}` } });
        }
    });

    bot.on('error', (err) => {
        if (err.message.includes('microsoft.com/link')) {
            if (process.send) {
                process.send({ type: 'auth_required', data: { id: botId, message: err.message } });
            }
        }
    });

    bot.on('end', (reason) => {
        if (process.send) {
            process.send({ type: 'status', data: { id: botId, status: 'offline' } });
        }
        setTimeout(createBot, 5000);
    });
}

process.on('message', (msg) => {
    if (!bot || !bot.entity) return;
    if (msg.cmd === 'chat') bot.chat(msg.args.message);
    if (msg.cmd === 'shard') bot.chat('/shard');
    if (msg.cmd === 'tpaccept') bot.chat('/tpaccept');
    if (msg.cmd === 'reconnect') bot.quit();
});

createBot();
