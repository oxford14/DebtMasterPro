// neon-db-replit-template (JavaScript)
// Reusable Neon PostgreSQL connection template for Replit

// 1. Load environment variables
import dotenv from 'dotenv'
dotenv.config()

// 2. Import PostgreSQL client
import pkg from 'pg'
const { Client } = pkg

// 3. Connect to Neon PostgreSQL database
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// 4. Test the connection
async function testConnection() {
  try {
    await client.connect()
    const res = await client.query('SELECT NOW()')
    console.log('✅ Connected to Neon DB:', res.rows)
    await client.end()
  } catch (err) {
    console.error('❌ Connection error:', err)
  }
}

// 5. Example database operations
async function createTable() {
  try {
    await client.connect()
    
    // Example: Create a users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    
    console.log('✅ Table created successfully')
    await client.end()
  } catch (err) {
    console.error('❌ Table creation error:', err)
  }
}

// 6. Example data insertion
async function insertData() {
  try {
    await client.connect()
    
    const result = await client.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      ['John Doe', 'john@example.com']
    )
    
    console.log('✅ Data inserted:', result.rows[0])
    await client.end()
  } catch (err) {
    console.error('❌ Data insertion error:', err)
  }
}

// 7. Example data retrieval
async function getData() {
  try {
    await client.connect()
    
    const result = await client.query('SELECT * FROM users')
    console.log('✅ Data retrieved:', result.rows)
    
    await client.end()
  } catch (err) {
    console.error('❌ Data retrieval error:', err)
  }
}

// Export functions for use in other modules
export {
  testConnection,
  createTable,
  insertData,
  getData
}

// Run test connection if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  testConnection()
}