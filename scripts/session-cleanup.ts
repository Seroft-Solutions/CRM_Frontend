import { prisma, sessionUtils } from '../src/lib/prisma';

/**
 * Session cleanup script for production environments
 * This script should be run periodically (e.g., via cron job) to clean up expired sessions
 * and maintain database performance.
 */

interface CleanupStats {
  cleanedSessions: number;
  cleanedUsers: number;
  totalSessionsBefore: number;
  totalSessionsAfter: number;
  runtime: number;
}

async function performCleanup(): Promise<CleanupStats> {
  const startTime = Date.now();
  
  console.log('🧹 Starting session cleanup...');
  
  // Get initial stats
  const statsBefore = await sessionUtils.getSessionStats();
  console.log('📊 Sessions before cleanup:', statsBefore);
  
  // Clean expired sessions
  const cleanedSessions = await sessionUtils.cleanExpiredSessions();
  console.log(`🗑️ Cleaned ${cleanedSessions} expired sessions`);
  
  // Clean up users with no sessions or accounts (optional)
  let cleanedUsers = 0;
  try {
    const orphanedUsers = await prisma.user.findMany({
      where: {
        AND: [
          { sessions: { none: {} } },
          { accounts: { none: {} } },
          { 
            created_at: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Older than 7 days
            }
          }
        ]
      }
    });

    if (orphanedUsers.length > 0) {
      console.log(`👥 Found ${orphanedUsers.length} orphaned users (no sessions/accounts for 7+ days)`);
      
      // Delete associated roles and organizations first
      for (const user of orphanedUsers) {
        await prisma.userRole.deleteMany({ where: { userId: user.id } });
        await prisma.userOrganization.deleteMany({ where: { userId: user.id } });
      }
      
      // Delete the users
      const deleteResult = await prisma.user.deleteMany({
        where: {
          id: {
            in: orphanedUsers.map(u => u.id)
          }
        }
      });
      
      cleanedUsers = deleteResult.count;
      console.log(`🗑️ Cleaned ${cleanedUsers} orphaned users`);
    }
  } catch (error) {
    console.error('⚠️ Warning: Could not clean orphaned users:', error);
    // Continue with session cleanup even if user cleanup fails
  }
  
  // Get final stats
  const statsAfter = await sessionUtils.getSessionStats();
  console.log('📊 Sessions after cleanup:', statsAfter);
  
  const runtime = Date.now() - startTime;
  
  const cleanupStats: CleanupStats = {
    cleanedSessions,
    cleanedUsers,
    totalSessionsBefore: statsBefore.total,
    totalSessionsAfter: statsAfter.total,
    runtime
  };
  
  console.log('✅ Cleanup completed in', runtime, 'ms');
  
  return cleanupStats;
}

async function logCleanupToDatabase(stats: CleanupStats) {
  try {
    // Create a simple log table for cleanup history (optional)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS session_cleanup_log (
        id SERIAL PRIMARY KEY,
        cleanup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cleaned_sessions INTEGER,
        cleaned_users INTEGER,
        total_sessions_before INTEGER,
        total_sessions_after INTEGER,
        runtime_ms INTEGER
      )
    `;
    
    await prisma.$executeRaw`
      INSERT INTO session_cleanup_log 
      (cleaned_sessions, cleaned_users, total_sessions_before, total_sessions_after, runtime_ms)
      VALUES (${stats.cleanedSessions}, ${stats.cleanedUsers}, ${stats.totalSessionsBefore}, ${stats.totalSessionsAfter}, ${stats.runtime})
    `;
    
    console.log('📝 Cleanup stats logged to database');
  } catch (error) {
    console.error('⚠️ Warning: Could not log cleanup stats:', error);
  }
}

async function analyzeSessionPatterns() {
  try {
    console.log('📈 Analyzing session patterns...');
    
    // Get session creation patterns
    const sessionsByHour = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as session_count
      FROM sessions 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;
    
    console.log('📊 Sessions created by hour (last 24h):', sessionsByHour);
    
    // Get average session duration
    const avgDuration = await prisma.$queryRaw`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (expires - created_at))/3600) as avg_duration_hours
      FROM sessions 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `;
    
    console.log('⏱️ Average session duration:', avgDuration);
    
    // Get most active users
    const activeUsers = await prisma.$queryRaw`
      SELECT 
        u.email,
        COUNT(s.id) as session_count
      FROM users u
      JOIN sessions s ON u.id = s.user_id
      WHERE s.created_at > NOW() - INTERVAL '7 days'
      GROUP BY u.id, u.email
      ORDER BY session_count DESC
      LIMIT 10
    `;
    
    console.log('👤 Most active users (last 7 days):', activeUsers);
    
  } catch (error) {
    console.error('⚠️ Warning: Could not analyze session patterns:', error);
  }
}

async function runCleanupJob() {
  console.log('🚀 Starting NextAuth Session Cleanup Job');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    await prisma.$connect();
    console.log('🔗 Database connected');
    
    // Perform the cleanup
    const stats = await performCleanup();
    
    // Log to database
    await logCleanupToDatabase(stats);
    
    // Analyze patterns (optional, can be disabled in production)
    if (process.env.NODE_ENV !== 'production' || process.env.ANALYZE_SESSIONS === 'true') {
      await analyzeSessionPatterns();
    }
    
    console.log('✅ Session cleanup job completed successfully');
    console.log('📊 Final stats:', stats);
    
    return stats;
    
  } catch (error) {
    console.error('❌ Session cleanup job failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected');
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  runCleanupJob()
    .then((stats) => {
      console.log('\n🎉 Cleanup job finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Cleanup job failed:', error);
      process.exit(1);
    });
}

export { runCleanupJob, performCleanup };
