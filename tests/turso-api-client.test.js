import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveQuery } from '../api/_queries.js';

// 每個前端方法送出的查詢，都必須能通過伺服器白名單（名稱存在、參數數量正確）
const sent = [];
globalThis.fetch = vi.fn(async (_url, init) => {
  const body = JSON.parse(init.body);
  sent.push(body);
  const resolved = resolveQuery(body.name, body.params);
  const ok = !resolved.error;
  return { ok, status: ok ? 200 : 400, json: async () => (ok ? { data: [] } : resolved) };
});

const api = await import('../src/config/turso-api.js');

describe('前端查詢都在白名單內', () => {
  beforeEach(() => { sent.length = 0; vi.spyOn(console, 'log').mockImplementation(() => {}); });

  const cases = [
    ['movieDB.getAll', () => api.movieDB.getAll(10)],
    ['movieDB.getById', () => api.movieDB.getById(1)],
    ['movieDB.getByImdbId', () => api.movieDB.getByImdbId('tt1')],
    ['movieDB.search', () => api.movieDB.search('in')],
    ['subtitleDB.getByMovieId', () => api.subtitleDB.getByMovieId('tt1')],
    ['vocabularyDB.getAll', () => api.vocabularyDB.getAll()],
    ['vocabularyDB.getAll(level)', () => api.vocabularyDB.getAll('B1')],
    ['vocabularyDB.getByMovieId', () => api.vocabularyDB.getByMovieId('tt1')],
    ['importantDialoguesDB.getByMovieId', () => api.importantDialoguesDB.getByMovieId('tt1')],
    ['exerciseDB.getByMovieId', () => api.exerciseDB.getByMovieId('tt1')],
    ['learningDB.getStats', () => api.learningDB.getStats('u', 7)],
    ['quizDB.createSession', () => api.quizDB.createSession('u', {})],
    ['quizDB.recordAnswer', () => api.quizDB.recordAnswer(1, { vocabularyId: 2, questionType: 'mc', questionText: 'q', userAnswer: 'a', correctAnswer: 'a', isCorrect: true })],
    ['quizDB.completeSession', () => api.quizDB.completeSession(1, { correctAnswers: 3, timeSpent: 60 })],
    ['masteryDB.updateMastery', () => api.masteryDB.updateMastery('u', 2, true)],
    ['masteryDB.updateLeitnerBox', () => api.masteryDB.updateLeitnerBox('u', 2, false)],
    ['wrongAnswersDB.addWrongAnswer', () => api.wrongAnswersDB.addWrongAnswer('u', { vocabularyId: 2, wrongAnswer: 'x', correctAnswer: 'y', questionType: 'mc' })],
    ['analyticsDB.updateStreak', () => api.analyticsDB.updateStreak('u')],
    ['db.testConnection', () => api.db.testConnection()],
  ];

  it.each(cases)('%s', async (_label, run) => {
    await run();
    expect(sent.length).toBeGreaterThan(0);
    for (const body of sent) {
      expect(body).not.toHaveProperty('sql');
      expect(resolveQuery(body.name, body.params).error).toBeUndefined();
    }
  });
});
