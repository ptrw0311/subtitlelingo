/**
 * 四選一題目生成器
 *
 * 支援三種題型：
 * - Type A: 給單字，選中文意思
 * - Type B: 給中文意思，選英文單字
 * - Type C: 給例句，選單字意思
 */

import { vocabularyDB } from '../config/turso-api.js';

/**
 * 隨機打亂陣列（Fisher-Yates shuffle）
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 生成四選一題目
 * @param {Object} options - 生成選項
 * @param {string} options.movieId - 影片 ID（可選）
 * @param {string} options.level - 難易度（可選：beginner, intermediate, advanced）
 * @param {number} options.count - 題目數量
 * @param {Array<string>} options.questionTypes - 題型類型（可選，預設全選）
 * @returns {Promise<Array>} 題目陣列
 */
export async function generateMultipleChoiceQuestions(options = {}) {
  const {
    movieId = null,
    level = null,
    count = 10,
    questionTypes = ['A', 'B', 'C']
  } = options;

  // 取得生字列表
  let vocabResult;
  if (movieId) {
    vocabResult = await vocabularyDB.getByMovieId(movieId);
  } else if (level) {
    vocabResult = await vocabularyDB.getAll(level);
  } else {
    vocabResult = await vocabularyDB.getAll();
  }

  if (vocabResult.error || !vocabResult.data || vocabResult.data.length === 0) {
    console.error('無法取得生字列表');
    return [];
  }

  const vocabularyList = vocabResult.data;

  // 如果生字數量不足，返回所有生字的題目
  const actualCount = Math.min(count, vocabularyList.length);

  // 隨機選擇生字作為題目
  const selectedVocabularies = shuffleArray(vocabularyList).slice(0, actualCount);

  const questions = [];

  for (const vocab of selectedVocabularies) {
    // 隨機選擇題型
    const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

    const question = await generateQuestion(vocab, vocabularyList, questionType);
    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

/**
 * 生成單一題目
 */
async function generateQuestion(vocab, allVocabularies, questionType) {
  try {
    switch (questionType) {
      case 'A':
        return generateTypeA(vocab, allVocabularies);
      case 'B':
        return generateTypeB(vocab, allVocabularies);
      case 'C':
        return generateTypeC(vocab, allVocabularies);
      default:
        return null;
    }
  } catch (error) {
    console.error(`生成題目失敗 (${questionType}):`, error);
    return null;
  }
}

/**
 * 題型 A: 給單字，選中文意思
 */
function generateTypeA(vocab, allVocabularies) {
  // 找尋干擾選項（同難易度的其他單字）
  const distractors = getDistractors(vocab, allVocabularies, 3);

  if (distractors.length < 3) {
    console.warn('干擾選項不足，跳過此題');
    return null;
  }

  const options = shuffleArray([
    vocab.definition_zh,
    ...distractors.map(d => d.definition_zh)
  ]);

  return {
    vocabulary_id: vocab.id,
    question_type: 'multiple_choice_A',
    question_text: `"${vocab.word}" 的中文意思是？`,
    options: options,
    correct_answer: vocab.definition_zh,
    word: vocab.word,
    part_of_speech: vocab.part_of_speech,
    level: vocab.level
  };
}

/**
 * 題型 B: 給中文意思，選英文單字
 */
function generateTypeB(vocab, allVocabularies) {
  // 找尋干擾選項（同難易度的其他單字）
  const distractors = getDistractors(vocab, allVocabularies, 3);

  if (distractors.length < 3) {
    console.warn('干擾選項不足，跳過此題');
    return null;
  }

  const options = shuffleArray([
    vocab.word,
    ...distractors.map(d => d.word)
  ]);

  return {
    vocabulary_id: vocab.id,
    question_type: 'multiple_choice_B',
    question_text: `"${vocab.definition_zh}" 的英文單字是？`,
    options: options,
    correct_answer: vocab.word,
    word: vocab.word,
    definition_zh: vocab.definition_zh,
    level: vocab.level
  };
}

/**
 * 題型 C: 給例句，選單字意思
 */
function generateTypeC(vocab, allVocabularies) {
  if (!vocab.original_sentence) {
    // 如果沒有例句，改用題型 A
    return generateTypeA(vocab, allVocabularies);
  }

  // 找尋干擾選項（同難易度的其他單字）
  const distractors = getDistractors(vocab, allVocabularies, 3);

  if (distractors.length < 3) {
    console.warn('干擾選項不足，跳過此題');
    return null;
  }

  const options = shuffleArray([
    vocab.definition_zh,
    ...distractors.map(d => d.definition_zh)
  ]);

  // 在例句中將單字挖空
  const blankedSentence = vocab.original_sentence.replace(
    new RegExp(vocab.word, 'gi'),
    '_____'
  );

  return {
    vocabulary_id: vocab.id,
    question_type: 'multiple_choice_C',
    question_text: `例句："${blankedSentence}"\n${vocab.word} 的意思是？`,
    options: options,
    correct_answer: vocab.definition_zh,
    word: vocab.word,
    original_sentence: vocab.original_sentence,
    level: vocab.level
  };
}

/**
 * 取得干擾選項
 * @param {Object} currentVocab - 當前單字
 * @param {Array} allVocabularies - 所有生字列表
 * @param {number} count - 需要的干擾選項數量
 * @returns {Array} 干擾選項陣列
 */
function getDistractors(currentVocab, allVocabularies, count) {
  // 優先選擇同難易度的單字作為干擾項
  const sameLevelVocabs = allVocabularies.filter(
    v => v.level === currentVocab.level && v.id !== currentVocab.id
  );

  // 如果同難易度的單字不夠，從所有單字中選擇
  let availableVocabs = sameLevelVocabs.length >= count
    ? sameLevelVocabs
    : allVocabularies.filter(v => v.id !== currentVocab.id);

  // 隨機選擇干擾選項
  return shuffleArray(availableVocabs).slice(0, count);
}

/**
 * 驗證答案
 * @param {Object} question - 題目物件
 * @param {string} userAnswer - 用戶答案
 * @returns {boolean} 是否正確
 */
export function validateAnswer(question, userAnswer) {
  return question.correct_answer === userAnswer;
}

/**
 * 計算測驗成績
 * @param {Array} questions - 題目陣列
 * @param {Array} userAnswers - 用戶答案陣列
 * @returns {Object} 成績統計
 */
export function calculateScore(questions, userAnswers) {
  let correctCount = 0;
  const results = [];

  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = validateAnswer(question, userAnswer);

    if (isCorrect) {
      correctCount++;
    }

    results.push({
      question_index: index,
      vocabulary_id: question.vocabulary_id,
      user_answer: userAnswer,
      correct_answer: question.correct_answer,
      is_correct: isCorrect
    });
  });

  return {
    total: questions.length,
    correct: correctCount,
    incorrect: questions.length - correctCount,
    percentage: Math.round((correctCount / questions.length) * 100),
    results: results
  };
}

/**
 * 生成練習模式的題目（即時反饋）
 */
export async function generatePracticeQuestions(options = {}) {
  const questions = await generateMultipleChoiceQuestions(options);

  // 練習模式可以加入額外的提示資訊
  return questions.map(q => ({
    ...q,
    hint: `提示：${q.part_of_speech || ''}詞`,
    explanation: `完整句子：${q.original_sentence || '暫無例句'}`
  }));
}

export default {
  generateMultipleChoiceQuestions,
  generatePracticeQuestions,
  validateAnswer,
  calculateScore
};
