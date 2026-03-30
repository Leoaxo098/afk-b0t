const { mineflayer: mineflayerViewer } = require('prismarine-viewer');

function start(bot, port) {
    try {
        mineflayerViewer(bot, { port: parseInt(port), firstPerson: false, host: '0.0.0.0' });
        console.log(`Viewer started on ${port}`);
    } catch (e) {
        console.error('Viewer failed: ' + e.message);
    }
}

module.exports = { start };