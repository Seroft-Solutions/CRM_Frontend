# ✅ NextAuth v5 Database Session Strategy (PostgreSQL)

## Step 1: PostgreSQL Database Setup

### Using Docker

1.  **Pull the PostgreSQL Image:**
    ```bash
    docker pull postgres:latest
    ```

2.  **Run the PostgreSQL Container:**
    Replace `your_password` with a strong password, `your_user` with your desired username, and `nextauth_db` with your preferred database name.
    ```bash
    docker run --name postgres-nextauth -e POSTGRES_USER=your_user -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=nextauth_db -p 5432:5432 -d postgres:latest
    ```
    *   `--name postgres-nextauth`: Assigns a name to the container for easy management.
    *   `-e POSTGRES_USER=your_user`: Sets the default superuser for the PostgreSQL instance.
    *   `-e POSTGRES_PASSWORD=your_password`: Sets the password for the default superuser. **Choose a strong password.**
    *   `-e POSTGRES_DB=nextauth_db`: Creates an initial database named `nextauth_db`. NextAuth will use this database.
    *   `-p 5432:5432`: Maps port 5432 on your host machine to port 5432 in the container (the default PostgreSQL port).
    *   `-d`: Runs the container in detached mode (in the background).
    *   `postgres:latest`: Specifies the image to use.

3.  **Connect to the Database (Optional but Recommended for Verification):**
    You can use a GUI tool like pgAdmin or DBeaver, or the command-line tool `psql`.
    To connect using `psql` from your host (if you have PostgreSQL client tools installed):
    ```bash
    psql -h localhost -p 5432 -U your_user -d nextauth_db
    ```
    You will be prompted for the password you set (`your_password`).

### Database and User Definition

*   **Database:** The database (`nextauth_db` in the example above) is automatically created when you run the Docker container with the `POSTGRES_DB` environment variable. This database will store the tables required by NextAuth (User, Session, Account, etc.).
*   **User:** The user (`your_user` in the example) is also created automatically with superuser privileges within that PostgreSQL instance. This user will be used by your Next.js application (via Prisma) to connect to and interact with the database.

**Important:** For production environments, it's recommended to:
    *   Use a managed PostgreSQL service (e.g., AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL).
    *   Create a dedicated, non-superuser role with specific permissions (CREATE, SELECT, INSERT, UPDATE, DELETE) on the NextAuth tables, rather than using the default superuser. However, for local development, the setup above is generally sufficient.

## Step 2: Prisma Configuration

### Prisma Schema (`schema.prisma`)

Below is the Prisma schema required for NextAuth.js. Save this in your `prisma/schema.prisma` file.

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### Explanation of Models and Fields

*   **`Account`**:
    *   Stores information about OAuth accounts linked to a `User`. One user can have multiple accounts (e.g., linked Google and GitHub accounts).
    *   `id`: Unique identifier for the account record.
    *   `userId`: Foreign key linking to the `User` model.
    *   `type`: The type of account, e.g., "oauth", "email".
    *   `provider`: The OAuth provider's name, e.g., "google", "github", "keycloak".
    *   `providerAccountId`: The user's ID as given by the OAuth provider.
    *   `refresh_token`: Token used to obtain new access tokens. Stored as `TEXT` for longer tokens.
    *   `access_token`: Token used to access the provider's API. Stored as `TEXT` for longer tokens.
    *   `expires_at`: Timestamp (in seconds since epoch) indicating when the `access_token` expires.
    *   `token_type`: Type of token, usually "Bearer".
    *   `scope`: Scopes granted by the user to the application.
    *   `id_token`: JWT token containing user identity information (common in OIDC). Stored as `TEXT` for longer tokens.
    *   `session_state`: Session state provided by some OAuth providers (e.g., Keycloak).
    *   `user`: Relation to the `User` model. `onDelete: Cascade` means if a `User` is deleted, their associated `Account` records are also deleted.
    *   `@@unique([provider, providerAccountId])`: Ensures that each combination of `provider` and `providerAccountId` is unique, preventing duplicate account linkages.

*   **`Session`**:
    *   Stores user session information when using database sessions.
    *   `id`: Unique identifier for the session record.
    *   `sessionToken`: The unique token used to identify the session. This is stored in the session cookie.
    *   `userId`: Foreign key linking to the `User` model.
    *   `expires`: Timestamp indicating when the session expires.
    *   `user`: Relation to the `User` model. `onDelete: Cascade` means if a `User` is deleted, their associated `Session` records are also deleted.

*   **`User`**:
    *   Represents the application's users.
    *   `id`: Unique identifier for the user.
    *   `name`: User's name (optional).
    *   `email`: User's email address (optional, but typically required). Must be unique if provided.
    *   `emailVerified`: Timestamp indicating if/when the user's email was verified (useful for email-based login or account recovery).
    *   `image`: URL to the user's profile picture (optional).
    *   `accounts`: Relation to the `Account` model (one user can have many linked accounts).
    *   `sessions`: Relation to the `Session` model (one user can have many active sessions).

