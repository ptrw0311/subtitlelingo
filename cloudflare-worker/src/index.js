// Cloudflare Worker for Turso Database API Proxy
// Deploy to: https://dash.cloudflare.com -> Workers & Pages

export default {
  async fetch(request, env, ctx) {
    // 處理 CORS 預檢請求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // 健康檢查
      if (path === '/health') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Turso 資料查詢端點
      if (path === '/api/query' && request.method === 'POST') {
        const body = await request.json();
        const { sql, params = [] } = body;

        if (!sql) {
          return new Response(JSON.stringify({ error: 'SQL query is required' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }

        // 構建 Turso HTTP API 請求
        const tursoUrl = env.TURSO_HTTP_URL;
        const authToken = env.TURSO_AUTH_TOKEN;

        const requests = [
          {
            type: 'execute',
            stmt: {
              sql: sql,
              args: params.map((val) => {
                // 處理不同類型的參數
                if (val === null) return { type: 'null' };
                if (typeof val === 'number') {
                  return Number.isInteger(val)
                    ? { type: 'integer', value: String(val) }
                    : { type: 'float', value: String(val) };
                }
                if (typeof val === 'boolean') {
                  return { type: 'integer', value: val ? '1' : '0' };
                }
                return { type: 'text', value: String(val) };
              }),
            },
          },
          { type: 'close' },
        ];

        const response = await fetch(`${tursoUrl}/v2/pipeline`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Turso API error:', errorText);
          return new Response(JSON.stringify({
            error: 'Database query failed',
            details: errorText,
          }), {
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }

        const data = await response.json();

        // 提取查詢結果
        const results = data.results
          ?.filter((r) => r.response?.result)
          ?.map((r) => r.response.result)
          ?.[0];

        return new Response(JSON.stringify({
          data: results?.rows || [],
          cols: results?.cols || [],
          affected_row_count: results?.affected_row_count || 0,
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // 404
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
