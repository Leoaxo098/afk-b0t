// ============================================================
// lib/discord-bot.js - DISCORD BOT SINGLETON
// ============================================================
// NO SIDE EFFECTS ON IMPORT
// Only one Discord client instance across entire runtime

const { Client, GatewayIntentBits } = require('discord.js');
const pm2 = require('pm2');
const fs = require('fs');

// Load settings
let config = require('../accounts.json');

// Track bot status updates sent from the workers
const botStatuses = {};

// 🔒 SINGLETON LOCK - prevents ANY duplicate start or login
let started = false;
let client = null;

function saveConfig() {
    fs.writeFileSync('./accounts.json', JSON.stringify(config, null, 2));
}

// Permission Guard
function hasPermission(userId, botId, member) {
    if (member.roles.cache.has(process.env.DISCORD_ADMIN_ROLE_ID)) return true;
    const bot = config.bots.find(b => b.id === botId);
    return bot && bot.assignedUsers.includes(userId);
}

// Send command to worker
function sendToWorker(botId, cmd, args = {}) {
    pm2.list((err, list) => {
        if (err) return console.error('PM2 list error:', err);
        const proc = list.find(p => p.name === `mcbot-${botId}`);
        if (proc) {
            pm2.sendDataToProcessId(
                proc.pm_id,
                { type: 'process:msg', data: { cmd, args }, topic: 'bot_control' },
                () => {}
            );
        }
    });
}

function startDiscordBot() {
    // 🚫 HARD BLOCK duplicate calls
    if (started) {
        return client;
    }
    started = true;

    // 🚫 BLOCK workers
    if (process.env.BOT_ID) {
        started = false;
        return null;
    }

    client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once('ready', () => {
        // Removed debug logging
    });

    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;

        const { commandName, options, user, member } = interaction;
        const botId = options.getString('bot-id');

        const botActions = ['chat', 'cmd', 'tpaccept', 'shard', 'reconnect'];

        if (botActions.includes(commandName)) {
            if (!hasPermission(user.id, botId, member)) {
                return interaction.reply({
                    content: '❌ You do not have permission to control this bot.',
                    ephemeral: true
                });
            }

            if (commandName === 'chat' || commandName === 'cmd') {
                const rawMsg = options.getString('message') || options.getString('command');
                const finalMsg = (commandName === 'cmd' && !rawMsg.startsWith('/')) ? `/${rawMsg}` : rawMsg;

                sendToWorker(botId, 'chat', { message: finalMsg });
                return interaction.reply(`✅ Sent to **${botId}**: \\`${finalMsg}\``);
            } else {
                sendToWorker(botId, commandName);
                return interaction.reply(`✅ Triggered \\`${commandName}\` on **${botId}**`);
            }
        }

        if (commandName === 'bots') {
            let text = '**Active Bots:**\n';
            config.bots.filter(b => b.enabled).forEach(b => {
                const status = botStatuses[b.id] || 'offline/unknown';
                text += `- **${b.id}** (${b.username}): \\`${status}\`\n`;
            });
            return interaction.reply(text);
        }
    });

    // PM2 Bus
    pm2.connect((err) => {
        if (err) return console.error('Error connecting to PM2:', err);

        pm2.launchBus((err, bus) => {
            if (err) return console.error('PM2 Bus Error:', err);

            bus.on('process:msg', (packet) => {
                const data = packet.data;

                if (data.type === 'status') {
                    botStatuses[data.data.id] = data.data.status;
                }

                if (data.type === 'auth_required') {
                    const adminChannelId = process.env.DISCORD_ADMIN_CHANNEL_ID;
                    const adminChannel = client.channels.cache.get(adminChannelId);

                    if (adminChannel) {
                        adminChannel.send(
                            `🔑 **Premium Auth Required for bot \\`${data.data.id}\`**\n` +
                            `\\`\\`\n${data.data.message}\n\\`\\``
                        );
                    }
                }
            });
        });
    });

    // 🔐 LOGIN
    client.login(process.env.DISCORD_TOKEN);

    return client;
}

// GET client (safe, doesn't trigger login)
function getClient() {
    return client;
}

module.exports = { startDiscordBot, getClient };