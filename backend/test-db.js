const { Pool } = require('pg');
const config = require('./src/config');

console.log('Connecting to DB with:', {
    host: config.db.host,
    user: config.db.user,
    database: config.db.database,
    port: config.db.port
});

const pool = new Pool(config.db);

pool.query('SELECT 1 as result')
    .then(res => {
        console.log('✅ DB Connection successful:', res.rows[0]);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ DB Connection failed:', err);
        process.exit(1);
    });
