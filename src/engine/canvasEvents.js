import { panCamera, zoomCamera } from "./camera";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_HEIGHT,
  DEFAULT_TEXT_WIDTH,
  PENCIL_SAMPLE_DISTANCE,
  TOOL_SHORTCUTS,
  ZOOM_MAX,
  ZOOM_MIN,
} from "./constants";
import { getShape } from "./registry";
import {
  boundsIntersect,
  getBounds,
  getSelectionBounds,
  moveShape,
  resizeShape,
} from "./shapeUtils";
import { pointerToCanvas, screenToWorld } from "./utils";

const INTERACTIVE_TAGS = new Set([
  "A",
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
]);

export function createCanvasEventHandlers({ canvas, refs, actions }) {
  const {
    activePointer,
    camera,
    currentShape,
    drawing,
    drawingColor,
    drawingOpacity,
    eraserTrail,
    erasing,
    dragging,
    lastWorld,
    nudgeActive,
    panning,
    resizeHandle,
    resizing,
    selected,
    selectionBase,
    selectionBox,
    shapes,
    spacePressed,
    strokeWidth,
    tool,
    transformHistorySaved,
  } = refs;
  const {
    clearCanvas,
    copySelected,
    getHandleAt,
    getShapeAt,
    pasteClipboard,
    redo,
    saveHistory,
    scheduleLocalSave,
    setTool,
    showTextEditor,
    undo,
  } = actions;

  const getWorldPointer = (event, minimumDistance = PENCIL_SAMPLE_DISTANCE) => {
    const pointer = pointerToCanvas(event, canvas);

    return {
      ...screenToWorld(pointer.x, pointer.y, camera.current),
      pressure: pointer.pressure,
      minDistance: minimumDistance / camera.current.zoom,
    };
  };

  const pointerDown = (event) => {
    if (!event.isPrimary) return;

    if (
      activePointer.current !== null &&
      activePointer.current !== event.pointerId
    ) {
      return;
    }

    activePointer.current = event.pointerId;
    canvas.setPointerCapture?.(event.pointerId);

    const currentTool = tool.current;
    const position = getWorldPointer(event);

    lastWorld.current = position;

    if (
      currentTool === "pan" ||
      spacePressed.current ||
      event.button === 1 ||
      event.button === 2
    ) {
      panning.current = true;
      canvas.dataset.interaction = "grabbing";
      return;
    }

    if (currentTool === "eraser") {
      saveHistory();
      erasing.current = true;
      eraserTrail.current = [position];
      return;
    }

    if (currentTool === "select") {
      const handle = getHandleAt(position.x, position.y);

      if (handle) {
        resizing.current = true;
        resizeHandle.current = handle;
        transformHistorySaved.current = false;
        return;
      }

      const hit = getShapeAt(position.x, position.y);

      if (event.shiftKey && hit) {
        selected.current = selected.current.includes(hit)
          ? selected.current.filter((shape) => shape !== hit)
          : [...selected.current, hit];
        return;
      }

      const selectionBounds = getSelectionBounds(selected.current);

      if (
        selectionBounds &&
        position.x >= selectionBounds.x &&
        position.x <= selectionBounds.x + selectionBounds.width &&
        position.y >= selectionBounds.y &&
        position.y <= selectionBounds.y + selectionBounds.height
      ) {
        dragging.current = true;
        transformHistorySaved.current = false;
        canvas.dataset.interaction = "moving";
        return;
      }

      if (hit) {
        if (!selected.current.includes(hit)) {
          selected.current = [hit];
        }

        dragging.current = true;
        transformHistorySaved.current = false;
        canvas.dataset.interaction = "moving";
        return;
      }

      selectionBase.current = event.shiftKey ? [...selected.current] : [];
      selectionBox.current = {
        x: position.x,
        y: position.y,
        width: 0,
        height: 0,
      };

      if (!event.shiftKey) {
        selected.current = [];
      }

      return;
    }

    if (currentTool === "text") {
      event.preventDefault();
      showTextEditor({
        screenX: event.clientX,
        screenY: event.clientY,
        worldX: position.x,
        worldY: position.y,
        value: "",
        width: DEFAULT_TEXT_WIDTH,
        height: DEFAULT_TEXT_HEIGHT,
        fontSize: DEFAULT_FONT_SIZE,
      });
      return;
    }

    const shapeDefinition = getShape(currentTool);

    if (!shapeDefinition) return;

    saveHistory();

    const shape = shapeDefinition.create(position.x, position.y);

    shape.stroke = drawingColor.current;
    shape.strokeWidth = strokeWidth.current;
    shape.opacity = drawingOpacity.current;

    if (shape.points?.[0]) {
      shape.points[0].pressure = position.pressure;
    }

    shapes.current.push(shape);
    currentShape.current = shape;
    drawing.current = true;
  };

  const pointerMove = (event) => {
    if (!event.isPrimary) return;

    const hoverPosition = getWorldPointer(event);

    if (activePointer.current === null) {
      if (spacePressed.current) {
        canvas.style.cursor = "grab";
        return;
      }

      if (tool.current === "select") {
        const handle = getHandleAt(hoverPosition.x, hoverPosition.y);

        if (handle === "tl" || handle === "br") {
          canvas.style.cursor = "nwse-resize";
        } else if (handle === "tr" || handle === "bl") {
          canvas.style.cursor = "nesw-resize";
        } else if (getShapeAt(hoverPosition.x, hoverPosition.y)) {
          canvas.style.cursor = "move";
        } else {
          canvas.style.cursor = "default";
        }
      }

      return;
    }

    if (activePointer.current !== event.pointerId) return;

    const samples =
      (drawing.current || erasing.current) &&
      typeof event.getCoalescedEvents === "function"
        ? event.getCoalescedEvents()
        : [event];
    const pointerSamples = samples.length ? samples : [event];

    pointerSamples.forEach((sample) => {
      const position = getWorldPointer(sample);
      const dx = position.x - lastWorld.current.x;
      const dy = position.y - lastWorld.current.y;

      lastWorld.current = position;

      if (
        (dragging.current || resizing.current) &&
        !transformHistorySaved.current &&
        (dx !== 0 || dy !== 0)
      ) {
        saveHistory();
        transformHistorySaved.current = true;
      }

      if (erasing.current) {
        eraserTrail.current.push(position);
        shapes.current = shapes.current.filter((shape) => {
          const shapeDefinition = getShape(shape.type);
          return !shapeDefinition?.hitTest?.(shape, position.x, position.y);
        });
      }

      if (selectionBox.current) {
        selectionBox.current.width += dx;
        selectionBox.current.height += dy;

        const box = getBounds(selectionBox.current);
        const hits = shapes.current.filter((shape) =>
          boundsIntersect(getBounds(shape), box),
        );

        selected.current = [...new Set([...selectionBase.current, ...hits])];
      }

      if (dragging.current) {
        selected.current.forEach((shape) => moveShape(shape, dx, dy));
      }

      if (resizing.current) {
        selected.current.forEach((shape) =>
          resizeShape(shape, resizeHandle.current, dx, dy),
        );
      }

      if (drawing.current && currentShape.current) {
        getShape(currentShape.current.type)?.update(
          currentShape.current,
          position,
        );
      }
    });

    if (panning.current) {
      panCamera(camera.current, event.movementX, event.movementY);
    }
  };

  const pointerUp = (event) => {
    if (
      activePointer.current !== null &&
      event.pointerId !== activePointer.current
    ) {
      return;
    }

    if (drawing.current && currentShape.current) {
      const position = getWorldPointer(event, 0.01);
      getShape(currentShape.current.type)?.update(
        currentShape.current,
        position,
      );
    }

    const projectChanged =
      drawing.current ||
      erasing.current ||
      transformHistorySaved.current ||
      panning.current;

    drawing.current = false;
    dragging.current = false;
    panning.current = false;
    erasing.current = false;
    resizing.current = false;
    currentShape.current = null;
    resizeHandle.current = null;
    selectionBox.current = null;
    selectionBase.current = [];
    transformHistorySaved.current = false;
    eraserTrail.current = [];
    delete canvas.dataset.interaction;

    if (
      activePointer.current !== null &&
      canvas.hasPointerCapture?.(activePointer.current)
    ) {
      canvas.releasePointerCapture?.(activePointer.current);
    }

    activePointer.current = null;
    canvas.style.cursor = "";

    if (projectChanged) {
      scheduleLocalSave();
    }
  };

  const doubleClick = (event) => {
    const pointer = pointerToCanvas(event, canvas);
    const position = screenToWorld(pointer.x, pointer.y, camera.current);
    const shape = getShapeAt(position.x, position.y);

    if (shape?.type !== "text") return;

    event.preventDefault();
    selected.current = [shape];

    showTextEditor(
      {
        shapeId: shape.id,
        screenX: (shape.x + camera.current.x) * camera.current.zoom,
        screenY: (shape.y + camera.current.y) * camera.current.zoom,
        worldX: shape.x,
        worldY: shape.y,
        value: shape.text,
        width: Math.max(220, shape.width * camera.current.zoom),
        height: Math.max(60, shape.height * camera.current.zoom),
        fontSize: (shape.fontSize || DEFAULT_FONT_SIZE) * camera.current.zoom,
        color: shape.fill || shape.stroke,
        opacity: shape.opacity ?? 1,
      },
      true,
    );
  };

  const wheel = (event) => {
    event.preventDefault();

    if (!event.ctrlKey) {
      panCamera(camera.current, -event.deltaX, -event.deltaY);
      scheduleLocalSave();
      return;
    }

    const pointer = pointerToCanvas(event, canvas);
    const before = screenToWorld(pointer.x, pointer.y, camera.current);

    camera.current.zoom *= event.deltaY > 0 ? 0.98 : 1.02;
    camera.current.zoom = Math.max(
      ZOOM_MIN,
      Math.min(ZOOM_MAX, camera.current.zoom),
    );

    const after = screenToWorld(pointer.x, pointer.y, camera.current);

    zoomCamera(camera.current, before, after);
    scheduleLocalSave();
  };

  const keyDown = (event) => {
    const target = event.target;

    if (INTERACTIVE_TAGS.has(target.tagName) || target.isContentEditable) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      spacePressed.current = true;
      canvas.style.cursor = "grab";
      return;
    }

    if (event.key === "Escape") {
      selected.current = [];
      selectionBox.current = null;
      return;
    }

    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) &&
      selected.current.length
    ) {
      event.preventDefault();

      if (!nudgeActive.current) {
        saveHistory();
        nudgeActive.current = true;
      }

      const distance = event.shiftKey ? 10 : 1;
      const dx =
        event.key === "ArrowLeft"
          ? -distance
          : event.key === "ArrowRight"
            ? distance
            : 0;
      const dy =
        event.key === "ArrowUp"
          ? -distance
          : event.key === "ArrowDown"
            ? distance
            : 0;

      selected.current.forEach((shape) => moveShape(shape, dx, dy));
      return;
    }

    if (TOOL_SHORTCUTS[event.key] && !event.ctrlKey && !event.metaKey) {
      setTool(TOOL_SHORTCUTS[event.key]);
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      if (!selected.current.length) return;

      saveHistory();
      shapes.current = shapes.current.filter(
        (shape) => !selected.current.includes(shape),
      );
      selected.current = [];
      scheduleLocalSave();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      selected.current = [...shapes.current];
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
      copySelected();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
      pasteClipboard();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
      event.preventDefault();
      copySelected();
      pasteClipboard();
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      event.key.toLowerCase() === "x"
    ) {
      event.preventDefault();
      clearCanvas();
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();

      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
    }
  };

  const keyUp = (event) => {
    if (event.code === "Space") {
      spacePressed.current = false;

      if (!panning.current) {
        canvas.style.cursor = "";
      }
    }

    if (event.key.startsWith("Arrow")) {
      if (nudgeActive.current) {
        scheduleLocalSave();
      }

      nudgeActive.current = false;
    }
  };

  return {
    doubleClick,
    keyDown,
    keyUp,
    pointerDown,
    pointerMove,
    pointerUp,
    preventContextMenu: (event) => event.preventDefault(),
    wheel,
  };
}

