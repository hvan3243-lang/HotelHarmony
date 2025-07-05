import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please configure your MySQL database connection.",
  );
}

// Create connection pool
export const connection = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
});

// Create drizzle instance
export const db = drizzle(connection, { schema, mode: 'default' });