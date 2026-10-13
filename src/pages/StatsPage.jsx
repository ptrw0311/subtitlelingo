import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { movieDB } from '../config/turso-api';
import { loadState, getMovie, recommendedStep, STEP_COUNT } from '../utils/progress-store';

// 學習統計：全部來自瀏覽器裡保存的 100LS 學習進度（不使用假資料）
function StatsPage() {
  const [titles, setTitles] = useState({});
  const state = useMemo(() => loadState(), []);

  // 有任何進度的影片才算「已開始」
  const started = Object.keys(state.movies)
    .map((id) => ({ id, ...getMovie(state, id) }))
    .filter((m) => m.completedSteps.length || m.fullRounds || m.segments.length || Object.keys(m.lineReps).length);

  const rounds = started.reduce((sum, m) => sum + m.fullRounds, 0);
  const reps = started.reduce(
    (sum, m) => sum + Object.values(m.lineReps).reduce((a, b) => a + b, 0) + m.segments.reduce((a, s) => a + s.reps, 0),
    0,
  );

  // 片名從影片清單取得（只讀取資料庫）
  useEffect(() => {
    if (!started.length) return;
    movieDB.getAll(200)
      .then(({ data }) => setTitles(Object.fromEntries(data.map((m) => [String(m.id), m.title]))))
      .catch(() => {});
  }, [started.length]);

  const cards = [
    { icon: '🎬', label: '已開始的影片', value: started.length, testid: 'stat-movies', color: 'text-blue-400' },
    { icon: '🔁', label: '整部片跟說輪數', value: rounds, testid: 'stat-rounds', color: 'text-amber-400' },
    { icon: '🗣️', label: '單句與段落跟說次數', value: reps, testid: 'stat-reps', color: 'text-green-400' },
    { icon: '📚', label: '我的生字', value: state.vocab.length, testid: 'stat-vocab', color: 'text-purple-400' },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-6 text-center">
            <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
              SubtitleLingo
            </span>
          </h1>
          <nav className="space-y-2">
            <Link to="/" className="block px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
              🏠 回到首頁
            </Link>
          </nav>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200"
          >
            <span>←</span>
            <span>回到首頁</span>
          </Link>
          <h1 className="page-title">學習統計</h1>
          <p className="page-subtitle">依照你在這台電腦的瀏覽器裡保存的 100LS 學習進度計算</p>
        </div>

        <div className="content-area">
          {started.length === 0 && state.vocab.length === 0 ? (
            <div className="card text-center" data-testid="stats-empty">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-white mb-2">尚無資料</h2>
              <p className="text-slate-300">在首頁選一部片，按「觀看字幕」開始五步驟學習後，這裡就會顯示你的進度。</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map((c) => (
                  <div key={c.testid} className="card text-center">
                    <div className="text-3xl mb-2">{c.icon}</div>
                    <div className={`text-2xl font-bold mb-1 ${c.color}`} data-testid={c.testid}>{c.value}</div>
                    <div className="text-slate-400">{c.label}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold text-white mb-4">每部片的進度</h3>
                {started.length === 0 ? <p className="text-slate-400">尚無資料</p> : (
                  <ul className="space-y-3 list-none m-0 p-0">
                    {started.map((m) => {
                      const next = recommendedStep(m);
                      return (
                        <li key={m.id} data-testid="stats-movie" className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <div>
                            <div className="text-white font-medium">🎬 {titles[m.id] || `影片 ${m.id}`}</div>
                            <div className="text-sm text-slate-400">
                              已完成 {m.completedSteps.length} / {STEP_COUNT} 步・{next ? `下一步：步驟 ${next}` : '五步驟全部完成'}・整部片跟說 {m.fullRounds} / 100 遍
                            </div>
                          </div>
                          <Link to={`/learn/${m.id}`} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium rounded-lg">
                            繼續學習
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default StatsPage;
