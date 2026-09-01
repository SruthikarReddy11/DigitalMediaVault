import { app } from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(`🚀 Personal Digital Library Server`);
  console.log(`📡 Listening on http://localhost:${config.port}`);
  console.log(`🔒 Mode: ${config.env}`);
  console.log(`=========================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
