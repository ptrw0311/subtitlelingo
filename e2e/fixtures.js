import { test as base, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { resolveQuery } from '../api/_queries.js';

// 假資料：兩部片，第 1 部有 3 句英文字幕
export const SRT = `1
00:00:01,000 --> 00:00:02,500
Hello there, dreamer.

2
00:00:03,000 --> 00:00:05,000
What is the most resilient parasite?

3
00:00:06,000 --> 00:00:08,000
An idea, planted in your subconscious.
`;

export const MOVIES = [
  { id: 1, imdb_id: 'tt1375666', title: 'Inception', year: 2010, type: 'movie', download_count: 10 },
  { id: 2, imdb_id: 'tt0068646', title: 'The Godfather', year: 1972, type: 'movie', download_count: 5 },
];

const FIXTURES = {
  'movies.count': () => [{ count: MOVIES.length }],
  'movies.getAll': () => MOVIES,
  'movies.getById': ([id]) => MOVIES.filter((m) => m.id === Number(id)),
  'movies.getByImdbId': ([imdb]) => MOVIES.filter((m) => m.imdb_id === imdb),
  'movies.search': () => MOVIES,
  'subtitles.getByMovieId': ([id]) => (Number(id) === 1 ? [{ id: 11, movie_id: 1, srt_content: SRT }] : []),
};

// 16-bit 單聲道 WAV（無聲），當作「本機影片檔」測試播放位置和速度
export function makeWav(seconds = 12, rate = 8000) {
  const samples = seconds * rate;
  const buf = Buffer.alloc(44 + samples * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples * 2, 40);
  return buf;
}

// 假的 YouTube IFrame API：記錄網站送出的指令，時間由測試控制
const FAKE_YT = `
window.__yt = { calls: [], time: 0 };
window.YT = { Player: class {
  constructor(el, opts) {
    const f = document.createElement('iframe');
    f.dataset.videoId = opts.videoId;
    el.replaceWith(f);
    Object.assign(window.__yt, { opts, player: this });
  }
  seekTo(t) { window.__yt.calls.push(['seekTo', t]); window.__yt.time = t; }
  playVideo() { window.__yt.calls.push(['playVideo']); }
  pauseVideo() { window.__yt.calls.push(['pauseVideo']); }
  setPlaybackRate(r) { window.__yt.calls.push(['setPlaybackRate', r]); }
  getCurrentTime() { return window.__yt.time; }
  loadModule(m) { window.__yt.calls.push(['loadModule', m]); }
  unloadModule(m) { window.__yt.calls.push(['unloadModule', m]); }
  destroy() {}
} };
window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady();
`;

export const test = base.extend({
  // auto：每個測試都自動攔截 API，避免誤連正式資料庫
  api: [async ({ page }, provide) => {
    const calls = [];
    // 攔截資料庫 API：只回應白名單內的具名查詢，並記錄所有請求
    await page.route('**/api/query', async (route) => {
      const body = route.request().postDataJSON();
      calls.push(body);
      const resolved = resolveQuery(body?.name, body?.params ?? []);
      if (resolved.error) return route.fulfill({ status: 400, json: { error: resolved.error } });
      const data = FIXTURES[body.name]?.(body.params) ?? [];
      return route.fulfill({ json: { data, cols: [], affected_row_count: data.length } });
    });
    await page.route('https://www.youtube.com/iframe_api', (route) =>
      route.fulfill({ contentType: 'text/javascript', body: FAKE_YT }));
    // 其他外部請求（字型等）直接放行
    await provide(calls);
  }, { auto: true }],
});

export { expect };
