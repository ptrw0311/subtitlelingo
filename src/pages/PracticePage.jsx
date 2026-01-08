import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { exerciseDB, movieDB } from '../config/turso-api';

// 備用練習題資料（當資料庫沒有資料時使用）
const fallbackQuestions = [
  {
    id: 1,
    question: "I'm going to make him an offer he can't _____.",
    correctAnswer: "refuse",
    options: ["refuse", "accept", "ignore", "understand"],
    explanation: "這句經典台詞的意思是「我要給他一個無法拒絕的提議」。",
    level: "intermediate"
  },
  {
    id: 2,
    question: "May the Force be _____ you.",
    correctAnswer: "with",
    options: ["with", "on", "in", "for"],
    explanation: "這是《星際大戰》的經典祝福語，願原力與你同在。",
    level: "beginner"
  },
  {
    id: 3,
    question: "Life is like a box of _____. You never know what you're gonna get.",
    correctAnswer: "chocolates",
    options: ["chocolates", "candies", "cookies", "surprises"],
    explanation: "這句話比喻人生的不確定性，就像一盒巧克力，你永遠不知道下一顆是什麼味道。",
    level: "intermediate"
  }
];

function PracticePage() {
  const { movieId } = useParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [movie, setMovie] = useState(null);

  // 載入練習題資料
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 同時載入影片資訊和練習題
        const [movieResult, exerciseResult] = await Promise.all([
          movieDB.getByImdbId(movieId),
          exerciseDB.getByMovieId(movieId)
        ]);

        // 處理影片資訊
        if (movieResult.data && movieResult.data.length > 0) {
          setMovie(movieResult.data[0]);
        }

        // 處理練習題
        if (exerciseResult.data && exerciseResult.data.length > 0) {
          // 解析 JSON 格式的選項
          const formattedQuestions = exerciseResult.data.map(exercise => ({
            id: exercise.id,
            question: exercise.question_text,
            correctAnswer: exercise.correct_answer,
            options: typeof exercise.options === 'string'
              ? JSON.parse(exercise.options)
              : exercise.options,
            explanation: exercise.explanation,
            level: exercise.difficulty_level
          }));
          setQuestions(formattedQuestions);
        } else {
          // 如果沒有找到練習題，使用備用資料
          console.log('⚠️ 找不到影片練習題，使用備用資料');
          setQuestions(fallbackQuestions);
        }
      } catch (err) {
        console.error('載入練習題失敗:', err);
        setError('載入練習題失敗，顯示示範資料');
        setQuestions(fallbackQuestions);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      loadData();
    }
  }, [movieId]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleAnswerSelect = (answer) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const newAnswers = [
      ...answers,
      {
        question: currentQuestion.question,
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect
      }
    ];

    setAnswers(newAnswers);
    setShowResult(true);

    if (isCorrect) {
      setScore(score + 1);
    }

    // TODO: 這裡可以記錄答案到資料庫
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer('');
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setQuizCompleted(false);
  };

  // 載入狀態
  if (loading) {
    return (
      <div className="app-container">
        <aside className="sidebar">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-6 text-center">
              <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
                SubtitleLingo
              </span>
            </h1>
          </div>
        </aside>
        <main className="main-content">
          <div className="page-header">
            <h1 className="page-title">載入中...</h1>
            <p className="page-subtitle">正在準備練習題</p>
          </div>
          <div className="content-area flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">正在載入練習題...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 錯誤狀態
  if (error && questions.length === 0) {
    return (
      <div className="app-container">
        <aside className="sidebar">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-6 text-center">
              <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
                SubtitleLingo
              </span>
            </h1>
          </div>
        </aside>
        <main className="main-content">
          <div className="page-header">
            <h1 className="page-title">載入失敗</h1>
            <p className="page-subtitle">無法載入練習題</p>
          </div>
          <div className="content-area">
            <div className="max-w-2xl mx-auto">
              <div className="card text-center">
                <div className="text-6xl mb-6">😅</div>
                <h2 className="text-2xl font-bold text-white mb-4">載入練習題時發生錯誤</h2>
                <p className="text-slate-300 mb-6">{error}</p>
                <Link
                  to="/"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  🏠 回到首頁
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (quizCompleted) {
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
            <h1 className="page-title">練習完成！</h1>
            <p className="page-subtitle">您已完成所有練習題</p>
          </div>

          <div className="content-area">
            <div className="max-w-2xl mx-auto">
              <div className="card text-center">
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  練習結果
                </h2>
                <div className="text-6xl font-bold mb-4">
                  <span className="text-amber-400">{score}</span>
                  <span className="text-slate-400">/{questions.length}</span>
                </div>
                <p className="text-xl text-slate-300 mb-8">
                  正確率：{Math.round((score / questions.length) * 100)}%
                </p>

                <div className="space-y-4 mb-8">
                  {answers.map((answer, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        answer.isCorrect
                          ? 'bg-green-600/20 border-green-500/50'
                          : 'bg-red-600/20 border-red-500/50'
                      }`}
                    >
                      <p className="text-white mb-2">{answer.question}</p>
                      <p className="text-sm">
                        您的答案：<span className={answer.isCorrect ? 'text-green-400' : 'text-red-400'}>
                          {answer.selectedAnswer}
                        </span>
                        {!answer.isCorrect && (
                          <span className="text-green-400 ml-2">
                            (正確答案：{answer.correctAnswer})
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={handleRestartQuiz}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    🔄 重新練習
                  </button>
                  <Link
                    to="/"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    🏠 回到首頁
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-6 text-center">
            <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
              SubtitleLingo
            </span>
          </h1>

          <div className="mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">練習進度</h3>
              <div className="text-2xl font-bold text-amber-400 mb-2">
                {currentQuestionIndex + 1} / {questions.length}
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm text-slate-400">
                目前得分：{score} 分
              </div>
              {movie && (
                <div className="text-sm text-slate-400 mt-2">
                  🎬 {movie.title}
                </div>
              )}
            </div>
          </div>

          <nav className="space-y-2">
            <Link to="/" className="block px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
              🏠 回到首頁
            </Link>
            <Link to="/stats" className="block px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
              📊 學習統計
            </Link>
          </nav>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">填空練習</h1>
          <p className="page-subtitle">
            {movie ? movie.title : `影片 ID: ${movieId}`} • 測試您對重要對話的理解
          </p>
        </div>

        <div className="content-area">
          <div className="max-w-3xl mx-auto">
            <div className="card">
              {/* 進度條 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">問題 {currentQuestionIndex + 1}</span>
                  <span className="text-slate-400">{Math.round(progress)}% 完成</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-amber-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* 題目 */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">填空題</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentQuestion?.level === 'beginner' ? 'bg-green-600 text-white' :
                    currentQuestion?.level === 'intermediate' ? 'bg-blue-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {currentQuestion?.level === 'beginner' ? '初級' :
                     currentQuestion?.level === 'intermediate' ? '中級' : '高級'}
                  </span>
                </div>

                <div className="text-2xl text-white leading-relaxed mb-6">
                  {currentQuestion?.question.split('_____').map((part, index, array) => (
                    <span key={index}>
                      {part}
                      {index < array.length - 1 && (
                        <span className={`inline-block min-w-[120px] mx-2 px-3 py-1 border-b-2 ${
                          showResult
                            ? selectedAnswer === currentQuestion.correctAnswer
                              ? 'border-green-500 text-green-400'
                              : selectedAnswer !== currentQuestion.correctAnswer && selectedAnswer
                                ? 'border-red-500 text-red-400'
                                : 'border-slate-500'
                            : selectedAnswer
                              ? 'border-blue-500 text-blue-400'
                              : 'border-slate-500'
                        }`}>
                          {selectedAnswer || '______'}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* 選項 */}
              {!showResult && currentQuestion?.options && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        selectedAnswer === option
                          ? 'border-blue-500 bg-blue-600/20 text-white'
                          : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-lg font-medium">{option}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 結果顯示 */}
              {showResult && (
                <div className={`p-4 rounded-lg mb-6 ${
                  selectedAnswer === currentQuestion.correctAnswer
                    ? 'bg-green-600/20 border border-green-500/50'
                    : 'bg-red-600/20 border border-red-500/50'
                }`}>
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">
                      {selectedAnswer === currentQuestion.correctAnswer ? '✅' : '❌'}
                    </span>
                    <span className="text-lg font-semibold text-white">
                      {selectedAnswer === currentQuestion.correctAnswer ? '答對了！' : '答錯了！'}
                    </span>
                  </div>

                  {selectedAnswer !== currentQuestion.correctAnswer && (
                    <p className="text-white mb-2">
                      正確答案：<span className="font-bold text-green-400">
                        {currentQuestion.correctAnswer}
                      </span>
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <p className="text-slate-300">
                      💡 {currentQuestion?.explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="flex justify-between">
                <div></div>
                {!showResult ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                      selectedAnswer
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    提交答案
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    {currentQuestionIndex < questions.length - 1 ? '下一題' : '查看結果'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PracticePage;