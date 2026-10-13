// SRT 字幕工具：把字幕文字拆成「第幾句、開始秒數、結束秒數、台詞」

// "00:01:02,100" 或 "00:01:02.100" → 62.1 秒
export function parseTimestamp(value) {
  const match = /(\d+):(\d{2}):(\d{2})[,.](\d{1,3})/.exec(value || '');
  if (!match) return NaN;
  const [, h, m, s, ms] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, '0')) / 1000;
}

// 62.1 → "1:02.1"；3723 → "1:02:03.0"
export function formatSeconds(seconds) {
  const total = Math.max(0, seconds || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = (total % 60).toFixed(1).padStart(4, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

// 解析整份 SRT；每句含 index（從 0 起算）、sequence（字幕檔序號）、start、end、timeStart、timeEnd、text
export function parseSrt(content) {
  if (!content) return [];
  const blocks = String(content).replace(/\r\n?/g, '\n').split(/\n\s*\n/);
  const lines = [];

  for (const block of blocks) {
    const rows = block.split('\n').map((r) => r.trim()).filter(Boolean);
    const timeRow = rows.findIndex((r) => r.includes('-->'));
    if (timeRow < 0) continue;

    const [timeStart, timeEnd] = rows[timeRow].split('-->').map((t) => t.trim().split(/\s+/)[0]);
    const start = parseTimestamp(timeStart);
    const end = parseTimestamp(timeEnd);
    const text = rows.slice(timeRow + 1).join(' ').replace(/<[^>]+>/g, '').trim();
    if (Number.isNaN(start) || Number.isNaN(end) || !text) continue;

    const sequence = timeRow > 0 && /^\d+$/.test(rows[timeRow - 1]) ? parseInt(rows[timeRow - 1], 10) : lines.length + 1;
    lines.push({ index: lines.length, sequence, start, end, timeStart, timeEnd, text });
  }

  return lines;
}

// 找出目前秒數所在的句子；offset 為字幕微調秒數（正數＝字幕延後）
export function findLineAt(lines, time, offset = 0) {
  return lines.findIndex((l) => time >= l.start + offset && time < l.end + offset);
}
