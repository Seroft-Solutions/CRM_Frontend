import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pool configuration for production
  ...(process.env.NODE_ENV === 'production' && {
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}?connection_limit=20&pool_timeout=20&pgbouncer=true`
      }
    }
  })
})

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma

/**
 * Type-safe database operations
 */
export type DatabaseUser = {
  id: string
  name?: string | null
  email?: string | null
  emailVerified?: Date | null
  image?: string | null
  keycloak_id?: string | null
  preferred_username?: string | null
  created_at: Date
  updated_at: Date
  last_login?: Date | null
  active: boolean
}

export type DatabaseSession = {
  id: string
  sessionToken: string
  userId: string
  expires: Date
  created_at: Date
  updated_at: Date
  ip_address?: string | null
  user_agent?: string | null
}

export type DatabaseAccount = {
  id: string
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token?: string | null
  access_token?: string | null
  expires_at?: number | null
  token_type?: string | null
  scope?: string | null
  id_token?: string | null
  session_state?: string | null
  oauth_token_secret?: string | null
  oauth_token?: string | null
  created_at: Date
  updated_at: Date
}

/**
 * Session management utilities
 */
export const sessionUtils = {
  /**
   * Clean up expired sessions
   */
  async cleanExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    })
    
    console.log(`Cleaned up ${result.count} expired sessions`)
    return result.count
  },

  /**
   * Get active session count for a user
   */
  async getActiveSessionCount(userId: string): Promise<number> {
    return await prisma.session.count({
      where: {
        userId,
        expires: {
          gt: new Date()
        }
      }
    })
  },

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        userId
      }
    })
    
    console.log(`Revoked ${result.count} sessions for user ${userId}`)
    return result.count
  },

  /**
   * Get session statistics
   */
  async getSessionStats() {
    const totalSessions = await prisma.session.count()
    const activeSessions = await prisma.session.count({
      where: {
        expires: {
          gt: new Date()
        }
      }
    })
    const expiredSessions = await prisma.session.count({
      where: {
        expires: {
          lt: new Date()
        }
      }
    })

    return {
      total: totalSessions,
      active: activeSessions,
      expired: expiredSessions,
      activePercentage: totalSessions > 0 ? (activeSessions / totalSessions) * 100 : 0
    }
  }
}

/**
 * User utilities
 */
export const userUtils = {
  /**
   * Find user by Keycloak ID
   */
  async findByKeycloakId(keycloakId: string) {
    return await prisma.user.findUnique({
      where: {
        keycloak_id: keycloakId
      },
      include: {
        accounts: true,
        sessions: {
          where: {
            expires: {
              gt: new Date()
            }
          }
        },
        roles: true,
        organizations: true
      }
    })
  },

  /**
   * Update user last login
   */
  async updateLastLogin(userId: string) {
    return await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        last_login: new Date(),
        updated_at: new Date()
      }
    })
  },

  /**
   * Sync user roles from Keycloak
   */
  async syncUserRoles(userId: string, roles: string[]) {
    // Delete existing roles
    await prisma.userRole.deleteMany({
      where: {
        userId
      }
    })

    // Insert new roles
    if (roles.length > 0) {
      await prisma.userRole.createMany({
        data: roles.map(role => ({
          userId,
          role
        }))
      })
    }
  },

  /**
   * Sync user organizations from Keycloak
   */
  async syncUserOrganizations(userId: string, organizations: Array<{ id: string; name: string }>) {
    // Delete existing organizations
    await prisma.userOrganization.deleteMany({
      where: {
        userId
      }
    })

    // Insert new organizations
    if (organizations.length > 0) {
      await prisma.userOrganization.createMany({
        data: organizations.map(org => ({
          userId,
          organizationId: org.id,
          organizationName: org.name
        }))
      })
    }
  }
}
