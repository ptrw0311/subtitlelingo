import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadState, saveState, getMovie, updateMovie,
  toggleStep, recommendedStep,
  addLineRep, setLinePassed, addFullRound,
  addSegment, updateSegment, removeSegment, addSegmentRep,
  addVocab, removeVocab,
  exportState, importState, STORAGE_KEY,
} from '../src/utils/progress-store.js';

// 模擬瀏覽器的 localStorage
function memoryStorage() {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    data,
  };
}

let storage;
beforeEach(() => { storage = memoryStorage(); });

describe('進度保存', () => {
  it('沒有資料時回傳空狀態，影片進度為預設值', () => {
    const state = loadState(storage);
    const m = getMovie(state, 'tt1');
    expect(m.completedSteps).toEqual([]);
    expect(m.fullRounds).toBe(0);
    expect(m.segments).toEqual([]);
    expect(recommendedStep(m)).toBe(1);
  });

  it('保存後重新讀取仍相同（INV-2）', () => {
    let state = loadState(storage);
    state = updateMovie(state, 'tt1', (m) => addLineRep(toggleStep(m, 1), 12));
    for (let i = 0; i < 6; i++) state = updateMovie(state, 'tt1', (m) => addLineRep(m, 12));
    saveState(storage, state);

    const reloaded = loadState(storage);
    const m = getMovie(reloaded, 'tt1');
    expect(m.completedSteps).toEqual([1]);
    expect(m.lineReps[12]).toBe(7);
  });

  it('不同影片的進度互不影響', () => {
    let state = loadState(storage);
    state = updateMovie(state, 'A', (m) => addFullRound(toggleStep(m, 2)));
    saveState(storage, state);
    const m = getMovie(loadState(storage), 'B');
    expect(m.completedSteps).toEqual([]);
    expect(m.fullRounds).toBe(0);
  });

  it('步驟可取消完成；建議下一步是第一個未完成的步驟（不強制順序）', () => {
    let m = getMovie(loadState(storage), 'tt1');
    m = toggleStep(toggleStep(m, 1), 3);
    expect(m.completedSteps).toEqual([1, 3]);
    expect(recommendedStep(m)).toBe(2);
    m = toggleStep(m, 1);
    expect(m.completedSteps).toEqual([3]);
    expect(recommendedStep(toggleStep(toggleStep(toggleStep(toggleStep(m, 1), 2), 4), 5))).toBe(null);
  });

  it('localStorage 內容損毀時回到空狀態，不會出錯', () => {
    storage.setItem(STORAGE_KEY, '{not json');
    expect(getMovie(loadState(storage), 'tt1').completedSteps).toEqual([]);
  });

  it('跟上了標記與整部片輪數', () => {
    let m = getMovie(loadState(storage), 'tt1');
    m = setLinePassed(m, 3, true);
    m = addFullRound(addFullRound(m));
    expect(m.linePassed[3]).toBe(true);
    expect(m.fullRounds).toBe(2);
    m = setLinePassed(m, 3, false);
    expect(m.linePassed[3]).toBeUndefined();
  });
});

describe('A-B 段落', () => {
  it('新增、改名、計次、刪除，並與整部片分開計算（Q3）', () => {
    let m = getMovie(loadState(storage), 'tt1');
    m = addSegment(m, { start: 65, end: 72 });
    const id = m.segments[0].id;
    expect(m.segments[0]).toMatchObject({ name: '段落 1', start: 65, end: 72, reps: 0, passed: false });

    m = updateSegment(m, id, { name: '夢境開場', end: 72.5 });
    m = addSegmentRep(addSegmentRep(addSegmentRep(m, id), id), id);
    expect(m.segments[0]).toMatchObject({ name: '夢境開場', end: 72.5, reps: 3 });
    expect(m.fullRounds).toBe(0);

    m = removeSegment(m, id);
    expect(m.segments).toEqual([]);
  });

  it('開始點晚於結束點時自動對調；長度為 0 時拒絕', () => {
    let m = getMovie(loadState(storage), 'tt1');
    m = addSegment(m, { start: 10, end: 5 });
    expect(m.segments[0]).toMatchObject({ start: 5, end: 10 });
    expect(() => addSegment(m, { start: 3, end: 3 })).toThrow();
  });
});

describe('我的生字本', () => {
  it('加入字與原句；同一部片同一個字不重複', () => {
    let state = loadState(storage);
    state = addVocab(state, { word: 'Subconscious', sentence: 'Your subconscious is looking for the dreamer.', movieId: 'tt1' });
    state = addVocab(state, { word: 'subconscious', sentence: 'again', movieId: 'tt1' });
    expect(state.vocab).toHaveLength(1);
    expect(state.vocab[0]).toMatchObject({ word: 'subconscious', movieId: 'tt1' });
    state = removeVocab(state, 'subconscious', 'tt1');
    expect(state.vocab).toEqual([]);
  });
});

describe('匯出／匯入進度檔（Q5）', () => {
  it('匯出後匯入可還原', () => {
    let state = loadState(storage);
    state = updateMovie(state, 'tt1', (m) => addFullRound(toggleStep(m, 5)));
    state = addVocab(state, { word: 'kick', sentence: 'Wait for the kick.', movieId: 'tt1' });
    const restored = importState(exportState(state));
    expect(getMovie(restored, 'tt1').fullRounds).toBe(1);
    expect(restored.vocab[0].word).toBe('kick');
  });

  it('拒絕格式錯誤的檔案', () => {
    expect(() => importState('hello')).toThrow();
    expect(() => importState(JSON.stringify({ app: 'other' }))).toThrow();
  });
});
