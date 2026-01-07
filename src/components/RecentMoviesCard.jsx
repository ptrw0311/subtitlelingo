import { useState, useEffect } from 'react';
import { movieDB, vocabularyDB } from '../config/turso.js';

const USER_ID = 'demo_user';

const GRADIENTS = [
  'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', // teal
  'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)', // purple
  'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', // blue
  'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', // orange
  'linear-gradient(135deg, #db2777 0%, #be185d 100%)', // pink
  'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', // indigo
];

export default function RecentMoviesCard({ currentMovieId, onMovieSelect }) {
  const [recentMovies, setRecentMovies] = useState([]);

  useEffect(() => {
    fetchRecentMovies();
  }, []);

  const fetchRecentMovies = async () => {
    try {
      const result = await movieDB.getAll();

      if (result.data && result.data.length > 0) {
        const moviesWithStats = await Promise.all(
          result.data.map(async (movie) => {
            const vocabResult = await vocabularyDB.getByMovieId(movie.id);
            const vocabularyCount = vocabResult.data ? vocabResult.data.length : 0;

            const lastPracticed = movie.created_at || new Date().toISOString();
            const daysAgo = Math.floor((Date.now() - new Date(lastPracticed)) / (1000 * 60 * 60 * 24));

            let timeLabel = '';
            if (daysAgo === 0) {
              timeLabel = '今天練習過';
            } else if (daysAgo === 1) {
              timeLabel = '昨天練習';
            } else if (daysAgo < 7) {
              timeLabel = `${daysAgo} 天前練習`;
            } else if (daysAgo < 30) {
              timeLabel = `${Math.floor(daysAgo / 7)} 週前練習`;
            } else {
              timeLabel = `${Math.floor(daysAgo / 30)} 個月前練習`;
            }

            return {
              ...movie,
              vocabularyCount,
              lastPracticedLabel: timeLabel,
              isPracticedToday: daysAgo === 0
            };
          })
        );

        const sorted = moviesWithStats
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 6);

        setRecentMovies(sorted);
      }
    } catch (error) {
      console.error('取得最近練習影片失敗:', error);
    }
  };

  const getDifficultyLabel = (vocabCount) => {
    if (vocabCount <= 15) return { label: '初級', color: 'bg-green-400/30 px-2 py-0.5 rounded text-xs text-green-400' };
    if (vocabCount <= 25) return { label: '中級', color: 'bg-orange-400/30 px-2 py-0.5 rounded text-xs text-orange-400' };
    return { label: '高級', color: 'bg-purple-400/30 px-2 py-0.5 rounded text-xs text-purple-400' };
  };

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-heading font-semibold text-teal-400 text-xs">
          ⏱️ 最近練習
        </h4>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
        >
          重新整理
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1"
           style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 #1e293b' }}>
        {recentMovies.map((movie, index) => {
          const difficulty = getDifficultyLabel(movie.vocabularyCount);
          const isSelected = movie.id === currentMovieId;
          const gradient = GRADIENTS[index % GRADIENTS.length];

          return (
            <button
              key={movie.id}
              onClick={() => onMovieSelect(movie.id)}
              className="movie-card flex-shrink-0 w-40 rounded-lg p-2 border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group"
              style={{
                background: isSelected
                  ? gradient
                  : 'linear-gradient(135deg, rgba(51, 65, 85, 0.6) 0%, rgba(30, 41, 59, 0.9) 100%)',
                border: isSelected ? '2px solid rgba(255, 255, 255, 0.4)' : '2px solid transparent',
                boxShadow: isSelected
                  ? '0 8px 20px rgba(0, 0, 0, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.background = gradient;
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(51, 65, 85, 0.6) 0%, rgba(30, 41, 59, 0.9) 100%)';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                }
              }}
            >
              {/* 懸停光澤層 */}
              {!isSelected && (
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)'
                  }}
                />
              )}

              {/* 內容層 */}
              <div className="relative z-10">
                <div
                  className="text-2xl mb-1"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                >
                  🎬
                </div>
                <div
                  className="font-heading font-bold text-xs mb-1 truncate"
                  style={{
                    color: '#ffffff',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}
                >
                  {movie.title}
                </div>
                <div
                  className="text-[10px] opacity-90 mb-1"
                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                >
                  {movie.year || 'N/A'}
                </div>
                <div className="flex gap-1 flex-wrap mb-1">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {difficulty.label}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {movie.vocabularyCount}字
                  </span>
                </div>
                <div
                  className="text-[10px] flex items-center gap-1"
                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                >
                  {movie.isPracticedToday && <span>🔥</span>}
                  <span>{movie.lastPracticedLabel}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
