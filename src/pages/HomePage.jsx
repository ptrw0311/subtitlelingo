import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieDB, vocabularyDB } from '../config/turso.js';

// 備用假資料
const fallbackMovies = [
  {
    id: 'tt0111161',
    title: 'The Shawshank Redemption',
    year: 1994,
    type: 'movie',
    poster_url: 'https://images.unsplash.com/photo-1489599113536-21c2b9b3bc19?w=300&h=450&fit=crop',
    download_count: 1250000
  },
  {
    id: 'tt0068646',
    title: 'The Godfather',
    year: 1972,
    type: 'movie',
    poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop',
    download_count: 980000
  },
  {
    id: 'tt0071562',
    title: 'The Godfather: Part II',
    year: 1974,
    type: 'movie',
    poster_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&h=450&fit=crop',
    download_count: 750000
  },
  {
    id: 'tt0468569',
    title: 'The Dark Knight',
    year: 2008,
    type: 'movie',
    poster_url: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=300&h=450&fit=crop',
    download_count: 2300000
  },
  {
    id: 'tt0050083',
    title: '12 Angry Men',
    year: 1957,
    type: 'movie',
    poster_url: 'https://images.unsplash.com/photo-1586473219011-9ff632499a13?w=300&h=450&fit=crop',
    download_count: 450000
  }
];

const fakeDialogues = [
  {
    id: 1,
    content: "I\'m going to make him an offer he can\'t refuse.",
    time_start: "02:15:30",
    time_end: "02:15:35",
    explanation: "這是一句經典的美式口語，表示要提出一個對方無法拒絕的條件或建議。"
  },
  {
    id: 2,
    content: "May the Force be with you.",
    time_start: "01:45:20",
    time_end: "01:45:23",
    explanation: "《星際大戰》中的經典台詞，表示祝福對方好運或成功。"
  },
  {
    id: 3,
    content: "Life is like a box of chocolates. You never know what you\'re gonna get.",
    time_start: "00:23:10",
    time_end: "00:23:15",
    explanation: "人生就像一盒巧克力，你永遠不知道下一顆是什麼味道，比喻人生的不確定性。"
  }
];

const fakeVocabularies = [
  {
    id: 1,
    word: "convince",
    part_of_speech: "verb",
    definition_zh: "說服，使相信",
    level: "intermediate",
    original_sentence: "I need to convince him to join our team.",
    example_sentences: [
      "She convinced me to try the new restaurant.",
      "Can you convince the board to approve the budget?",
      "He was convinced by the evidence."
    ]
  },
  {
    id: 2,
    word: "opportunity",
    part_of_speech: "noun",
    definition_zh: "機會，時機",
    level: "beginner",
    original_sentence: "This is a great opportunity to learn something new.",
    example_sentences: [
      "Don\'t miss this opportunity.",
      "The company offers many growth opportunities.",
      "She seized the opportunity to speak."
    ]
  },
  {
    id: 3,
    word: "perspective",
    part_of_speech: "noun",
    definition_zh: "觀點，看法",
    level: "advanced",
    original_sentence: "From my perspective, this is the best solution.",
    example_sentences: [
      "Try to see it from her perspective.",
      "The book offers a new perspective on history.",
      "His perspective changed after the trip."
    ]
  }
];

