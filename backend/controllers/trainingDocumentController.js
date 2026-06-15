import TrainingDocument from "../models/TrainingDocument.js";
import StudentTrainingPreference from "../models/StudentTrainingPreference.js";
import StudentTeacher from "../models/StudentTeacher.js";
import ParentChild from "../models/ParentChild.js";
import {
  parseTrainingText,
  extractTextFromUploadedDocument,
  buildDocPreview,
  getVisibleTrainingDocumentsForStudent,
} from "../services/trainingContentService.js";

const parseIdList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // ignore and fallback to comma format
  }

  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

const resolveLinkedStudentIdsForOwner = async (ownerId, role) => {
  if (role === "teacher") {
    const links = await StudentTeacher.find({ teacherId: ownerId }).select("studentId");
    return new Set(links.map((link) => link.studentId.toString()));
  }

  if (role === "parent") {
    const links = await ParentChild.find({ parentId: ownerId }).select("childId");
    return new Set(links.map((link) => link.childId.toString()));
  }

  return new Set();
};

const formatDocForStudent = (doc, currentStudentId) => {
  const owner = doc.ownerId && typeof doc.ownerId === "object" ? doc.ownerId : null;
  const ownerRole = doc.ownerRole || owner?.role || "teacher";
  const ownerName = owner?.name || "Unknown";
  const ownerLabel =
    ownerRole === "teacher"
      ? "Shared by Therapist"
      : ownerRole === "parent"
      ? "Shared by Guardian"
      : "Uploaded by Student";

  const targetedIds = (doc.targetStudentIds?.length ? doc.targetStudentIds : doc.assignedStudentIds || []).map(String);
  const isExplicitTarget = targetedIds.includes(String(currentStudentId));

  return {
    _id: doc._id,
    title: doc.title,
    ownerRole,
    ownerName,
    ownerEmail: owner?.email || "",
    ownerLabel,
    previewText: doc.previewText || buildDocPreview(doc.rawText),
    extractedWordCount: doc.extractedWordCount || 0,
    extractedSentenceCount: doc.extractedSentenceCount || 0,
    shareMode: doc.shareMode,
    targetType: doc.targetType || (doc.shareMode === "selected" ? "individual" : doc.shareMode === "all-linked" ? "group" : "private"),
    sharedWithAll: Boolean(doc.sharedWithAll ?? doc.shareMode === "all-linked"),
    targetStudentIds: targetedIds,
    createdAt: doc.createdAt,
    visibleReason:
      ownerRole === "student"
        ? "Your own upload"
        : isExplicitTarget
        ? "Shared directly with you"
        : "Shared with all linked students",
  };
};

export const uploadTrainingDocument = async (req, res) => {
  try {
    const file = req.file;
    const { title, shareMode } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: "Document file is required" });
    }

    const rawText = await extractTextFromUploadedDocument(file);
    if (!rawText || rawText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Uploaded document does not contain usable text",
      });
    }

    const role = req.user.role;
    if (!["student", "teacher", "parent"].includes(role)) {
      return res.status(403).json({ success: false, message: "Only students, therapists, or guardians can upload" });
    }

    let finalShareMode = "private";
    let targetType = "private";
    let sharedWithAll = false;
    let assignedStudentIds = [];

    if (role === "teacher") {
      finalShareMode = shareMode === "selected" ? "selected" : "all-linked";
      targetType = finalShareMode === "selected" ? "individual" : "group";
      sharedWithAll = finalShareMode === "all-linked";

      if (finalShareMode === "selected") {
        const selectedIds = parseIdList(req.body.studentIds);
        const links = await StudentTeacher.find({ teacherId: req.user._id }).select("studentId");
        const myStudentIds = new Set(links.map((l) => l.studentId.toString()));
        assignedStudentIds = selectedIds.filter((id) => myStudentIds.has(String(id)));

        if (assignedStudentIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Choose at least one linked student for individual sharing",
          });
        }
      }
    }

    if (role === "parent") {
      finalShareMode = shareMode === "selected" ? "selected" : "all-linked";
      targetType = finalShareMode === "selected" ? "individual" : "group";
      sharedWithAll = finalShareMode === "all-linked";

      if (finalShareMode === "selected") {
        const selectedIds = parseIdList(req.body.childIds);
        const links = await ParentChild.find({ parentId: req.user._id }).select("childId");
        const myChildIds = new Set(links.map((l) => l.childId.toString()));
        assignedStudentIds = selectedIds.filter((id) => myChildIds.has(String(id)));

        if (assignedStudentIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Choose at least one linked child for individual sharing",
          });
        }
      }
    }

    const parsed = parseTrainingText(rawText, "upload-preview");
    const finalTitle = (title || file.originalname || "Training Document").slice(0, 140);

    const duplicateDoc = await TrainingDocument.findOne({
      ownerId: req.user._id,
      title: finalTitle,
      rawText,
      isEnabledForTraining: true,
    }).select("_id title createdAt");

    if (duplicateDoc) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "This document was already uploaded by you. Existing copy kept.",
        document: duplicateDoc,
        extracted: {
          words: parsed.words.length,
          sentences: parsed.sentences.length,
        },
      });
    }

    const savedDoc = await TrainingDocument.create({
      ownerId: req.user._id,
      ownerRole: role,
      title: finalTitle,
      previewText: buildDocPreview(rawText),
      rawText,
      extractedWordCount: parsed.words.length,
      extractedSentenceCount: parsed.sentences.length,
      shareMode: finalShareMode,
      targetType,
      sharedWithAll,
      assignedStudentIds,
      targetStudentIds: assignedStudentIds,
      isEnabledForTraining: true,
    });

    return res.status(201).json({
      success: true,
      document: {
        id: savedDoc._id,
        title: savedDoc.title,
        ownerRole: savedDoc.ownerRole,
        previewText: savedDoc.previewText,
        shareMode: savedDoc.shareMode,
        targetType: savedDoc.targetType,
        sharedWithAll: savedDoc.sharedWithAll,
        assignedStudentIds: savedDoc.assignedStudentIds,
        targetStudentIds: savedDoc.targetStudentIds,
        createdAt: savedDoc.createdAt,
        isEnabledForTraining: savedDoc.isEnabledForTraining,
        extractedWordCount: savedDoc.extractedWordCount,
        extractedSentenceCount: savedDoc.extractedSentenceCount,
      },
      extracted: {
        words: parsed.words.length,
        sentences: parsed.sentences.length,
      },
    });
  } catch (error) {
    console.error("uploadTrainingDocument error:", error);
    if (
      error.message === "Unsupported file type" ||
      error.message?.toLowerCase().includes("pdf") ||
      error.message?.toLowerCase().includes("docx")
    ) {
      return res.status(400).json({
        success: false,
        message: "Could not parse this file. Please upload a valid PDF, DOCX, or TXT document.",
      });
    }

    return res.status(500).json({ success: false, message: "Failed to upload document" });
  }
};

