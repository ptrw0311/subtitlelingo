// 學習進度保存：五步驟進度、跟說次數、A-B 段落、我的生字本、YouTube 網址
// 全部存在瀏覽器的 localStorage，不寫入資料庫（設計 INV-4）
// 所有更新函式都回傳新物件，不直接修改傳入的資料

export const STORAGE_KEY = 'subtitlelingo.progress.v1';
const APP_ID = 'subtitlelingo-progress';
export const STEP_COUNT = 5;

const emptyState = () => ({ version: 1, movies: {}, vocab: [] });

export const emptyMovie = () => ({
  completedSteps: [],
  lineReps: {},
  linePassed: {},
  fullRounds: 0,
  segments: [],
  youtubeUrl: '',
  subtitleOffset: 0,
});

function normalize(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.movies !== 'object' || !Array.isArray(raw.vocab)) {
    return null;
  }
  return { version: 1, movies: raw.movies || {}, vocab: raw.vocab };
}

export function loadState(storage = globalThis.localStorage) {
  try {
    return normalize(JSON.parse(storage.getItem(STORAGE_KEY))) || emptyState();
  } catch {
    return emptyState();
  }
}

export function saveState(storage = globalThis.localStorage, state) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getMovie(state, movieId) {
  return { ...emptyMovie(), ...(state.movies[movieId] || {}) };
}

export function updateMovie(state, movieId, updater) {
  return { ...state, movies: { ...state.movies, [movieId]: updater(getMovie(state, movieId)) } };
}

// 五步驟：點一下完成，再點一下取消；不強制順序（Q4）
export function toggleStep(movie, step) {
  const done = movie.completedSteps.includes(step)
    ? movie.completedSteps.filter((s) => s !== step)
    : [...movie.completedSteps, step].sort((a, b) => a - b);
  return { ...movie, completedSteps: done };
}

// 建議的下一步：第一個還沒完成的步驟；全部完成時回傳 null
export function recommendedStep(movie) {
  for (let s = 1; s <= STEP_COUNT; s++) {
    if (!movie.completedSteps.includes(s)) return s;
  }
  return null;
}

export function addLineRep(movie, lineIndex) {
  return { ...movie, lineReps: { ...movie.lineReps, [lineIndex]: (movie.lineReps[lineIndex] || 0) + 1 } };
}

export function setLinePassed(movie, lineIndex, passed) {
  const linePassed = { ...movie.linePassed };
  if (passed) linePassed[lineIndex] = true;
  else delete linePassed[lineIndex];
  return { ...movie, linePassed };
}

export function addFullRound(movie) {
  return { ...movie, fullRounds: movie.fullRounds + 1 };
}

// A-B 段落（Q3：段落另外計次）
export function addSegment(movie, { start, end, name }) {
  const [a, b] = start <= end ? [start, end] : [end, start];
  if (!(b - a > 0)) throw new Error('段落長度必須大於 0 秒');
  const id = `seg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const segment = { id, name: name || `段落 ${movie.segments.length + 1}`, start: a, end: b, reps: 0, passed: false };
  return { ...movie, segments: [...movie.segments, segment] };
}

export function updateSegment(movie, id, changes) {
  return { ...movie, segments: movie.segments.map((s) => (s.id === id ? { ...s, ...changes } : s)) };
}

export function removeSegment(movie, id) {
  return { ...movie, segments: movie.segments.filter((s) => s.id !== id) };
}

export function addSegmentRep(movie, id) {
  return { ...movie, segments: movie.segments.map((s) => (s.id === id ? { ...s, reps: s.reps + 1 } : s)) };
}

// 我的生字本：同一部片、同一個字（不分大小寫）只保留一筆
export function addVocab(state, { word, sentence, movieId }) {
  const clean = String(word || '').toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g, '');
  if (!clean || state.vocab.some((v) => v.word === clean && v.movieId === movieId)) return state;
  const entry = { word: clean, sentence, movieId, addedAt: new Date().toISOString() };
  return { ...state, vocab: [...state.vocab, entry] };
}

export function removeVocab(state, word, movieId) {
  return { ...state, vocab: state.vocab.filter((v) => !(v.word === word && v.movieId === movieId)) };
}

// 匯出／匯入進度檔（Q5：換電腦時使用）
export function exportState(state) {
  return JSON.stringify({ app: APP_ID, exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export function importState(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('這不是有效的進度檔');
  }
  const state = raw?.app === APP_ID ? normalize(raw) : null;
  if (!state) throw new Error('這不是 SubtitleLingo 的進度檔');
  return state;
}
