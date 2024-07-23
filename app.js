const startServer = require('./src/infrastructure/http/server');

const PORT = process.env.PORT || 3000;
startServer(PORT);