*   **`VerificationToken`**:
    *   Used for "magic link" email sign-ins or email verification processes. Stores a temporary token sent to the user's email.
    *   `identifier`: Usually the user's email address or a user ID to whom the token was sent.
    *   `token`: The unique, cryptographically secure token.
    *   `expires`: Timestamp indicating when the token expires and can no longer be used.
    *   `@@unique([identifier, token])`: Ensures that the combination of `identifier` and `token` is unique.

This schema is based on the official NextAuth.js Prisma Adapter documentation and is designed to work seamlessly with it. Remember to set the `DATABASE_URL` environment variable in your `.env` file to point to your PostgreSQL database (e.g., `DATABASE_URL="postgresql://your_user:your_password@localhost:5432/nextauth_db"`).
After adding this schema, run `npx prisma db push` (or `npx prisma migrate dev --name init_nextauth` for a full migration) to create these tables in your database.

## Step 3: Connecting Prisma to Next.js

### Securely Configuring `DATABASE_URL`

The `DATABASE_URL` is a connection string that Prisma uses to connect to your PostgreSQL database. It contains sensitive credentials, so it must be handled securely.

1.  **Format:**
    The typical format for a PostgreSQL connection URL is:
    ```
    postgresql://USER:PASSWORD@HOST:PORT/DATABASE
    ```
    Replace:
    *   `USER`: With the username you configured (e.g., `your_user` from Step 1).
    *   `PASSWORD`: With the password for that user.
    *   `HOST`: The hostname or IP address of your PostgreSQL server (e.g., `localhost` for the local Docker setup).
    *   `PORT`: The port your PostgreSQL server is running on (e.g., `5432`).
    *   `DATABASE`: The name of the database (e.g., `nextauth_db` from Step 1).

    **Example for local Docker setup:**
    ```
    postgresql://your_user:your_password@localhost:5432/nextauth_db
    ```

2.  **Using Environment Variables:**
    *   **Local Development:** Create a `.env.local` file in the root of your Next.js project. **This file should be added to your `.gitignore` file to prevent committing secrets.**
        ```
        # .env.local
        DATABASE_URL="postgresql://your_user:your_password@localhost:5432/nextauth_db"
        ```
    *   **Production/Deployment:**
        *   Most hosting platforms (Vercel, Netlify, AWS, etc.) provide a way to set environment variables securely through their dashboard or CLI.
        *   **Do not hardcode the `DATABASE_URL` in your application code.**
        *   Ensure you configure appropriate network access rules (firewalls) so your deployed application can reach the database, especially if the database is not hosted on the same platform.

### Prisma Client Initialization (`@/lib/prisma.ts`)

To use Prisma in your Next.js application, you need to initialize the `PrismaClient`. It's crucial to do this in a way that prevents creating too many instances of `PrismaClient` during development (due to Next.js hot-reloading) and works efficiently in serverless environments.

Create a file, for example, at `lib/prisma.ts` (or `app/lib/prisma.ts` if you prefer to keep it inside the `app` directory for App Router projects):

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-unused-vars
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    // Optional: Log Prisma queries during development
    // log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : [],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
