/**
 * Database Check Script
 * 
 * Verifies database state:
 * - Checks if tables exist
 * - Shows table structure
 * - Counts rows in each table
 * - Checks for any issues
 */

import { config } from "dotenv";
import postgres from "postgres";

config();

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/todo_db";

async function checkDatabase() {
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log("🔍 Checking database state...\n");
    
    // Check if tables exist
    console.log("📋 Checking tables...");
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log(`Found ${tables.length} table(s):`);
    tables.forEach((t: any) => console.log(`  ✓ ${t.table_name}`));
    
    // Check for expected tables
    const expectedTables = ["users", "tasks"];
    const existingTableNames = tables.map((t: any) => t.table_name);
    const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`\n❌ Missing tables: ${missingTables.join(", ")}`);
      console.log("   Run: npx drizzle-kit push");
    } else {
      console.log("\n✅ All expected tables exist");
    }
    
    // Check table structures
    console.log("\n📊 Table Structures:");
    for (const table of expectedTables) {
      if (existingTableNames.includes(table)) {
        const columns = await sql`
          SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = ${table}
          ORDER BY ordinal_position;
        `;
        
        console.log(`\n  ${table}:`);
        columns.forEach((col: any) => {
          const length = col.character_maximum_length ? `(${col.character_maximum_length})` : "";
          const nullable = col.is_nullable === "YES" ? "NULL" : "NOT NULL";
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : "";
          console.log(`    - ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultVal}`);
        });
        
        // Count rows
        const countResult = await sql.unsafe(`SELECT COUNT(*) as count FROM ${table}`);
        const count = countResult[0]?.count || 0;
        console.log(`    Rows: ${count}`);
      }
    }
    
    // Check for foreign key constraints
    console.log("\n🔗 Foreign Key Constraints:");
    const foreignKeys = await sql`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public';
    `;
    
    if (foreignKeys.length > 0) {
      foreignKeys.forEach((fk: any) => {
        console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log("  No foreign key constraints found");
    }
    
    // Check for indexes
    console.log("\n📑 Indexes:");
    const indexes = await sql`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    if (indexes.length > 0) {
      indexes.forEach((idx: any) => {
        console.log(`  ${idx.tablename}.${idx.indexname}`);
      });
    } else {
      console.log("  No indexes found");
    }
    
    console.log("\n✅ Database check complete!");
    
  } catch (error) {
    console.error("❌ Error checking database:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkDatabase();

