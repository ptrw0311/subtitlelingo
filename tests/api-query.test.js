import { describe, it, expect, vi, beforeEach } from 'vitest';

// 模擬 Turso 客戶端，記錄實際送出的 SQL
const execute = vi.fn();
vi.mock('@libsql/client', () => ({
  createClient: () => ({ execute }),
}));

const { default: handler } = await import('../api/query.js');
const { QUERIES } = await import('../api/_queries.js');

function makeRes() {
  const res = { statusCode: 0, body: null, headers: {} };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  res.end = () => res;
  return res;
}

async function call(body) {
  const res = makeRes();
  await handler({ method: 'POST', body }, res);
  return res;
}

describe('/api/query 只接受具名查詢', () => {
  beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue({ rows: [{ id: 1 }], columns: ['id'] });
  });

  it('拒絕任意 SQL', async () => {
    const res = await call({ sql: 'DROP TABLE movies' });
    expect(res.statusCode).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it('拒絕未知的查詢名稱', async () => {
    const res = await call({ name: 'dropEverything', params: [] });
    expect(res.statusCode).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it('同時帶 sql 與已知名稱時，只執行白名單 SQL', async () => {
    const res = await call({ name: 'movies.getAll', params: [10], sql: 'DELETE FROM movies' });
    expect(res.statusCode).toBe(200);
    expect(execute).toHaveBeenCalledWith({ sql: QUERIES['movies.getAll'], args: [10] });
  });

  it('參數數量不符時拒絕', async () => {
    const res = await call({ name: 'movies.getAll', params: [] });
    expect(res.statusCode).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it('參數只能是字串、數字、布林或 null', async () => {
    const res = await call({ name: 'movies.getById', params: [{ evil: true }] });
    expect(res.statusCode).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it('已知名稱以參數執行並回傳資料', async () => {
    const res = await call({ name: 'subtitles.getByMovieId', params: ['tt1375666'] });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([{ id: 1 }]);
  });

  it('白名單內沒有改資料庫結構或刪除資料的指令', () => {
    for (const sql of Object.values(QUERIES)) {
      expect(sql).not.toMatch(/\b(CREATE|ALTER|DROP|DELETE|TRUNCATE|PRAGMA|ATTACH)\b/i);
    }
  });
});
