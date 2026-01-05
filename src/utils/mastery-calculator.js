/**
 * 掌握度計算工具
 *
 * 掌握度計算公式：
 * 掌握度 = (答對次數 × 1.5) / (答對次數 × 1.5 + 答錯次數 × 0.5)
 *
 * 說明：
 * - 答對的權重是 1.5（強化正確）
 * - 答錯的權重是 0.5（弱化錯誤）
 * - 結果範圍：0-1
 */

/**
 * 計算單字掌握度 (0-1)
 * @param {number} correctCount - 答對次數
 * @param {number} incorrectCount - 答錯次數
 * @returns {number} 掌握度分數 (0-1)
 */
export function calculateMasteryLevel(correctCount = 0, incorrectCount = 0) {
  const total = correctCount + incorrectCount;

  if (total === 0) return 0;

  // 加權計算：答對權重 1.5，答錯權重 0.5
  const weightedScore = (correctCount * 1.5) / (correctCount * 1.5 + incorrectCount * 0.5);

  return Math.max(0, Math.min(1, weightedScore));
}

/**
 * 根據掌握度分數取得等級文字
 * @param {number} masteryLevel - 0-1 之間的分數
 * @returns {string} 等級標籤
 */
export function getMasteryLabel(masteryLevel) {
  if (masteryLevel === 0) return '尚未學習';
  if (masteryLevel < 0.3) return '初級';
  if (masteryLevel < 0.6) return '中級';
  if (masteryLevel < 0.8) return '高級';
  return '精通';
}

/**
 * 根據掌握度分數取得顏色
 * @param {number} masteryLevel - 0-1 之間的分數
 * @returns {string} CSS 顏色代碼
 */
export function getMasteryColor(masteryLevel) {
  if (masteryLevel === 0) return '#9ca3af';  // gray
  if (masteryLevel < 0.3) return '#ef4444';  // red
  if (masteryLevel < 0.6) return '#f59e0b';  // amber
  if (masteryLevel < 0.8) return '#3b82f6';  // blue
  return '#10b981';  // green
}

/**
 * 根據掌握度分數取得背景顏色類別
 * @param {number} masteryLevel - 0-1 之間的分數
 * @returns {string} Tailwind CSS 類別
 */
export function getMasteryBgColor(masteryLevel) {
  if (masteryLevel === 0) return 'bg-gray-100 text-gray-800';
  if (masteryLevel < 0.3) return 'bg-red-100 text-red-800';
  if (masteryLevel < 0.6) return 'bg-amber-100 text-amber-800';
  if (masteryLevel < 0.8) return 'bg-blue-100 text-blue-800';
  return 'bg-green-100 text-green-800';
}

/**
 * 計算需要再答對幾次才能達到目標掌握度
 * @param {number} correctCount - 目前答對次數
 * @param {number} incorrectCount - 目前答錯次數
 * @param {number} targetLevel - 目標掌握度 (0-1)
 * @returns {number|null} 需要答對的次數，如果無法達到則返回 null
 */
export function calculateNeededCorrectAnswers(correctCount, incorrectCount, targetLevel = 0.8) {
  if (targetLevel >= 1) return null;

  // 解方程：(c + x) * 1.5 / ((c + x) * 1.5 + i * 0.5) = targetLevel
  // 其中 c = correctCount, i = incorrectCount, x = 需要答對的次數

  const c = correctCount;
  const i = incorrectCount;
  const t = targetLevel;

  // (c + x) * 1.5 = t * ((c + x) * 1.5 + i * 0.5)
  // 1.5c + 1.5x = 1.5t(c + x) + 0.5t*i
  // 1.5c + 1.5x = 1.5t*c + 1.5t*x + 0.5t*i
  // 1.5x - 1.5t*x = 1.5t*c + 0.5t*i - 1.5c
  // x(1.5 - 1.5t) = 1.5t*c + 0.5t*i - 1.5c
  // x = (1.5t*c + 0.5t*i - 1.5c) / (1.5 - 1.5t)
  // x = (t * (1.5c + 0.5i) - 1.5c) / (1.5 * (1 - t))

  const numerator = t * (1.5 * c + 0.5 * i) - 1.5 * c;
  const denominator = 1.5 * (1 - t);

  if (denominator === 0) return null;
  if (numerator < 0) return 0;  // 已經超過目標

  const x = numerator / denominator;
  return Math.max(0, Math.ceil(x));
}

/**
 * 比較兩次測驗的進步情況
 * @param {Object} oldScore - 舊成績 { correct, total }
 * @param {Object} newScore - 新成績 { correct, total }
 * @returns {Object} 進步分析
 */
export function analyzeProgress(oldScore, newScore) {
  if (!oldScore || !newScore) {
    return {
      improved: null,
      percentageChange: 0,
      message: '無法比較'
    };
  }

  const oldPercentage = (oldScore.correct / oldScore.total) * 100;
  const newPercentage = (newScore.correct / newScore.total) * 100;
  const percentageChange = newPercentage - oldPercentage;

  let message = '';
  if (percentageChange > 0) {
    message = `進步了 ${percentageChange.toFixed(1)}% 🎉`;
  } else if (percentageChange < 0) {
    message = `退步了 ${Math.abs(percentageChange).toFixed(1)}% 💪 加油！`;
  } else {
    message = '保持相同水準 💪';
  }

  return {
    improved: percentageChange > 0,
    percentageChange: percentageChange,
    message: message
  };
}

/**
 * 計算學習建議
 * @param {number} masteryLevel - 掌握度分數
 * @param {number} streak - 連續答對次數
 * @returns {string} 建議訊息
 */
export function getLearningAdvice(masteryLevel, streak = 0) {
  if (masteryLevel >= 0.8) {
    return '太棒了！這個單字已經掌握了 🎉';
  }

  if (streak >= 3) {
    return '連續答對！表現很好 👍';
  }

  if (masteryLevel < 0.3) {
    return '這個單字還需要多練習 💪';
  }

  if (masteryLevel < 0.6) {
    return '繼續保持，快掌握了！📚';
  }

  return '再練習幾次就能完全掌握了 🎯';
}

export default {
  calculateMasteryLevel,
  getMasteryLabel,
  getMasteryColor,
  getMasteryBgColor,
  calculateNeededCorrectAnswers,
  analyzeProgress,
  getLearningAdvice
};
