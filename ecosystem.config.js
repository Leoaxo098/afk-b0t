const config = require('./accounts.json');

const apps = [
  {
    name: 'master-controller',
    script: 'lib/master.js',
    env: { NODE_ENV: 'production' }
  }
];

config.bots.forEach(bot => {
  if (bot.enabled) {
    apps.push({
      name: `mcbot-${bot.id}`,
      script: 'bot.js',
      env: {
        BOT_ID: bot.id,
        BOT_USERNAME: bot.username,
        BOT_PASSWORD: bot.password,
	AUTH_TYPE: bot.authType,
        SERVER_IP: bot.serverIp,
        SERVER_PORT: bot.serverPort,
        SERVER_VERSION: bot.version,
        PORT: bot.port,
        VIEWER_PORT: bot.viewerPort,
        SHARD_CHECK: bot.shardCheck
      }
    });
  }
});

module.exports = { apps };