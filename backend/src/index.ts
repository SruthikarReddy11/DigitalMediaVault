import { app } from './app';
import { config } from './config';
import { TrashService } from './services/trash.service';

const server = app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(`🚀 Personal Digital Library Server`);
  console.log(`📡 Listening on http://localhost:${config.port}`);
  console.log(`🔒 Mode: ${config.env}`);
  console.log(`=========================================`);

  // Run 30-day trash auto-purge on server boot
  TrashService.purgeExpiredTrash().catch((err) => {
    console.error('[Trash Purge] Boot auto-purge error:', err);
  });

  // Schedule auto-purge every 6 hours
  setInterval(() => {
    TrashService.purgeExpiredTrash().catch((err) => {
      console.error('[Trash Purge] Periodic auto-purge error:', err);
    });
  }, 6 * 60 * 60 * 1000);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