export function attachCanvasEventHandlers(canvas, handlers) {
  canvas.addEventListener("pointerdown", handlers.pointerDown);
  canvas.addEventListener("dblclick", handlers.doubleClick);
  canvas.addEventListener("contextmenu", handlers.preventContextMenu);
  canvas.addEventListener("wheel", handlers.wheel, { passive: false });

  window.addEventListener("pointermove", handlers.pointerMove);
  window.addEventListener("pointerup", handlers.pointerUp);
  window.addEventListener("pointercancel", handlers.pointerUp);
  window.addEventListener("keydown", handlers.keyDown);
  window.addEventListener("keyup", handlers.keyUp);

  return () => {
    canvas.removeEventListener("pointerdown", handlers.pointerDown);
    canvas.removeEventListener("dblclick", handlers.doubleClick);
    canvas.removeEventListener("contextmenu", handlers.preventContextMenu);
    canvas.removeEventListener("wheel", handlers.wheel);

    window.removeEventListener("pointermove", handlers.pointerMove);
    window.removeEventListener("pointerup", handlers.pointerUp);
    window.removeEventListener("pointercancel", handlers.pointerUp);
    window.removeEventListener("keydown", handlers.keyDown);
    window.removeEventListener("keyup", handlers.keyUp);
  };
}
