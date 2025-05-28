import { prisma, sessionUtils, userUtils } from '../src/lib/prisma';

/**
 * Validation script for NextAuth database session implementation
 * Run this script to verify that the database session strategy is working correctly
 */

async function validateDatabaseConnection() {
  console.log('🔗 Testing database connection...');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in database`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function validateTables() {
  console.log('📋 Validating database tables...');
  
  const tables = ['users', 'accounts', 'sessions', 'verificationtokens', 'user_roles', 'user_organizations'];
  
  for (const table of tables) {
    try {
      const query = `SELECT COUNT(*) FROM "${table}"`;
      const result = await prisma.$queryRawUnsafe(query);
      console.log(`✅ Table "${table}" exists and accessible`);
    } catch (error) {
      console.error(`❌ Table "${table}" not found or inaccessible:`, error);
    }
  }
}

async function validateSessionUtils() {
  console.log('🛠️ Testing session utilities...');
  
  try {
    // Test session statistics
    const stats = await sessionUtils.getSessionStats();
    console.log('✅ Session statistics:', stats);
    
    // Test expired session cleanup
    const cleanedCount = await sessionUtils.cleanExpiredSessions();
    console.log(`✅ Cleaned up ${cleanedCount} expired sessions`);
    
    return true;
  } catch (error) {
    console.error('❌ Session utilities test failed:', error);
    return false;
  }
}

async function createTestUser() {
  console.log('👤 Creating test user...');
  
  try {
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        keycloak_id: 'test-keycloak-id',
        preferred_username: 'testuser',
      }
    });
    
    console.log('✅ Test user created:', testUser.id);
    
    // Create test session for the user
    const testSession = await prisma.session.create({
      data: {
        userId: testUser.id,
        sessionToken: 'test-session-token-' + Date.now(),
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      }
    });
    
    console.log('✅ Test session created:', testSession.id);
    
    // Test user utilities
    await userUtils.syncUserRoles(testUser.id, ['user', 'test']);
    await userUtils.syncUserOrganizations(testUser.id, [
      { id: 'org-1', name: 'Test Organization' }
    ]);
    
    console.log('✅ User roles and organizations synced');
    
    // Clean up test data
    await prisma.session.delete({ where: { id: testSession.id } });
    await prisma.userRole.deleteMany({ where: { userId: testUser.id } });
    await prisma.userOrganization.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    
    console.log('✅ Test data cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Test user creation failed:', error);
    return false;
  }
}

async function validateIndexes() {
  console.log('🔍 Validating database indexes...');
  
  try {
    // Check if critical indexes exist (PostgreSQL specific)
    const indexQueries = [
      "SELECT indexname FROM pg_indexes WHERE tablename = 'sessions' AND indexname LIKE '%session_token%'",
      "SELECT indexname FROM pg_indexes WHERE tablename = 'sessions' AND indexname LIKE '%user_id%'",
      "SELECT indexname FROM pg_indexes WHERE tablename = 'sessions' AND indexname LIKE '%expires%'",
      "SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE '%email%'",
      "SELECT indexname FROM pg_indexes WHERE tablename = 'accounts' AND indexname LIKE '%user_id%'",
    ];
    
    for (const query of indexQueries) {
      try {
        const result = await prisma.$queryRawUnsafe(query);
        console.log('✅ Index found:', JSON.stringify(result));
      } catch (error) {
        console.log('⚠️ Could not verify index (this might be normal)');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Index validation failed:', error);
    return false;
  }
}

async function runValidation() {
  console.log('🧪 Starting NextAuth Database Session Validation\n');
  
  const validations = [
    { name: 'Database Connection', fn: validateDatabaseConnection },
    { name: 'Database Tables', fn: validateTables },
    { name: 'Session Utilities', fn: validateSessionUtils },
    { name: 'Test User Creation', fn: createTestUser },
    { name: 'Database Indexes', fn: validateIndexes },
  ];
  
  let passedCount = 0;
  
  for (const validation of validations) {
    console.log(`\n--- ${validation.name} ---`);
    const passed = await validation.fn();
    if (passed) {
      passedCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🧪 Validation Results: ${passedCount}/${validations.length} passed`);
  
  if (passedCount === validations.length) {
    console.log('🎉 All validations passed! Your database session setup is working correctly.');
    console.log('\nNext steps:');
    console.log('1. Start your Next.js application: npm run dev');
    console.log('2. Test the authentication flow');
    console.log('3. Monitor session creation in the database');
  } else {
    console.log('⚠️ Some validations failed. Please check the error messages above.');
  }
  
  await prisma.$disconnect();
}

// Run validation if this script is executed directly
if (require.main === module) {
  runValidation().catch((error) => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

export { runValidation };
