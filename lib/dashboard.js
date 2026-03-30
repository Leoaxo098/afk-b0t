const express = require('express');
const app = express();
let sseClients = [];
let chatLog = [];

function pushChat(entry) {
    chatLog.push(entry);
    if (chatLog.length > 300) chatLog.shift();
    const data = `data: ${JSON.stringify(entry)}\n\n`;
    sseClients.forEach(c => c.write(data));
}

function start(bot, port) {
    app.use(express.json());

    app.get('/', (req, res) => {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Dashboard - ${bot.username}</title></head>
        <body>
            <div id="log" style="height:400px;overflow-y:auto;background:#111;color:#eee;font-family:monospace;padding:10px;"></div>
            <input type="text" id="input" placeholder="Chat..." style="width:100%;padding:10px;" />
            <script>
                const log = document.getElementById('log');
                const input = document.getElementById('input');
                
                function addMsg(entry) {
                    const div = document.createElement('div');
                    div.textContent = \`[\${new Date(entry.ts).toLocaleTimeString()}] \${entry.username ? '<'+entry.username+'> ' : ''}\${entry.message}\`;
                    log.appendChild(div);
                    log.scrollTop = log.scrollHeight;
                }

                const es = new EventSource('/events');
                es.onmessage = e => addMsg(JSON.parse(e.data)); // Instant display

                input.addEventListener('keydown', async (e) => {
                    if (e.key === 'Enter' && input.value) {
                        const msg = input.value;
                        input.value = '';
                        await fetch('/send', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ message: msg }) });
                    }
                });
            </script>
        </body>
        </html>
        `);
    });

    app.get('/events', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        sseClients.push(res);
        req.on('close', () => sseClients = sseClients.filter(c => c !== res));
    });

    app.post('/send', (req, res) => {
        if(bot && bot.entity) {
            bot.chat(req.body.message);
            pushChat({ ts: Date.now(), type: 'sent', username: 'You', message: req.body.message });
            res.json({ok: true});
        } else {
            res.json({ok: false});
        }
    });

    app.listen(port, '0.0.0.0', () => console.log(`Dashboard listening on ${port}`));
}

module.exports = { start, pushChat };