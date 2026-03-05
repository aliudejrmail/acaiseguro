const { Pool } = require('pg');
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/acaiseguro' });
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