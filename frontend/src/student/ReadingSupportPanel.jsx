import {
  backgroundPresets,
  brushColors,
  focusColors,
  readingModes,
} from "./useReadingPreferences";

export default function ReadingSupportPanel({
  isCollapsed,
  onToggleCollapse,
  draftPreferences,
  setDraftPreference,
  applyPreferences,
  resetPreferences,
}) {
  const hasCollapsed = isCollapsed;

  return (
    <section style={styles.panel}>
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.title}>Reading Support</h3>
          <p style={styles.copy}>
            Tune the reading surface, then apply the settings when they feel right.
          </p>
        </div>
        <div style={styles.headerActions}>
          <button type="button" style={styles.secondaryBtn} onClick={resetPreferences}>
            Reset
          </button>
          <button type="button" style={styles.collapseBtn} onClick={onToggleCollapse}>
            {hasCollapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {!hasCollapsed && (
        <>
          <div style={styles.grid}>
            <label style={styles.field}>
              <span style={styles.label}>Reading mode</span>
              <select
                value={draftPreferences.readingMode}
                onChange={(e) => {
                  const nextMode = e.target.value;
                  const preset = readingModes[nextMode];
                  setDraftPreference("readingMode", nextMode);
                  setDraftPreference("fontScale", preset.fontScale);
                  setDraftPreference("letterSpacing", preset.letterSpacing);
                  setDraftPreference("wordSpacing", preset.wordSpacing);
                  setDraftPreference("lineHeight", preset.lineHeight);
                }}
                style={styles.select}
              >
                <option value="focus">Focus</option>
                <option value="steady">Steady</option>
                <option value="comfort">Comfort</option>
              </select>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Font style</span>
              <select
                value={draftPreferences.fontPreset}
                onChange={(e) => setDraftPreference("fontPreset", e.target.value)}
                style={styles.select}
              >
                <option value="dyslexic">Dyslexic friendly</option>
                <option value="clear">Hyperlegible sans</option>
                <option value="rounded">Rounded sans</option>
                <option value="classic">Classic serif</option>
              </select>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Background tint</span>
              <select
                value={draftPreferences.backgroundPreset}
                onChange={(e) =>
                  setDraftPreference("backgroundPreset", e.target.value)
                }
                style={styles.select}
              >
                {Object.keys(backgroundPresets).map((preset) => (
                  <option key={preset} value={preset}>
                    {preset[0].toUpperCase() + preset.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Magnifier</span>
              <button
                type="button"
                style={{
                  ...styles.toggleBtn,
                  ...(draftPreferences.magnifierEnabled ? styles.toggleOn : {}),
                }}
                onClick={() =>
                  setDraftPreference(
                    "magnifierEnabled",
                    !draftPreferences.magnifierEnabled
                  )
                }
              >
                {draftPreferences.magnifierEnabled ? "On" : "Off"}
              </button>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Lens shape</span>
              <select
                value={draftPreferences.lensShape}
                onChange={(e) => setDraftPreference("lensShape", e.target.value)}
                style={styles.select}
              >
                <option value="rounded">Rounded</option>
                <option value="circle">Circle</option>
              </select>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Paintbrush</span>
              <button
                type="button"
                style={{
                  ...styles.toggleBtn,
                  ...(draftPreferences.paintbrushEnabled ? styles.toggleOn : {}),
                }}
                onClick={() =>
                  setDraftPreference(
                    "paintbrushEnabled",
                    !draftPreferences.paintbrushEnabled
                  )
                }
              >
                {draftPreferences.paintbrushEnabled ? "On" : "Off"}
              </button>
            </label>
          </div>

          <div style={styles.field}>
            <span style={styles.label}>Highlight color</span>
            <div style={styles.colorRow}>
              {focusColors.map((color) => {
                const active = draftPreferences.focusColor === color.value;
                return (
                  <button
                    key={color.id}
                    type="button"
                    title={color.label}
                    aria-label={color.label}
                    onClick={() => setDraftPreference("focusColor", color.value)}
                    style={{
                      ...styles.colorChip,
                      background: color.value,
                      ...(active ? styles.colorChipActive : {}),
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div style={styles.field}>
            <span style={styles.label}>Brush color</span>
            <div style={styles.colorRow}>
              {brushColors.map((color) => {
                const active = draftPreferences.brushColor === color.value;
                return (
                  <button
                    key={color.id}
                    type="button"
                    title={color.label}
                    aria-label={color.label}
                    onClick={() => setDraftPreference("brushColor", color.value)}
                    style={{
                      ...styles.colorChip,
                      background: color.value,
                      ...(active ? styles.colorChipActive : {}),
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div style={styles.sliderList}>
            <RangeField
              label="Font size"
              value={draftPreferences.fontScale}
              min={0.9}
              max={1.7}
              step={0.05}
              display={`${Math.round(draftPreferences.fontScale * 100)}%`}
              onChange={(value) => setDraftPreference("fontScale", value)}
            />
            <RangeField
              label="Letter spacing"
              value={draftPreferences.letterSpacing}
              min={0}
              max={0.22}
              step={0.01}
              display={`${Number(draftPreferences.letterSpacing).toFixed(2)}em`}
              onChange={(value) => setDraftPreference("letterSpacing", value)}
            />
            <RangeField
              label="Word spacing"
              value={draftPreferences.wordSpacing}
              min={0}
              max={0.5}
              step={0.01}
              display={`${Number(draftPreferences.wordSpacing).toFixed(2)}em`}
              onChange={(value) => setDraftPreference("wordSpacing", value)}
            />
            <RangeField
              label="Line spacing"
              value={draftPreferences.lineHeight}
              min={1.2}
              max={2.3}
              step={0.05}
              display={Number(draftPreferences.lineHeight).toFixed(2)}
              onChange={(value) => setDraftPreference("lineHeight", value)}
            />
            <RangeField
              label="Brush size"
              value={draftPreferences.brushSize}
              min={14}
              max={60}
              step={2}
              display={`${draftPreferences.brushSize}px`}
              onChange={(value) => setDraftPreference("brushSize", value)}
            />
            <RangeField
              label="Brush opacity"
              value={draftPreferences.brushOpacity}
              min={0.15}
              max={0.9}
              step={0.05}
              display={`${Math.round(draftPreferences.brushOpacity * 100)}%`}
              onChange={(value) => setDraftPreference("brushOpacity", value)}
            />
            <RangeField
              label="Lens size"
              value={draftPreferences.lensSize}
              min={120}
              max={280}
              step={10}
              display={`${draftPreferences.lensSize}px`}
              onChange={(value) => setDraftPreference("lensSize", value)}
            />
            <RangeField
              label="Lens zoom"
              value={draftPreferences.lensZoom}
              min={1}
              max={2.2}
              step={0.05}
              display={`${Number(draftPreferences.lensZoom).toFixed(2)}x`}
              onChange={(value) => setDraftPreference("lensZoom", value)}
            />
            <RangeField
              label="Lens tint"
              value={draftPreferences.lensOpacity}
              min={0}
              max={0.45}
              step={0.01}
              display={`${Math.round(draftPreferences.lensOpacity * 100)}%`}
              onChange={(value) => setDraftPreference("lensOpacity", value)}
            />
          </div>

          <div style={styles.preview}>
            <span style={styles.previewLabel}>Preview</span>
            <p
              style={{
                ...styles.previewText,
                background: draftPreferences.focusColor,
                transform: draftPreferences.magnifierEnabled
                  ? `scale(${Math.min(1.12, draftPreferences.lensZoom)})`
                  : "scale(1)",
              }}
            >
              Reading should feel calmer, clearer, and easier to track line by line.
            </p>
          </div>

          <div style={styles.footerActions}>
            <button type="button" style={styles.applyBtn} onClick={applyPreferences}>
              Apply
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function RangeField({ label, value, min, max, step, display, onChange }) {
  return (
    <label style={styles.rangeField}>
      <div style={styles.rangeHeader}>
        <span style={styles.label}>{label}</span>
        <strong style={styles.value}>{display}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={styles.range}
      />
    </label>
  );
}

const styles = {
  panel: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)",
    border: "1px solid #d8dee7",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 14px 36px rgba(15, 23, 42, 0.09)",
    display: "grid",
    gap: 16,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  headerActions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  title: {
    margin: 0,
    fontSize: 18,
    color: "#0f172a",
  },
  copy: {
    margin: "4px 0 0",
    color: "#526071",
    fontSize: 13,
  },
  secondaryBtn: {
    border: "1px solid #d7deea",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  collapseBtn: {
    border: "1px solid #bfd1ff",
    background: "#edf4ff",
    color: "#173a73",
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  field: {
    display: "grid",
    gap: 6,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: 600,
  },
  select: {
    border: "1px solid #d7deea",
    borderRadius: 10,
    padding: "10px 12px",
    background: "#fff",
    fontSize: 14,
  },
  toggleBtn: {
    border: "1px solid #d7deea",
    borderRadius: 10,
    padding: "10px 12px",
    background: "#fff",
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
  },
  toggleOn: {
    background: "#0f172a",
    color: "#fff",
    borderColor: "#0f172a",
  },
  colorRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  colorChip: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "2px solid rgba(15,23,42,0.12)",
    cursor: "pointer",
    transition: "transform 0.18s ease",
  },
  colorChipActive: {
    transform: "scale(1.12)",
    border: "3px solid #0f172a",
  },
  sliderList: {
    display: "grid",
    gap: 10,
  },
  rangeField: {
    display: "grid",
    gap: 6,
  },
  rangeHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  value: {
    color: "#0f172a",
    fontSize: 13,
  },
  range: {
    width: "100%",
  },
  preview: {
    borderRadius: 14,
    background: "#fffefb",
    border: "1px solid #e8ddc5",
    padding: 14,
  },
  previewLabel: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#7c5c21",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 6,
  },
  previewText: {
    margin: 0,
    color: "#3b2c11",
    fontSize: 15,
    lineHeight: 1.7,
    display: "inline-block",
    borderRadius: 10,
    padding: "10px 12px",
    transition: "transform 0.18s ease",
  },
  footerActions: {
    display: "flex",
    justifyContent: "flex-end",
  },
  applyBtn: {
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    borderRadius: 999,
    padding: "10px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
