// 本機預覽用：讓 `npm run dev` 也能處理 /api/query（正式站由 Vercel 的 api/query.js 處理）
// 預設只允許讀取；寫入類查詢（INSERT、UPDATE）會被拒絕，避免本機預覽改動資料庫
// 要允許寫入（例如試測驗頁存成績），啟動前設定環境變數 ALLOW_DEV_WRITES=1
import process from 'node:process';
import { resolveQuery } from '../api/_queries.js';

export default function apiDevPlugin(env) {
  return {
    name: 'subtitlelingo-api-dev',
    apply: 'serve',
    configureServer(server) {
      // api/query.js 讀取 TURSO_*；本機 .env 只有 VITE_TURSO_*，在這裡對應過去
      process.env.TURSO_HTTP_URL ||= env.TURSO_HTTP_URL || env.VITE_TURSO_URL;
      process.env.TURSO_AUTH_TOKEN ||= env.TURSO_AUTH_TOKEN || env.VITE_TURSO_AUTH_TOKEN;
      const allowWrites = (process.env.ALLOW_DEV_WRITES || env.ALLOW_DEV_WRITES) === '1';

      server.middlewares.use('/api/query', async (req, res) => {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body = {};
        try { body = raw ? JSON.parse(raw) : {}; } catch { /* 交給 handler 回 400 */ }

        // 讓 Node 的回應物件支援 handler 使用的 res.status().json()
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return res;
        };

        const resolved = resolveQuery(body.name, body.params ?? []);
        if (!allowWrites && resolved.sql && /^\s*(INSERT|UPDATE)\b/i.test(resolved.sql)) {
          return res.status(403).json({ error: '本機預覽只允許讀取資料庫；要寫入請設定 ALLOW_DEV_WRITES=1' });
        }

        const { default: handler } = await server.ssrLoadModule('/api/query.js');
        return handler({ method: req.method, body }, res);
      });
    },
  };
}
