import { describe, it, expect } from 'vitest';
import { parseSrt, parseTimestamp, formatSeconds, findLineAt } from '../src/utils/srt.js';

const SAMPLE = `1
00:00:01,000 --> 00:00:02,500
Hello there.

2
00:00:03,000 --> 00:00:05,250
What is the most
resilient parasite?

3
00:01:02,100 --> 00:01:04,000
[MUSIC]
`;

describe('parseSrt 字幕拆句', () => {
  it('拆出序號、開始與結束秒數、台詞', () => {
    const lines = parseSrt(SAMPLE);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({ index: 0, sequence: 1, start: 1, end: 2.5, text: 'Hello there.' });
    expect(lines[0].timeStart).toBe('00:00:01,000');
    expect(lines[1].text).toBe('What is the most resilient parasite?');
    expect(lines[2]).toMatchObject({ start: 62.1, end: 64, text: '[MUSIC]' });
  });

  it('支援 Windows 換行（CRLF）與點號毫秒', () => {
    const lines = parseSrt('1\r\n00:00:01.000 --> 00:00:02.000\r\nHi\r\n');
    expect(lines).toEqual([expect.objectContaining({ start: 1, end: 2, text: 'Hi' })]);
  });

  it('空內容回傳空陣列', () => {
    expect(parseSrt('')).toEqual([]);
    expect(parseSrt(null)).toEqual([]);
  });

  it('移除 HTML 標籤', () => {
    const lines = parseSrt('1\n00:00:01,000 --> 00:00:02,000\n<i>Dream</i> bigger\n');
    expect(lines[0].text).toBe('Dream bigger');
  });
});

describe('時間工具', () => {
  it('parseTimestamp', () => {
    expect(parseTimestamp('01:02:03,456')).toBeCloseTo(3723.456);
  });

  it('formatSeconds', () => {
    expect(formatSeconds(65.4)).toBe('1:05.4');
    expect(formatSeconds(3723)).toBe('1:02:03.0');
  });

  it('findLineAt 依目前秒數找到台詞（含字幕微調）', () => {
    const lines = parseSrt(SAMPLE);
    expect(findLineAt(lines, 4)).toBe(1);
    expect(findLineAt(lines, 2.8)).toBe(-1);
    // 字幕延後 0.5 秒：原本 2.5 秒結束的句子，在 2.8 秒時仍算第 0 句
    expect(findLineAt(lines, 2.8, 0.5)).toBe(0);
  });
});
