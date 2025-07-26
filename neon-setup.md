# Neon Database Setup for Replit

## Quick Setup Guide

### 1. Environment Variables
The following environment variables are already configured in your Replit project:
- `DATABASE_URL` - Complete connection string
- `PGDATABASE` - Database name
- `PGHOST` - Neon host endpoint
- `PGPORT` - Port (5432)
- `PGUSER` - Database user
- `PGPASSWORD` - Database password

### 2. Database Connection

This project uses **Drizzle ORM** with Neon for production reliability, but also includes a standard PostgreSQL client template for testing and direct database operations.

#### Current Setup:
- **Primary**: Drizzle ORM with Neon serverless driver (`server/db.ts`)
- **Template**: Standard pg client for testing (`neon-db-template.js`)

### 3. Testing Database Connection

Run the test template:
```bash
node neon-db-template.js
```

### 4. Database Schema

The current schema includes:
- **users** - User authentication and profiles
- **debts** - Debt tracking with flexible payment options
- **budgetItems** - Income and expense management
- **payments** - Payment history and tracking

### 5. Migration Commands

```bash
# Push schema changes to database
npm run db:push

# Generate migrations (if needed)
npx drizzle-kit generate
```

### 6. For New Replit Projects

If importing this project to a new Replit account:

1. Create a new Neon database at [neon.tech](https://neon.tech)
2. Copy the connection details to your Replit secrets
3. Run `npm run db:push` to set up the schema
4. Test with `node neon-db-template.js`

### 7. Security Notes

- Never commit actual credentials to your repository
- Use Replit secrets for environment variables in production
- The `.env.example` file shows the required variables structure