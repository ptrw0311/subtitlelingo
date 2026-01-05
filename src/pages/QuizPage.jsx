import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { movieDB, quizDB, masteryDB, wrongAnswersDB, analyticsDB } from '../config/turso.js';
import { generateMultipleChoiceQuestions, calculateScore } from '../utils/quiz-generator.js';
import { getMasteryLabel } from '../utils/mastery-calculator.js';

const USER_ID = 'demo_user';

function QuizPage() {
  const navigate = useNavigate();

  // 測驗狀態
  const [quizState, setQuizState] = useState('setup'); // setup | quiz | results
  const [movies, setMovies] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [startTime, setStartTime] = useState(null);

  // 測驗設定
  const [quizConfig, setQuizConfig] = useState({
    movieId: null,
    level: null,
    questionCount: 10
  });

  // 測驗結果
  const [quizResults, setQuizResults] = useState(null);

  // 載入狀態
  const [loading, setLoading] = useState(false);

  // 載入影片列表
  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    const result = await movieDB.getAll();
    if (result.data) {
      setMovies(result.data);
    }
  };

  // 開始測驗
  const startQuiz = async () => {
    setLoading(true);
    try {
      // 生成題目
      const generatedQuestions = await generateMultipleChoiceQuestions({
        movieId: quizConfig.movieId || undefined,
        level: quizConfig.level || undefined,
        count: quizConfig.questionCount
      });

      if (generatedQuestions.length === 0) {
        alert('沒有符合條件的生字可以生成題目');
        setLoading(false);
        return;
      }

      // 建立測驗會話
      const sessionResult = await quizDB.createSession(USER_ID, {
        quizType: 'multiple_choice',
        totalQuestions: generatedQuestions.length,
        movieId: quizConfig.movieId || undefined
      });

      if (sessionResult.data && sessionResult.data.length > 0) {
        setSessionId(sessionResult.data[0].id);
      }

      setQuestions(generatedQuestions);
      setQuizState('quiz');
      setStartTime(new Date());
    } catch (error) {
      console.error('開始測驗失敗:', error);
      alert('測驗啟動失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 回答問題
  const handleAnswer = async (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correct_answer;

    // 記錄答案
    const newAnswers = [...userAnswers, answer];
    setUserAnswers(newAnswers);

    // 記錄到資料庫
    if (sessionId) {
      await quizDB.recordAnswer(sessionId, {
        vocabularyId: currentQuestion.vocabulary_id,
        questionType: currentQuestion.question_type,
        questionText: currentQuestion.question_text,
        userAnswer: answer,
        correctAnswer: currentQuestion.correct_answer,
        isCorrect: isCorrect
      });

      // 更新掌握度
      await masteryDB.updateMastery(USER_ID, currentQuestion.vocabulary_id, isCorrect);
      await masteryDB.updateLeitnerBox(USER_ID, currentQuestion.vocabulary_id, isCorrect);

      // 如果答錯，加入錯題本
      if (!isCorrect) {
        await wrongAnswersDB.addWrongAnswer(USER_ID, {
          vocabularyId: currentQuestion.vocabulary_id,
          wrongAnswer: answer,
          correctAnswer: currentQuestion.correct_answer,
          questionType: currentQuestion.question_type,
          questionContext: currentQuestion.question_text
        });
      }
    }

    // 下一題或完成
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await completeQuiz(newAnswers);
    }
  };

  // 完成測驗
  const completeQuiz = async (finalAnswers) => {
    const endTime = new Date();
    const timeSpent = Math.round((endTime - startTime) / 1000); // 秒

    // 計算成績
    const score = calculateScore(questions, finalAnswers);

    // 更新測驗會話
    if (sessionId) {
      await quizDB.completeSession(sessionId, {
        correctAnswers: score.correct,
        timeSpent: timeSpent
      });

      // 更新連續學習天數
      await analyticsDB.updateStreak(USER_ID);
    }

    setQuizResults({
      ...score,
      timeSpent: timeSpent,
      timeSpentFormatted: formatTime(timeSpent)
    });
    setQuizState('results');
  };

  // 格式化時間
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} 分 ${secs} 秒`;
  };

  // 測驗設定畫面
  const renderSetup = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        📝 生字測驗設定
      </h2>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
          選擇影片（可選）
        </label>
        <select
          value={quizConfig.movieId || ''}
          onChange={(e) => setQuizConfig({ ...quizConfig, movieId: e.target.value || null })}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-secondary)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)'
          }}
        >
          <option value="">全部影片</option>
          {movies.map(movie => (
            <option key={movie.imdb_id} value={movie.imdb_id}>
              {movie.title}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
          選擇難易度（可選）
        </label>
        <select
          value={quizConfig.level || ''}
          onChange={(e) => setQuizConfig({ ...quizConfig, level: e.target.value || null })}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-secondary)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)'
          }}
        >
          <option value="">全部難度</option>
          <option value="beginner">初級</option>
          <option value="intermediate">中級</option>
          <option value="advanced">高級</option>
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
          題目數量
        </label>
        <input
          type="number"
          min="1"
          max="50"
          value={quizConfig.questionCount}
          onChange={(e) => setQuizConfig({ ...quizConfig, questionCount: parseInt(e.target.value) })}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-secondary)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)'
          }}
        />
      </div>

      <button
        onClick={startQuiz}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.875rem',
          borderRadius: '0.5rem',
          border: 'none',
          backgroundColor: 'var(--accent-primary)',
          color: 'white',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1
        }}
      >
        {loading ? '載入中...' : '開始測驗'}
      </button>

      <button
        onClick={() => navigate('/')}
        style={{
          width: '100%',
          padding: '0.875rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-secondary)',
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        返回首頁
      </button>
    </div>
  );

  // 測驗進行畫面
  const renderQuiz = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
        {/* 進度條 */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              題目 {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: 'var(--accent-primary)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* 題目卡片 */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            fontSize: '0.75rem',
            marginBottom: '1rem'
          }}>
            {currentQuestion.level === 'beginner' ? '初級' :
             currentQuestion.level === 'intermediate' ? '中級' : '高級'}
          </div>

          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            {currentQuestion.question_text}
          </h3>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid var(--border-secondary)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'var(--accent-primary)';
                  e.target.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'var(--border-secondary)';
                  e.target.style.transform = 'translateX(0)';
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 測驗結果畫面
  const renderResults = () => {
    if (!quizResults) return null;

    const scoreColor = quizResults.percentage >= 80 ? 'green' :
                      quizResults.percentage >= 60 ? 'blue' : 'orange';

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            🎉 測驗完成！
          </h2>

          <div style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: scoreColor === 'green' ? '#10b981' :
                   scoreColor === 'blue' ? '#3b82f6' : '#f59e0b',
            marginBottom: '1rem'
          }}>
            {quizResults.percentage}%
          </div>

          <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            答對 {quizResults.correct} 題 / 共 {quizResults.total} 題
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.5rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                用時
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {quizResults.timeSpentFormatted}
              </div>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.5rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                正確率
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {quizResults.percentage}%
              </div>
            </div>
          </div>

          {quizResults.percentage >= 80 && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#dcfce7',
              color: '#166534',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              太棒了！表現優秀！🌟
            </div>
          )}

          {quizResults.percentage >= 60 && quizResults.percentage < 80 && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              不錯喔！繼續保持！💪
            </div>
          )}

          {quizResults.percentage < 60 && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              再加油！多練習就能進步！📚
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <button
            onClick={() => {
              setQuizState('setup');
              setQuestions([]);
              setCurrentQuestionIndex(0);
              setUserAnswers([]);
              setQuizResults(null);
              setSessionId(null);
            }}
            style={{
              padding: '0.875rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            再測驗一次
          </button>

          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-secondary)',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {quizState === 'setup' && renderSetup()}
      {quizState === 'quiz' && renderQuiz()}
      {quizState === 'results' && renderResults()}
    </div>
  );
}

export default QuizPage;
