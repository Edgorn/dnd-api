const startServer = require('./infrastructure/http/server');

const PORT = process.env.PORT || 8000;
startServer(PORT);