import cron from "node-cron";
import { prisma } from "../../lib/prisma";  // adjust if your prisma path differs
// Run daily at midnight (adjust as needed)
cron.schedule("0 0 * * *", async () => {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        expires: { lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) } // 30 days ago
      },
    });
    console.log(`[CRON] Deleted ${result.count} expired sessions`);
  } catch (err) {
    console.error("[CRON] Session cleanup failed:", err);
  }
});
