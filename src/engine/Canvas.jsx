import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { createCamera, panCamera, zoomCamera } from "./camera";
import { drawGrid } from "./grid";
import { drawShapes } from "./renderer";
import { screenToWorld } from "./utils";

import "./shapes/index";
import { getShape } from "./registry";

import {
  boundsIntersect,
  getBounds,
  getSelectionBounds,
  moveShape,
  resizeShape,
} from "./shapeUtils";

const HANDLE_SIZE = 10;

const Canvas = forwardRef(({ tool }, ref) => {
  const canvasRef = useRef(null);

  const cameraRef = useRef(createCamera());

  const shapesRef = useRef([]);
  const selectedRef = useRef([]);

  const currentShapeRef = useRef(null);

  const drawingRef = useRef(false);
  const draggingRef = useRef(false);
  const panningRef = useRef(false);
  const erasingRef = useRef(false);
  const resizingRef = useRef(false);
  const selectionBoxRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const eraserTrailRef = useRef([]);

  const lastWorldRef = useRef({
    x: 0,
    y: 0,
  });

  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const [textEditor, setTextEditor] = useState(null);
  const textInputRef = useRef(null);

  const saveHistory = () => {
    historyRef.current.push(structuredClone(shapesRef.current));

    if (historyRef.current.length > 100) {
      historyRef.current.shift();
    }

    redoRef.current = [];
  };

  const getShapeAt = (x, y) => {
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const shape = shapesRef.current[i];

      const shapeDef = getShape(shape.type);

      if (shapeDef?.hitTest?.(shape, x, y)) {
        return shape;
      }
    }

    return null;
  };

  const getHandleAt = (x, y) => {
    const bounds = getSelectionBounds(selectedRef.current);

    if (!bounds) {
      return null;
    }

    const handles = {
      tl: [bounds.x, bounds.y],
      tr: [bounds.x + bounds.width, bounds.y],
      bl: [bounds.x, bounds.y + bounds.height],
      br: [bounds.x + bounds.width, bounds.y + bounds.height],
    };

    for (const key in handles) {
      const [hx, hy] = handles[key];

      if (
        x >= hx - HANDLE_SIZE &&
        x <= hx + HANDLE_SIZE &&
        y >= hy - HANDLE_SIZE &&
        y <= hy + HANDLE_SIZE
      ) {
        return key;
      }
    }

    return null;
  };

  useImperativeHandle(ref, () => ({
    clear() {
      saveHistory();

      shapesRef.current = [];
      selectedRef.current = [];
    },

    undo() {
      if (!historyRef.current.length) return;

      redoRef.current.push(structuredClone(shapesRef.current));

      shapesRef.current = historyRef.current.pop();

      selectedRef.current = [];
    },

    redo() {
      if (!redoRef.current.length) return;

      historyRef.current.push(structuredClone(shapesRef.current));

      shapesRef.current = redoRef.current.pop();

      selectedRef.current = [];
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;

    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();

    window.addEventListener("resize", resize);

    let frame;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawGrid(ctx, cameraRef.current, canvas.width, canvas.height);

      drawShapes(
        ctx,
        cameraRef.current,
        shapesRef.current,
        selectedRef.current,
        selectionBoxRef.current,
        eraserTrailRef.current,
      );

      frame = requestAnimationFrame(render);
    };

    render();

    const pointerDown = (e) => {
      const camera = cameraRef.current;

      const pos = screenToWorld(e.clientX, e.clientY, camera);

      lastWorldRef.current = pos;

      if (tool === "pan" || e.button === 1 || e.button === 2) {
        panningRef.current = true;
        return;
      }

      if (tool === "eraser") {
        saveHistory();

        erasingRef.current = true;

        eraserTrailRef.current = [pos];

        return;
      }

      if (tool === "select") {
        const handle = getHandleAt(pos.x, pos.y);

        if (handle) {
          saveHistory();

          resizingRef.current = true;
          resizeHandleRef.current = handle;

          return;
        }

        const selectionBounds = getSelectionBounds(selectedRef.current);

        if (
          selectionBounds &&
          pos.x >= selectionBounds.x &&
          pos.x <= selectionBounds.x + selectionBounds.width &&
          pos.y >= selectionBounds.y &&
          pos.y <= selectionBounds.y + selectionBounds.height
        ) {
          saveHistory();

          draggingRef.current = true;

          return;
        }

        const hit = getShapeAt(pos.x, pos.y);

        if (hit) {
          if (!selectedRef.current.includes(hit)) {
            selectedRef.current = [hit];
          }

          saveHistory();

          draggingRef.current = true;

          return;
        }

        selectionBoxRef.current = {
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        };

        selectedRef.current = [];

        return;
      }

      if (tool === "text") {
        setTextEditor({
          screenX: e.clientX,
          screenY: e.clientY,
          worldX: pos.x,
          worldY: pos.y,
        });

        requestAnimationFrame(() => {
          textInputRef.current?.focus();

          if (textInputRef.current) {
            textInputRef.current.selectionStart = 0;
            textInputRef.current.selectionEnd = 0;
          }
        });

        return;
      }

      const shapeDef = getShape(tool);

      if (!shapeDef) return;

      saveHistory();

      const shape = shapeDef.create(pos.x, pos.y);

      shapesRef.current.push(shape);

      currentShapeRef.current = shape;

      drawingRef.current = true;
    };

    const pointerMove = (e) => {
      const camera = cameraRef.current;

      const pos = screenToWorld(e.clientX, e.clientY, camera);

      const dx = pos.x - lastWorldRef.current.x;

      const dy = pos.y - lastWorldRef.current.y;

      lastWorldRef.current = pos;

      if (panningRef.current) {
        panCamera(camera, e.movementX, e.movementY);
      }

      if (erasingRef.current) {
        eraserTrailRef.current.push(pos);

        shapesRef.current = shapesRef.current.filter((shape) => {
          const shapeDef = getShape(shape.type);

          return !shapeDef?.hitTest?.(shape, pos.x, pos.y);
        });
      }

      if (selectionBoxRef.current) {
        selectionBoxRef.current.width += dx;
        selectionBoxRef.current.height += dy;

        const box = getBounds(selectionBoxRef.current);

        selectedRef.current = shapesRef.current.filter((s) =>
          boundsIntersect(getBounds(s), box),
        );
      }

      if (draggingRef.current) {
        selectedRef.current.forEach((s) => moveShape(s, dx, dy));
      }

      if (resizingRef.current) {
        selectedRef.current.forEach((s) =>
          resizeShape(s, resizeHandleRef.current, dx, dy),
        );
      }

      if (drawingRef.current && currentShapeRef.current) {
        const shape = currentShapeRef.current;

        const shapeDef = getShape(shape.type);

        shapeDef?.update(shape, pos);
      }
    };

    const pointerUp = () => {
      drawingRef.current = false;
      draggingRef.current = false;
      panningRef.current = false;
      erasingRef.current = false;
      resizingRef.current = false;

      currentShapeRef.current = null;

      resizeHandleRef.current = null;

      selectionBoxRef.current = null;

      eraserTrailRef.current = [];
    };

    const wheel = (e) => {
      e.preventDefault();

      const camera = cameraRef.current;

      if (!e.ctrlKey) {
        panCamera(camera, -e.deltaX, -e.deltaY);

        return;
      }

      const before = screenToWorld(e.clientX, e.clientY, camera);

      camera.zoom *= e.deltaY > 0 ? 0.98 : 1.02;

      camera.zoom = Math.max(0.2, Math.min(5, camera.zoom));

      const after = screenToWorld(e.clientX, e.clientY, camera);

      zoomCamera(camera, before, after);
    };

    const keyDown = (e) => {
      if (e.key === "Delete") {
        if (!selectedRef.current.length) {
          return;
        }

        saveHistory();

        shapesRef.current = shapesRef.current.filter(
          (s) => !selectedRef.current.includes(s),
        );

        selectedRef.current = [];
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();

        selectedRef.current = [...shapesRef.current];
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();

        if (e.shiftKey) {
          ref.current?.redo();
        } else {
          ref.current?.undo();
        }
      }
    };

    canvas.addEventListener("pointerdown", pointerDown);

    window.addEventListener("pointermove", pointerMove);

    window.addEventListener("pointerup", pointerUp);

    window.addEventListener("keydown", keyDown);

    canvas.addEventListener("wheel", wheel, {
      passive: false,
    });

    return () => {
      cancelAnimationFrame(frame);

      window.removeEventListener("resize", resize);

      window.removeEventListener("pointermove", pointerMove);

      window.removeEventListener("pointerup", pointerUp);

      window.removeEventListener("keydown", keyDown);

      canvas.removeEventListener("pointerdown", pointerDown);

      canvas.removeEventListener("wheel", wheel);
    };
  }, [tool, ref]);

  return (
    <>
      <canvas ref={canvasRef} className="canvas" />

      {textEditor ? (
        <textarea
          ref={textInputRef}
          className="canvas-text-input"
          autoFocus
          spellCheck={false}
          placeholder="Type..."
          style={{
            left: `${textEditor.screenX}px`,
            top: `${textEditor.screenY}px`,
            width: "260px",
            height: "120px",
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();

            if (e.key === "Escape") {
              setTextEditor(null);
            }
          }}
          onBlur={(e) => {
            const value = e.target.value.trim();

            if (value) {
              saveHistory();

              const shape = getShape("text").create(
                textEditor.worldX,
                textEditor.worldY,
                value,
                e.target.offsetWidth,
                e.target.offsetHeight,
              );

              shapesRef.current.push(shape);
            }

            setTextEditor(null);
          }}
        />
      ) : null}
    </>
  );
});

export default Canvas;