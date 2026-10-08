import { Pool } from 'pg';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/eri',
});

// A small utility wrapper for the client
export const query = (text: string, params?: any[]) => {
  return db.query(text, params);
};
