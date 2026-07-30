import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { createCamera, panCamera, zoomCamera } from "./camera";
import { getCanvasInkColor } from "./color";
import { drawGrid } from "./grid";
import { drawShapes } from "./renderer";
import { pointerToCanvas, screenToWorld } from "./utils";
import { HANDLE_SIZE, TOOL_SHORTCUTS, ZOOM_MIN, ZOOM_MAX } from "./constants";

import "./shapes/index";
import { getShape } from "./registry";

import {
  boundsIntersect,
  getBounds,
  getSelectionBounds,
  moveShape,
  resizeShape,
} from "./shapeUtils";

function exportShapesAsPng(shapes, width, height, bgColor, defaultStroke) {
  const bounds = getSelectionBounds(shapes);

  const padding = 40;

  const srcWidth = bounds ? bounds.width + padding * 2 : width;
  const srcHeight = bounds ? bounds.height + padding * 2 : height;

  const offsetX = bounds ? -bounds.x + padding : 0;
  const offsetY = bounds ? -bounds.y + padding : 0;

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }

  const scale = Math.min(width / srcWidth, height / srcHeight);

  ctx.translate(
    (width - srcWidth * scale) / 2,
    (height - srcHeight * scale) / 2,
  );

  ctx.scale(scale, scale);
  ctx.translate(offsetX, offsetY);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const shape of shapes) {
    const shapeDef = getShape(shape.type);

    if (!shapeDef) {
      continue;
    }

    ctx.save();
    ctx.globalAlpha = shape.opacity ?? 1;
    ctx.strokeStyle = shape.stroke || defaultStroke;
    ctx.fillStyle = shape.fill || "transparent";
    ctx.lineWidth = shape.strokeWidth || 2;

    shapeDef.render(ctx, shape);
    ctx.restore();
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

const Canvas = forwardRef(
  ({ tool, setTool, bgColor, drawingColor, strokeWidth, drawingOpacity, onZoomChange},ref,) => {
  const canvasRef = useRef(null);

  const cameraRef = useRef(createCamera());
  const toolRef = useRef(tool);
  const drawingColorRef = useRef(drawingColor);
  const strokeWidthRef = useRef(strokeWidth);
  const drawingOpacityRef = useRef(drawingOpacity);

  const shapesRef = useRef([]);
  const selectedRef = useRef([]);
  const clipboardRef = useRef([]);

  const currentShapeRef = useRef(null);

  const drawingRef = useRef(false);
  const draggingRef = useRef(false);
  const panningRef = useRef(false);
  const erasingRef = useRef(false);
  const resizingRef = useRef(false);
  const selectionBoxRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const eraserTrailRef = useRef([]);
  const lastZoomLabelRef = useRef("100%");
  const activePointerIdRef = useRef(null);
  const selectionBaseRef = useRef([]);
  const spacePressedRef = useRef(false);
  const nudgeActiveRef = useRef(false);
  const transformHistorySavedRef = useRef(false);

  const lastWorldRef = useRef({
    x: 0,
    y: 0,
  });

  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const [textEditor, setTextEditor] = useState(null);
  const textInputRef = useRef(null);
  const cancelTextEditRef = useRef(false);

  toolRef.current = tool;
  drawingColorRef.current = drawingColor;
  strokeWidthRef.current = strokeWidth;
  drawingOpacityRef.current = drawingOpacity;

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "";
    }
  }, [tool]);

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

  const showTextEditor = (editor, selectAll = false) => {
    cancelTextEditRef.current = false;
    setTextEditor(editor);

    requestAnimationFrame(() => {
      const input = textInputRef.current;

      if (!input) return;

      input.focus();

      if (selectAll) {
        input.select();
      } else {
        input.selectionStart = input.value.length;
        input.selectionEnd = input.value.length;
      }
    });
  };

  const getHandleAt = (x, y) => {
    if (
      selectedRef.current.length !== 1 ||
      selectedRef.current[0]?.points
    ) {
      return null;
    }

    const bounds = getSelectionBounds(selectedRef.current);

    if (!bounds) {
      return null;
    }

    const handleSize = HANDLE_SIZE / cameraRef.current.zoom;
    const handles = {
      tl: [bounds.x, bounds.y],
      tr: [bounds.x + bounds.width, bounds.y],
      bl: [bounds.x, bounds.y + bounds.height],
      br: [bounds.x + bounds.width, bounds.y + bounds.height],
    };

    for (const key in handles) {
      const [hx, hy] = handles[key];

      if (
        x >= hx - handleSize &&
        x <= hx + handleSize &&
        y >= hy - handleSize &&
        y <= hy + handleSize
      ) {
        return key;
      }
    }

    return null;
  };

  const clearCanvas = () => {
    if (!shapesRef.current.length) return;

    saveHistory();

    shapesRef.current = [];
    selectedRef.current = [];
  };

  const copySelected = () => {
    if (!selectedRef.current.length) return;

    clipboardRef.current = structuredClone(selectedRef.current);
  };

  const pasteClipboard = () => {
    if (!clipboardRef.current.length) return;

    saveHistory();

    const pasted = clipboardRef.current.map((shape) => ({
      ...structuredClone(shape),
      id: crypto.randomUUID(),
    }));

    pasted.forEach((shape) => moveShape(shape, 24, 24));

    shapesRef.current = [...shapesRef.current, ...pasted];
    selectedRef.current = pasted;
    clipboardRef.current = structuredClone(pasted);
  };

  useImperativeHandle(ref, () => ({
    clear() {
      clearCanvas();
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

    setSelectedStyle({ color, strokeWidth: width, opacity }) {
      if (!selectedRef.current.length) return;

      saveHistory();

      selectedRef.current.forEach((shape) => {
        if (color !== undefined) {
          shape.stroke = color;

          if (shape.type === "text") {
            shape.fill = color;
          }
        }

        if (width !== undefined) shape.strokeWidth = width;
        if (opacity !== undefined) shape.opacity = opacity;
      });
    },

    async exportPng(width, height, transparent) {
      const blob = await exportShapesAsPng(
        shapesRef.current,
        width,
        height,
        transparent ? null : bgColor,
        getCanvasInkColor(bgColor),
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "drawing.png";
      a.click();

      URL.revokeObjectURL(url);
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

      drawGrid(ctx, cameraRef.current, canvas.width, canvas.height, bgColor);

      drawShapes(
        ctx,
        cameraRef.current,
        shapesRef.current,
        selectedRef.current,
        selectionBoxRef.current,
        eraserTrailRef.current,
        getCanvasInkColor(bgColor),
      );

      const zoomLabel = `${Math.round(cameraRef.current.zoom * 100)}%`;

      if (zoomLabel !== lastZoomLabelRef.current) {
        lastZoomLabelRef.current = zoomLabel;
        onZoomChange?.(zoomLabel);
      }

      frame = requestAnimationFrame(render);
    };

    render();

    const pointerDown = (e) => {
      if (!e.isPrimary) return;

      if (
        activePointerIdRef.current !== null &&
        activePointerIdRef.current !== e.pointerId
      ) {
        return;
      }

      activePointerIdRef.current = e.pointerId;
      canvas.setPointerCapture?.(e.pointerId);

      const camera = cameraRef.current;
      const currentTool = toolRef.current;
      const pointer = pointerToCanvas(e, canvas);
      const pos = {
        ...screenToWorld(pointer.x, pointer.y, camera),
        pressure: pointer.pressure,
        minDistance: 0.75 / camera.zoom,
      };

      lastWorldRef.current = pos;

      if (
        currentTool === "pan" ||
        spacePressedRef.current ||
        e.button === 1 ||
        e.button === 2
      ) {
        panningRef.current = true;
        canvas.dataset.interaction = "grabbing";
        return;
      }

      if (currentTool === "eraser") {
        saveHistory();

        erasingRef.current = true;

        eraserTrailRef.current = [pos];

        return;
      }

      if (currentTool === "select") {
        const handle = getHandleAt(pos.x, pos.y);

        if (handle) {
          resizingRef.current = true;
          resizeHandleRef.current = handle;
          transformHistorySavedRef.current = false;

          return;
        }

        const hit = getShapeAt(pos.x, pos.y);

        if (e.shiftKey && hit) {
          selectedRef.current = selectedRef.current.includes(hit)
            ? selectedRef.current.filter((shape) => shape !== hit)
            : [...selectedRef.current, hit];
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
          draggingRef.current = true;
          transformHistorySavedRef.current = false;
          canvas.dataset.interaction = "moving";

          return;
        }

        if (hit) {
          if (!selectedRef.current.includes(hit)) {
            selectedRef.current = [hit];
          }

          draggingRef.current = true;
          transformHistorySavedRef.current = false;
          canvas.dataset.interaction = "moving";

          return;
        }

        selectionBaseRef.current = e.shiftKey
          ? [...selectedRef.current]
          : [];
        selectionBoxRef.current = {
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        };

        if (!e.shiftKey) {
          selectedRef.current = [];
        }

        return;
      }

      if (currentTool === "text") {
        e.preventDefault();

        showTextEditor({
          screenX: e.clientX,
          screenY: e.clientY,
          worldX: pos.x,
          worldY: pos.y,
          value: "",
          width: 260,
          height: 80,
          fontSize: 28,
        });

        return;
      }

      const shapeDef = getShape(currentTool);

      if (!shapeDef) return;

      saveHistory();

      const shape = shapeDef.create(pos.x, pos.y);
      shape.stroke = drawingColorRef.current;
      shape.strokeWidth = strokeWidthRef.current;
      shape.opacity = drawingOpacityRef.current;

      if (shape.points?.[0]) {
        shape.points[0].pressure = pos.pressure;
      }

      shapesRef.current.push(shape);

      currentShapeRef.current = shape;

      drawingRef.current = true;
    };

    const pointerMove = (e) => {
      if (!e.isPrimary) return;

      const camera = cameraRef.current;
      const pointer = pointerToCanvas(e, canvas);
      const hoverPos = screenToWorld(pointer.x, pointer.y, camera);

      if (activePointerIdRef.current === null) {
        if (spacePressedRef.current) {
          canvas.style.cursor = "grab";
          return;
        }

        if (toolRef.current === "select") {
          const handle = getHandleAt(hoverPos.x, hoverPos.y);

          if (handle === "tl" || handle === "br") {
            canvas.style.cursor = "nwse-resize";
          } else if (handle === "tr" || handle === "bl") {
            canvas.style.cursor = "nesw-resize";
          } else if (getShapeAt(hoverPos.x, hoverPos.y)) {
            canvas.style.cursor = "move";
          } else {
            canvas.style.cursor = "default";
          }
        }

        return;
      }

      if (activePointerIdRef.current !== e.pointerId) return;

      const samples =
        (drawingRef.current || erasingRef.current) &&
        typeof e.getCoalescedEvents === "function"
          ? e.getCoalescedEvents()
          : [e];
      const pointerSamples = samples.length ? samples : [e];

      pointerSamples.forEach((sample) => {
        const samplePointer = pointerToCanvas(sample, canvas);
        const pos = {
          ...screenToWorld(samplePointer.x, samplePointer.y, camera),
          pressure: samplePointer.pressure,
          minDistance: 0.75 / camera.zoom,
        };
        const dx = pos.x - lastWorldRef.current.x;
        const dy = pos.y - lastWorldRef.current.y;

        lastWorldRef.current = pos;

        if (
          (draggingRef.current || resizingRef.current) &&
          !transformHistorySavedRef.current &&
          (dx !== 0 || dy !== 0)
        ) {
          saveHistory();
          transformHistorySavedRef.current = true;
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
          const hits = shapesRef.current.filter((shape) =>
            boundsIntersect(getBounds(shape), box),
          );

          selectedRef.current = [
            ...new Set([...selectionBaseRef.current, ...hits]),
          ];
        }

        if (draggingRef.current) {
          selectedRef.current.forEach((shape) => moveShape(shape, dx, dy));
        }

        if (resizingRef.current) {
          selectedRef.current.forEach((shape) =>
            resizeShape(shape, resizeHandleRef.current, dx, dy),
          );
        }

        if (drawingRef.current && currentShapeRef.current) {
          const shapeDef = getShape(currentShapeRef.current.type);
          shapeDef?.update(currentShapeRef.current, pos);
        }
      });

      if (panningRef.current) {
        panCamera(camera, e.movementX, e.movementY);
      }
    };

    const pointerUp = (e) => {
      if (
        activePointerIdRef.current !== null &&
        e.pointerId !== activePointerIdRef.current
      ) {
        return;
      }

      if (drawingRef.current && currentShapeRef.current) {
        const camera = cameraRef.current;
        const pointer = pointerToCanvas(e, canvas);
        const pos = {
          ...screenToWorld(pointer.x, pointer.y, camera),
          pressure: pointer.pressure,
          minDistance: 0.01 / camera.zoom,
        };
        const shapeDef = getShape(currentShapeRef.current.type);

        shapeDef?.update(currentShapeRef.current, pos);
      }

      drawingRef.current = false;
      draggingRef.current = false;
      panningRef.current = false;
      erasingRef.current = false;
      resizingRef.current = false;

      currentShapeRef.current = null;
      resizeHandleRef.current = null;
      selectionBoxRef.current = null;
      selectionBaseRef.current = [];
      transformHistorySavedRef.current = false;

      eraserTrailRef.current = [];
      delete canvas.dataset.interaction;

      if (
        activePointerIdRef.current !== null &&
        canvas.hasPointerCapture?.(activePointerIdRef.current)
      ) {
        canvas.releasePointerCapture?.(activePointerIdRef.current);
      }

      activePointerIdRef.current = null;
      canvas.style.cursor = "";
    };

    const doubleClick = (e) => {
      const camera = cameraRef.current;
      const pointer = pointerToCanvas(e, canvas);
      const pos = screenToWorld(pointer.x, pointer.y, camera);
      const shape = getShapeAt(pos.x, pos.y);

      if (shape?.type !== "text") return;

      e.preventDefault();
      selectedRef.current = [shape];

      showTextEditor(
        {
          shapeId: shape.id,
          screenX: (shape.x + camera.x) * camera.zoom,
          screenY: (shape.y + camera.y) * camera.zoom,
          worldX: shape.x,
          worldY: shape.y,
          value: shape.text,
          width: Math.max(220, shape.width * camera.zoom),
          height: Math.max(60, shape.height * camera.zoom),
          fontSize: (shape.fontSize || 28) * camera.zoom,
          color: shape.fill || shape.stroke,
          opacity: shape.opacity ?? 1,
        },
        true,
      );
    };

    const wheel = (e) => {
      e.preventDefault();

      const camera = cameraRef.current;

      if (!e.ctrlKey) {
        panCamera(camera, -e.deltaX, -e.deltaY);

        return;
      }

      const pointer = pointerToCanvas(e, canvas);
      const before = screenToWorld(pointer.x, pointer.y, camera);

      camera.zoom *= e.deltaY > 0 ? 0.98 : 1.02;
      camera.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, camera.zoom));

      const after = screenToWorld(pointer.x, pointer.y, camera);

      zoomCamera(camera, before, after);
    };

    const keyDown = (e) => {
      const target = e.target;

      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        spacePressedRef.current = true;
        canvas.style.cursor = "grab";
        return;
      }

      if (e.key === "Escape") {
        selectedRef.current = [];
        selectionBoxRef.current = null;
        return;
      }

      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) &&
        selectedRef.current.length
      ) {
        e.preventDefault();

        if (!nudgeActiveRef.current) {
          saveHistory();
          nudgeActiveRef.current = true;
        }

        const distance = e.shiftKey ? 10 : 1;
        const dx =
          e.key === "ArrowLeft"
            ? -distance
            : e.key === "ArrowRight"
              ? distance
              : 0;
        const dy =
          e.key === "ArrowUp"
            ? -distance
            : e.key === "ArrowDown"
              ? distance
              : 0;

        selectedRef.current.forEach((shape) => moveShape(shape, dx, dy));
        return;
      }

      if (TOOL_SHORTCUTS[e.key] && !e.ctrlKey && !e.metaKey) {
        setTool(TOOL_SHORTCUTS[e.key]);
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
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

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        copySelected();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        pasteClipboard();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        copySelected();
        pasteClipboard();
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "x"
      ) {
        e.preventDefault();

        clearCanvas();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();

        if (e.shiftKey) {
          ref.current?.redo();
        } else {
          ref.current?.undo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();

        ref.current?.redo();
      }
    };

    const keyUp = (e) => {
      if (e.code === "Space") {
        spacePressedRef.current = false;

        if (!panningRef.current) {
          canvas.style.cursor = "";
        }
      }

      if (e.key.startsWith("Arrow")) {
        nudgeActiveRef.current = false;
      }
    };

    const preventContextMenu = (e) => e.preventDefault();

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("dblclick", doubleClick);
    canvas.addEventListener("contextmenu", preventContextMenu);

    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerUp);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    canvas.addEventListener("wheel", wheel, {
      passive: false,
    });

    return () => {
      cancelAnimationFrame(frame);

      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", pointerUp);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);

      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("dblclick", doubleClick);
      canvas.removeEventListener("contextmenu", preventContextMenu);
      canvas.removeEventListener("wheel", wheel);
    };
  }, [ref, setTool, bgColor, onZoomChange]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="canvas"
        data-tool={tool}
        aria-label="Drawing canvas"
      />

      {textEditor ? (
        <textarea
          ref={textInputRef}
          className="canvas-text-input"
          autoFocus
          spellCheck={false}
          defaultValue={textEditor.value}
          placeholder="Type something…"
          title="Ctrl or Cmd + Enter to finish · Escape to cancel"
          style={{
            left: `${textEditor.screenX}px`,
            top: `${textEditor.screenY}px`,
            width: `${textEditor.width}px`,
            height: `${textEditor.height}px`,
            fontSize: `${textEditor.fontSize}px`,
            color: textEditor.color || drawingColor || getCanvasInkColor(bgColor),
            caretColor: textEditor.color || drawingColor || getCanvasInkColor(bgColor),
            opacity: textEditor.opacity ?? drawingOpacity,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();

            if (e.key === "Escape") {
              cancelTextEditRef.current = true;
              setTextEditor(null);
            }

            if (
              e.key === "Enter" &&
              (e.ctrlKey || e.metaKey)
            ) {
              e.preventDefault();
              e.target.blur();
            }
          }}
          onInput={(e) => {
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = `${Math.min(
              360,
              Math.max(60, e.currentTarget.scrollHeight),
            )}px`;
          }}
          onBlur={(e) => {
            if (cancelTextEditRef.current) {
              cancelTextEditRef.current = false;
              return;
            }

            const value = e.target.value.trim();
            const camera = cameraRef.current;
            const width = e.target.offsetWidth / camera.zoom;
            const height = e.target.offsetHeight / camera.zoom;
            const existingShape = textEditor.shapeId
              ? shapesRef.current.find(
                  (shape) => shape.id === textEditor.shapeId,
                )
              : null;

            if (existingShape) {
              if (
                value !== existingShape.text ||
                width !== existingShape.width ||
                height !== existingShape.height
              ) {
                saveHistory();

                if (value) {
                  existingShape.text = value;
                  existingShape.width = width;
                  existingShape.height = height;
                } else {
                  shapesRef.current = shapesRef.current.filter(
                    (shape) => shape !== existingShape,
                  );
                  selectedRef.current = [];
                }
              }
            } else if (value) {
              saveHistory();

              const shape = getShape("text").create(
                textEditor.worldX,
                textEditor.worldY,
                value,
                width,
                height,
              );
              shape.stroke = drawingColorRef.current;
              shape.fill = drawingColorRef.current;
              shape.strokeWidth = strokeWidthRef.current;
              shape.opacity = drawingOpacityRef.current;

              shapesRef.current.push(shape);
            }

            setTextEditor((prev) => (prev === textEditor ? null : prev));
          }}
        />
      ) : null}
    </>
  );
  },
);

export default Canvas;