```

**Explanation:**

*   **`import { PrismaClient } from '@prisma/client';`**: Imports the `PrismaClient` generated from your schema.
*   **`declare global { ... }`**: This TypeScript declaration extends the global namespace to include a `prisma` variable. This is a common pattern to store the Prisma client instance globally during development.
*   **`export const prisma = global.prisma || new PrismaClient(...)`**:
    *   This line checks if an instance of `PrismaClient` already exists on the `global` object (`global.prisma`).
    *   If it exists, it reuses that instance.
    *   If it doesn't exist (e.g., on the first run or in a production environment), it creates a new `PrismaClient` instance.
*   **`new PrismaClient({ log: [...] })`**: (Optional) You can configure Prisma Client options here. The example shows how to enable query logging during development, which can be very helpful for debugging. It's disabled in production for performance and security.
*   **`if (process.env.NODE_ENV !== 'production') { global.prisma = prisma; }`**:
    *   In development (`process.env.NODE_ENV !== 'production'`), this line assigns the newly created or reused `prisma` instance to `global.prisma`.
    *   This ensures that during hot-reloading in development, Next.js doesn't create a new `PrismaClient` instance with every code change, which could exhaust database connections.
    *   In production, each serverless function invocation will get its own `PrismaClient` instance if one isn't already available in its execution context, which is the desired behavior for managing connections efficiently.

This setup ensures that you have a single, shared `PrismaClient` instance in development and that new instances are created as needed in serverless production environments, adhering to best practices.

## Step 4: Run Prisma Migrations

Once you have your `schema.prisma` file defined (Step 2) and your `DATABASE_URL` configured (Step 3), you need to create and apply migrations to set up the actual tables in your PostgreSQL database. You also need to ensure the Prisma Client is generated.

1.  **Install Prisma CLI (if not already installed):**
    If you haven't already, install Prisma CLI as a development dependency:
    ```bash
    npm install prisma --save-dev
    # or
    yarn add prisma --dev
    # or
    pnpm add prisma --save-dev
    ```

2.  **Create the Initial Migration:**
    This command creates a new SQL migration file based on your `schema.prisma` and marks it as applied if the database is empty. If you already have data or tables, Prisma will attempt to generate a migration that preserves your data.
    ```bash
    npx prisma migrate dev --name init
    ```
    *   `npx prisma migrate dev`: This is the primary command for managing migrations in development.
        *   It creates the database if it doesn't exist (useful for initial setup).
        *   It applies any pending migrations.
        *   It generates the Prisma Client (`@prisma/client`).
    *   `--name init`:  Specifies a name for this migration (e.g., "init", "initial-setup"). Choose a descriptive name.

    After running this command, you'll find a new directory `prisma/migrations` containing a sub-directory for this migration with a `.sql` file. This SQL file contains the DDL commands (e.g., `CREATE TABLE`) that Prisma generated.

3.  **Generating Prisma Client (Usually Automatic with `migrate dev`):**
    The `npx prisma migrate dev` command typically also triggers `npx prisma generate`. This command reads your `prisma.schema` and generates the `PrismaClient` library tailored to your models into `node_modules/@prisma/client`.

    If you ever need to regenerate the client manually (e.g., after changing `schema.prisma` without running a migration, or if your IDE isn't picking up changes), you can run:
    ```bash
    npx prisma generate
    ```

4.  **Applying Migrations in Production:**
    In a production environment, you typically don't use `prisma migrate dev`. Instead, you would use:
    ```bash
    npx prisma migrate deploy
    ```
    This command applies all pending migrations and is suitable for CI/CD pipelines and production deployments. It does not generate artifacts like `prisma generate` or try to create the database. Ensure your database is created and accessible before running this.

**After running `npx prisma migrate dev --name init`:**
*   Your PostgreSQL database (e.g., `nextauth_db`) should now have the `User`, `Account`, `Session`, and `VerificationToken` tables.
*   Your `node_modules/@prisma/client` directory will be updated with a client tailored to your schema.

You can inspect your database using a tool like pgAdmin or DBeaver to confirm that the tables have been created correctly.

## Step 5: NextAuth v5 Database Adapter Configuration

With Prisma set up and migrations applied, you can now configure NextAuth to use the Prisma adapter for database sessions. This will store session data in your PostgreSQL database instead of JWTs.

Create or update your NextAuth configuration file. This file is commonly named `auth.ts` at the root of your project, or `app/auth.ts`, or `pages/api/auth/[...nextauth].ts` if using Pages Router. For Next.js App Router projects, a common practice is to have an `auth.ts` file in the project root or an `app/auth.ts` file.

Here's a comprehensive example for `auth.ts`:

```typescript
// auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma"; // Adjust path based on your prisma client location

// Example: Using Keycloak as an OIDC provider
// For other providers like Google, GitHub, etc., the structure is similar.
// Ensure you have KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET, and KEYCLOAK_ISSUER in your .env.local
import Keycloak from "next-auth/providers/keycloak";
// import Google from "next-auth/providers/google"; // Example for Google

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database", // Crucial: Use database sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days session expiry
    updateAge: 24 * 60 * 60, // 24 hours to update session data (how often to write to the DB)
  },
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID as string,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET as string,
      issuer: process.env.KEYCLOAK_ISSUER as string,
      // Optional: Add custom profile information to the NextAuth user object
      // This profile function is provider-specific.
      // It maps the provider's profile data to your User model.
      profile(profile) {
        return {
          // Important: `id` must be the provider's unique user ID.
          // For OIDC providers like Keycloak, `profile.sub` is standard.
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          // Example: If you added a 'role' field to your User model in schema.prisma
          // and your Keycloak tokens contain role information (e.g., in realm_access.roles).
          // role: profile.realm_access?.roles.includes('admin') ? 'admin' : 'user',
        };
      },
    }),
    // Example for Google provider:
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID as string,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    //   profile(profile) {
    //     return {
    //       id: profile.sub,
    //       name: profile.name,
    //       email: profile.email,
    //       image: profile.picture,
    //       // role: 'user', // Default role or map from Google groups if applicable
    //     };
    //   },
    // }),
    // Add other providers here if needed
  ],
  callbacks: {
    async session({ session, user /*, token */ }) {
      // The `user` object here is the user from your database.
      // The `token` object is not used with database sessions for session data.

      // Add custom data to the session object, making it available to the client.
      if (session.user && user) {
        session.user.id = user.id; // Add the user's database ID
        // Example: Add user's role if it exists on your User model
        // if (user.role) { // Assuming 'role' is a field on your Prisma User model
        //   session.user.role = user.role;
        // }
      }
      return session;
    },
    // The `jwt` callback is NOT typically needed when using database sessions (`strategy: "database"`).
    // The session data is stored in the database, and the session cookie only contains a sessionToken.
    // However, if you need to generate a JWT for other parts of your system (e.g., for an external API that expects a JWT),
    // you can still use the jwt callback. It won't be used by NextAuth for its own session management if strategy is "database".
    //
    // async jwt({ token, user, account, profile, isNewUser }) {
    //   // This callback is executed when a JWT is created (i.e., on sign in)
    //   // or when a session is accessed (if strategy: "jwt").
    //   if (user) { // `user` is available on initial sign-in
    //     token.id = user.id;
    //     // token.role = user.role; // Example: Add role to JWT
    //   }
    //   if (account) { // `account` is available on initial sign-in
    //     // token.accessToken = account.access_token; // Example: Add access token to JWT
    //   }
    //   return token;
    // },
  },
  // Optional: Events for logging or custom actions (e.g., sending welcome emails)
  // events: {
  //   async signIn(message) { /* user signed in */ },
  //   async createUser(message) { /* user created, e.g., send welcome email */ },
  // },

  // Optional: Custom pages (if you want to override default NextAuth UI)
  // pages: {
  //   signIn: '/auth/signin', // Custom sign-in page
  //   // signOut: '/auth/signout',
  //   // error: '/auth/error', // Error code passed in query string as ?error=
  //   // verifyRequest: '/auth/verify-request', // (e.g. via email)
  //   // newUser: '/auth/new-user' // New users will be directed here on first sign in
  // },

  // Debugging: Enable detailed Auth.js logs during development
  // debug: process.env.NODE_ENV === "development",
});

