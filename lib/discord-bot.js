require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const pm2 = require('pm2');
const fs = require('fs');

let config = require('../accounts.json');
const botStatuses = {};

let started = false;
let client = null;

function saveConfig() {
    fs.writeFileSync('./accounts.json', JSON.stringify(config, null, 2));
}

function hasPermission(userId, botId, member) {
    if (member.roles.cache.has(process.env.DISCORD_ADMIN_ROLE_ID)) return true;
    const bot = config.bots.find(b => b.id === botId);
    return bot && bot.assignedUsers.includes(userId);
}

function sendToWorker(botId, cmd, args) {
    pm2.list((err, list) => {
        if (err) return console.error('PM2 list error:', err);
        const proc = list.find(p => p.name === 'mcbot-' + botId);
        if (proc) {
            pm2.sendDataToProcessId(
                proc.pm_id,
                { type: 'process:msg', data: { cmd, args }, topic: 'bot_control' },
                (err) => { if (err) console.error('Send error:', err); }
            );
        }
    });
}

function startDiscordBot() {
    console.log('startDiscordBot called');
    
    if (started) {
        console.log('Already started, returning existing client');
        return client;
    }
    
    started = true;

    if (process.env.BOT_ID) {
        console.log('Worker process, skipping Discord bot');
        return null;
    }

    console.log('Creating new Discord client');
    client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once('ready', () => {
        console.log('Discord Bot logged in as ' + client.user.tag);
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const commandName = interaction.commandName;
        const botId = interaction.options.getString('bot-id');

        try {
            if (commandName === 'chat' || commandName === 'cmd') {
                const rawMsg = interaction.options.getString('message') || interaction.options.getString('command') || '';
                const finalMsg = (commandName === 'cmd' && !rawMsg.startsWith('/')) ? '/' + rawMsg : rawMsg;
                
                if (!hasPermission(interaction.user.id, botId, interaction.member)) {
                    return await interaction.reply({ content: 'No permission', ephemeral: true });
                }
                
                sendToWorker(botId, 'chat', { message: finalMsg });
                return await interaction.reply('Sent to ' + botId + ': ' + finalMsg);
            } 
            else if (commandName === 'tpaccept' || commandName === 'shard' || commandName === 'reconnect') {
                if (!hasPermission(interaction.user.id, botId, interaction.member)) {
                    return await interaction.reply({ content: 'No permission', ephemeral: true });
                }
                
                sendToWorker(botId, commandName);
                return await interaction.reply('Command sent: ' + commandName);
            }
            else if (commandName === 'add-bot') {
                if (!interaction.member.roles.cache.has(process.env.DISCORD_ADMIN_ROLE_ID)) {
                    return await interaction.reply({ content: 'Admin only', ephemeral: true });
                }
                
                const newBotId = interaction.options.getString('bot-id');
                const newBotUsername = interaction.options.getString('username');
                const newBotPort = interaction.options.getInteger('port') || 3000;
                
                if (!config.bots) config.bots = [];
                
                const existing = config.bots.find(b => b.id === newBotId);
                if (existing) {
                    return await interaction.reply('Bot already exists: ' + newBotId);
                }
                
                config.bots.push({
                    id: newBotId,
                    username: newBotUsername,
                    port: newBotPort,
                    viewerPort: newBotPort + 1000,
                    enabled: true,
                    assignedUsers: [interaction.user.id]
                });
                
                saveConfig();
                return await interaction.reply('Bot added: ' + newBotId);
            }
            else if (commandName === 'link') {
                const botId = interaction.options.getString('bot-id');
                const bot = config.bots.find(b => b.id === botId);
                
                if (!bot) {
                    return await interaction.reply('Bot not found: ' + botId);
                }
                
                const dashboardUrl = 'http://localhost:' + bot.port;
                return await interaction.reply('Dashboard: ' + dashboardUrl);
            }
            else if (commandName === 'bots') {
                let text = 'Active Bots:\n';
                config.bots.filter(b => b.enabled).forEach(b => {
                    const status = botStatuses[b.id] || 'offline';
                    text += '- ' + b.id + ' (' + b.username + '): ' + status + '\n';
                });
                return await interaction.reply(text);
            } 
            else {
                return await interaction.reply('Unknown command: ' + commandName);
            }
        } catch (err) {
            console.error('Interaction error:', err.message);
            try {
                if (!interaction.replied) {
                    await interaction.reply({ content: 'Error: ' + err.message, ephemeral: true });
                }
            } catch (e) {
                console.error('Reply error:', e.message);
            }
        }
    });

    pm2.connect((err) => {
        if (err) {
            console.error('PM2 connect error:', err.message);
            return;
        }

        pm2.launchBus((err, bus) => {
            if (err) {
                console.error('PM2 bus error:', err.message);
                return;
            }

            bus.on('process:msg', (packet) => {
                try {
                    const data = packet.data;

                    if (data.type === 'status') {
                        botStatuses[data.data.id] = data.data.status;
                    }

                    if (data.type === 'auth_required' && client) {
                        const adminChannel = client.channels.cache.get(process.env.DISCORD_ADMIN_CHANNEL_ID);
                        if (adminChannel) {
                            adminChannel.send('Auth required for bot: ' + data.data.id).catch(e => console.error('Send error:', e.message));
                        }
                    }
                } catch (err) {
                    console.error('Bus message error:', err.message);
                }
            });
        });
    });

    console.log('Logging into Discord with token...');
    client.login(process.env.DISCORD_TOKEN);

    return client;
}

function getClient() {
    return client;
}

module.exports = { startDiscordBot, getClient };
