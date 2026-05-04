import LetterState from "../models/LetterState.js";
import WordState from "../models/WordState.js";
import SentenceState from "../models/SentenceState.js";
import TwoLetterWordState from "../models/TwoLetterWordState.js";
import User from "../models/User.js";
import StudentTeacher from "../models/StudentTeacher.js";
import ParentChild from "../models/ParentChild.js";
import { TWO_LETTER_WORDS } from "../data/twoLetterWords.js";
import { getTrainingCorpusForStudent } from "./trainingContentService.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const toPercent = (value) => Number((value * 100).toFixed(1));

const getCutoffDate = (timeframe = 30) => {
  const safeDays = Number(timeframe) > 0 ? Number(timeframe) : 30;
  return new Date(Date.now() - safeDays * DAY_MS);
};

const buildTimeFilter = (timeframe) => ({
  updatedAt: { $gte: getCutoffDate(timeframe) },
});

const isWithinTimeframe = (item, timeframe) => {
  const cutoff = getCutoffDate(timeframe).getTime();
  const candidate = item?.updatedAt || item?.createdAt || null;
  if (!candidate) return true;
  return new Date(candidate).getTime() >= cutoff;
};

const filterByTimeframe = (items = [], timeframe = 30) =>
  items.filter((item) => isWithinTimeframe(item, timeframe));

const estimateCorrectCount = (pulls = 0, avgReward = 0) => {
  if (!pulls) return 0;
  return Math.max(0, Math.min(pulls, Math.round(avgReward * pulls)));
};

const estimateResponseTime = (avgReward = 0, baseMs = 1800) => {
  const normalized = Math.max(0, Math.min(1, avgReward));
  return Math.round(baseMs + (1 - normalized) * 2200);
};

const buildTrend = (items = []) => {
  if (!items.length) return null;
  const sorted = [...items].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );
  if (sorted.length < 2) {
    const accuracy = sorted[0]?.successRate ?? 0;
    return {
      direction: "stable",
      change: "0.0",
      previousAvg: accuracy.toFixed(1),
      recentAccuracy: accuracy.toFixed(1),
    };
  }

  const mid = Math.ceil(sorted.length / 2);
  const older = sorted.slice(0, mid);
  const recent = sorted.slice(mid);
  const olderAvg =
    older.reduce((sum, item) => sum + (item.successRate ?? 0), 0) / older.length;
  const recentAvg =
    recent.reduce((sum, item) => sum + (item.successRate ?? 0), 0) / recent.length;
  const delta = recentAvg - olderAvg;

  return {
    direction: Math.abs(delta) < 2 ? "stable" : delta > 0 ? "improving" : "declining",
    change: delta.toFixed(1),
    previousAvg: olderAvg.toFixed(1),
    recentAccuracy: recentAvg.toFixed(1),
  };
};

const aggregateWordMetrics = (items = []) => {
  const totalAttempts = items.reduce((sum, item) => sum + item.totalAttempts, 0);
  const correctAttempts = items.reduce((sum, item) => sum + item.correctCount, 0);
  const weightedTime = items.reduce(
    (sum, item) => sum + item.avgResponseTime * item.totalAttempts,
    0
  );
  const avgResponseTime = totalAttempts ? Math.round(weightedTime / totalAttempts) : 0;
  const successRate = totalAttempts
    ? Number(((correctAttempts / totalAttempts) * 100).toFixed(1))
    : 0;

  const problemWords = items
    .filter((item) => item.totalAttempts > item.correctCount)
    .map((item) => ({
      word: item.word,
      errorCount: item.totalAttempts - item.correctCount,
      errorRate: Number(
        (((item.totalAttempts - item.correctCount) / item.totalAttempts) * 100).toFixed(1)
      ),
    }))
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 8);

  const phonemeMap = new Map();
  items.forEach((item) => {
    const errorCount = item.totalAttempts - item.correctCount;
    if (errorCount <= 0) return;
    item.word.split("").forEach((char) => {
      const current = phonemeMap.get(char) || { letter: char, errorCount: 0, baseCount: 0 };
      current.errorCount += errorCount;
      current.baseCount += item.totalAttempts;
      phonemeMap.set(char, current);
    });
  });

  const problemLetters = Array.from(phonemeMap.values())
    .map((item) => ({
      letter: item.letter,
      errorCount: item.errorCount,
      errorRate: item.baseCount
        ? Number(((item.errorCount / item.baseCount) * 100).toFixed(1))
        : 0,
    }))
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 8);

  return {
    overview: {
      totalAttempts,
      correctAttempts,
      successRate,
      avgResponseTime,
    },
    allWords: items,
    problemWords,
    problemLetters,
    trend: buildTrend(items),
  };
};

