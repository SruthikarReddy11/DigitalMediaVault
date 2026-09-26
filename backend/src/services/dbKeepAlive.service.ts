import { prisma } from '../database/prisma';

export class DatabaseKeepAliveService {
  private static timer: NodeJS.Timeout | null = null;
  private static isRunning = false;
  private static pingCount = 0;

  /**
   * Starts a background heartbeat that sends a lightweight read query
   * to the database every 10 seconds to prevent hibernation.
   * Completely safe and read-only: does not modify, insert, or delete any data.
   */
  public static start(intervalMs = 10 * 1000) {
    if (this.timer) return;

    console.log(`[DB KeepAlive] Starting anti-hibernation heartbeat every ${intervalMs / 1000}s...`);

    // Run first read immediately on start
    this.sendPing().catch(() => {});

    this.timer = setInterval(() => {
      this.sendPing().catch(() => {});
    }, intervalMs);
  }

  public static stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[DB KeepAlive] Stopped anti-hibernation heartbeat.');
    }
  }

  public static async sendPing(): Promise<boolean> {
    if (this.isRunning) return false;
    this.isRunning = true;

    try {
      // Safe, zero-write read query that keeps PostgreSQL connection pool & remote DB active
      await prisma.$queryRaw`SELECT 1`;
      this.pingCount++;

      // Log periodically (every 6 pings = 1 minute) to keep logs clean
      if (this.pingCount % 6 === 0) {
        console.log(`[DB KeepAlive] Heartbeat active (ping #${this.pingCount}) - Database is awake.`);
      }
      return true;
    } catch (err: any) {
      // Fallback query to User table if raw SQL is restricted
      try {
        await prisma.user.findFirst({ select: { id: true } });
        return true;
      } catch (fallbackErr: any) {
        console.warn('[DB KeepAlive] Heartbeat query notice:', fallbackErr?.message || err?.message);
        return false;
      }
    } finally {
      this.isRunning = false;
    }
  }

  public static getStats() {
    return {
      active: this.timer !== null,
      intervalSeconds: 10,
      totalPings: this.pingCount,
    };
  }
}
