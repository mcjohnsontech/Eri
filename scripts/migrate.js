const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://eri:eri@localhost:5432/eri'
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const sql = fs.readFileSync(path.join(__dirname, 'migrate.sql'), 'utf8');
        await client.query(sql);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

migrate();
