import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { createCamera } from "./camera";
import {
  attachCanvasEventHandlers,
  createCanvasEventHandlers,
} from "./canvasEvents";
import { getCanvasInkColor } from "./color";
import { drawGrid } from "./grid";
import { drawShapes } from "./renderer";
import {
  createProjectData,
  downloadBlob,
  parseProjectData,
  renderProjectImage,
} from "./project";
import {
  AUTOSAVE_DELAY,
  EXPORT_FORMATS,
  HANDLE_SIZE,
  HISTORY_LIMIT,
  LOCAL_PROJECT_KEY,
  MAX_EXPORT_DIMENSION,
  MAX_PROJECT_FILE_SIZE,
  ZOOM_MIN,
  ZOOM_MAX,
} from "./constants";

import "./shapes/index";
import { getShape } from "./registry";

import {
  getBounds,
  getSelectionBounds,
  invalidateShapeBounds,
  moveShape,
} from "./shapeUtils";

const Canvas = forwardRef(function Canvas(
  {
    tool,
    setTool,
    bgColor,
    drawingColor,
    strokeWidth,
    drawingOpacity,
    onZoomChange,
    onBackgroundChange,
    onSaveStatusChange,
  },
  ref,
) {
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
  const localSaveTimerRef = useRef(null);
  const hasRestoredLocalProjectRef = useRef(false);
  const bgColorRef = useRef(bgColor);
  const previousBackgroundRef = useRef(bgColor);
  const saveStatusCallbackRef = useRef(onSaveStatusChange);
  const zoomCallbackRef = useRef(onZoomChange);
  const applyProjectDataRef = useRef(null);
  const drawSceneRef = useRef(null);
  const renderFrameRef = useRef(null);

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
  drawingColorRef.current = drawingColor || getCanvasInkColor(bgColor);
  strokeWidthRef.current = strokeWidth;
  drawingOpacityRef.current = drawingOpacity;
  bgColorRef.current = bgColor;
  saveStatusCallbackRef.current = onSaveStatusChange;
  zoomCallbackRef.current = onZoomChange;

  const requestRender = () => {
    if (renderFrameRef.current !== null) return;

    renderFrameRef.current = requestAnimationFrame(() => {
      renderFrameRef.current = null;
      drawSceneRef.current?.();
    });
  };

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "";
    }
  }, [tool]);

  const getProjectData = () =>
    createProjectData(shapesRef.current, cameraRef.current, bgColorRef.current);

  const applyProjectData = (project, keepHistory = false) => {
    const validShapes = project.shapes.filter(
      (shape) =>
        shape &&
        typeof shape === "object" &&
        typeof shape.type === "string" &&
        getShape(shape.type),
    );

    if (keepHistory) {
      saveHistory();
    } else {
      historyRef.current = [];
      redoRef.current = [];
    }

    shapesRef.current = structuredClone(validShapes);
    selectedRef.current = [];
    clipboardRef.current = [];

    if (project.camera) {
      cameraRef.current = {
        x: Number.isFinite(project.camera.x) ? project.camera.x : 0,
        y: Number.isFinite(project.camera.y) ? project.camera.y : 0,
        zoom: Math.max(
          ZOOM_MIN,
          Math.min(
            ZOOM_MAX,
            Number.isFinite(project.camera.zoom) ? project.camera.zoom : 1,
          ),
        ),
      };
    }

    if (/^#[0-9a-f]{6}$/i.test(project.background || "")) {
      onBackgroundChange?.(project.background);
    }

    requestRender();
    return validShapes.length;
  };

  applyProjectDataRef.current = applyProjectData;

  const saveLocalProject = () => {
    try {
      localStorage.setItem(LOCAL_PROJECT_KEY, JSON.stringify(getProjectData()));
      saveStatusCallbackRef.current?.("saved");
    } catch {
      saveStatusCallbackRef.current?.("error");
    }
  };

  const scheduleLocalSave = () => {
    if (!hasRestoredLocalProjectRef.current) return;

    saveStatusCallbackRef.current?.("saving");
    window.clearTimeout(localSaveTimerRef.current);
    localSaveTimerRef.current = window.setTimeout(
      saveLocalProject,
      AUTOSAVE_DELAY,
    );
  };

  useEffect(() => {
    if (hasRestoredLocalProjectRef.current) return;

    hasRestoredLocalProjectRef.current = true;

    try {
      const savedProject = localStorage.getItem(LOCAL_PROJECT_KEY);

      if (savedProject) {
        applyProjectDataRef.current(parseProjectData(savedProject));
      }

      saveStatusCallbackRef.current?.("saved");
    } catch {
      localStorage.removeItem(LOCAL_PROJECT_KEY);
      saveStatusCallbackRef.current?.("error");
    }
  }, []);

  useEffect(() => {
    if (previousBackgroundRef.current !== bgColor) {
      previousBackgroundRef.current = bgColor;
      scheduleLocalSave();
    }

    requestRender();
  }, [bgColor]);

  useEffect(() => {
    const saveBeforeLeaving = () => {
      if (hasRestoredLocalProjectRef.current) {
        saveLocalProject();
      }
    };

    window.addEventListener("pagehide", saveBeforeLeaving);

    return () => {
      window.removeEventListener("pagehide", saveBeforeLeaving);
      window.clearTimeout(localSaveTimerRef.current);
    };
  }, []);

  const saveHistory = () => {
    historyRef.current.push(structuredClone(shapesRef.current));

    if (historyRef.current.length > HISTORY_LIMIT) {
      historyRef.current.shift();
    }

    redoRef.current = [];
  };

  const getShapeAt = (x, y) => {
    const hitPadding = 10 / cameraRef.current.zoom;

    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const shape = shapesRef.current[i];
      const bounds = getBounds(shape);

      if (
        x < bounds.x - hitPadding ||
        x > bounds.x + bounds.width + hitPadding ||
        y < bounds.y - hitPadding ||
        y > bounds.y + bounds.height + hitPadding
      ) {
        continue;
      }

      const shapeDef = getShape(shape.type);

      if (shapeDef?.hitTest?.(shape, x, y, hitPadding)) {
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
    if (selectedRef.current.length !== 1 || selectedRef.current[0]?.points) {
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
    scheduleLocalSave();
    requestRender();
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
    scheduleLocalSave();
    requestRender();
  };

  const undo = () => {
    if (!historyRef.current.length) return;

    redoRef.current.push(structuredClone(shapesRef.current));
    shapesRef.current = historyRef.current.pop();
    selectedRef.current = [];
    scheduleLocalSave();
    requestRender();
  };

  const redo = () => {
    if (!redoRef.current.length) return;

    historyRef.current.push(structuredClone(shapesRef.current));
    shapesRef.current = redoRef.current.pop();
    selectedRef.current = [];
    scheduleLocalSave();
    requestRender();
  };

  useImperativeHandle(ref, () => ({
    clear: clearCanvas,
    undo,
    redo,

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
      scheduleLocalSave();
      requestRender();
    },

    async exportImage({ width, height, format, transparent, quality }) {
      if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width < 1 ||
        height < 1 ||
        width > MAX_EXPORT_DIMENSION ||
        height > MAX_EXPORT_DIMENSION
      ) {
        throw new Error(
          `Export dimensions must be between 1 and ${MAX_EXPORT_DIMENSION} pixels.`,
        );
      }

      const selectedFormat = EXPORT_FORMATS[format] || EXPORT_FORMATS.png;
      const canBeTransparent = format !== "jpeg";
      const blob = await renderProjectImage({
        shapes: shapesRef.current,
        width,
        height,
        background: transparent && canBeTransparent ? null : bgColorRef.current,
        defaultStroke: getCanvasInkColor(bgColorRef.current),
        mimeType: selectedFormat.mimeType,
        quality,
      });

      if (!blob) {
        throw new Error("Your browser could not create this image format.");
      }

      if (blob.type && blob.type !== selectedFormat.mimeType) {
        throw new Error(
          `Your browser does not support ${format.toUpperCase()} export.`,
        );
      }

      downloadBlob(blob, `drawxd-drawing.${selectedFormat.extension}`);
    },

    saveProject() {
      const blob = new Blob([JSON.stringify(getProjectData(), null, 2)], {
        type: "application/json",
      });

      downloadBlob(blob, "drawxd-project.drawxd");
    },

    async importProject(file) {
      if (!file || file.size > MAX_PROJECT_FILE_SIZE) {
        throw new Error("Choose a drawxd project smaller than 25 MB.");
      }

      const project = parseProjectData(await file.text());
      const shapeCount = applyProjectData(project, true);

      scheduleLocalSave();
      return { shapeCount, background: project.background };
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let viewportWidth = 0;
    let viewportHeight = 0;

    const resize = () => {
      viewportWidth = Math.max(1, Math.round(canvas.clientWidth));
      viewportHeight = Math.max(1, Math.round(canvas.clientHeight));

      if (
        canvas.width !== viewportWidth ||
        canvas.height !== viewportHeight
      ) {
        canvas.width = viewportWidth;
        canvas.height = viewportHeight;
      }

      requestRender();
    };

    const render = () => {
      ctx.clearRect(0, 0, viewportWidth, viewportHeight);

      drawGrid(
        ctx,
        cameraRef.current,
        viewportWidth,
        viewportHeight,
        bgColorRef.current,
      );

      drawShapes(
        ctx,
        cameraRef.current,
        shapesRef.current,
        selectedRef.current,
        selectionBoxRef.current,
        eraserTrailRef.current,
        getCanvasInkColor(bgColorRef.current),
        viewportWidth,
        viewportHeight,
      );

      const zoomLabel = `${Math.round(cameraRef.current.zoom * 100)}%`;

      if (zoomLabel !== lastZoomLabelRef.current) {
        lastZoomLabelRef.current = zoomLabel;
        zoomCallbackRef.current?.(zoomLabel);
      }
    };

    drawSceneRef.current = render;
    resize();

    window.addEventListener("resize", resize);

    const eventHandlers = createCanvasEventHandlers({
      canvas,
      refs: {
        activePointer: activePointerIdRef,
        camera: cameraRef,
        currentShape: currentShapeRef,
        drawing: drawingRef,
        drawingColor: drawingColorRef,
        drawingOpacity: drawingOpacityRef,
        dragging: draggingRef,
        eraserTrail: eraserTrailRef,
        erasing: erasingRef,
        lastWorld: lastWorldRef,
        nudgeActive: nudgeActiveRef,
        panning: panningRef,
        resizeHandle: resizeHandleRef,
        resizing: resizingRef,
        selected: selectedRef,
        selectionBase: selectionBaseRef,
        selectionBox: selectionBoxRef,
        shapes: shapesRef,
        spacePressed: spacePressedRef,
        strokeWidth: strokeWidthRef,
        tool: toolRef,
        transformHistorySaved: transformHistorySavedRef,
      },
      actions: {
        clearCanvas,
        copySelected,
        getHandleAt,
        getShapeAt,
        pasteClipboard,
        requestRender,
        redo,
        saveHistory,
        scheduleLocalSave,
        setTool,
        showTextEditor,
        undo,
      },
    });
    const detachCanvasEvents = attachCanvasEventHandlers(canvas, eventHandlers);

    return () => {
      if (renderFrameRef.current !== null) {
        cancelAnimationFrame(renderFrameRef.current);
        renderFrameRef.current = null;
      }

      drawSceneRef.current = null;
      window.removeEventListener("resize", resize);
      detachCanvasEvents();
    };
  }, [setTool]);

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
          placeholder="Type something..."
          title="Ctrl or Cmd + Enter to finish; Escape to cancel"
          style={{
            left: `${textEditor.screenX}px`,
            top: `${textEditor.screenY}px`,
            width: `${textEditor.width}px`,
            height: `${textEditor.height}px`,
            fontSize: `${textEditor.fontSize}px`,
            color:
              textEditor.color || drawingColor || getCanvasInkColor(bgColor),
            caretColor:
              textEditor.color || drawingColor || getCanvasInkColor(bgColor),
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

            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
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
            let textChanged = false;
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
                textChanged = true;

                if (value) {
                  existingShape.text = value;
                  existingShape.width = width;
                  existingShape.height = height;
                  invalidateShapeBounds(existingShape);
                } else {
                  shapesRef.current = shapesRef.current.filter(
                    (shape) => shape !== existingShape,
                  );
                  selectedRef.current = [];
                }
              }
            } else if (value) {
              saveHistory();
              textChanged = true;

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

            if (textChanged) {
              scheduleLocalSave();
              requestRender();
            }

            setTextEditor((prev) => (prev === textEditor ? null : prev));
          }}
        />
      ) : null}
    </>
  );
});

export default Canvas;
