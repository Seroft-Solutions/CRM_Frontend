@echo off
REM Prisma Migration Script for NextAuth Database Sessions
REM Run this script to set up the database for NextAuth v5 with Prisma

echo 🚀 Setting up NextAuth database with Prisma...

REM Generate Prisma client
echo 📦 Generating Prisma client...
call npx prisma generate

REM Check database connection
echo 🔗 Checking database connection...
call npx prisma db pull --print || echo ⚠️  Could not connect to database - please verify DATABASE_URL

REM Create migration for NextAuth tables
echo 📋 Creating migration for NextAuth tables...
call npx prisma migrate dev --name "init-nextauth-database-sessions"

REM Verify tables were created
echo ✅ Verifying database setup...
call npx prisma db pull --print

echo 🎉 Database setup complete!
echo.
echo Next steps:
echo 1. Start your Next.js application: npm run dev
echo 2. Test authentication flow
echo 3. Check session storage in database
echo.
echo Useful commands:
echo - View database: npx prisma studio
echo - Reset database: npx prisma migrate reset
echo - Check session stats: curl http://localhost:3000/api/auth/cleanup

pause
