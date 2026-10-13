// 播放控制的純邏輯：解析 YouTube 網址、判斷播到段落結尾時要做什麼

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const YT_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'];

// 從各種 YouTube 網址取出 11 碼影片 ID；不是 YouTube 網址時回傳 null
export function parseYouTubeId(input) {
  const value = String(input || '').trim();
  if (YT_ID.test(value)) return value;

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!YT_HOSTS.includes(url.hostname)) return null;

  const candidate = url.hostname === 'youtu.be'
    ? url.pathname.slice(1)
    : url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
  return YT_ID.test(candidate || '') ? candidate : null;
}

// 播放位置超過段落結尾時：loop 段落回到開始點、單句播放則停止
// 為了避免播放器回報時間的誤差，提前 0.05 秒判斷
export function rangeAction(time, range) {
  if (!range) return null;
  if (time >= range.end - 0.05) return range.loop ? 'loop' : 'stop';
  if (range.loop && time < range.start - 0.5) return 'loop';
  return null;
}
