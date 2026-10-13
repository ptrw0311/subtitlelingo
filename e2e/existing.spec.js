import { test, expect } from './fixtures.js';

// 在首頁選 Inception，讓學習模式按鈕出現
async function selectInception(page) {
  await page.goto('/');
  await page.getByText('Inception').first().click();
  await expect(page.getByRole('button', { name: /觀看字幕/ })).toBeVisible();
}

test('AC-6 首頁 6 個學習模式按鈕都會帶到對應頁面', async ({ page }) => {
  await selectInception(page);
  await page.getByRole('button', { name: /觀看字幕/ }).click();
  await expect(page).toHaveURL(/\/learn\/1$/);

  await selectInception(page);
  await page.getByRole('button', { name: /跟讀練習/ }).click();
  await expect(page).toHaveURL(/\/learn\/1\?step=4$/);
  await expect(page.getByTestId('step-4')).toHaveAttribute('aria-current', 'step');

  await selectInception(page);
  await page.getByRole('button', { name: /精選對話/ }).click();
  await expect(page.getByTestId('tab-dialogue')).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: /影片生字/ }).click();
  await expect(page.getByTestId('tab-vocabulary')).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('button', { name: /四選一測驗/ }).click();
  await expect(page).toHaveURL(/\/quiz$/);

  await selectInception(page);
  await page.getByRole('button', { name: /今日待複習/ }).click();
  await expect(page).toHaveURL(/\/quiz$/);
});

test('AC-6 統計頁沒有資料時顯示「尚無資料」，不顯示假數字', async ({ page }) => {
  await page.goto('/stats');
  await expect(page.getByTestId('stats-empty')).toContainText('尚無資料');
  await expect(page.getByText('156')).toHaveCount(0);
  await expect(page.getByText('The Shawshank Redemption')).toHaveCount(0);
});

test('AC-6 統計頁顯示真實的學習進度', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('subtitlelingo.progress.v1', JSON.stringify({
      version: 1,
      movies: {
        1: { completedSteps: [1, 2], lineReps: { 0: 4, 2: 3 }, linePassed: {}, fullRounds: 2, segments: [{ id: 's', name: '段落 1', start: 1, end: 2, reps: 5, passed: false }], youtubeUrl: '', subtitleOffset: 0 },
      },
      vocab: [{ word: 'kick', sentence: 'Wait for the kick.', movieId: '1', addedAt: '2026-10-13T00:00:00Z' }],
    }));
  });
  await page.goto('/stats');
  await expect(page.getByTestId('stat-movies')).toHaveText('1');
  await expect(page.getByTestId('stat-rounds')).toHaveText('2');
  await expect(page.getByTestId('stat-reps')).toHaveText('12');
  await expect(page.getByTestId('stat-vocab')).toHaveText('1');
  const row = page.getByTestId('stats-movie').first();
  await expect(row).toContainText('Inception');
  await expect(row).toContainText('已完成 2 / 5 步');
  await expect(row).toContainText('下一步：步驟 3');
});

test('AC-6 填空頁選到沒有題目的電影時顯示「這部片還沒有題目」', async ({ page }) => {
  await page.goto('/practice/1');
  await expect(page.getByText('這部片還沒有題目')).toBeVisible();
  await expect(page.getByText("offer he can't")).toHaveCount(0);
});

test('AC-6 頁面內容不再只擠在左半邊', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  for (const path of ['/stats', '/practice/1', '/quiz', '/']) {
    await page.goto(path);
    const width = await page.locator('#root').evaluate((el) => el.getBoundingClientRect().width);
    expect(width, path).toBeGreaterThan(1300);
  }
});

test('AC-5 步驟 3 點字加入我的生字本，重新整理後仍在，且不寫入資料庫', async ({ page, api }) => {
  await page.goto('/learn/1?step=3');
  await page.locator('[data-word="subconscious"]').first().click();
  const vocab = page.getByTestId('my-vocab');
  await expect(vocab).toContainText('subconscious');
  await expect(vocab).toContainText('An idea, planted in your subconscious.');
  await page.reload();
  await expect(page.getByTestId('my-vocab')).toContainText('subconscious');
  expect(api.every((c) => /^(movies|subtitles)\./.test(c.name))).toBe(true);
});

test('AC-6 測驗頁的按鈕有顏色', async ({ page }) => {
  await page.goto('/quiz');
  const bg = await page.getByRole('button', { name: '開始測驗' }).evaluate((b) => getComputedStyle(b).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});

test('AC-8 首頁重要對話分頁仍能從字幕解析出對話（共用 srt.js 後）', async ({ page }) => {
  await selectInception(page);
  await page.getByTestId('tab-dialogue').click();
  await expect(page.getByText('What is the most resilient parasite?').first()).toBeVisible();
  await expect(page.getByText('An idea, planted in your subconscious.').first()).toBeVisible();
});