export const getMyTrainingDocuments = async (req, res) => {
  try {
    if (!["student", "teacher", "parent"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const docs = await TrainingDocument.find({ ownerId: req.user._id })
      .sort({ createdAt: -1 })
      .select(
        "title ownerRole previewText extractedWordCount extractedSentenceCount shareMode targetType sharedWithAll assignedStudentIds targetStudentIds isEnabledForTraining createdAt"
      );

    return res.json({ success: true, documents: docs });
  } catch (error) {
    console.error("getMyTrainingDocuments error:", error);
    return res.status(500).json({ success: false, message: "Failed to load documents" });
  }
};

export const updateTrainingDocumentSharing = async (req, res) => {
  try {
    if (!["teacher", "parent", "student"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const doc = await TrainingDocument.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (req.user.role === "student") {
      doc.shareMode = "private";
      doc.targetType = "private";
      doc.sharedWithAll = false;
      doc.assignedStudentIds = [];
      doc.targetStudentIds = [];
      await doc.save();

      return res.json({ success: true, document: doc, message: "Student documents stay private." });
    }

    const { shareMode } = req.body;
    const requestedIds = parseIdList(
      req.user.role === "teacher" ? req.body.studentIds : req.body.childIds
    );
    const linkedIds = await resolveLinkedStudentIdsForOwner(req.user._id, req.user.role);

    let nextAssignedIds = [];
    let nextShareMode = shareMode === "selected" ? "selected" : "all-linked";
    let nextTargetType = nextShareMode === "selected" ? "individual" : "group";
    let nextSharedWithAll = nextShareMode === "all-linked";

    if (nextShareMode === "selected") {
      nextAssignedIds = requestedIds.filter((id) => linkedIds.has(String(id)));
      if (nextAssignedIds.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            req.user.role === "teacher"
              ? "Choose at least one linked student for this document."
              : "Choose at least one linked child for this document.",
        });
      }
    }

    doc.shareMode = nextShareMode;
    doc.targetType = nextTargetType;
    doc.sharedWithAll = nextSharedWithAll;
    doc.assignedStudentIds = nextAssignedIds;
    doc.targetStudentIds = nextAssignedIds;
    await doc.save();

    return res.json({
      success: true,
      document: doc,
      message:
        nextShareMode === "all-linked"
          ? "Document now applies to all linked learners."
          : "Document targets were updated.",
    });
  } catch (error) {
    console.error("updateTrainingDocumentSharing error:", error);
    return res.status(500).json({ success: false, message: "Failed to update document sharing" });
  }
};

export const getVisibleTrainingDocuments = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Only students can view training selections" });
    }

    const [documents, preference] = await Promise.all([
      getVisibleTrainingDocumentsForStudent(req.user._id),
      StudentTrainingPreference.findOne({ studentId: req.user._id }).select("mode selectedDocumentIds"),
    ]);

    return res.json({
      success: true,
      documents: documents.map((doc) => formatDocForStudent(doc, req.user._id)),
      selection: {
        mode: preference?.mode || "all",
        selectedDocumentIds: preference?.selectedDocumentIds || [],
      },
    });
  } catch (error) {
    console.error("getVisibleTrainingDocuments error:", error);
    return res.status(500).json({ success: false, message: "Failed to load visible documents" });
  }
};

export const updateTrainingSelection = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Only students can update training selections" });
    }

    const { mode, selectedDocumentIds = [] } = req.body;
    if (!["all", "selected"].includes(mode)) {
      return res.status(400).json({ success: false, message: "Mode must be 'all' or 'selected'" });
    }

    const visibleDocs = await getVisibleTrainingDocumentsForStudent(req.user._id);
    const visibleIds = new Set(visibleDocs.map((doc) => doc._id.toString()));
    const validSelectedIds = Array.isArray(selectedDocumentIds)
      ? selectedDocumentIds.filter((id) => visibleIds.has(String(id)))
      : [];

    const preference = await StudentTrainingPreference.findOneAndUpdate(
      { studentId: req.user._id },
      {
        mode,
        selectedDocumentIds: mode === "selected" ? validSelectedIds : [],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      selection: {
        mode: preference.mode,
        selectedDocumentIds: preference.selectedDocumentIds,
      },
      message:
        mode === "all"
          ? "Training will now use all visible documents."
          : "Training will now use only the selected documents.",
    });
  } catch (error) {
    console.error("updateTrainingSelection error:", error);
    return res.status(500).json({ success: false, message: "Failed to update training selection" });
  }
};
