import { test, expect, makeWav } from './fixtures.js';

const wav = { name: 'test-clip.wav', mimeType: 'audio/wav', buffer: makeWav() };

// 監看所有請求：不得出現影片或錄音上傳（INV-1）
function watchUploads(page) {
  const suspicious = [];
  page.on('request', (req) => {
    const size = req.postDataBuffer()?.length ?? 0;
    if (req.method() !== 'GET' && !req.url().endsWith('/api/query')) suspicious.push(req.url());
    if (size > 10_000) suspicious.push(`${req.url()} (${size} bytes)`);
  });
  return suspicious;
}

const videoTime = (page) => page.getByTestId('local-player').evaluate((v) => v.currentTime);

test('AC-1 五步驟進度保存，兩部片互不影響', async ({ page, api }) => {
  await page.goto('/learn/1');
  await expect(page.getByTestId('learn-title')).toHaveText('Inception');
  await expect(page.getByTestId('step-1')).toHaveAttribute('aria-current', 'step');

  await page.getByTestId('complete-step').click();
  await page.getByTestId('step-2').click();
  await page.getByTestId('complete-step').click();
  await page.reload();

  await expect(page.getByTestId('step-1')).toHaveAttribute('data-done', 'true');
  await expect(page.getByTestId('step-2')).toHaveAttribute('data-done', 'true');
  await expect(page.getByTestId('step-3')).toHaveAttribute('aria-current', 'step');
  await expect(page.getByTestId('step-3')).toContainText('建議下一步');

  await page.goto('/learn/2');
  await expect(page.getByTestId('learn-title')).toHaveText('The Godfather');
  await expect(page.getByTestId('step-1')).toHaveAttribute('data-done', 'false');
  expect(api.every((c) => !('sql' in c))).toBe(true);
});

test('AC-2 逐句播放原聲：播到句尾就停、重播、0.75 倍', async ({ page }) => {
  const uploads = watchUploads(page);
  await page.goto('/learn/1');
  await page.getByTestId('step-4').click();
  await page.getByTestId('local-file').setInputFiles(wav);
  await expect(page.getByTestId('local-player')).toBeVisible();
  await page.getByTestId('local-player').evaluate((v) => new Promise((r) => (v.readyState >= 1 ? r() : v.addEventListener('loadedmetadata', r))));

  const line2 = page.getByTestId('line').nth(1);
  await line2.getByTestId('play-line').click();
  await expect.poll(() => videoTime(page)).toBeGreaterThan(3);
  await expect(page.getByTestId('subtitle-overlay')).toContainText('resilient parasite');
  await expect.poll(() => page.getByTestId('local-player').evaluate((v) => v.paused), { timeout: 5000 }).toBe(true);
  const stopAt = await videoTime(page);
  expect(stopAt).toBeGreaterThan(4.7);
  expect(stopAt).toBeLessThan(5.4);

  // 重播同一句
  await line2.getByTestId('play-line').click();
  await expect.poll(() => videoTime(page)).toBeLessThan(4.5);

  await page.getByTestId('rate-0.75').click();
  await expect.poll(() => page.getByTestId('local-player').evaluate((v) => v.playbackRate)).toBe(0.75);
  expect(uploads).toEqual([]);
});

test('AC-3 錄音對照：可錄音並播放自己的錄音', async ({ page }) => {
  const uploads = watchUploads(page);
  await page.goto('/learn/1');
  await page.getByTestId('step-4').click();
  await page.getByTestId('local-file').setInputFiles(wav);
  await page.getByTestId('line').nth(0).getByTestId('play-line').click();

  const rec = page.getByTestId('recorder');
  await rec.getByRole('button', { name: '🎙 錄音' }).click();
  await rec.getByRole('button', { name: '⏹ 停止錄音' }).click({ delay: 800 });
  await expect(page.getByTestId('my-recording')).toBeVisible();
  await expect(rec.getByRole('button', { name: '▶ 播放原句' })).toBeVisible();
  expect(uploads).toEqual([]);
});

