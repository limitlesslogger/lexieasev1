import { useEffect, useRef, useState } from "react";
import { brushColors } from "./useReadingPreferences";

export default function FloatingBrushTool({
  visible,
  brushState,
  onUpdate,
  onClear,
  onClose,
}) {
  const [position, setPosition] = useState({ x: 24, y: 120 });
  const [dragging, setDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!visible) return undefined;

    const stopDrag = () => setDragging(false);
    window.addEventListener("pointerup", stopDrag);
    return () => window.removeEventListener("pointerup", stopDrag);
  }, [visible]);

  useEffect(() => {
    if (!dragging) return undefined;

    const move = (event) => {
      setPosition({
        x: Math.max(12, event.clientX - dragOffsetRef.current.x),
        y: Math.max(84, event.clientY - dragOffsetRef.current.y),
      });
    };

    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [dragging]);

  if (!visible) return null;

  return (
    <section
      style={{
        ...styles.shell,
        left: position.x,
        top: position.y,
      }}
    >
      <button
        type="button"
        style={styles.dragHandle}
        onPointerDown={(event) => {
          dragOffsetRef.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y,
          };
          setDragging(true);
        }}
      >
        Brush Tool
      </button>

      <button type="button" style={styles.closeBtn} onClick={onClose}>
        x
      </button>

      <div style={styles.row}>
        <button
          type="button"
          style={{
            ...styles.modeBtn,
            ...(brushState.mode === "paint" ? styles.modeBtnActive : {}),
          }}
          onClick={() => onUpdate("brushMode", "paint")}
        >
          Paint
        </button>
        <button
          type="button"
          style={{
            ...styles.modeBtn,
            ...(brushState.mode === "erase" ? styles.modeBtnActive : {}),
          }}
          onClick={() => onUpdate("brushMode", "erase")}
        >
          Erase
        </button>
        <button type="button" style={styles.clearBtn} onClick={onClear}>
          Clear
        </button>
      </div>

      <div style={styles.palette}>
        {brushColors.map((color) => {
          const active = brushState.color === color.value;
          return (
            <button
              key={color.id}
              type="button"
              title={color.label}
              aria-label={color.label}
              onClick={() => onUpdate("brushColor", color.value)}
              style={{
                ...styles.swatch,
                background: color.value,
                ...(active ? styles.swatchActive : {}),
              }}
            />
          );
        })}
      </div>

      <div style={styles.customColorField}>
        <div style={styles.customColorHeader}>
          <span style={styles.label}>Any color</span>
          <button
            type="button"
            style={styles.paletteToggleBtn}
            onClick={() => setShowColorPicker((prev) => !prev)}
          >
            {showColorPicker ? "Close" : "Choose"}
          </button>
        </div>
        {showColorPicker && (
          <div style={styles.customColorRow}>
            <input
              type="color"
              value={brushState.color}
              onChange={(event) => {
                onUpdate("brushColor", event.target.value);
                setShowColorPicker(false);
              }}
              style={styles.colorInput}
            />
            <code style={styles.colorCode}>{brushState.color}</code>
          </div>
        )}
        {!showColorPicker && (
          <div style={styles.selectedColorRow}>
            <span
              style={{
                ...styles.selectedSwatch,
                background: brushState.color,
              }}
            />
            <code style={styles.colorCode}>{brushState.color}</code>
          </div>
        )}
      </div>

      <label style={styles.field}>
        <span style={styles.label}>Size</span>
        <input
          type="range"
          min="14"
          max="60"
          step="2"
          value={brushState.size}
          onChange={(event) => onUpdate("brushSize", Number(event.target.value))}
        />
        <span style={styles.value}>{brushState.size}px</span>
      </label>

      <label style={styles.field}>
        <span style={styles.label}>Opacity</span>
        <input
          type="range"
          min="0.15"
          max="0.9"
          step="0.05"
          value={brushState.opacity}
          onChange={(event) => onUpdate("brushOpacity", Number(event.target.value))}
        />
        <span style={styles.value}>
          {Math.round(brushState.opacity * 100)}%
        </span>
      </label>
    </section>
  );
}

const styles = {
  shell: {
    position: "fixed",
    zIndex: 1200,
    width: 220,
    borderRadius: 20,
    border: "1px solid rgba(15,23,42,0.12)",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 18px 38px rgba(15,23,42,0.18)",
    backdropFilter: "blur(10px)",
    padding: 12,
    paddingTop: 42,
  },
  dragHandle: {
    width: "100%",
    border: "none",
    borderRadius: 14,
    background: "#0f172a",
    color: "#fff",
    fontWeight: 800,
    letterSpacing: "0.04em",
    padding: "8px 10px",
    marginBottom: 10,
    cursor: "grab",
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  },
  row: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
  },
  modeBtn: {
    flex: 1,
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    fontWeight: 700,
    padding: "7px 10px",
    cursor: "pointer",
  },
  modeBtnActive: {
    background: "#dbeafe",
    borderColor: "#93c5fd",
    color: "#1d4ed8",
  },
  clearBtn: {
    borderRadius: 999,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    fontWeight: 700,
    padding: "7px 10px",
    cursor: "pointer",
  },
  palette: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
  },
  customColorField: {
    display: "grid",
    gap: 6,
    marginBottom: 10,
  },
  customColorHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  customColorRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  selectedColorRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  paletteToggleBtn: {
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#0f172a",
    fontWeight: 700,
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 12,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "2px solid transparent",
    cursor: "pointer",
  },
  swatchActive: {
    borderColor: "#0f172a",
    transform: "scale(1.08)",
  },
  field: {
    display: "grid",
    gridTemplateColumns: "44px 1fr auto",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
  },
  colorInput: {
    width: 44,
    height: 32,
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
  },
  selectedSwatch: {
    width: 24,
    height: 24,
    borderRadius: 999,
    border: "2px solid rgba(15,23,42,0.18)",
    flexShrink: 0,
  },
  colorCode: {
    margin: 0,
    padding: "6px 8px",
    borderRadius: 10,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#0f172a",
    fontSize: 12,
    fontWeight: 700,
  },
  value: {
    minWidth: 42,
    textAlign: "right",
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
  },
};