function HomePage() {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('subtitle');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [movies, setMovies] = useState([]);
  const [vocabularies, setVocabularies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 載入資料
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 載入影片資料
      const { data: moviesData, error: moviesError } = await movieDB.getAll(20);
      if (moviesError) {
        throw moviesError;
      }

      // 載入生字資料
      const { data: vocabData, error: vocabError } = await vocabularyDB.getAll();
      if (vocabError) {
        throw vocabError;
      }

      setMovies(moviesData.length > 0 ? moviesData : fallbackMovies);
      setVocabularies(vocabData);

      console.log(`📊 載入 ${moviesData.length} 部影片，${vocabData.length} 個生字`);

    } catch (err) {
      console.error('載入資料失敗:', err);
      setError('載入資料失敗，顯示示範資料');
      // 使用備用資料
      setMovies(fallbackMovies);
      setVocabularies(fakeVocabularies);
    } finally {
      setLoading(false);
    }
  };

  // 搜尋影片
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.trim()) {
      try {
        const { data: searchResults, error } = await movieDB.search(query.trim());
        if (error) {
          throw error;
        }
        setMovies(searchResults);
      } catch (err) {
        console.error('搜尋失敗:', err);
        // 使用本端過濾
      }
    } else {
      // 重新載入所有資料
      loadData();
    }
  };

  // 過濾電影
  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 過濾生字
  const filteredVocabularies = vocabularies.filter(vocab =>
    selectedLevel === 'all' || vocab.level === selectedLevel
  );

  return (
    <div className="app-container">
      {/* 側邊欄 */}
      <aside className="sidebar">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-6 text-center">
            <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
              SubtitleLingo
            </span>
          </h1>

          {/* 搜尋框 */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 搜尋影片..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* 影片列表 */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-slate-300">
              熱門影片
              {loading && <span className="text-xs text-slate-500 ml-2">載入中...</span>}
            </h2>

            {/* 錯誤提示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-600/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* 載入狀態 */}
            {loading && (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-800/30 animate-pulse">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-slate-700 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-700 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 影片列表 */}
            {!loading && (
              <div className="space-y-3">
                {filteredMovies.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="text-4xl mb-2">🔍</div>
                    <p>找不到符合的影片</p>
                  </div>
                ) : (
                  filteredMovies.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedMovie?.id === movie.id
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'bg-slate-800/50 hover:bg-slate-700/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {movie.type === 'movie' ? '🎬' : '📺'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{movie.title}</h3>
                      <p className="text-slate-400 text-sm">{movie.year}</p>
                      <p className="text-slate-500 text-xs mt-1">
                        {movie.download_count.toLocaleString()} 次下載
                      </p>
                    </div>
                  </div>
                </div>
              ))
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 主要內容區 */}
      <main className="main-content">
        <div className="page-header">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="page-title">
                {selectedMovie ? selectedMovie.title : '選擇一部影片開始學習'}
              </h1>
              <p className="page-subtitle">
                {selectedMovie
                  ? `${selectedMovie.year} • ${selectedMovie.type === 'movie' ? '電影' : '影集'}`
                  : '從左側列表選擇您想要學習的影片'
                }
              </p>
            </div>
            {selectedMovie && (
              <div className="flex space-x-4">
                <Link to={`/practice/${selectedMovie.id}`}>
                  <button className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-amber-500/25">
                    🎯 開始練習
                  </button>
                </Link>
                <Link to="/stats">
                  <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors duration-200">
                    📊 學習統計
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="content-area">
          {selectedMovie ? (
            <>
              {/* 內容標籤 */}
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setActiveTab('subtitle')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'subtitle'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  📝 完整字幕
                </button>
                <button
                  onClick={() => setActiveTab('dialogue')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'dialogue'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  💬 重要對話
                </button>
                <button
                  onClick={() => setActiveTab('vocabulary')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'vocabulary'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  📚 生字筆記
                </button>
              </div>

              {/* 內容顯示區 */}
              <div className="card">
                {activeTab === 'subtitle' && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">完整字幕</h3>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-slate-300 leading-relaxed">
                        字幕內容載入中... 這裡將顯示完整的 SRT 字幕檔案內容，包含時間軸資訊。
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'dialogue' && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">重要對話</h3>
                    <div className="space-y-4">
                      {fakeDialogues.map((dialogue) => (
                        <div key={dialogue.id} className="bg-slate-800/50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-blue-400 text-sm font-mono">
                              {dialogue.time_start} - {dialogue.time_end}
                            </span>
                          </div>
                          <p className="text-white text-lg mb-3 italic">
                            "{dialogue.content}"
                          </p>
                          <div className="bg-slate-900/50 rounded p-3">
                            <p className="text-amber-400 text-sm">
                              💡 {dialogue.explanation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'vocabulary' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold">生字筆記</h3>
                      <div className="flex space-x-2">
                        {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
                          <button
                            key={level}
                            onClick={() => setSelectedLevel(level)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                              selectedLevel === level
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            {level === 'all' ? '全部' :
                             level === 'beginner' ? '初級' :
                             level === 'intermediate' ? '中級' : '高級'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredVocabularies.map((vocab) => (
                        <div key={vocab.id} className="bg-slate-800/50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-semibold text-white">
                              {vocab.word}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              vocab.level === 'beginner' ? 'bg-green-600 text-white' :
                              vocab.level === 'intermediate' ? 'bg-blue-600 text-white' :
                              'bg-red-600 text-white'
                            }`}>
                              {vocab.level === 'beginner' ? '初級' :
                               vocab.level === 'intermediate' ? '中級' : '高級'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm mb-2">
                            {vocab.part_of_speech} • {vocab.definition_zh}
                          </p>
                          <div className="bg-slate-900/50 rounded p-2 mb-2">
                            <p className="text-amber-400 text-sm italic">
                              "{vocab.original_sentence}"
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-500 text-xs">例句：</p>
                            {vocab.example_sentences.map((example, idx) => (
                              <p key={idx} className="text-slate-300 text-sm">
                                • {example}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  歡迎來到 SubtitleLingo
                </h3>
                <p className="text-slate-400">
                  從左側選擇一部影片，開始您的英文學習之旅
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default HomePage;