const fs = require('fs');
const config = require('./accounts.json');

let yaml = `tunnel: YOUR_TUNNEL_UUID\ncredentials-file: /root/.cloudflared/YOUR_TUNNEL_UUID.json\n\ningress:\n`;

// Merged dashboard
yaml += `  - hostname: dashboard.yourdomain.com\n    service: http://localhost:${config.dashboard.mergedPort}\n`;

config.bots.forEach(bot => {
    if (bot.enabled) {
        yaml += `  - hostname: ${bot.id}.yourdomain.com\n    service: http://localhost:${bot.port}\n`;
        yaml += `  - hostname: viewer-${bot.id}.yourdomain.com\n    service: http://localhost:${bot.viewerPort}\n`;
    }
});

yaml += `  - service: http_status:404\n`;

fs.writeFileSync('cf-config.yml', yaml);
console.log('✅ Generated cf-config.yml. Copy this to your cloudflared directory.');