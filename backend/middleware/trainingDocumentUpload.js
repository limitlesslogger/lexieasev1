import multer from "multer";
import {
  MAX_TRAINING_DOC_SIZE_BYTES,
  ALLOWED_TRAINING_DOC_EXTENSIONS,
} from "../services/trainingContentService.js";

const storage = multer.memoryStorage();

const extensionFromName = (name = "") => {
  const idx = name.lastIndexOf(".");
  if (idx === -1) return "";
  return name.slice(idx).toLowerCase();
};

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const docUpload = multer({
  storage,
  limits: { fileSize: MAX_TRAINING_DOC_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    const ext = extensionFromName(file.originalname || "");
    const isAllowedExt = ALLOWED_TRAINING_DOC_EXTENSIONS.includes(ext);
    const isAllowedMime = allowedMimeTypes.has(file.mimetype);

    if (isAllowedExt || isAllowedMime) {
      return cb(null, true);
    }

    return cb(new Error("Only PDF, DOCX, and TXT files are supported"));
  },
});

export const uploadTrainingDocumentFile = (req, res, next) => {
  docUpload.single("document")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Document exceeds size limit. Maximum allowed size is 5 MB.",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "Invalid document upload",
    });
  });
};
