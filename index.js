// Load environment variables first
require('dotenv').config();

// Now it’s safe to require other modules
const discordBot = require('./discord-bot');

// Your existing index.js code may go here, ensuring that any initialization is done after
// loading the dotenv configuration.

// Example of initialization after loading .env variables:
const someConfiguration = { /* your settings */ }; // ensure initialization happens after
const runBot = () => {
    // Bot running logic
};
runBot();