```

### Explanation:

*   **`import { PrismaAdapter } from "@auth/prisma-adapter";`**: Imports the adapter that allows NextAuth.js to interface with your Prisma client.
*   **`import { prisma } from "@/lib/prisma";`**: Imports your initialized Prisma client (from Step 3). Adjust the path (e.g., `../lib/prisma` or `~/lib/prisma`) if your `auth.ts` file is located differently, for example, inside `app/api/auth/[...nextauth]/`.
*   **`adapter: PrismaAdapter(prisma)`**: This is the core of the database session setup. It tells NextAuth.js to use Prisma for managing user accounts, sessions, etc.
*   **`session: { strategy: "database", ... }`**:
    *   `strategy: "database"`: This is crucial. It instructs NextAuth.js to store sessions in the database using the Prisma adapter. The browser cookie will only contain a session token (a pointer to the database record), not the full session payload. This is ideal for security and avoids cookie size limits.
    *   `maxAge`: (Optional) Defines the maximum age of a session in seconds. Default is 30 days.
    *   `updateAge`: (Optional) Defines how often the session expiry time is updated in the database in seconds. This happens when the session is accessed. Default is 24 hours.
*   **`providers: [...]`**:
    *   Configure your OAuth identity providers here. The example uses Keycloak. You'll need to install the specific provider package (e.g., `next-auth/providers/keycloak`).
    *   **Environment Variables**: Ensure client ID, client secret, and issuer URL (e.g., `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER`) are correctly set in your `.env.local` file. The `as string` assertions are a common way to satisfy TypeScript if you are sure these environment variables will be present.
    *   **`profile(profile)` function**: This function is vital. It maps the data received from the provider's profile endpoint to the fields in your `User` model (defined in `prisma/schema.prisma`).
        *   The `id` field in the returned object **must** be the unique user identifier from the provider (e.g., `profile.sub` for OIDC/Keycloak, `profile.id` for GitHub). This `id` will be stored in the `providerAccountId` field of the `Account` model.
        *   NextAuth uses this mapping to create or update the user in your database. Ensure the fields match your `User` model.
*   **`callbacks: { ... }`**:
    *   **`async session({ session, user })`**:
        *   This callback is invoked whenever a session is accessed (e.g., via `useSession()`, `auth()`, or `getSession()`).
        *   When using `strategy: "database"`, the `user` parameter in this callback is the user object directly from your database (as defined by your Prisma schema). The `token` parameter is not relevant for session data in this strategy.
        *   You can augment the `session.user` object with additional data you want to make available on the client-side. For example, `session.user.id = user.id;` adds the user's database ID (which is different from the provider's ID) to the session object accessible by your frontend. If you have custom fields like `role` on your `User` model, you can expose them here: `session.user.role = user.role;`.
    *   **`jwt({ token, user, account, profile, isNewUser })`**:
        *   When `strategy: "database"` is used, the `jwt` callback is **generally not required for session management itself**. The session is stored in the database, and the cookie contains a session ID.
        *   This callback is primarily for JWT-based sessions (`strategy: "jwt"`).
        *   However, you might still use it if:
            1.  You want to create a JWT for other purposes (e.g., to pass to a separate backend API that expects a JWT).
            2.  You want to enrich a JWT with information from the `user`, `account`, or `profile` objects during the initial sign-in, even if the JWT isn't used for NextAuth's own session management.
        *   If you do implement it, remember that for database sessions, this JWT is auxiliary; the database session remains the source of truth for authentication state within NextAuth.

By configuring NextAuth.js this way, sessions are securely stored in your PostgreSQL database, and your application benefits from smaller cookies and a robust, server-side session management strategy.

## Step 6: Test and Validate Session Storage

After configuring NextAuth to use database sessions and successfully logging in, you need to verify that session data is being stored correctly in your PostgreSQL database.

### 1. Trigger Session Creation

*   Start your Next.js application (`npm run dev` or similar).
*   Navigate to a page that initiates an authentication flow (e.g., a login button or a protected route).
*   Log in using the OAuth provider you configured (e.g., Keycloak).
*   If the login is successful, NextAuth should create a session record in the database.

### 2. Connect to Your PostgreSQL Database

Use a database management tool like pgAdmin, DBeaver, or the `psql` command-line interface to connect to your PostgreSQL database (e.g., `nextauth_db` using `your_user`).

**Using `psql`:**
```bash
psql -h localhost -p 5432 -U your_user -d nextauth_db
# You will be prompted for the password
```

### 3. Query the Database to Validate Sessions

Once connected, run the following SQL queries:

*   **Check the `Session` table:**
    This query retrieves all active sessions. You should see a new row created after a successful login.

    ```sql
    SELECT "id", "sessionToken", "userId", "expires" FROM "Session";
    ```
    *   **What to look for:**
        *   `id`: A unique identifier for the session entry.
        *   `sessionToken`: A unique token. This is the value stored in the user's session cookie (e.g., `next-auth.session-token` or `__Secure-authjs.session-token`).
        *   `userId`: The ID of the user associated with this session. This should match an `id` in your `User` table.
        *   `expires`: The timestamp when this session is set to expire.

*   **Check the `User` table:**
    This query retrieves users. You should see a user record corresponding to the `userId` found in the `Session` table.

    ```sql
    SELECT "id", "name", "email", "emailVerified", "image" FROM "User";
    ```
    *   **What to look for:**
        *   `id`: The user's unique identifier. This should match the `userId` in the `Session` table.
        *   `name`, `email`, `image`: Profile information, which should have been populated from the OAuth provider during login (as mapped in your `auth.ts` provider's `profile` function).
        *   `emailVerified`: May be null or a timestamp, depending on the provider and your configuration.

*   **Check the `Account` table (Optional but Recommended):**
    This query shows the linked OAuth accounts for users.

    ```sql
    SELECT "id", "userId", "type", "provider", "providerAccountId" FROM "Account";
    ```
    *   **What to look for:**
        *   `userId`: Should match the `id` of a user in the `User` table.
        *   `provider`: The name of the OAuth provider (e.g., "keycloak", "google").
        *   `providerAccountId`: The user's unique ID from that specific OAuth provider.

### 4. Verify Cookie Behavior (Browser Developer Tools)

1.  Open your browser's developer tools (usually by pressing F12).
2.  Go to the "Application" (in Chrome/Edge) or "Storage" (in Firefox) tab.
3.  Look for "Cookies" and select your application's domain.
4.  You should find a session cookie (e.g., `next-auth.session-token` or `__Secure-authjs.session-token` or `authjs.session-token` depending on NextAuth version and configuration).
    *   The value of this cookie should be the `sessionToken` you observed in the `Session` table.
    *   The cookie should be much smaller than it would be if it contained a full JWT. It's just an identifier.
    *   Check its attributes: `HttpOnly` should be true, `Secure` should be true if using HTTPS, `SameSite` is typically `lax` or `strict`.

By performing these checks, you can confirm that:
*   User and account information is being created/updated correctly upon login.
*   Session records are being stored in the database.
*   The client-side cookie is a simple session identifier, not a large JWT.

This validation ensures your database session strategy is working as intended.

## Step 7: Configure Logout Properly (NextAuth → Keycloak)

Proper logout involves invalidating the session in your Next.js application (removing it from the database) and, importantly, also logging the user out from the identity provider (IdP), such as Keycloak. This is often referred to as RP-Initiated Logout (Relying Party Initiated Logout).

### Understanding Keycloak Logout

When a user logs out of your application, you also want to ensure their session with Keycloak is terminated. If not, they might be automatically logged back into your application or other applications connected to the same Keycloak realm.

Keycloak supports logout via a specific URL. You need to redirect the user to this URL after their local NextAuth session is cleared. Keycloak requires an `id_token_hint` and often a `post_logout_redirect_uri` to perform the logout and then redirect the user back to your application.

### NextAuth Configuration for Logout

You can customize the sign-out behavior in NextAuth.js within the `events` or by overriding the `signOut` method if more complex logic is needed, though often redirecting after the default signout is sufficient. For database sessions, NextAuth's default `signOut` will remove the session from the database and clear the session cookie.

The main task is to redirect to Keycloak's logout endpoint after the local sign-out is complete.

1.  **Ensure Environment Variables for Keycloak Logout are Set:**
    You'll need the Keycloak issuer URL and potentially the client ID. The `id_token` obtained during login is also crucial.
    ```
    # .env.local
    KEYCLOAK_ISSUER="your_keycloak_issuer_url" # e.g., http://localhost:8080/realms/your-realm
    NEXTAUTH_URL="http://localhost:3000" # Your application's base URL

    # For client-side access to these variables, prefix them with NEXT_PUBLIC_
    NEXT_PUBLIC_KEYCLOAK_ISSUER="your_keycloak_issuer_url"
    NEXT_PUBLIC_NEXTAUTH_URL="http://localhost:3000"
    ```

2.  **Modifying `auth.ts` Callbacks to Include `id_token`:**

    To perform a Keycloak RP-Initiated logout, the `id_token_hint` is recommended. You need to make the `id_token` (received during login) available to the session object that your client-side logout function can access.

    Update your `auth.ts` callbacks:
    ```typescript
    // auth.ts (extending callbacks from Step 5)
    // ... other imports from your existing auth.ts
    // import { PrismaAdapter } from "@auth/prisma-adapter"; // Make sure it's imported
    // import { prisma } from "@/lib/prisma"; // Make sure it's imported
    // import Keycloak from "next-auth/providers/keycloak"; // Make sure it's imported

    export const { handlers, auth, signIn, signOut } = NextAuth({
      // ... adapter, session strategy, providers from Step 5
      adapter: PrismaAdapter(prisma),
      session: { strategy: "database" /* ... */ },
      providers: [
        Keycloak({
          clientId: process.env.KEYCLOAK_CLIENT_ID as string,
          clientSecret: process.env.KEYCLOAK_CLIENT_SECRET as string,
          issuer: process.env.KEYCLOAK_ISSUER as string,
          profile(profile) {
            return {
              id: profile.sub, // This maps the Keycloak 'sub' to 'id' in your User model
              name: profile.name ?? profile.preferred_username,
              email: profile.email,
              image: profile.picture,
              // Ensure other necessary fields are mapped
            };
          },
        }),
        // ... other providers
      ],
      callbacks: {
        async jwt({ token, account, user }) {
          // Persist the user's db id, id_token and provider to the JWT
          if (user) { // `user` is available on initial sign-in
            token.sub = user.id; // Persist the user's database ID to the token's 'sub'
          }
          if (account?.id_token) {
            token.id_token = account.id_token;
          }
          if (account?.provider) {
            token.provider = account.provider;
          }
          return token;
        },
        async session({ session, token }) {
          // `token` here is the JWT token from the `jwt` callback.
          // `session.user.id` is now the user's database ID (from token.sub).
          if (session.user && token.sub) {
            session.user.id = token.sub;
          }
          if (token.id_token) {
            (session as any).id_token = token.id_token; // Add id_token to session object
          }
          if (token.provider) {
            (session as any).provider = token.provider; // Add provider to session object
          }
          return session;
        },
      },
      events: {
        async signOut({ session, token }) {
          // This event is triggered AFTER the NextAuth session is invalidated locally.
          // `token` contains the JWT payload (including id_token and provider if added in jwt callback).
          // `session` is the session object that was just invalidated (might be empty or partial).

          // Note: The actual redirect to Keycloak's logout URL should be handled by the client
          // after NextAuth's signOut completes. This server-side event is good for logging
          // or if you had other server-side cleanup related to the IdP.

          if ((token as any).provider === "keycloak" && (token as any).id_token) {
            const issuer = process.env.KEYCLOAK_ISSUER;
            const postLogoutRedirectUri = process.env.NEXTAUTH_URL + "/"; // Or a specific logged-out page

            if (issuer) {
              const keycloakLogoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`);
              keycloakLogoutUrl.searchParams.set("id_token_hint", (token as any).id_token as string);
              keycloakLogoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
              
              console.log(`Server-side signOut event for Keycloak user. Client should redirect to: ${keycloakLogoutUrl.toString()}`);
            } else {
              console.error("Keycloak issuer URL is not configured for server-side logout event logging.");
            }
          }
        }
      }
      // ... rest of your auth.ts configuration
    });
    ```

3.  **Client-Side Logout Handling Component:**

    Create a button or link in your UI that, when clicked, signs the user out of NextAuth and then redirects them to Keycloak's logout endpoint.

    ```typescript
    // components/LogoutButton.tsx (Client Component)
    "use client"; // Marks this as a Client Component

    import { signOut, useSession } from "next-auth/react";

    const LogoutButton = () => {
      const { data: session, status } = useSession();

      const handleLogout = async () => {
        // Retrieve id_token and provider from the session object
        // These were added via the jwt and session callbacks in auth.ts
        const idToken = (session as any)?.id_token;
        const provider = (session as any)?.provider;

        // Step 1: Sign out from NextAuth.
        // This clears the local session cookie and removes the session from the database.
        // `redirect: false` prevents NextAuth from automatically redirecting; we'll handle it.
        await signOut({ redirect: false });

        // Step 2: If the provider was Keycloak and we have an id_token, redirect to Keycloak's logout URL.
        if (provider === "keycloak" && idToken) {
          const keycloakIssuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
          const postLogoutRedirectUri = (process.env.NEXT_PUBLIC_NEXTAUTH_URL || "http://localhost:3000") + "/"; // Redirect to home page after Keycloak logout

          if (keycloakIssuer) {
            const params = new URLSearchParams();
            params.set("id_token_hint", idToken);
            params.set("post_logout_redirect_uri", postLogoutRedirectUri);
            // This URI (postLogoutRedirectUri) must be whitelisted in your Keycloak client's
            // "Valid Post Logout Redirect URIs" setting.

            const logoutUrl = `${keycloakIssuer}/protocol/openid-connect/logout?${params.toString()}`;
            window.location.href = logoutUrl; // Perform the client-side redirect
          } else {
            console.warn("Keycloak issuer URL (NEXT_PUBLIC_KEYCLOAK_ISSUER) is not configured. Performing local logout only.");
            window.location.href = "/"; // Fallback: redirect to home page
          }
        } else {
          // If not Keycloak or no id_token, just redirect to home page after local signOut.
          window.location.href = "/";
        }
      };

      if (status === "loading") {
        return <p>Loading session...</p>;
      }

      return session ? (
        <button onClick={handleLogout}>Sign Out</button>
      ) : null;
    };

    export default LogoutButton;
    ```
    **Important Considerations for Client-Side Variables:**
    *   Ensure `NEXT_PUBLIC_KEYCLOAK_ISSUER` and `NEXT_PUBLIC_NEXTAUTH_URL` are defined in your `.env.local` file (e.g., `NEXT_PUBLIC_KEYCLOAK_ISSUER=http://localhost:8080/realms/your-realm`). The `NEXT_PUBLIC_` prefix makes them available in the browser.

### Confirmation Steps:

1.  **Local Session Invalidation:**
    *   Log in to your application using Keycloak.
    *   Click your custom `LogoutButton`.
    *   **Check Browser Cookies:** Open your browser's developer tools, navigate to Application (or Storage) > Cookies. The NextAuth session cookie (e.g., `next-auth.session-token`, `__Secure-authjs.session-token`, or `authjs.session-token`) should be deleted or invalidated.
    *   **Check Database:** Connect to your PostgreSQL database and query the `Session` table. The session record associated with the user who just logged out should be removed.
        ```sql
        -- Replace 'the_user_id' with the actual ID of the user who logged out.
        -- You might need to get this ID before logout for testing.
        SELECT * FROM "Session" WHERE "userId" = 'the_user_id';
        -- This query should return no rows for the session that was just terminated.
        ```

2.  **Keycloak Session Invalidation:**
    *   After clicking the logout button, your browser should be redirected to the Keycloak logout page, and then (if configured with `post_logout_redirect_uri`) back to your application (e.g., the homepage).
    *   **Attempt to Access Protected Route:** Try navigating to a protected route in your Next.js application. You should be redirected to the login page, requiring authentication via Keycloak.
    *   **Check Keycloak's Session:** If possible, try accessing another application that uses the same Keycloak realm for SSO, or Keycloak's own account management console. You should find that you are logged out or your session for the client you just logged out from is invalid. This confirms the global logout from Keycloak.
    *   When you try to log back into your application, Keycloak should prompt for credentials again, unless Keycloak itself has a separate "remember me" or session persistence feature enabled that is independent of the OIDC session for your specific client.

By implementing these steps, you ensure a robust logout mechanism that clears the session both locally within your Next.js application (database and cookie) and globally at the Keycloak identity provider.

## Step 8: Best Practices & Security Recommendations

Implementing database sessions with NextAuth.js, Prisma, and PostgreSQL is a robust approach. Here are some best practices, security recommendations, and considerations for maintaining and scaling your setup:

### 1. Security

*   **Cookie Security:**
    *   **`HttpOnly` Flag:** Ensure your session cookie is set with the `HttpOnly` flag. NextAuth.js does this by default. This prevents client-side JavaScript from accessing the cookie, mitigating XSS attacks targeting the session cookie.
    *   **`Secure` Flag:** In production, always serve your application over HTTPS and ensure the session cookie has the `Secure` flag (set `useSecureCookies: true` in `auth.js` or ensure `NEXTAUTH_URL` starts with `https://`). This prevents the cookie from being transmitted over unencrypted HTTP.
    *   **`SameSite` Attribute:** Use `SameSite=Lax` or `SameSite=Strict` for your session cookie to protect against CSRF attacks. NextAuth.js defaults to `Lax`.
    *   **Cookie Prefixes:** Consider using `__Host-` or `__Secure-` prefixes for your cookie names if your application structure allows (requires `Secure` flag and specific path attributes). NextAuth v5 often uses `authjs.session-token` or `__Secure-authjs.session-token`.

*   **Cross-Site Request Forgery (CSRF):**
    *   NextAuth.js has built-in CSRF protection for POST requests when modifying data (like sign-in/sign-out). It uses a double submit cookie pattern by default with a CSRF token. Ensure this is active. For GET requests that trigger state changes (like a GET-based logout link), ensure they are handled correctly or convert them to POST requests using a form.

*   **Cross-Site Scripting (XSS):**
    *   While `HttpOnly` cookies protect the session token, always sanitize user-generated content displayed on your pages to prevent XSS that could manipulate the DOM or make malicious API requests on behalf of the user.

*   **Database Security:**
    *   **Strong Credentials:** Use strong, unique passwords for your PostgreSQL database user. Store these securely using environment variables (as covered in Step 3).
    *   **Principle of Least Privilege:** The database user your Next.js application uses should only have the necessary permissions (SELECT, INSERT, UPDATE, DELETE) on the tables required by NextAuth (`User`, `Session`, `Account`, `VerificationToken`) and any other application tables. Avoid using a superuser role for the application in production.
    *   **Network Access:** Restrict network access to your database. If your app and database are on a cloud platform, use private networks or firewalls to allow connections only from your application servers.
    *   **Regular Backups:** Implement regular backups for your PostgreSQL database.
    *   **Encryption at Rest:** Ensure your database data is encrypted at rest, especially in cloud environments (most managed services offer this).
    *   **Encryption in Transit:** Use SSL/TLS for connections between your Next.js application and the PostgreSQL database. You can configure this in your `DATABASE_URL` by adding `?sslmode=require` (or other modes like `prefer`, `verify-full` depending on your setup). Example: `postgresql://user:pass@host:port/db?sslmode=require`.

*   **Session Management:**
    *   **Short Session Expiry:** Set a reasonable session expiry (`maxAge` in `auth.ts`). Balance user convenience with security. For sensitive applications, shorter session durations are better.
    *   **Session Token Rotation:** While NextAuth.js database sessions use a stable session token, be aware of practices for more advanced scenarios. For most cases, the default is secure.
    *   **Logout Invalidation:** Ensure logout properly invalidates the session on both the server (database) and the IdP (Keycloak), as covered in Step 7.

### 2. Scalability

*   **Database Performance:**
    *   **Indexing:** The Prisma schema for NextAuth includes indexes on frequently queried columns (e.g., `sessionToken` in `Session`, `email` in `User`, `provider` + `providerAccountId` in `Account`). Ensure these are effectively used. For very high traffic, you might need to analyze query performance.
    *   **Connection Pooling:** Prisma manages a connection pool. Ensure your database server is configured to handle the expected number of connections from your application instances. Serverless environments can lead to many short-lived connections; configure Prisma and your DB accordingly (e.g., using PgBouncer if direct connections become an issue).
    *   **Read Replicas:** For very large applications, consider using read replicas for your PostgreSQL database to offload read queries, though this adds complexity to your Prisma setup.

*   **Stateless vs. Stateful:**
    *   Database sessions make your application stateful at the session layer. This is generally fine and often necessary. Be mindful of this when designing your infrastructure, especially regarding horizontal scaling and sticky sessions (though NextAuth's session cookie handles identification, so sticky sessions at the load balancer level are not strictly required for session lookup itself).

### 3. Maintenance

*   **Prisma Migrations:** Manage database schema changes carefully using `prisma migrate dev` in development and `prisma migrate deploy` in production. Test migrations thoroughly.
*   **Cleaning Expired Sessions:**
    *   The `Session` table will accumulate expired sessions. While they won't be used for authentication, they consume database space.
    *   You should implement a periodic cleanup mechanism. This can be a cron job or a scheduled task that deletes sessions where the `expires` column is past the current time.
    *   **Example SQL to delete expired sessions:**
        ```sql
        DELETE FROM "Session" WHERE "expires" < NOW();
        ```
    *   You can run this using `psql` or integrate it into a small script run by a scheduler. Some ORMs or background job libraries can also help schedule this.

*   **Monitoring and Logging:**
    *   Monitor your application and database for performance issues or errors.
    *   Use NextAuth's logging options (e.g., `debug: true` in dev) and Prisma's logging for troubleshooting.

### 4. Future Considerations

*   **Advanced Session Features:** If you need features like viewing all active sessions for a user, or remotely logging out a specific session, you'll need to build custom logic on top of the basic session management.
*   **Multi-Region Deployments:** If deploying your application across multiple geographic regions, consider the latency and replication strategy for your session database.
*   **Security Audits:** For critical applications, conduct regular security audits of your authentication and session management implementation.
*   **Dependency Updates:** Keep NextAuth.js, Prisma, your database server, and other dependencies updated to receive security patches and new features.

By adhering to these practices, you can build a secure, scalable, and maintainable Next.js application using database sessions with PostgreSQL and Prisma.
