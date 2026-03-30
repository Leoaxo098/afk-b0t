const express = require('express');
const { startDiscordBot } = require('./discord-bot.js');
const config = require('../accounts.json');

startDiscordBot();

const app = express();
app.get('/', (req, res) => {
    let html = '<h1>Merged Dashboard</h1><ul>';
    config.bots.filter(b => b.enabled).forEach(b => {
        html += `<li><a href="http://${req.hostname}:${b.port}" target="_blank">${b.username} (Chat)</a> | <a href="http://${req.hostname}:${b.viewerPort}" target="_blank">Viewer</a></li>`;
    });
    html += '</ul>';
    res.send(html);
});

app.listen(config.dashboard.mergedPort, () => console.log(`Dashboard on ${config.dashboard.mergedPort}`));