import { describe, it, expect } from 'vitest';
import { parseYouTubeId, rangeAction } from '../src/utils/playback.js';

describe('parseYouTubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=30', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?t=5', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('%s', (url, id) => {
    expect(parseYouTubeId(url)).toBe(id);
  });

  it.each(['', 'https://example.com/watch?v=dQw4w9WgXcQ', 'not a url', 'https://www.youtube.com/watch?v=short'])(
    '拒絕 %s', (url) => {
      expect(parseYouTubeId(url)).toBe(null);
    });
});

describe('rangeAction 播到段落結尾時的動作', () => {
  it('還沒到結尾：不動作', () => {
    expect(rangeAction(5, { start: 3, end: 8, loop: true })).toBe(null);
  });

  it('A-B 重複：到結尾跳回開始點', () => {
    expect(rangeAction(8, { start: 3, end: 8, loop: true })).toBe('loop');
  });

  it('單句播放：到句尾就停', () => {
    expect(rangeAction(8.01, { start: 3, end: 8, loop: false })).toBe('stop');
  });

  it('使用者把影片拖到段落之前：A-B 重複時跳回開始點', () => {
    expect(rangeAction(1, { start: 3, end: 8, loop: true })).toBe('loop');
    expect(rangeAction(1, { start: 3, end: 8, loop: false })).toBe(null);
  });

  it('沒有段落：不動作', () => {
    expect(rangeAction(5, null)).toBe(null);
  });
});
