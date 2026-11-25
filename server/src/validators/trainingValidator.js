import AppError from '../utils/AppError.js';

const difficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const contentTypes = ['ARTICLE', 'VIDEO', 'INTERACTIVE'];

function requiredText(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new AppError(`${field} must be a non-empty string up to ${maxLength} characters.`, 400);
  }
  return value.trim();
}

function validateQuiz(quiz) {
  if (!Array.isArray(quiz)) throw new AppError('quiz must be an array.', 400);
  return quiz.map((item, index) => {
    const question = requiredText(item?.question, `Quiz question ${index + 1}`, 500);
    if (!Array.isArray(item.options) || item.options.length < 2 || item.options.length > 6) {
      throw new AppError(`Quiz question ${index + 1} must have between 2 and 6 options.`, 400);
    }
    const options = item.options.map((option) => requiredText(option, `Option for question ${index + 1}`, 250));
    if (!Number.isInteger(item.correctAnswer) || item.correctAnswer < 0 || item.correctAnswer >= options.length) {
      throw new AppError(`Quiz question ${index + 1} has an invalid correctAnswer index.`, 400);
    }
    return {
      question,
      options,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation === undefined ? '' : requiredText(item.explanation, `Explanation for question ${index + 1}`, 1000)
    };
  });
}

function validateValues(payload, isCreate) {
  const data = {};
  if (isCreate || payload.title !== undefined) data.title = requiredText(payload.title, 'Title', 200);
  if (isCreate || payload.description !== undefined) data.description = requiredText(payload.description, 'Description', 2000);
  if (isCreate || payload.category !== undefined) data.category = requiredText(payload.category, 'Category', 100);
  if (isCreate || payload.contentType !== undefined) {
    if (!contentTypes.includes(payload.contentType)) throw new AppError('contentType is invalid.', 400);
    data.contentType = payload.contentType;
  }
  if (isCreate || payload.duration !== undefined) {
    if (!Number.isInteger(payload.duration) || payload.duration < 1 || payload.duration > 480) throw new AppError('duration must be a whole number of minutes between 1 and 480.', 400);
    data.duration = payload.duration;
  }
  if (payload.difficulty !== undefined) {
    if (!difficulties.includes(payload.difficulty)) throw new AppError('Difficulty is invalid.', 400);
    data.difficulty = payload.difficulty;
  }
  if (payload.contentUrl !== undefined) {
    if (payload.contentUrl === '') {
      data.contentUrl = '';
    } else {
      const contentUrl = requiredText(payload.contentUrl, 'contentUrl', 2000);
      let parsedUrl;
      try {
        parsedUrl = new URL(contentUrl);
      } catch {
        throw new AppError('contentUrl must be a valid HTTP or HTTPS URL.', 400);
      }
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new AppError('contentUrl must be a valid HTTP or HTTPS URL.', 400);
      }
      data.contentUrl = contentUrl;
    }
  }
  if (payload.tags !== undefined) {
    if (!Array.isArray(payload.tags) || payload.tags.length > 20) throw new AppError('tags must contain at most 20 values.', 400);
    data.tags = payload.tags.map((tag) => requiredText(tag, 'Tag', 50).toLowerCase());
  }
  if (payload.quiz !== undefined) data.quiz = validateQuiz(payload.quiz);
  if (payload.passingScore !== undefined) {
    if (!Number.isInteger(payload.passingScore) || payload.passingScore < 0 || payload.passingScore > 100) throw new AppError('passingScore must be a whole number from 0 to 100.', 400);
    data.passingScore = payload.passingScore;
  }
  if (payload.isActive !== undefined) {
    if (typeof payload.isActive !== 'boolean') throw new AppError('isActive must be true or false.', 400);
    data.isActive = payload.isActive;
  }
  if (!isCreate && !Object.keys(data).length) throw new AppError('Provide at least one valid training field to update.', 400);
  return data;
}

export const validateTrainingCreate = (payload = {}) => validateValues(payload, true);
export const validateTrainingUpdate = (payload = {}) => validateValues(payload, false);

export function validateQuizSubmission(payload = {}) {
  if (!Array.isArray(payload.answers)) throw new AppError('answers must be an array.', 400);
  const answerMap = new Map();
  for (const answer of payload.answers) {
    if (!Number.isInteger(answer?.questionIndex) || !Number.isInteger(answer?.answerIndex) || answer.questionIndex < 0 || answer.answerIndex < 0) {
      throw new AppError('Each answer must contain non-negative questionIndex and answerIndex integers.', 400);
    }
    if (answerMap.has(answer.questionIndex)) throw new AppError('Each quiz question may be answered once.', 400);
    answerMap.set(answer.questionIndex, answer.answerIndex);
  }
  return answerMap;
}
