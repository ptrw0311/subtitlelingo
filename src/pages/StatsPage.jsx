import { useState } from 'react';
import { Link } from 'react-router-dom';

// 假的統計資料
const fakeStats = {
  totalMovies: 12,
  totalWords: 156,
  totalExercises: 89,
  correctRate: 78,
  studyMinutes: 245,
  dailyStats: [
    { date: '2025-12-05', moviesStudied: 2, wordsLearned: 15, exercisesCorrect: 12, exercisesTotal: 15, studyMinutes: 45 },
    { date: '2025-12-06', moviesStudied: 1, wordsLearned: 8, exercisesCorrect: 10, exercisesTotal: 12, studyMinutes: 30 },
    { date: '2025-12-07', moviesStudied: 3, wordsLearned: 22, exercisesCorrect: 18, exercisesTotal: 20, studyMinutes: 60 },
    { date: '2025-12-08', moviesStudied: 0, wordsLearned: 0, exercisesCorrect: 0, exercisesTotal: 0, studyMinutes: 0 },
    { date: '2025-12-09', moviesStudied: 2, wordsLearned: 18, exercisesCorrect: 15, exercisesTotal: 18, studyMinutes: 50 },
    { date: '2025-12-10', moviesStudied: 1, wordsLearned: 12, exercisesCorrect: 14, exercisesTotal: 16, studyMinutes: 35 },
    { date: '2025-12-11', moviesStudied: 3, wordsLearned: 81, exercisesCorrect: 20, exercisesTotal: 25, studyMinutes: 25 },
  ],
  vocabularyByLevel: {
    beginner: { count: 65, correctRate: 85 },
    intermediate: { count: 67, correctRate: 75 },
    advanced: { count: 24, correctRate: 68 },
  },
  recentMovies: [
    { title: 'The Shawshank Redemption', studyDate: '2025-12-11', wordsLearned: 25 },
    { title: 'The Godfather', studyDate: '2025-12-10', wordsLearned: 18 },
    { title: 'The Dark Knight', studyDate: '2025-12-09', wordsLearned: 22 },
  ]
};

function StatsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('7days'); // 7days, 30days, all

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
  };

  // 計算統計資料
  const getPeriodStats = () => {
    const days = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : fakeStats.dailyStats.length;
    const recentData = fakeStats.dailyStats.slice(-days);

    return {
      totalMovies: recentData.reduce((sum, day) => sum + day.moviesStudied, 0),
      totalWords: recentData.reduce((sum, day) => sum + day.wordsLearned, 0),
      totalExercises: recentData.reduce((sum, day) => sum + day.exercisesTotal, 0),
      correctExercises: recentData.reduce((sum, day) => sum + day.exercisesCorrect, 0),
      studyMinutes: recentData.reduce((sum, day) => sum + day.studyMinutes, 0),
    };
  };

  const periodStats = getPeriodStats();
  const correctRate = periodStats.totalExercises > 0
    ? Math.round((periodStats.correctExercises / periodStats.totalExercises) * 100)
    : 0;

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
            <Link to="/practice/tt0111161" className="block px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
              🎯 練習模式
            </Link>
          </nav>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">學習統計</h1>
          <p className="page-subtitle">追蹤您的學習進度和成果</p>
        </div>

        <div className="content-area">
          {/* 時間選擇器 */}
          <div className="flex space-x-2 mb-6">
            {[
              { value: '7days', label: '最近 7 天' },
              { value: '30days', label: '最近 30 天' },
              { value: 'all', label: '全部時間' }
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedPeriod === period.value
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card text-center">
              <div className="text-3xl mb-2">🎬</div>
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {periodStats.totalMovies}
              </div>
              <div className="text-slate-400">已學習影片</div>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-2">📚</div>
              <div className="text-2xl font-bold text-amber-400 mb-1">
                {periodStats.totalWords}
              </div>
              <div className="text-slate-400">學習生字</div>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-2">🎯</div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                {correctRate}%
              </div>
              <div className="text-slate-400">練習正確率</div>
            </div>

            <div className="card text-center">
              <div className="text-3xl mb-2">⏱️</div>
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {Math.floor(periodStats.studyMinutes / 60)}h {periodStats.studyMinutes % 60}m
              </div>
              <div className="text-slate-400">學習時間</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 學習趨勢圖 */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4">學習趨勢</h3>
              <div className="space-y-3">
                {fakeStats.dailyStats.slice(-7).map((day, index) => (
                  <div key={day.date} className="flex items-center space-x-3">
                    <div className="w-16 text-sm text-slate-400">
                      {formatDate(day.date)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${(day.studyMinutes / 60) * 100}%` }}
                          />
                        </div>
                        <div className="text-sm text-slate-300 w-12 text-right">
                          {day.studyMinutes}m
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 text-sm">
                      {day.moviesStudied > 0 && (
                        <span className="px-2 py-1 bg-blue-600/30 text-blue-400 rounded">
                          🎬 {day.moviesStudied}
                        </span>
                      )}
                      {day.wordsLearned > 0 && (
                        <span className="px-2 py-1 bg-amber-600/30 text-amber-400 rounded">
                          📚 {day.wordsLearned}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 生字等級分布 */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4">生字等級分布</h3>
              <div className="space-y-4">
                {Object.entries(fakeStats.vocabularyByLevel).map(([level, data]) => {
                  const percentage = (data.count / fakeStats.totalWords) * 100;
                  const levelColors = {
                    beginner: 'from-green-500 to-green-600',
                    intermediate: 'from-blue-500 to-blue-600',
                    advanced: 'from-red-500 to-red-600'
                  };
                  const levelNames = {
                    beginner: '初級',
                    intermediate: '中級',
                    advanced: '高級'
                  };

                  return (
                    <div key={level} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">
                          {levelNames[level]}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-300">
                            {data.count} 個單字
                          </span>
                          <span className="text-slate-400 text-sm">
                            正確率 {data.correctRate}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div
                          className={`bg-gradient-to-r ${levelColors[level]} h-3 rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 最近學習的影片 */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4">最近學習</h3>
              <div className="space-y-3">
                {fakeStats.recentMovies.map((movie, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-white font-medium mb-1">
                        🎬 {movie.title}
                      </div>
                      <div className="text-sm text-slate-400">
                        學習日期：{formatDate(movie.studyDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-400 font-semibold">
                        +{movie.wordsLearned}
                      </div>
                      <div className="text-sm text-slate-500">個生字</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 成就徽章 */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4">成就徽章</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="text-sm text-white font-medium">連續學習</div>
                  <div className="text-xs text-slate-400">5天</div>
                </div>
                <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-3xl mb-2">📚</div>
                  <div className="text-sm text-white font-medium">單字收集家</div>
                  <div className="text-xs text-slate-400">100+</div>
                </div>
                <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="text-sm text-white font-medium">練習達人</div>
                  <div className="text-xs text-slate-400">80%+</div>
                </div>
                <div className="text-center p-3 bg-slate-800/50 rounded-lg opacity-50">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="text-sm text-white font-medium">電影鑑賞家</div>
                  <div className="text-xs text-slate-400">未解鎖</div>
                </div>
                <div className="text-center p-3 bg-slate-800/50 rounded-lg opacity-50">
                  <div className="text-3xl mb-2">💎</div>
                  <div className="text-sm text-white font-medium">完美主義者</div>
                  <div className="text-xs text-slate-400">未解鎖</div>
                </div>
                <div className="text-center p-3 bg-slate-800/50 rounded-lg opacity-50">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="text-sm text-white font-medium">學習大師</div>
                  <div className="text-xs text-slate-400">未解鎖</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StatsPage;