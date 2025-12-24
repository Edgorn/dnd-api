import { startServer } from './infrastructure/http/server';

const PORT = Number(process.env.PORT) || 8000;

startServer(PORT);