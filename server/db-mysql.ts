import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../shared/schema-mysql.js';

// Create the connection
const connection = mysql.createConnection({
  uri: process.env.DATABASE_URL!,
});

export const db = drizzle(await connection, { schema, mode: 'default' });
export { connection };