test('AC-4 跟說次數：單句 +1、整部片輪數，重新整理後不變', async ({ page }) => {
  await page.goto('/learn/1');
  await page.getByTestId('step-4').click();
  const line = page.getByTestId('line').nth(2);
  for (let i = 0; i < 3; i++) await line.getByTestId('line-rep').click();
  await expect(line.getByTestId('line-reps')).toHaveText('3 / 100');

  await page.getByTestId('step-5').click();
  await expect(page.getByTestId('line').nth(2)).toContainText('（字幕已隱藏）');
  await page.getByTestId('add-round').click();
  await expect(page.getByTestId('full-rounds')).toHaveText('第 1 / 100 遍');

  await page.reload();
  await page.getByTestId('step-5').click();
  await expect(page.getByTestId('full-rounds')).toHaveText('第 1 / 100 遍');
  await expect(page.getByTestId('line').nth(2).getByTestId('line-reps')).toHaveText('3 / 100');
});

test('AC-9 YouTube 嵌入和 A-B 重複', async ({ page, api }) => {
  const uploads = watchUploads(page);
  await page.goto('/learn/1');
  await page.getByTestId('step-4').click();

  // 錯誤網址會被拒絕
  await page.getByLabel('YouTube 網址').fill('https://example.com/x');
  await page.getByTestId('save-youtube').click();
  await expect(page.getByRole('alert')).toContainText('不是 YouTube 影片網址');

  await page.getByLabel('YouTube 網址').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await page.getByTestId('save-youtube').click();
  await expect(page.locator('[data-testid="youtube-player"] iframe')).toHaveAttribute('data-video-id', 'dQw4w9WgXcQ');

  // 在 1:05 按 A、1:12 按 B
  await page.evaluate(() => { window.__yt.time = 65; });
  await page.getByTestId('mark-a').click();
  await page.evaluate(() => { window.__yt.time = 72; });
  await page.getByTestId('mark-b').click();
  await expect(page.getByTestId('segment-range')).toHaveText('1:05.0–1:12.0');

  // 重複播放：先跳到開始點，播過結束點後再跳回開始點
  await page.getByTestId('segment-play').click();
  await expect.poll(() => page.evaluate(() => window.__yt.time)).toBe(65);
  await page.evaluate(() => { window.__yt.calls = []; window.__yt.time = 72.2; });
  await expect.poll(() => page.evaluate(() => window.__yt.calls.filter((c) => c[0] === 'seekTo').map((c) => c[1]))).toContain(65);

  await page.getByTestId('rate-0.75').click();
  await expect.poll(() => page.evaluate(() => window.__yt.calls.some((c) => c[0] === 'setPlaybackRate' && c[1] === 0.75))).toBe(true);

  // 重新整理後網址和段落仍在
  await page.reload();
  await page.getByTestId('step-4').click();
  await expect(page.getByLabel('YouTube 網址')).toHaveValue('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await expect(page.locator('[data-testid="youtube-player"] iframe')).toHaveCount(1);
  await expect(page.getByTestId('segment-range')).toHaveText('1:05.0–1:12.0');

  // 禁止嵌入的影片顯示提示
  await page.evaluate(() => window.__yt.opts.events.onError({ data: 150 }));
  await expect(page.getByRole('alert')).toContainText('不允許嵌入');

  // 網址沒有送到資料庫 API，也沒有上傳
  expect(api.some((c) => JSON.stringify(c).includes('dQw4w9WgXcQ'))).toBe(false);
  expect(uploads).toEqual([]);
});

test('AC-9 A-B 重複在本機影片也能用', async ({ page }) => {
  await page.goto('/learn/1');
  await page.getByTestId('step-4').click();
  await page.getByTestId('local-file').setInputFiles(wav);
  const player = page.getByTestId('local-player');
  await player.evaluate((v) => new Promise((r) => (v.readyState >= 1 ? r() : v.addEventListener('loadedmetadata', r))));

  await player.evaluate((v) => { v.currentTime = 2; });
  await page.getByTestId('mark-a').click();
  await player.evaluate((v) => { v.currentTime = 3; });
  await page.getByTestId('mark-b').click();
  await expect(page.getByTestId('segment-range')).toHaveText('0:02.0–0:03.0');

  await page.getByTestId('segment-play').click();
  // 播放 2.5 秒以上，位置應一直留在 2–3 秒之間（播到 3 秒就跳回 2 秒）
  await page.waitForTimeout(2500);
  const t = await player.evaluate((v) => v.currentTime);
  expect(t).toBeGreaterThanOrEqual(1.9);
  expect(t).toBeLessThan(3.2);
  expect(await player.evaluate((v) => v.paused)).toBe(false);
});
