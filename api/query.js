import { createClient } from '@libsql/client';

export default async function handler(req, res) {
  // CORS 處理
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sql, params = [] } = req.body;

    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }

    // 建立 Turso 客戶端
    const client = createClient({
      url: process.env.TURSO_HTTP_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // 執行查詢
    const result = await client.execute({
      sql: sql,
      args: params,
    });

    // 返回結果
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      data: result.rows,
      cols: result.columns,
      affected_row_count: result.rows.length
    });
  } catch (error) {
    console.error('Query error:', error);
    return res.status(500).json({
      error: 'Database query failed',
      message: error.message
    });
  }
}
