function startShardMonitor(bot) {
    bot.on('message', (jsonMsg) => {
        const text = jsonMsg.toString().replace(/§./g, '').trim();
        const match = text.match(/Your shards:\s*([\d.,]+[KMB]?)/i);
        if (match && process.send) {
            process.send({ type: 'shard_update', data: { id: process.env.BOT_ID, amount: match[1] } });
        }
    });

    setInterval(() => {
        if (bot && bot.entity) bot.chat('/shard');
    }, 30000);
}

module.exports = { startShardMonitor };