import { db } from "./database.js";
import SQLite from "better-sqlite3";

/**
 * Database health check utility
 */
export class DatabaseHealth {
  /**
   * Run comprehensive database health checks
   */
  static async checkHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    stats: Record<string, any>;
  }> {
    const issues: string[] = [];
    const stats: Record<string, any> = {};

    try {
      // Test basic connectivity
      const result = await db.selectFrom("user").select("id").limit(1).execute();
      stats.connectivity = "OK";
    } catch (error) {
      issues.push(`Database connectivity failed: ${error}`);
      stats.connectivity = "FAILED";
    }

    try {
      // Get database file size
      const dbPath = "./data/db.sqlite3";
      const fs = await import("fs");
      const stat = fs.statSync(dbPath);
      stats.fileSize = stat.size;
      stats.lastModified = stat.mtime;
    } catch (error) {
      issues.push(`Could not get database file stats: ${error}`);
    }

    try {
      // Check for WAL file size (should be reasonable)
      const walPath = "./data/db.sqlite3-wal";
      const fs = await import("fs");
      if (fs.existsSync(walPath)) {
        const walStat = fs.statSync(walPath);
        stats.walSize = walStat.size;
        
        // Warn if WAL is getting too large (> 10MB)
        if (walStat.size > 10 * 1024 * 1024) {
          issues.push(`WAL file is large (${Math.round(walStat.size / 1024 / 1024)}MB) - consider manual checkpoint`);
        }
      } else {
        stats.walSize = 0;
      }
    } catch (error) {
      issues.push(`Could not check WAL file: ${error}`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      stats,
    };
  }

  /**
   * Perform database maintenance
   */
  static async performMaintenance(): Promise<void> {
    console.log("🔧 Starting database maintenance...");

    try {
      // Force WAL checkpoint
      const sqlite = new SQLite("./data/db.sqlite3");
      sqlite.pragma("wal_checkpoint(TRUNCATE)");
      sqlite.close();
      console.log("✅ WAL checkpoint completed");
    } catch (error) {
      console.error("❌ WAL checkpoint failed:", error);
      throw error;
    }

    // Skip complex integrity check for maintenance endpoint
    // Integrity check is done on startup in database.ts
    console.log("✅ Database maintenance simplified - integrity check done on startup");
    console.log("🎉 Database maintenance completed successfully");
  }

  /**
   * Get database statistics
   */
  static async getStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    try {
      // Table counts
      const userCount = await db.selectFrom("user").select(db.fn.count("id").as("count")).executeTakeFirst();
      const bookingCount = await db.selectFrom("bookings").select(db.fn.count("id").as("count")).executeTakeFirst();
      const courtCount = await db.selectFrom("courts").select(db.fn.count("id").as("count")).executeTakeFirst();

      stats.tables = {
        users: userCount?.count || 0,
        bookings: bookingCount?.count || 0,
        courts: courtCount?.count || 0,
      };
    } catch (error) {
      console.error("Error getting table stats:", error);
    }

    return stats;
  }
}