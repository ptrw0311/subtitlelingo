import { useState, useEffect, useRef } from 'react';
import { movieDB, vocabularyDB } from '../config/turso-api';

export default function AllMoviesDropdown({ currentMovieId, onMovieSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allMovies, setAllMovies] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchAllMovies();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAllMovies = async () => {
    try {
      const result = await movieDB.getAll();

      if (result.data && result.data.length > 0) {
        const moviesWithStats = await Promise.all(
          result.data.map(async (movie) => {
            const vocabResult = await vocabularyDB.getByMovieId(movie.id);
            const vocabularyCount = vocabResult.data ? vocabResult.data.length : 0;

            let difficulty = '初級';
            let difficultyColor = 'bg-green-400/20 text-green-400 px-2 py-0.5 rounded text-xs';

            if (vocabularyCount > 25) {
              difficulty = '高級';
              difficultyColor = 'bg-purple-400/20 text-purple-400 px-2 py-0.5 rounded text-xs';
            } else if (vocabularyCount > 15) {
              difficulty = '中級';
              difficultyColor = 'bg-orange-400/20 text-orange-400 px-2 py-0.5 rounded text-xs';
            }

            return {
              ...movie,
              vocabularyCount,
              difficulty,
              difficultyColor
            };
          })
        );

        setAllMovies(moviesWithStats);
      }
    } catch (error) {
      console.error('取得所有影片失敗:', error);
    }
  };

  const filteredMovies = allMovies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGradientColor = (index) => {
    const colors = [
      'from-teal-600 to-teal-700',
      'from-purple-600 to-purple-700',
      'from-blue-600 to-blue-700',
      'from-orange-600 to-orange-700',
      'from-pink-600 to-pink-700',
      'from-indigo-600 to-indigo-700'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-lg flex items-center justify-between transition-all duration-300 text-left relative overflow-hidden group"
        style={{
          height: '32px',
          minHeight: '32px',
          maxHeight: '32px',
          paddingLeft: '10px',
          paddingRight: '10px',
          paddingTop: '0',
          paddingBottom: '0',
          lineHeight: '1',
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
          boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(13, 148, 136, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(13, 148, 136, 0.3)';
        }}
      >
        {/* 懸停光澤效果 */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            animation: isOpen ? 'none' : 'shimmer 2s infinite'
          }}
        />

        <div
          className="flex items-center gap-1.5 relative z-10"
          style={{ minHeight: '0', lineHeight: '1' }}
        >
          <span
            className="text-base"
            style={{
              lineHeight: '1',
              display: 'flex',
              alignItems: 'center',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
            }}
          >
            🎬
          </span>
          <span
            className="font-heading font-semibold text-xs"
            style={{
              lineHeight: '1',
              display: 'flex',
              alignItems: 'center',
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            選擇其他影片...
          </span>
        </div>
      </button>

      {isOpen && (
        <div
          className="dropdown-menu absolute w-full mt-1 bg-slate-700 rounded-lg max-h-48 overflow-y-auto border border-slate-600 z-50 shadow-xl"
        >
          <div className="p-2 border-b border-slate-600 sticky top-0 bg-slate-700 z-10">
            <input
              type="text"
              placeholder="🔍 搜尋..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-teal-500 text-white placeholder-slate-400"
            />
          </div>

          <div className="p-1.5 space-y-1">
            {filteredMovies.length > 0 ? (
              filteredMovies.map((movie, index) => {
                const isSelected = movie.id === currentMovieId;
                const gradient = getGradientColor(index);

                return (
                  <button
                    key={movie.id}
                    onClick={() => {
                      onMovieSelect(movie.id);
                      setIsOpen(false);
                    }}
                    className="w-full rounded-lg px-3 py-2 flex items-center gap-2 transition-all duration-300 text-left relative overflow-hidden group"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${gradient.split(' ')[1]} 0%, ${gradient.split(' ')[3]} 100%)`
                        : 'linear-gradient(135deg, rgba(51, 65, 85, 0.5) 0%, rgba(30, 41, 59, 0.8) 100%)',
                      border: isSelected ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                      boxShadow: isSelected
                        ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                        : 'none',
                      transform: 'translateY(0)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.background = `linear-gradient(135deg, ${gradient.split(' ')[1]}dd 0%, ${gradient.split(' ')[3]}dd 100%)`;
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(51, 65, 85, 0.5) 0%, rgba(30, 41, 59, 0.8) 100%)';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    {/* 懸停光澤層 */}
                    {!isSelected && (
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)'
                        }}
                      />
                    )}

                    <div
                      className="text-lg flex-shrink-0 relative z-10"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                    >
                      🎬
                    </div>

                    <div className="flex-1 min-w-0 relative z-10">
                      <div
                        className="font-heading font-semibold truncate text-white text-xs"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                      >
                        {movie.title}
                      </div>
                      <div className="text-[10px] text-white/80">
                        {movie.year || 'N/A'}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-4 text-slate-500">
                <div className="text-2xl mb-1">🔍</div>
                <p className="text-xs">找不到符合的影片</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
