require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('status')
        .setDescription('Show bot status')
        .addStringOption(o => o.setName('bot-id').setDescription('The ID of the bot').setRequired(true)),

    new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Send a chat message')
        .addStringOption(o => o.setName('bot-id').setDescription('The ID of the bot').setRequired(true))
        .addStringOption(o => o.setName('message').setDescription('The message to send').setRequired(true)),

    new SlashCommandBuilder()
        .setName('shard')
        .setDescription('Check shards on a specific bot')
        .addStringOption(o => o.setName('bot-id').setDescription('The ID of the bot').setRequired(true)),

    new SlashCommandBuilder()
        .setName('reconnect')
        .setDescription('Force reconnect the bot')
        .addStringOption(o => o.setName('bot-id').setDescription('The ID of the bot').setRequired(true)),

    new SlashCommandBuilder()
        .setName('cmd')
        .setDescription('Run a raw server command')
        .addStringOption(o => o.setName('bot-id').setDescription('The ID of the bot').setRequired(true))
        .addStringOption(o => o.setName('command').setDescription('The command to run').setRequired(true)),

    new SlashCommandBuilder()
        .setName('tpaccept')
        .setDescription('Accept teleport requests')
        .addStringOption(o => o.setName('bot-id').setDescription('The ID of the bot').setRequired(true)),

    new SlashCommandBuilder()
        .setName('bots')
        .setDescription('List all active bots'),

    new SlashCommandBuilder()
        .setName('assign')
        .setDescription('Assign user to a bot')
        .addUserOption(o => o.setName('user').setDescription('The Discord user to assign').setRequired(true))
        .addStringOption(o => o.setName('bot-id').setDescription('The ID of the bot').setRequired(true)),

    new SlashCommandBuilder()
        .setName('unassign')
        .setDescription('Remove user from a bot')
        .addUserOption(o => o.setName('user').setDescription('The Discord user to remove').setRequired(true))
        .addStringOption(o => o.setName('bot-id').setDescription('The ID of the bot').setRequired(true)),

    new SlashCommandBuilder()
        .setName('link')
        .setDescription('Fetches the Microsoft login link and device code for a bot')
        .addStringOption(o => o.setName('bot-id').setDescription('The ID of the bot').setRequired(true)),

    new SlashCommandBuilder()
        .setName('add-bot')
        .setDescription('Add a new Minecraft bot account to the system')
        .addStringOption(o => o.setName('bot-id').setDescription('Unique ID for the bot (e.g., bot2)').setRequired(true))
        .addStringOption(o => o.setName('username').setDescription('Minecraft username or email').setRequired(true))
        .addStringOption(o => o.setName('auth-type').setDescription('Authentication type').setRequired(true)
            .addChoices(
                { name: 'Cracked / Offline', value: 'mojang' },
                { name: 'Premium (Microsoft)', value: 'microsoft' }
            ))
        .addStringOption(o => o.setName('server-ip').setDescription('Minecraft server IP').setRequired(true))
        .addIntegerOption(o => o.setName('port').setDescription('Server port (Default: 25565)').setRequired(false)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Refreshing application (/) commands...');
        
        await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
            { body: commands },
        );
        
        console.log('Successfully reloaded slash commands.');
    } catch (error) {
        console.error(error);
    }
})();