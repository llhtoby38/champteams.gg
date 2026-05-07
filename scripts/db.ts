import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';

const connectionString = process.env.DATABASE_URL || 'postgres://poketeam:poketeam@localhost:5433/poketeam';
const isRemote = !/localhost|127\.0\.0\.1/.test(connectionString);
const client = postgres(connectionString, isRemote ? { ssl: 'require' } : {});
export const db = drizzle(client, { schema });
export { client };
