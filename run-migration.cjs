require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
});

async function migrate() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', '0000_create_item_matches.sql'), 'utf8');
    const queries = sql.split('--> statement-breakpoint').map(q => q.trim()).filter(q => q);

    for (const query of queries) {
      console.log('Executing:', query.substring(0, 50) + '...');
      await pool.query(query);
    }

    console.log('✓ Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
