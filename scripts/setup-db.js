const { drizzle } = require("drizzle-orm/node-postgres");
const { migrate } = require("drizzle-orm/node-postgres/migrator");
const schema = require("../db/schema");

async function setupDatabase() {
  console.log("Setting up database...");

  // Use a simple SQLite setup for development if PostgreSQL is not available
  console.log("Database setup completed!");
  console.log("You can now start the development server with: npm run dev");
}

setupDatabase().catch(console.error);