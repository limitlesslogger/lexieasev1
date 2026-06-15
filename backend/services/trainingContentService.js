import TrainingDocument from "../models/TrainingDocument.js";
import StudentTeacher from "../models/StudentTeacher.js";
import ParentChild from "../models/ParentChild.js";
import StudentTrainingPreference from "../models/StudentTrainingPreference.js";
import { WORDS } from "../data/words.js";
import { SENTENCES } from "../data/sentences.js";

export const MAX_TRAINING_DOC_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_TRAINING_DOC_EXTENSIONS = [".pdf", ".docx", ".txt"];
export const REVOKE_SHARED_ACCESS_WHEN_RELATIONSHIP_REMOVED = true;

const normalizeText = (value = "") =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();

export const buildDocPreview = (rawText = "", limit = 220) => {
  const normalized = normalizeText(rawText);
  if (!normalized) return "";
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trim()}...`;
};

const toSentenceChunks = (text = "") => {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  return normalized
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 3);
};

const toWords = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && w.length <= 20);
};

export const parseTrainingText = (rawText = "", sourcePrefix = "doc") => {
  const sentences = toSentenceChunks(rawText);
  const wordMap = new Map();
  const sentenceItems = [];

  sentences.forEach((sentence, sentenceIndex) => {
    const sentenceId = `${sourcePrefix}-s-${sentenceIndex + 1}`;
    const sentenceWords = toWords(sentence);
    const focusWords = [...new Set(sentenceWords)].slice(0, 5);

    sentenceItems.push({
      id: sentenceId,
      text: sentence,
      focusWords,
    });

    sentenceWords.forEach((word) => {
      if (wordMap.has(word)) return;
      wordMap.set(word, {
        id: `${sourcePrefix}-w-${word}`,
        text: word,
        sourceSentence: sentence,
      });
    });
  });

  return {
    words: Array.from(wordMap.values()),
    sentences: sentenceItems,
  };
};

const mapDocsToDataset = (docs = []) => {
  const words = [];
  const sentences = [];

  docs.forEach((doc) => {
    const sourcePrefix = `doc-${doc._id.toString()}`;
    const parsed = parseTrainingText(doc.rawText, sourcePrefix);

    parsed.words.forEach((w) => {
      words.push({
        ...w,
        sourceDocId: doc._id.toString(),
        sourceDocTitle: doc.title,
      });
    });

    parsed.sentences.forEach((s) => {
      sentences.push({
        ...s,
        sourceDocId: doc._id.toString(),
        sourceDocTitle: doc.title,
      });
    });
  });

  return { words, sentences };
};

const dedupeWords = (words = []) => {
  const seen = new Set();
  const deduped = [];

  words.forEach((item) => {
    const key = item.text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });

  return deduped;
};

export const getVisibleTrainingDocumentsForStudent = async (studentId) => {
  const [teacherLinks, parentLinks] = await Promise.all([
    StudentTeacher.find({ studentId }).select("teacherId"),
    ParentChild.find({ childId: studentId }).select("parentId"),
  ]);

  const teacherIds = teacherLinks.map((l) => l.teacherId);
  const parentIds = parentLinks.map((l) => l.parentId);

  const baseQuery = {
    isEnabledForTraining: true,
    $or: [
      { ownerRole: "student", ownerId: studentId, shareMode: "private" },
      {
        ownerRole: "teacher",
        ownerId: { $in: teacherIds },
        shareMode: "all-linked",
      },
      {
        ownerRole: "teacher",
        assignedStudentIds: studentId,
        shareMode: "selected",
      },
      {
        ownerRole: "parent",
        ownerId: { $in: parentIds },
        shareMode: "all-linked",
      },
      {
        ownerRole: "parent",
        assignedStudentIds: studentId,
        shareMode: "selected",
      },
    ],
  };

  return TrainingDocument.find(baseQuery)
    .sort({ createdAt: -1 })
    .select(
      "title ownerId ownerRole previewText extractedWordCount extractedSentenceCount shareMode targetType sharedWithAll assignedStudentIds targetStudentIds createdAt rawText"
    )
    .populate("ownerId", "name email role");
};

export const getTrainingCorpusForStudent = async (studentId) => {
  const [visibleDocs, preference] = await Promise.all([
    getVisibleTrainingDocumentsForStudent(studentId),
    StudentTrainingPreference.findOne({ studentId }).select("mode selectedDocumentIds"),
  ]);

  const visibleDocIdSet = new Set(visibleDocs.map((doc) => doc._id.toString()));

  const docs =
    preference?.mode === "selected"
      ? visibleDocs.filter((doc) =>
          preference.selectedDocumentIds.some(
            (selectedId) => selectedId.toString() === doc._id.toString()
          )
        )
      : visibleDocs;

  const dataset = mapDocsToDataset(docs);
  const words = dedupeWords(dataset.words);
  const sentences = dataset.sentences;

  const hasCustomTrainingData = words.length > 0 && sentences.length > 0;

  return {
    words: hasCustomTrainingData ? words : WORDS,
    sentences: hasCustomTrainingData ? sentences : SENTENCES,
    hasCustomTrainingData,
    source: hasCustomTrainingData ? "uploaded-documents" : "fallback-hardcoded",
    activeDocumentIds:
      preference?.mode === "selected"
        ? preference.selectedDocumentIds
            .map((id) => id.toString())
            .filter((id) => visibleDocIdSet.has(id))
        : visibleDocs.map((doc) => doc._id.toString()),
    documentSelectionMode: preference?.mode || "all",
  };
};

const getExtension = (filename = "") => {
  const idx = filename.lastIndexOf(".");
  if (idx === -1) return "";
  return filename.slice(idx).toLowerCase();
};

export const extractTextFromUploadedDocument = async (file) => {
  if (!file?.buffer) return "";

  const extension = getExtension(file.originalname);

  if (extension === ".txt") {
    return file.buffer.toString("utf8");
  }

  if (extension === ".pdf") {
    const pdfModule = await import("pdf-parse");
    const pdfParse = pdfModule.default || pdfModule;
    const parsed = await pdfParse(file.buffer);
    return parsed?.text || "";
  }

  if (extension === ".docx") {
    const mammothModule = await import("mammoth");
    const mammoth = mammothModule.default || mammothModule;
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return parsed?.value || "";
  }

  throw new Error("Unsupported file type");
};
