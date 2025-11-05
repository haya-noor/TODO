# Database Troubleshooting Guide

## Quick Commands

### Check Database State
```bash
npm run db:check
```
This will show:
- All tables that exist
- Table structures (columns, types, constraints)
- Row counts
- Foreign keys and indexes

### Check Tables Directly (PostgreSQL)
```bash
# Using psql (if installed)
psql $DATABASE_URL -c "\dt"  # List tables
psql $DATABASE_URL -c "\d users"  # Describe users table
psql $DATABASE_URL -c "\d tasks"  # Describe tasks table
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"  # Count users
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tasks;"  # Count tasks
```

### Push Schema Changes
```bash
npm run db:push
```
This will apply any schema changes from your code to the database.

### Open Drizzle Studio (Visual Database Browser)
```bash
npm run db:studio
```
Opens a web interface to browse and edit your database.

## Common Issues

### 1. Tables Don't Exist
**Symptoms:** `db:check` shows missing tables

**Solution:**
```bash
npm run db:push
```

### 2. Schema Mismatch
**Symptoms:** Errors about missing columns or wrong types

**Solution:**
1. Check your schema files:
   - `src/app/infra/db/user.table.ts`
   - `src/app/infra/db/task.table.ts`
2. Run `npm run db:push` to sync

### 3. Migration Issues
**Symptoms:** "relation already exists" or migration errors

**Solution:**
1. Check if tables exist but schema is wrong:
   ```bash
   npm run db:check
   ```
2. If needed, manually drop and recreate:
   ```sql
   -- WARNING: This will delete all data!
   DROP TABLE IF EXISTS tasks CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
   Then run `npm run db:push`

### 4. Connection Issues
**Symptoms:** "connection refused" or "authentication failed"

**Solution:**
1. Check `.env` file has correct `DATABASE_URL`
2. Verify database is running:
   ```bash
   # If using Docker
   docker ps | grep postgres
   
   # If using local PostgreSQL
   sudo systemctl status postgresql
   ```
3. Test connection:
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

### 5. Foreign Key Violations
**Symptoms:** Errors when creating tasks about assignee_id

**Solution:**
- Ensure users exist before creating tasks
- Check that `assignee_id` references an existing user

## Expected Tables Structure

### users
- `id` (uuid, primary key)
- `name` (varchar(255), not null)
- `email` (varchar(255), not null)
- `password` (varchar(255), not null)
- `created_at` (timestamp, not null)
- `updated_at` (timestamp, not null)

### tasks
- `id` (uuid, primary key)
- `title` (varchar(255), not null)
- `description` (text, nullable)
- `status` (varchar(20), not null)
- `assignee_id` (uuid, not null)
- `created_at` (timestamp, not null)
- `updated_at` (timestamp, not null)

## Verification Steps

1. **Check tables exist:**
   ```bash
   npm run db:check
   ```

2. **Verify structure matches code:**
   - Compare `db:check` output with table definitions
   - Check `src/app/infra/db/user.table.ts`
   - Check `src/app/infra/db/task.table.ts`

3. **Test database operations:**
   - Run tests: `npm test`
   - Create a user via API
   - Create a task via API


