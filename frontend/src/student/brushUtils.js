export function hexToRgba(hex, opacity = 1) {
  if (!hex) return `rgba(255, 213, 79, ${opacity})`;

  const normalized = hex.replace("#", "");
  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const value = Number.parseInt(fullHex, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function intersectsBrush(rect, x, y, radius) {
  const nearestX = Math.max(rect.left, Math.min(x, rect.right));
  const nearestY = Math.max(rect.top, Math.min(y, rect.bottom));
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

export function getTargetsWithinBrush(targetMap, point, brushSize) {
  const radius = Math.max(10, brushSize / 2);
  const hits = [];

  Object.entries(targetMap).forEach(([key, element]) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (intersectsBrush(rect, point.x, point.y, radius)) {
      hits.push(key);
    }
  });

  return hits;
}

export function applyBrushToKeys(keys, mode, color, setState) {
  if (!keys.length) return;

  setState((prev) => {
    const next = { ...prev };
    keys.forEach((key) => {
      if (mode === "erase") {
        delete next[key];
      } else {
        next[key] = color;
      }
    });
    return next;
  });
}
