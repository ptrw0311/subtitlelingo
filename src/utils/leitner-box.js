/**
 * Leitner Box 間隔重複系統
 *
 * Leitner Box 是一個簡單的間隔重複學習系統：
 * - Box 0: 每天複習（新單字或答錯單字）
 * - Box 1: 每 2 天複習
 * - Box 2: 每 4 天複習
 * - Box 3: 每週複習
 * - Box 4: 每 2 週複習
 * - Box 5: 每月複習（已掌握）
 *
 * 規則：
 * - 答對 → 升到下一盒（最高 Box 5）
 * - 答錯 → 降回 Box 0
 */

// Box 複習間隔設定（天數）
const BOX_INTERVALS = {
  0: 1,   // 新單字或答錯：每天複習
  1: 2,   // Box 1: 每 2 天
  2: 4,   // Box 2: 每 4 天
  3: 7,   // Box 3: 每週
  4: 14,  // Box 4: 每 2 週
  5: 30   // Box 5: 每月（已掌握）
};

/**
 * 更新 Leitner Box 等級
 * @param {number} currentBox - 當前 Box 等級 (0-5)
 * @param {boolean} isCorrect - 是否答對
 * @returns {Object} { box, nextReviewDate, intervalDays }
 */
export function updateLeitnerBox(currentBox = 0, isCorrect = false) {
  let newBox;

  if (isCorrect) {
    // 答對：升到下一盒（最高 Box 5）
    newBox = Math.min(5, currentBox + 1);
  } else {
    // 答錯：降回 Box 0
    newBox = 0;
  }

  // 計算下次複習日期
  const intervalDays = BOX_INTERVALS[newBox];
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  return {
    box: newBox,
    next_review_date: nextReviewDate.toISOString(),
    interval_days: intervalDays
  };
}

/**
 * 檢查是否需要今天複習
 * @param {string} nextReviewDate - 下次複習日期 (ISO string)
 * @returns {boolean}
 */
export function isDueForReview(nextReviewDate) {
  if (!nextReviewDate) return true;

  const today = new Date().toISOString().split('T')[0];
  const reviewDate = nextReviewDate.split('T')[0];
  return reviewDate <= today;
}

/**
 * 取得 Box 標籤
 * @param {number} box - Box 等級 (0-5)
 * @returns {string} Box 標籤
 */
export function getBoxLabel(box) {
  const labels = {
    0: '新學習',
    1: '學習中',
    2: '熟悉',
    3: '掌握',
    4: '精通',
    5: '完全掌握'
  };
  return labels[box] || '未知';
}

/**
 * 計算複習進度百分比
 * @param {Array} allMasteries - 所有掌握度資料
 * @returns {number} 進度百分比
 */
export function calculateReviewProgress(allMasteries) {
  if (!allMasteries || allMasteries.length === 0) return 0;

  const total = allMasteries.length;
  const mastered = allMasteries.filter(m => m.srs_box >= 5).length;

  return Math.round((mastered / total) * 100);
}

/**
 * 根據 Box 等級分組單字
 * @param {Array} masteries - 掌握度資料陣列
 * @returns {Object} 分組後的物件
 */
export function groupByBox(masteries) {
  const groups = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
  };

  masteries.forEach(m => {
    const box = m.srs_box || 0;
    if (groups[box]) {
      groups[box].push(m);
    }
  });

  return groups;
}

export default {
  updateLeitnerBox,
  isDueForReview,
  getBoxLabel,
  calculateReviewProgress,
  groupByBox
};
