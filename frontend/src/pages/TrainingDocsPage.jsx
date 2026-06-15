import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

const MAX_DOC_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_DOC_SIZE_MB = 5;
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

const getExtension = (filename = "") => {
  const idx = filename.lastIndexOf(".");
  if (idx === -1) return "";
  return filename.slice(idx).toLowerCase();
};

export default function TrainingDocsPage({ role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [docs, setDocs] = useState([]);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [relations, setRelations] = useState([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [shareMode, setShareMode] = useState("all-linked");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionMode, setSelectionMode] = useState("all");
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingSelection, setSavingSelection] = useState(false);
  const [refreshingRelations, setRefreshingRelations] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [docShareMode, setDocShareMode] = useState({});
  const [docSelectedIds, setDocSelectedIds] = useState({});

  const isTeacher = role === "teacher";
  const isParent = role === "parent";
  const isStudent = role === "student";
  const relationField = isTeacher ? "studentIds" : "childIds";
  const relationLabel = isTeacher ? "students" : "children";

  const headerText = useMemo(() => {
    if (isStudent) return "Upload your own training document";
    if (isTeacher) return "Upload a document for your students";
    return "Upload a document for your child";
  }, [isStudent, isTeacher]);

  const groupedAvailableDocs = useMemo(
    () =>
      Object.values(
        availableDocs.reduce((acc, doc) => {
          const key = `${doc.ownerRole}:${doc.ownerName || "Unknown"}`;
          if (!acc[key]) {
            acc[key] = {
              key,
              label: doc.ownerLabel || `Shared by ${doc.ownerRole}`,
              ownerName: doc.ownerName || "Unknown",
              documents: [],
            };
          }
          acc[key].documents.push(doc);
          return acc;
        }, {})
      ),
    [availableDocs]
  );

  const loadMine = async () => {
    const res = await apiFetch("/api/training-documents/mine");
    const documents = res.documents || [];
    setDocs(documents);
    setDocShareMode((prev) => {
      const next = { ...prev };
      documents.forEach((doc) => {
        next[doc._id] = doc.shareMode;
      });
      return next;
    });
    setDocSelectedIds((prev) => {
      const next = { ...prev };
      documents.forEach((doc) => {
        next[doc._id] = (doc.targetStudentIds || doc.assignedStudentIds || []).map(String);
      });
      return next;
    });
  };

  const loadAvailable = async () => {
    if (!isStudent) return;
    const res = await apiFetch("/api/training-documents/available");
    setAvailableDocs(res.documents || []);
    setSelectionMode(res.selection?.mode || "all");
    setSelectedDocIds((res.selection?.selectedDocumentIds || []).map(String));
  };

  const loadRelations = async () => {
    if (isTeacher) {
      const list = await apiFetch("/api/relationships/my-students");
      setRelations(list || []);
      return list || [];
    }

    if (isParent) {
      const list = await apiFetch("/api/relationships/my-children");
      setRelations(list || []);
      return list || [];
    }

    return [];
  };

  useEffect(() => {
    loadMine();
    loadRelations();
    loadAvailable();
  }, [role, location.pathname]);

  useEffect(() => {
    const refreshOnFocus = () => {
      loadRelations();
      loadMine();
    };

    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [role]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleDocSelection = (id) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleDocTarget = (docId, targetId) => {
    setDocSelectedIds((prev) => {
      const current = prev[docId] || [];
      return {
        ...prev,
        [docId]: current.includes(targetId)
          ? current.filter((id) => id !== targetId)
          : [...current, targetId],
      };
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!file) {
      setError("Please choose a document file.");
      return;
    }

    const ext = getExtension(file.name || "");
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError("Only PDF, DOCX, and TXT files are supported.");
      return;
    }

    if (file.size > MAX_DOC_SIZE_BYTES) {
      setError(`File is too large. Maximum allowed size is ${MAX_DOC_SIZE_MB} MB.`);
      return;
    }

    try {
      setLoading(true);
      const form = new FormData();
      form.append("document", file);
      if (title.trim()) form.append("title", title.trim());

      if (!isStudent) {
        form.append("shareMode", shareMode);
        if (shareMode === "selected") {
          form.append(relationField, JSON.stringify(selectedIds));
        }
      }

      const res = await apiFetch("/api/training-documents/upload", {
        method: "POST",
        body: form,
      });

      setMessage(
        res.duplicate
          ? res.message || "This document is already uploaded."
          : `Uploaded. Extracted ${res.extracted.words} words and ${res.extracted.sentences} sentences.`
      );
      setTitle("");
      setFile(null);
      setSelectedIds([]);
      await loadMine();
      await loadAvailable();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSelection = async () => {
    setError("");
    setMessage("");

    try {
      setSavingSelection(true);
      const res = await apiFetch("/api/training-documents/selection", {
        method: "POST",
        body: JSON.stringify({
          mode: selectionMode,
          selectedDocumentIds: selectedDocIds,
        }),
      });

      setMessage(res.message || "Training selection saved.");
      await loadAvailable();
    } catch (err) {
      setError(err.message || "Failed to save training selection");
    } finally {
      setSavingSelection(false);
    }
  };

  const handleUpdateDocSharing = async (docId) => {
    try {
      setError("");
      setMessage("");

      const shareModeForDoc = docShareMode[docId] || "all-linked";
      const targetIds = docSelectedIds[docId] || [];

      if (shareModeForDoc === "selected" && targetIds.length === 0) {
        setError(
          isTeacher
            ? "Choose at least one linked student for this document."
            : "Choose at least one linked child for this document."
        );
        return;
      }

      const payload = {
        shareMode: shareModeForDoc,
      };
      payload[relationField] = targetIds;

      const res = await apiFetch(`/api/training-documents/${docId}/sharing`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setMessage(res.message || "Document sharing updated.");
      setEditingDocId(null);
      await loadMine();
    } catch (err) {
      setError(err.message || "Failed to update document sharing");
    }
  };

  const handleRefreshRelations = async () => {
    try {
      setRefreshingRelations(true);
      setError("");
      const [linkedList] = await Promise.all([loadRelations(), loadMine()]);
      setMessage(
        `Linked ${relationLabel} refreshed. ${linkedList.length} currently available.`
      );
    } catch (err) {
      setError(err.message || `Failed to refresh linked ${relationLabel}`);
    } finally {
      setRefreshingRelations(false);
    }
  };

  return (
    <div style={styles.page}>
      {isStudent && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Training Selection</h2>
          <p style={styles.subtitle}>
            Choose whether your word and sentence practice should use every visible document or only specific ones.
          </p>

          <div style={styles.modeRow}>
            <label style={styles.radioRow}>
              <input
                type="radio"
                name="selection-mode"
                checked={selectionMode === "all"}
                onChange={() => setSelectionMode("all")}
              />
              <span>Use all visible docs</span>
            </label>
            <label style={styles.radioRow}>
              <input
                type="radio"
                name="selection-mode"
                checked={selectionMode === "selected"}
                onChange={() => setSelectionMode("selected")}
              />
              <span>Use only selected docs</span>
            </label>
          </div>

          {availableDocs.length === 0 ? (
            <p style={styles.empty}>No visible documents yet. Upload one or wait for a therapist or guardian to share one.</p>
          ) : (
            <div style={styles.groupList}>
              {groupedAvailableDocs.map((group) => (
                <section key={group.key} style={styles.groupBlock}>
                  <div style={styles.groupHeader}>
                    <strong>{group.label}</strong>
                    <span style={styles.groupMeta}>{group.ownerName}</span>
                  </div>
                  <div style={styles.previewGrid}>
                    {group.documents.map((doc) => (
                      <div key={doc._id} style={styles.previewCard}>
                        <label style={styles.previewHeader}>
                          <input
                            type="checkbox"
                            checked={
                              selectionMode === "all" || selectedDocIds.includes(doc._id)
                            }
                            disabled={selectionMode === "all"}
                            onChange={() => toggleDocSelection(doc._id)}
                          />
                          <div>
                            <strong>{doc.title}</strong>
                            <div style={styles.meta}>
                              {doc.visibleReason} | {doc.extractedWordCount} words | {doc.extractedSentenceCount} sentences
                            </div>
                            <div style={styles.meta}>{new Date(doc.createdAt).toLocaleString()}</div>
                          </div>
                        </label>
                        <p style={styles.previewText}>{doc.previewText || "Preview unavailable."}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <button
            type="button"
            style={styles.button}
            disabled={savingSelection || availableDocs.length === 0}
            onClick={handleSaveSelection}
          >
            {savingSelection ? "Saving..." : "Save Training Selection"}
          </button>
        </div>
      )}

      <div style={styles.card}>
        <h1 style={styles.title}>{headerText}</h1>
        <p style={styles.subtitle}>
          Uploaded text is mapped into words and sentences for meaningful MAB-based training.
        </p>
        <p style={styles.rules}>
          Allowed formats: PDF, DOCX, TXT. Maximum size: {MAX_DOC_SIZE_MB} MB.
        </p>
        {!isStudent && (
          <div style={styles.inlineActions}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() =>
                navigate(isTeacher ? "/teacher/manage-students" : "/parent/manage-children")
              }
            >
              {isTeacher ? "Manage Students" : "Manage Children"}
            </button>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() =>
                navigate(isTeacher ? "/teacher/change-password" : "/parent/change-password")
              }
            >
              Change Password
            </button>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={handleRefreshRelations}
              disabled={refreshingRelations}
            >
              {refreshingRelations
                ? "Refreshing..."
                : `Refresh Linked ${relationLabel[0].toUpperCase() + relationLabel.slice(1)}`}
            </button>
          </div>
        )}

        <form onSubmit={handleUpload} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Document title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="file"
            onChange={(e) => {
              const picked = e.target.files?.[0] || null;
              setFile(picked);
              setError("");
              if (!picked) return;

              const ext = getExtension(picked.name || "");
              if (!ALLOWED_EXTENSIONS.includes(ext)) {
                setError("Only PDF, DOCX, and TXT files can be selected.");
                return;
              }

              if (picked.size > MAX_DOC_SIZE_BYTES) {
                setError(`Selected file is too large. Limit is ${MAX_DOC_SIZE_MB} MB.`);
              }
            }}
            style={styles.input}
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          />

          {!isStudent && (
            <>
              <select
                style={styles.input}
                value={shareMode}
                onChange={(e) => setShareMode(e.target.value)}
              >
                <option value="all-linked">Use for all linked {relationLabel}</option>
                <option value="selected">Use for selected {relationLabel}</option>
              </select>

              <div style={styles.meta}>
                Linked {relationLabel}: {relations.length}
              </div>

              {shareMode === "selected" && relations.length > 0 && (
                <div style={styles.selectionBox}>
                  {relations.map((person) => (
                    <label key={person._id} style={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(person._id)}
                        onChange={() => toggleSelect(person._id)}
                      />
                      <span>{person.name} ({person.email})</span>
                    </label>
                  ))}
                </div>
              )}

              {shareMode === "selected" && relations.length === 0 && (
                <div style={styles.emptyStateBox}>
                  <p style={styles.emptyStateText}>
                    No linked {relationLabel} are available to select yet.
                  </p>
                  <div style={styles.inlineActions}>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() =>
                        navigate(isTeacher ? "/teacher/manage-students" : "/parent/manage-children")
                      }
                    >
                      {isTeacher ? "Add Or Link Students" : "Add Or Link Children"}
                    </button>
                    <button type="button" style={styles.secondaryButton} onClick={loadRelations}>
                      Reload
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Uploading..." : "Upload Document"}
          </button>
        </form>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </div>

      {isStudent && availableDocs.length > 0 && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Accessible Documents</h2>
          <p style={styles.subtitle}>
            These documents are visible to you based on your own uploads and active therapist or guardian sharing.
          </p>
          <div style={styles.list}>
            {availableDocs.map((doc) => (
              <div key={`visible-${doc._id}`} style={styles.listItem}>
                <div>
                  <strong>{doc.title}</strong>
                  <div style={styles.meta}>
                    {doc.ownerLabel}: {doc.ownerName} | {doc.visibleReason}
                  </div>
                  <div style={styles.meta}>
                    {doc.extractedWordCount || 0} words | {doc.extractedSentenceCount || 0} sentences | {new Date(doc.createdAt).toLocaleString()}
                  </div>
                  <p style={styles.previewText}>{doc.previewText || "Preview unavailable."}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>My Uploaded Documents</h2>
        {docs.length === 0 ? (
          <p style={styles.empty}>No documents uploaded yet.</p>
        ) : (
          <div style={styles.list}>
            {docs.map((doc) => (
              <div key={doc._id} style={styles.listItem}>
                <div>
                  <strong>{doc.title}</strong>
                  <div style={styles.meta}>
                    share: {doc.targetType || doc.shareMode}
                    {doc.sharedWithAll ? " (all linked)" : ""}
                    {" | "}
                    {doc.extractedWordCount || 0} words | {doc.extractedSentenceCount || 0} sentences | {new Date(doc.createdAt).toLocaleString()}
                  </div>
                  {!doc.sharedWithAll && doc.targetStudentIds?.length > 0 && (
                    <div style={styles.meta}>Targets: {doc.targetStudentIds.length} student(s)</div>
                  )}
                  <p style={styles.previewText}>{doc.previewText || "Preview unavailable."}</p>
                  {!isStudent && (
                    <div style={styles.inlineActions}>
                      <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={() =>
                          setEditingDocId((prev) => (prev === doc._id ? null : doc._id))
                        }
                      >
                        {editingDocId === doc._id ? "Close Sharing" : "Edit Sharing"}
                      </button>
                    </div>
                  )}
                  {!isStudent && editingDocId === doc._id && (
                    <div style={styles.docEditBox}>
                      <select
                        style={styles.input}
                        value={docShareMode[doc._id] || doc.shareMode}
                        onChange={(event) =>
                          setDocShareMode((prev) => ({
                            ...prev,
                            [doc._id]: event.target.value,
                          }))
                        }
                      >
                        <option value="all-linked">Use for all linked {relationLabel}</option>
                        <option value="selected">Use for selected {relationLabel}</option>
                      </select>

                      {(docShareMode[doc._id] || doc.shareMode) === "selected" && (
                        <>
                          {relations.length > 0 ? (
                            <div style={styles.selectionBox}>
                              {relations.map((person) => (
                                <label key={`${doc._id}-${person._id}`} style={styles.checkboxRow}>
                                  <input
                                    type="checkbox"
                                    checked={(docSelectedIds[doc._id] || []).includes(person._id)}
                                    onChange={() => toggleDocTarget(doc._id, person._id)}
                                  />
                                  <span>{person.name} ({person.email})</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <p style={styles.empty}>No linked {relationLabel} available.</p>
                          )}
                        </>
                      )}

                      <div style={styles.inlineActions}>
                        <button
                          type="button"
                          style={styles.button}
                          onClick={() => handleUpdateDocSharing(doc._id)}
                        >
                          Save Sharing
                        </button>
                        <button
                          type="button"
                          style={styles.secondaryButton}
                          onClick={() => {
                            setDocShareMode((prev) => ({ ...prev, [doc._id]: doc.shareMode }));
                            setDocSelectedIds((prev) => ({
                              ...prev,
                              [doc._id]: (doc.targetStudentIds || doc.assignedStudentIds || []).map(String),
                            }));
                            setEditingDocId(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "28px",
    background: "#f8fafc",
    display: "grid",
    gap: 20,
  },
  card: {
    background: "white",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    border: "1px solid #e2e8f0",
  },
  topBar: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  title: { margin: 0, fontSize: 28, color: "#0f172a" },
  subtitle: { marginTop: 8, color: "#64748b" },
  rules: { marginTop: 8, color: "#334155", fontSize: 13 },
  form: { marginTop: 16, display: "grid", gap: 12 },
  inlineActions: {
    marginTop: 12,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    background: "white",
  },
  modeRow: {
    display: "flex",
    gap: 18,
    flexWrap: "wrap",
    marginTop: 16,
    marginBottom: 16,
  },
  radioRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    color: "#334155",
  },
  selectionBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 12,
    maxHeight: 180,
    overflow: "auto",
  },
  emptyStateBox: {
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    padding: 14,
    background: "#f8fafc",
  },
  emptyStateText: {
    margin: 0,
    color: "#475569",
  },
  checkboxRow: {
    display: "flex",
    gap: 8,
    marginBottom: 8,
    color: "#334155",
    fontSize: 14,
  },
  button: {
    border: "none",
    borderRadius: 10,
    background: "#1d4ed8",
    color: "white",
    padding: "11px 14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    background: "#fff",
    color: "#0f172a",
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  logoutButton: {
    border: "none",
    borderRadius: 10,
    background: "#fee2e2",
    color: "#991b1b",
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  success: { color: "#166534", marginTop: 10 },
  error: { color: "#991b1b", marginTop: 10 },
  sectionTitle: { margin: 0, fontSize: 20, color: "#0f172a" },
  empty: { color: "#64748b", marginTop: 10 },
  list: { marginTop: 14, display: "grid", gap: 10 },
  previewGrid: {
    marginTop: 14,
    marginBottom: 16,
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  },
  groupList: {
    marginTop: 14,
    marginBottom: 16,
    display: "grid",
    gap: 18,
  },
  groupBlock: {
    display: "grid",
    gap: 10,
  },
  groupHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "baseline",
    color: "#0f172a",
  },
  groupMeta: {
    color: "#64748b",
    fontSize: 13,
  },
  docEditBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #dbeafe",
    background: "#f8fbff",
    display: "grid",
    gap: 10,
  },
  previewCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 14,
    background: "#f8fafc",
  },
  previewHeader: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    color: "#0f172a",
  },
  previewText: {
    marginTop: 10,
    marginBottom: 0,
    color: "#475569",
    fontSize: 14,
    lineHeight: 1.5,
  },
  listItem: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: 12,
    background: "#f8fafc",
  },
  meta: { color: "#64748b", marginTop: 4, fontSize: 13 },
};
