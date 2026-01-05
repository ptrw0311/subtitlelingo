import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieDB, vocabularyDB, subtitleDB, importantDialoguesDB } from '../config/turso.js';

// 備用假資料
const fallbackMovies = [
  {
    id: 'tt14364480',
    title: 'Wake Up Dead Man: A Knives Out Mystery',
    year: 2025,
    type: 'movie',
    poster_url: 'https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?w=300&h=450&fit=crop',
    download_count: 2800000
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

// Inception 電影中的重要單字
const inceptionVocabularies = [
  {
    id: 1,
    word: "subconscious",
    part_of_speech: "名詞 (noun)",
    definition_zh: "潛意識；指潛藏在意識之下的心理活動",
    level: "advanced",
    original_sentence: "That's my subconscious trying to keep the dream intact.",
    example_sentences: [
      "Your subconscious can affect your decisions without you realizing it.",
      "Dreams are a way to access the subconscious mind.",
      "He tapped into his subconscious to find creative inspiration."
    ]
  },
  {
    id: 2,
    word: "parasite",
    part_of_speech: "名詞 (noun)",
    definition_zh: "寄生蟲；比喻依賴他人生存的事物",
    level: "intermediate",
    original_sentence: "What is the most resilient parasite? An idea.",
    example_sentences: [
      "The parasite lives inside the host's body.",
      "Some plants are parasites that feed on other plants.",
      "Negative thoughts can be like parasites that destroy your confidence."
    ]
  },
  {
    id: 3,
    word: "resilient",
    part_of_speech: "形容詞 (adjective)",
    definition_zh: "有彈性的；能快速恢復的",
    level: "advanced",
    original_sentence: "An idea is resilient, highly contagious.",
    example_sentences: [
      "Children are often more resilient than adults.",
      "The resilient material can withstand extreme temperatures.",
      "She showed a resilient spirit after the setback."
    ]
  },
  {
    id: 4,
    word: "eradicate",
    part_of_speech: "動詞 (verb)",
    definition_zh: "根除；消滅",
    level: "advanced",
    original_sentence: "Once an idea has taken hold, it's almost impossible to eradicate.",
    example_sentences: [
      "We must eradicate poverty from our society.",
      "The disease was completely eradicated.",
      "It's difficult to eradicate bad habits."
    ]
  },
  {
    id: 5,
    word: "extraction",
    part_of_speech: "名詞 (noun)",
    definition_zh: "提取；抽取",
    level: "intermediate",
    original_sentence: "Extraction is about entering a dream and stealing information.",
    example_sentences: [
      "The extraction of natural resources harms the environment.",
      "Tooth extraction can be a painful procedure.",
      "Data extraction requires specialized software."
    ]
  },
  {
    id: 6,
    word: "inception",
    part_of_speech: "名詞 (noun)",
    definition_zh: "開始； inception 指在他人夢中植入想法的技術",
    level: "advanced",
    original_sentence: "Inception is not about stealing ideas, but planting them.",
    example_sentences: [
      "The project's inception dates back to last year.",
      "Since its inception, the company has grown rapidly.",
      "The story begins at the inception of the conflict."
    ]
  },
  {
    id: 7,
    word: "complexity",
    part_of_speech: "名詞 (noun)",
    definition_zh: "複雜性",
    level: "intermediate",
    original_sentence: "I can't imagine you with all your complexity.",
    example_sentences: [
      "The complexity of the problem requires careful analysis.",
      "She embraced the complexity of the human mind.",
      "Technology adds complexity to our daily lives."
    ]
  },
  {
    id: 8,
    word: "collapse",
    part_of_speech: "動詞 (verb)",
    definition_zh: "崩塌；倒塌",
    level: "beginner",
    original_sentence: "The dream is collapsing!",
    example_sentences: [
      "The building collapsed during the earthquake.",
      "Her plans collapsed when funding was cut.",
      "After working all day, he collapsed on the sofa."
    ]
  },
  {
    id: 9,
    word: "commitment",
    part_of_speech: "名詞 (noun)",
    definition_zh: "承諾；投入",
    level: "intermediate",
    original_sentence: "I'm going to impress you with the depth of my commitment.",
    example_sentences: [
      "He shows great commitment to his work.",
      "Marriage requires true commitment from both partners.",
      "Her commitment to learning languages is impressive."
    ]
  },
  {
    id: 10,
    word: "convinced",
    part_of_speech: "形容詞/動詞過去式 (adjective/past verb)",
    definition_zh: "被說服的；確信的",
    level: "beginner",
    original_sentence: "I'm convinced this is the only way to do it.",
    example_sentences: [
      "She convinced me to join the team.",
      "I'm convinced that he's telling the truth.",
      "They were convinced by the evidence presented."
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
  const [subtitles, setSubtitles] = useState(null);
  const [dialogues, setDialogues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDialogueId, setExpandedDialogueId] = useState(null);

  // 載入資料
  useEffect(() => {
    loadData();
  }, []);

  // 載入影片字幕
  useEffect(() => {
    if (selectedMovie) {
      loadSubtitles(selectedMovie.id);
    } else {
      setSubtitles(null);
    }
  }, [selectedMovie]);

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
      // 如果資料庫沒有生字資料，使用 Inception 生字列表
      setVocabularies(vocabData.length > 0 ? vocabData : inceptionVocabularies);

      console.log(`📊 載入 ${moviesData.length} 部影片，${vocabData.length} 個生字`);

    } catch (err) {
      console.error('載入資料失敗:', err);
      setError('載入資料失敗，顯示示範資料');
      // 使用備用資料（Inception 生字）
      setMovies(fallbackMovies);
      setVocabularies(inceptionVocabularies);
    } finally {
      setLoading(false);
    }
  };

  const loadSubtitles = async (movieId) => {
    try {
      console.log(`📝 正在載入影片 ${movieId} 的字幕...`);

      // 載入字幕內容
      const { data: subtitlesData, error: subtitlesError } = await subtitleDB.getByMovieId(movieId);

      if (subtitlesError) {
        throw subtitlesError;
      }

      if (subtitlesData && subtitlesData.length > 0) {
        const srtContent = subtitlesData[0].srt_content;
        setSubtitles(srtContent);
        console.log(`✅ 字幕載入成功，${srtContent.length} 字元`);
      } else {
        setSubtitles(null);
        console.log('⚠️ 該影片暫無字幕資料');
      }

      // 載入重要對話（從資料庫，不是解析 SRT）
      const { data: dialoguesData, error: dialoguesError } = await importantDialoguesDB.getByMovieId(movieId);

      if (dialoguesError) {
        throw dialoguesError;
      }

      if (dialoguesData && dialoguesData.length > 0) {
        // 資料庫中的對話格式，映射欄位名稱
        const formattedDialogues = dialoguesData.map(d => ({
          ...d,
          text: d.content,  // 映射 content → text
          translation: d.translation_zh || d.translation || '翻譯載入中...',
          timeStart: d.time_start,  // 映射 time_start → timeStart
          timeEnd: d.time_end,      // 映射 time_end → timeEnd
          sequence: d.sequence || d.id
        }));
        setDialogues(formattedDialogues);
        console.log(`💬 從資料庫載入 ${formattedDialogues.length} 段重要對話`);
      } else {
        // 如果資料庫沒有對話資料，使用解析後的備用資料
        if (subtitlesData && subtitlesData.length > 0) {
          const parsedDialogues = parseDialoguesFromSRT(subtitlesData[0].srt_content);
          setDialogues(parsedDialogues);
          console.log(`💬 解析出 ${parsedDialogues.length} 段對話（備用）`);
        } else {
          setDialogues([]);
        }
      }

      // 載入生字筆記
      const { data: vocabData, error: vocabError } = await vocabularyDB.getByMovieId(movieId);

      if (vocabError) {
        throw vocabError;
      }

      if (vocabData && vocabData.length > 0) {
        // 處理 example_sentences JSON 欄位
        const formattedVocabs = vocabData.map(v => ({
          ...v,
          example_sentences: v.example_sentences && typeof v.example_sentences === 'string'
            ? JSON.parse(v.example_sentences)
            : v.example_sentences || []
        }));
        setVocabularies(formattedVocabs);
        console.log(`📚 從資料庫載入 ${formattedVocabs.length} 個生字`);
      } else {
        // 如果資料庫沒有生字資料，保留現有的生字列表
        console.log('⚠️ 該影片暫無生字筆記資料');
      }

    } catch (err) {
      console.error('載入字幕失敗:', err);
      setSubtitles(null);
      setDialogues([]);
    }
  };

  // 簡單的翻譯映射（Inception 電影中的關鍵對話）
  const translations = {
    "You mustn't be afraid to dream a little bigger, darling.": "親愛的，你不該害怕夢想得更宏大一點。",
    "What is the most resilient parasite? A bacteria? A virus? An intestinal worm?": "最強韌的寄生蟲是什麼？細菌？病毒？還是腸道寄生蟲？",
    "An idea. Resilient, highly contagious. Once an idea has taken hold of the brain, it's almost impossible to eradicate.": "一個點子。強韌且高度傳染。一旦一個點子在腦中生根，就幾乎不可能根除。",
    "The dream is collapsing.": "夢境正在崩塌。",
    "I'm going to impress you with the depth of my commitment.": "我要讓你見識我決心的深度。",
    "You're waiting for a train. A train that will take you far away.": "你在等一列火車。一列會帶你遠走的火車。",
    "You know where you hope this train will take you, but you can't know for sure.": "你希望這列火車帶你去哪裡，但你無法確定。",
    "But it doesn't matter. Because we'll be together.": "但這不重要。因為我們會在一起。",
    "I can't stay with her anymore because she doesn't exist.": "我不能再和她在一起了，因為她不存在。",
    "I wish. I wish more than anything. But I can't imagine you with all your complexity, all your perfection and imperfection.": "我希望。我比什麼都希望。但我無法想像你所有的複雜，你所有的完美和不完美。",
    "You're talking about dreams, right?": "你在說夢境，對吧？",
    "Dreams feel real while we're in them. It's only when we wake up that we realize something was actually strange.": "做夢時感覺很真實。只有醒來時才意識到有些地方其實很奇怪。",
    "We need to get deeper.": "我們需要進入更深的層次。",
    "The stronger the issues, the more powerful the extraction.": "問題越強烈，抽取就越強大。",
    "I bought the airline. It seemed neater.": "我買下了航空公司。這樣看起來更整潔。",
    "He was destroyed by it.": "他被它毀了。",
    "That's my subconscious.": "那是我的潛意識。",
    "They're attacking my subconscious.": "他們在攻擊我的潛意識。"
  };

  // 解析 SRT 字幕並提取對話
  const parseDialoguesFromSRT = (srtContent) => {
    // SRT 格式解析
    const lines = srtContent.split('\n');
    const dialogues = [];
    let currentDialogue = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 空行表示一段字幕結束
      if (!line) {
        if (currentDialogue && currentDialogue.text) {
          // 只保留有實際文字內容的對話（過濾掉 [LAUGHING]、[SCREAMS] 等音效描述）
          const hasSpokenText = currentDialogue.text.match(/[a-zA-Z]{3,}/);
          if (hasSpokenText) {
            // 添加翻譯
            const text = currentDialogue.text.trim();
            const translation = translations[text] || translateText(text);
            dialogues.push({ ...currentDialogue, text, translation });
          }
        }
        currentDialogue = null;
        continue;
      }

      // 序號行
      if (/^\d+$/.test(line)) {
        if (!currentDialogue) {
          currentDialogue = { sequence: parseInt(line), timeStart: '', timeEnd: '', text: '' };
        }
        continue;
      }

      // 時間軸行 (00:00:00,000 --> 00:00:00,000)
      if (line.includes('-->')) {
        if (currentDialogue) {
          const times = line.split('-->');
          currentDialogue.timeStart = times[0].trim();
          currentDialogue.timeEnd = times[1].trim();
        }
        continue;
      }

      // 文字內容行
      if (currentDialogue && line) {
        if (currentDialogue.text) {
          currentDialogue.text += ' ' + line;
        } else {
          currentDialogue.text = line;
        }
      }
    }

    // 處理最後一段對話
    if (currentDialogue && currentDialogue.text) {
      const hasSpokenText = currentDialogue.text.match(/[a-zA-Z]{3,}/);
      if (hasSpokenText) {
        const text = currentDialogue.text.trim();
        const translation = translations[text] || translateText(text);
        dialogues.push({ ...currentDialogue, text, translation });
      }
    }

    // 選擇前 20 段較長的重要對話
    return dialogues
      .filter(d => d.text && d.text.length > 20) // 只保留超過 20 字元的對話
      .sort((a, b) => b.text.length - a.text.length) // 按長度排序
      .slice(0, 20); // 取前 20 段
  };

  // 簡單的翻譯函數（基於規則的基礎翻譯）
  const translateText = (text) => {
    // 對於不在映射表中的文本，提供簡單的翻譯提示
    const commonWords = {
      'dream': '夢境',
      'reality': '現實',
      'subconscious': '潛意識',
      'idea': '點子',
      'extraction': '抽取',
      'inception': '植入',
      'level': '層次',
      'time': '時間',
      'wake': '醒來',
      'believe': '相信',
      'together': '在一起'
    };

    let translated = text;
    Object.keys(commonWords).forEach(eng => {
      const regex = new RegExp(`\\b${eng}\\b`, 'gi');
      translated = translated.replace(regex, commonWords[eng]);
    });

    return translated + ' (翻譯)';
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
        <div className="p-4 flex flex-col" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
          {/* 凍結的頂部區域 */}
          <div style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-primary)', zIndex: 10, paddingBottom: '1rem' }}>
            <h1
              className="font-bold mb-4 text-center"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                lineHeight: '1.3',
                letterSpacing: '-0.02em',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              🎞️ <span className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
                SubtitleLingo
              </span>
            </h1>

            {/* 作者資訊 - 移至標題下方 */}
            <div className="mb-6 text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
                ✍️ produced by Peter Wang
              </p>
            </div>

            {/* 搜尋框 */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 搜尋影片..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
                />
              </div>
            </div>
          </div>

          {/* 影片列表 - 可滾動 */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '60px' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
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
                  className={`p-3 rounded-lg cursor-pointer transition-all`}
                  style={{
                    backgroundColor: selectedMovie?.id === movie.id ? 'rgba(220, 38, 38, 0.2)' : 'var(--bg-secondary)',
                    borderColor: selectedMovie?.id === movie.id ? 'rgba(239, 68, 68, 0.5)' : 'transparent',
                    border: selectedMovie?.id === movie.id ? '1px solid' : '1px solid var(--border-subtle)',
                    marginBottom: '0.75rem'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedMovie?.id !== movie.id) {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.2)';
                      e.currentTarget.style.borderColor = 'var(--accent-color)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedMovie?.id !== movie.id) {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {movie.type === 'movie' ? '🎬' : '📺'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate" style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>
                        {movie.title}
                        {movie.overview && movie.overview.includes('Season') && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{
                            backgroundColor: 'var(--accent-color)',
                            color: 'var(--bg-primary)',
                            fontWeight: '500'
                          }}>
                            {movie.overview.match(/Season (\d+), Episode (\d+)/)?.slice(1).map((n, i) => i === 0 ? `S${n.padStart(2, '0')}` : `E${n.padStart(2, '0')}`).join('') || ''}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{movie.year}</p>
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
                  <button
                    className="px-6 py-3 text-white font-medium rounded-lg shadow-lg"
                    style={{
                      backgroundColor: 'var(--accent-color)',
                      fontFamily: 'var(--font-body)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent-dark)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
                    }}
                  >
                    🎯 開始練習
                  </button>
                </Link>
                <Link to="/stats">
                  <button
                    className="px-6 py-3 text-white font-medium rounded-lg"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      fontFamily: 'var(--font-body)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
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
              <div className="flex space-x-2 mb-6 tab-buttons-sticky">
                <button
                  onClick={() => setActiveTab('subtitle')}
                  className="px-4 py-2 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: activeTab === 'subtitle' ? 'var(--primary-color)' : 'var(--bg-tertiary)',
                    color: activeTab === 'subtitle' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'subtitle') {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'subtitle') {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                >
                  📝 完整字幕
                </button>
                <button
                  onClick={() => setActiveTab('dialogue')}
                  className="px-4 py-2 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: activeTab === 'dialogue' ? 'var(--primary-color)' : 'var(--bg-tertiary)',
                    color: activeTab === 'dialogue' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'dialogue') {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'dialogue') {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                >
                  💬 重要對話
                </button>
                <button
                  onClick={() => setActiveTab('vocabulary')}
                  className="px-4 py-2 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: activeTab === 'vocabulary' ? 'var(--primary-color)' : 'var(--bg-tertiary)',
                    color: activeTab === 'vocabulary' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'vocabulary') {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'vocabulary') {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                >
                  📚 生字筆記
                </button>
              </div>

              {/* 內容顯示區 */}
              <div className="card">
                {activeTab === 'subtitle' && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600' }}>完整字幕</h3>
                    <div className="prose prose-invert max-w-none">
                      {subtitles ? (
                        <pre className="leading-relaxed whitespace-pre-wrap text-sm bg-slate-900/50 p-4 rounded-lg overflow-auto max-h-[600px]" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                          {subtitles}
                        </pre>
                      ) : (
                        <p className="leading-relaxed" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                          載入中... 該影片暫無字幕資料
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'dialogue' && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">重要對話 <span className="text-sm text-slate-400 font-normal">(點擊查看翻譯)</span></h3>
                    {dialogues.length > 0 ? (
                      <div className="space-y-4">
                        {dialogues.map((dialogue, index) => (
                          <div
                            key={index}
                            onClick={() => setExpandedDialogueId(expandedDialogueId === index ? null : index)}
                            className="rounded-lg p-4 cursor-pointer hover:bg-slate-700/50 transition-all duration-200"
                            style={{
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--border-subtle)'
                            }}
                          >
                            <div className="flex items-start mb-2">
                              <span className="text-sm font-mono" style={{ color: 'var(--accent-color)' }}>
                                {dialogue.timeStart} - {dialogue.timeEnd}
                              </span>
                            </div>
                            <p className="text-lg mb-2 italic" style={{ color: 'var(--text-primary)' }}>
                              "{dialogue.text}"
                            </p>
                            {expandedDialogueId === index && (
                              <div
                                className="rounded p-3 mt-3 animate-fadeIn"
                                style={{
                                  backgroundColor: 'var(--bg-tertiary)',
                                  border: '1px solid var(--accent-color)'
                                }}
                              >
                                <p className="text-sm" style={{ color: 'var(--success-color)' }}>
                                  🇹🇼 {dialogue.translation || '翻譯載入中...'}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <div className="text-4xl mb-2">💬</div>
                        <p>載入中... 該影片暫無對話資料</p>
                      </div>
                    )}
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
                            style={{
                              backgroundColor: selectedLevel === level ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                              color: selectedLevel === level ? 'var(--text-primary)' : 'var(--text-secondary)'
                            }}
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
                        <div
                          key={vocab.id}
                          className="rounded-lg p-4"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-subtle)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            e.currentTarget.style.borderColor = 'var(--accent-color)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-lg font-semibold" style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
                              {vocab.word}
                            </h4>
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: vocab.level === 'beginner' ? 'var(--success-color)' :
                                                 vocab.level === 'intermediate' ? 'var(--primary-light)' :
                                                 'var(--error-color)',
                                color: 'var(--text-primary)'
                              }}
                            >
                              {vocab.level === 'beginner' ? '初級' :
                               vocab.level === 'intermediate' ? '中級' : '高級'}
                            </span>
                          </div>
                          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                            {vocab.part_of_speech} • {vocab.definition_zh}
                          </p>
                          <div
                            className="rounded p-2 mb-2"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              border: '1px solid var(--accent-color)'
                            }}
                          >
                            <p className="text-sm italic" style={{ color: 'var(--accent-color)' }}>
                              "{vocab.original_sentence}"
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>例句：</p>
                            {vocab.example_sentences.map((example, idx) => (
                              <p key={idx} className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7' }}>
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
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700' }}>
                  歡迎來到 SubtitleLingo
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.7' }}>
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