const normalizeStudent = async (student) => {
  const [latestWord, latestSentence, latestTwoLetter, latestLetter] = await Promise.all([
    WordState.findOne({ studentId: student._id }).sort({ updatedAt: -1 }).select("updatedAt"),
    SentenceState.findOne({ studentId: student._id }).sort({ updatedAt: -1 }).select("updatedAt"),
    TwoLetterWordState.findOne({ studentId: student._id }).sort({ updatedAt: -1 }).select("updatedAt"),
    LetterState.findOne({ studentId: student._id }).sort({ updatedAt: -1 }).select("updatedAt"),
  ]);

  const lastActive = [latestWord, latestSentence, latestTwoLetter, latestLetter]
    .map((item) => item?.updatedAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  return {
    _id: student._id,
    name: student.name,
    email: student.email,
    createdAt: student.createdAt,
    age: null,
    lastActive: lastActive || null,
  };
};

export const getStudentDetail = async (studentId) => {
  const student = await User.findById(studentId).select("name email createdAt role");
  if (!student || student.role !== "student") {
    return null;
  }

  return normalizeStudent(student);
};

export const getStudentsForTeacher = async (teacherId) => {
  const links = await StudentTeacher.find({ teacherId })
    .populate("studentId", "name email role createdAt")
    .sort({ createdAt: -1 });

  const students = await Promise.all(
    links
      .filter((link) => link.studentId?.role === "student")
      .map(async (link) => ({
        ...(await normalizeStudent(link.studentId)),
        assignedDate: link.createdAt,
      }))
  );

  return students;
};

export const getStudentsForParent = async (parentId) => {
  const links = await ParentChild.find({ parentId })
    .populate("childId", "name email role createdAt")
    .sort({ createdAt: -1 });

  const students = await Promise.all(
    links
      .filter((link) => link.childId?.role === "student")
      .map(async (link) => ({
        ...(await normalizeStudent(link.childId)),
        assignedDate: link.createdAt,
      }))
  );

  return students;
};

export const getLetterReportData = async (studentId, timeframe = 30) => {
  const states = await LetterState.find({
    studentId,
    ...buildTimeFilter(timeframe),
  }).sort({ letter: 1 });

  // Filter to show only attempted letters (pulls > 0)
  const attemptedStates = states.filter((state) => state.pulls > 0);

  const letters = attemptedStates.map((state) => ({
    letter: state.letter,
    attempts: state.pulls,
    strength: toPercent(state.avgReward),
    totalReward: Number(state.totalReward.toFixed(2)),
    lastPracticedAt: state.updatedAt,
  }));

  return { letters };
};

export const getWordReportData = async (studentId, timeframe = 30) => {
  const [twoLetterStatesRaw, wordStatesRaw, corpus] = await Promise.all([
    TwoLetterWordState.find({ studentId }).sort({ updatedAt: -1, lastShownAt: -1 }),
    WordState.find({ studentId }).sort({ updatedAt: -1, lastShownAt: -1 }),
    getTrainingCorpusForStudent(studentId),
  ]);
  const twoLetterStates = filterByTimeframe(twoLetterStatesRaw, timeframe);
  const wordStates = filterByTimeframe(wordStatesRaw, timeframe);

  const twoLetterMap = new Map(TWO_LETTER_WORDS.map((item) => [item.id, item.text]));
  const wordMap = new Map(corpus.words.map((item) => [item.id, item.text]));

  const twoLetterItems = twoLetterStates
    .filter((state) => state.pulls > 0) // Filter: only attempted items
    .map((state) => {
      const correctCount = estimateCorrectCount(state.pulls, state.avgReward);
      return {
        word: twoLetterMap.get(state.twoLetterWordId) || state.twoLetterWordId,
        totalAttempts: state.pulls,
        correctCount,
        successRate: state.pulls ? Number(((correctCount / state.pulls) * 100).toFixed(1)) : 0,
        avgResponseTime: estimateResponseTime(state.avgReward, 1400),
        updatedAt: state.updatedAt,
      };
    });

  const wordItems = wordStates
    .filter((state) => state.pulls > 0) // Filter: only attempted items
    .map((state) => {
      const correctCount = estimateCorrectCount(state.pulls, state.avgReward);
      return {
        word: wordMap.get(state.wordId) || state.wordId.replace(/^.*-w-/, ""),
        totalAttempts: state.pulls,
        correctCount,
        successRate: state.pulls ? Number(((correctCount / state.pulls) * 100).toFixed(1)) : 0,
        avgResponseTime: estimateResponseTime(state.avgReward, 1800),
        updatedAt: state.updatedAt,
      };
    });

  const twoLetter = aggregateWordMetrics(twoLetterItems);
  const words = aggregateWordMetrics(wordItems);

  const combinedItems = [...twoLetterItems, ...wordItems];
  const combinedOverview = aggregateWordMetrics(combinedItems);

  return {
    twoLetter,
    words,
    combined: {
      totalAttempts: combinedOverview.overview.totalAttempts,
      correctAttempts: combinedOverview.overview.correctAttempts,
      successRate: combinedOverview.overview.successRate,
      avgResponseTime: combinedOverview.overview.avgResponseTime,
      trend: combinedOverview.trend,
    },
  };
};

export const getSentenceReportData = async (studentId, timeframe = 30) => {
  const [statesRaw, corpus] = await Promise.all([
    SentenceState.find({ studentId }).sort({ updatedAt: -1, lastShownAt: -1 }),
    getTrainingCorpusForStudent(studentId),
  ]);
  const states = filterByTimeframe(statesRaw, timeframe);

  const sentenceMap = new Map(corpus.sentences.map((item) => [item.id, item.text]));
  
  // Filter to show only attempted sentences (pulls > 0)
  const attemptedStates = states.filter((state) => state.pulls > 0);
  
  const attempts = attemptedStates.map((state) => {
    const accuracy = toPercent(Math.max(0, state.avgReward));

    // Get the most recent spoken attempt
    const lastAttempt = state.attempts && state.attempts.length > 0 
      ? state.attempts[state.attempts.length - 1]
      : null;

    const hasVisualScore = Number.isFinite(Number(lastAttempt?.visualScore));
    const eyeScore = hasVisualScore
      ? Number(Number(lastAttempt.visualScore).toFixed(2))
      : null;
    
    return {
      sentence: sentenceMap.get(state.sentenceId) || state.sentenceId.replace(/^.*-s-\d+/, "").trim() || state.sentenceId,
      spoken: lastAttempt?.spoken || "",
      correct: state.avgReward >= 0.7,
      accuracy,
      responseTime: lastAttempt?.responseTime || estimateResponseTime(state.avgReward, 2200),
      eyeScore,
      updatedAt: state.updatedAt,
    };
  });

  const total = attempts.length;
  const correctCount = attempts.filter((item) => item.correct).length;
  const successRate = total ? Number(((correctCount / total) * 100).toFixed(1)) : 0;
  const trackedAttempts = attempts.filter((item) => item.eyeScore !== null);
  const tracked = trackedAttempts.length;
  const avgVisualScore = tracked
    ? Number((trackedAttempts.reduce((sum, item) => sum + item.eyeScore, 0) / tracked).toFixed(2))
    : 0;
  const hardSessions = trackedAttempts.filter((item) => item.eyeScore >= 0.6).length;
  const hardRate = tracked ? Number(((hardSessions / tracked) * 100).toFixed(1)) : 0;
  const hesitationLevel =
    avgVisualScore >= 0.6 ? "High" : avgVisualScore >= 0.3 ? "Moderate" : "Low";

  return {
    attempts,
    successRate,
    eyeTracking: {
      tracked,
      avgVisualScore,
      hesitationLevel,
      hardSessions,
      hardRate,
    },
  };
};

export const getDashboardSummaryData = async (studentId, timeframe = 30) => {
  const [lettersRaw, wordsRaw, twoLetterWordsRaw, sentencesRaw] = await Promise.all([
    LetterState.find({ studentId, ...buildTimeFilter(timeframe) }),
    WordState.find({ studentId }),
    TwoLetterWordState.find({ studentId }),
    SentenceState.find({ studentId }),
  ]);
  const letters = lettersRaw;
  const words = filterByTimeframe(wordsRaw, timeframe);
  const twoLetterWords = filterByTimeframe(twoLetterWordsRaw, timeframe);
  const sentences = filterByTimeframe(sentencesRaw, timeframe);

  const wordAttempts = [...words, ...twoLetterWords];
  const wordPulls = wordAttempts.reduce((sum, item) => sum + item.pulls, 0);
  const wordCorrect = wordAttempts.reduce(
    (sum, item) => sum + estimateCorrectCount(item.pulls, item.avgReward),
    0
  );
  const sentencePulls = sentences.reduce((sum, item) => sum + item.pulls, 0);
  const sentenceCorrect = sentences.reduce(
    (sum, item) => sum + estimateCorrectCount(item.pulls, item.avgReward),
    0
  );
  const avgStrength = letters.length
    ? Number(
        (
          letters.reduce((sum, item) => sum + toPercent(item.avgReward), 0) / letters.length
        ).toFixed(1)
      )
    : 0;

  return {
    summary: {
      letters: {
        total: letters.reduce((sum, item) => sum + item.pulls, 0),
        avgStrength,
      },
      words: {
        total: wordPulls,
        successRate: wordPulls ? Number(((wordCorrect / wordPulls) * 100).toFixed(1)) : 0,
      },
      sentences: {
        total: sentencePulls,
        successRate: sentencePulls
          ? Number(((sentenceCorrect / sentencePulls) * 100).toFixed(1))
          : 0,
      },
    },
  };
};
