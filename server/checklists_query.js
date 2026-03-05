require('dotenv').config();
const { Pool } = require('pg');
(async () => {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'acaiseguro'
  });
  try {
    const b = await pool.query("SELECT id,nome_fantasia FROM batedores WHERE nome_fantasia ILIKE '%Teste%' LIMIT 1");
    console.log('batedor', b.rows);
    if (b.rows.length) {
      const id = b.rows[0].id;
      const c = await pool.query('SELECT * FROM checklists WHERE batedor_id=$1 ORDER BY data_checklist DESC', [id]);
      console.log('checklists', JSON.stringify(c.rows, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();