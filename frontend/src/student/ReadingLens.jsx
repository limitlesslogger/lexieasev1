import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";

const HANDLE_HEIGHT = 28;

export default function ReadingLens({
  visible,
  containerRef,
  size,
  zoom,
  shape = "rounded",
  opacity = 0.18,
  onZoomIn,
  onZoomOut,
  onResizeUp,
  onResizeDown,
  onResizeTo,
  onClose,
}) {
  const [position, setPosition] = useState({ x: 12, y: 12 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState("");
  const [captureMetrics, setCaptureMetrics] = useState({
    width: 0,
    height: 0,
  });
  const resizeStartRef = useRef({
    pointerX: 0,
    pointerY: 0,
    baseSize: size,
  });
  const frameRef = useRef(null);

  useEffect(() => {
    if (!visible) return undefined;

    const handlePointerUp = () => {
      setDragging(false);
      setResizing(false);
    };

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [visible]);

  useEffect(() => {
    if ((!dragging && !resizing) || !containerRef?.current) return undefined;

    const handlePointerMove = (event) => {
      const containerRect = containerRef.current.getBoundingClientRect();

      if (dragging) {
        const nextX = event.clientX - containerRect.left - size / 2;
        const nextY = event.clientY - containerRect.top - HANDLE_HEIGHT;

        setPosition({
          x: clamp(nextX, 0, Math.max(0, containerRect.width - size)),
          y: clamp(nextY, 0, Math.max(0, containerRect.height - size)),
        });
      }

      if (resizing) {
        const delta = Math.max(
          event.clientX - resizeStartRef.current.pointerX,
          event.clientY - resizeStartRef.current.pointerY
        );

        const nextSize = clamp(resizeStartRef.current.baseSize + delta, 120, 320);
        const roundedSize = Math.round(nextSize / 10) * 10;
        if (roundedSize !== size) {
          onResizeTo?.(roundedSize);
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [containerRef, dragging, onResizeTo, resizing, size]);

  useEffect(() => {
    if (!containerRef?.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPosition((prev) => ({
      x: clamp(prev.x, 0, Math.max(0, rect.width - size)),
      y: clamp(prev.y, 0, Math.max(0, rect.height - size)),
    }));
  }, [containerRef, size]);

  useEffect(() => {
    if (!visible || !containerRef?.current) return undefined;

    let cancelled = false;
    let rafId = 0;
    const captureNode = containerRef.current;

    const capture = async () => {
      const captureRect = captureNode.getBoundingClientRect();

      setCaptureMetrics({
        width: captureRect.width,
        height: captureRect.height,
      });

      const canvas = await html2canvas(captureNode, {
        backgroundColor: null,
        logging: false,
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true,
        ignoreElements: (element) =>
          element instanceof HTMLElement &&
          element.dataset?.html2canvasIgnore === "true",
      });

      if (!cancelled) {
        setSnapshotUrl(canvas.toDataURL("image/png"));
      }
    };

    const queueCapture = () => {
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        capture();
      });
    };

    queueCapture();

    const resizeObserver = new ResizeObserver(queueCapture);
    resizeObserver.observe(captureNode);

    const mutationObserver = new MutationObserver(queueCapture);
    mutationObserver.observe(captureNode, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [containerRef, visible]);

  const radius = shape === "circle" ? "999px" : "24px";

  const backgroundStyle = useMemo(() => {
    const viewportHeight = size - HANDLE_HEIGHT;

    return {
      backgroundImage: snapshotUrl ? `url(${snapshotUrl})` : "none",
      backgroundRepeat: "no-repeat",
      backgroundSize: `${captureMetrics.width * zoom}px ${captureMetrics.height * zoom}px`,
      backgroundPositionX: `${-position.x * zoom}px`,
      backgroundPositionY: `${-(position.y + HANDLE_HEIGHT) * zoom}px`,
      width: size,
      height: viewportHeight,
    };
  }, [captureMetrics.height, captureMetrics.width, position.x, position.y, size, snapshotUrl, zoom]);

  if (!visible) return null;

  return (
    <div
      ref={frameRef}
      data-html2canvas-ignore="true"
      style={{
        ...styles.frame,
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        borderRadius: radius,
      }}
    >
      <div style={styles.handle} onPointerDown={() => setDragging(true)}>
        <span>Lens</span>
        <div style={styles.controls}>
          <button
            type="button"
            style={styles.controlBtn}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onClose}
          >
            x
          </button>
          <button
            type="button"
            style={styles.controlBtn}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onResizeUp}
          >
            S+
          </button>
          <button
            type="button"
            style={styles.controlBtn}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onResizeDown}
          >
            S-
          </button>
          <button
            type="button"
            style={styles.controlBtn}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onZoomOut}
          >
            -
          </button>
          <button
            type="button"
            style={styles.controlBtn}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onZoomIn}
          >
            +
          </button>
        </div>
      </div>

      <div style={styles.viewport}>
        <div
          style={{
            ...styles.capture,
            ...backgroundStyle,
          }}
        />
        <div
          style={{
            ...styles.tint,
            background: `rgba(255, 248, 196, ${opacity})`,
          }}
        />
      </div>

      <button
        type="button"
        aria-label="Resize lens"
        style={styles.resizeHandle}
        onPointerDown={(event) => {
          event.stopPropagation();
          setResizing(true);
          resizeStartRef.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            baseSize: size,
          };
        }}
      />
    </div>
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const styles = {
  frame: {
    position: "absolute",
    zIndex: 30,
    overflow: "hidden",
    border: "2px solid rgba(15,23,42,0.9)",
    boxShadow: "0 18px 36px rgba(15,23,42,0.18)",
    background: "transparent",
    touchAction: "none",
    userSelect: "none",
    pointerEvents: "auto",
    transition: "box-shadow 120ms ease, border-radius 120ms ease",
  },
  handle: {
    height: HANDLE_HEIGHT,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    background: "#0f172a",
    color: "#fff",
    cursor: "grab",
    padding: "0 8px",
  },
  controls: {
    display: "flex",
    gap: 6,
  },
  controlBtn: {
    minWidth: 24,
    height: 22,
    borderRadius: 999,
    border: "none",
    background: "#f8fafc",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
    lineHeight: 1,
    padding: "0 6px",
  },
  viewport: {
    position: "relative",
    height: `calc(100% - ${HANDLE_HEIGHT}px)`,
    overflow: "hidden",
    background: "transparent",
  },
  capture: {
    position: "absolute",
    left: 0,
    top: 0,
    imageRendering: "high-quality",
    willChange: "background-position, background-size, width, height",
  },
  tint: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  resizeHandle: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 18,
    height: 18,
    border: "none",
    background: "transparent",
    borderRight: "3px solid rgba(15,23,42,0.8)",
    borderBottom: "3px solid rgba(15,23,42,0.8)",
    cursor: "nwse-resize",
    padding: 0,
  },
};
