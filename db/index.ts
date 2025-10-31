import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as authSchema from './schema/auth';
import * as schoolSchema from './schema/school';

// Handle missing database gracefully
let db: ReturnType<typeof drizzle> | null = null;

// Check for offline mode or missing database
const OFFLINE_MODE = process.env.OFFLINE_MODE === 'true' || !process.env.DATABASE_URL;

if (OFFLINE_MODE) {
  console.warn('🔌 Running in OFFLINE MODE - database features disabled');
} else if (process.env.DATABASE_URL) {
  try {
    console.log('Initializing database connection...');

    // Parse database URL and create connection config manually for better control
    const dbUrl = process.env.DATABASE_URL;
    console.log('Raw DATABASE_URL:', dbUrl ? 'Set' : 'Not set');

    let config;
    try {
      // For Supabase, we need to handle the connection string differently
      if (dbUrl.includes('supabase')) {
        // Extract connection details manually for Supabase
        const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
        if (urlMatch) {
          config = {
            host: urlMatch[3],
            port: parseInt(urlMatch[4]),
            database: urlMatch[5],
            user: urlMatch[1],
            password: urlMatch[2],
            ssl: {
              rejectUnauthorized: false,
              sslmode: 'require'
            },
            connectionTimeoutMillis: 20000, // 20 seconds for Supabase
            idleTimeoutMillis: 30000, // 30 seconds
            max: 5, // More connections for cloud
            min: 1, // Keep 1 connection alive
            application_name: 'yps-task-tracker',
            // Supabase specific settings
            keepAlive: true,
            keepAliveInitialDelayMillis: 5000,
          };
        } else {
          throw new Error('Invalid Supabase connection string format');
        }
      } else {
        // Standard PostgreSQL connection
        config = {
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 15000,
          idleTimeoutMillis: 30000,
          max: 5,
        };
      }

      console.log('Database config:', {
        host: config.host || 'Using connection string',
        port: config.port || 'default',
        database: config.database || 'postgres',
        user: config.user || 'from connection string',
        sslEnabled: !!config.ssl,
        supabase: dbUrl.includes('supabase')
      });
    } catch (configError) {
      console.error('Failed to parse database URL:', configError);
      throw configError;
    }

    const pool = new Pool(config);

    // Test the connection
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });

    pool.on('connect', () => {
      console.log('Database connected successfully');
    });

    db = drizzle(pool, {
      schema: {
        ...authSchema,
        ...schoolSchema,
      },
    });

    // Test connection with shorter timeout and more aggressive fallback
    const testConnection = async () => {
      try {
        console.log('Testing database connection...');
        const client = await Promise.race([
          pool.connect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection test timeout')), 5000)
          )
        ]);

        await Promise.race([
          client.query('SELECT NOW()'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query test timeout')), 3000)
          )
        ]);

        client.release();
        console.log('✅ Database connection test successful');
      } catch (error) {
        console.warn('❌ Database connection test failed:', error instanceof Error ? error.message : "Unknown error");
        console.warn('⚠️  Application will run in limited mode without database');
        // Don't throw error, just log it and continue with demo mode
      }
    };

    // Run connection test immediately
    testConnection();

  } catch (error) {
    console.warn('Database initialization failed, running in demo mode:', error);
  }
} else {
  console.warn('DATABASE_URL not found, running in demo mode');
}

export { db };

// Re-export all schemas for easy import
export * from './schema/auth';
export * from './schema/school';

// Export schema object for Drizzle operations
export const schema = {
  ...authSchema,
  ...schoolSchema,
};