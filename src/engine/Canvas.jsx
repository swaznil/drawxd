import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { createCamera } from "./camera";
import { drawGrid } from "./grid";
import { drawShapes } from "./renderer";
import { screenToWorld } from "./utils";

const Canvas = forwardRef(({ tool }, ref) => {
  const canvasRef = useRef(null);
  const cameraRef = useRef(createCamera());
  const shapesRef = useRef([]);
  const currentShapeRef = useRef(null);
  const selectedShapeRef = useRef(null);
  const drawingRef = useRef(false);
  const panningRef = useRef(false);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({x: 0,y: 0,});
  const lastRef = useRef({ x: 0, y: 0,});

  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const saveHistory = () => {
    historyRef.current.push(JSON.parse(JSON.stringify(shapesRef.current)));

    if (historyRef.current.length > 100) {
      historyRef.current.shift();
    }

    redoRef.current = [];
  };

  useImperativeHandle(ref, () => ({
    clear() {
      saveHistory();
      shapesRef.current = [];
      selectedShapeRef.current = null;
    },

    undo() {
      if (historyRef.current.length === 0) return;

      redoRef.current.push(JSON.parse(JSON.stringify(shapesRef.current)));

      shapesRef.current = historyRef.current.pop();
    },

    redo() {
      if (redoRef.current.length === 0) return;

      historyRef.current.push(JSON.parse(JSON.stringify(shapesRef.current)));

      shapesRef.current = redoRef.current.pop();
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

    const distanceToLine = (x1, y1, x2, y2, px, py) => {
      const A = px - x1;
      const B = py - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;

      const lenSq = C * C + D * D;

      let param = -1;

      if (lenSq !== 0) {
        param = dot / lenSq;
      }

      let xx;
      let yy;

      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }

      const dx = px - xx;
      const dy = py - yy;

      return Math.sqrt(dx * dx + dy * dy);
    };

    const getShapeAt = (x, y) => {
      for (let i = shapesRef.current.length - 1; i >= 0; i--) {
        const s = shapesRef.current[i];

        if (s.type === "rect" || s.type === "ellipse") {
          if (
            x >= Math.min(s.x, s.x + s.width) &&
            x <= Math.max(s.x, s.x + s.width) &&
            y >= Math.min(s.y, s.y + s.height) &&
            y <= Math.max(s.y, s.y + s.height)
          ) {
            return s;
          }
        }

        if (s.type === "line") {
          const dist = distanceToLine(
            s.x,
            s.y,
            s.x + s.width,
            s.y + s.height,
            x,
            y,
          );

          if (dist < 8 / cameraRef.current.zoom) {
            return s;
          }
        }

        if (s.type === "pencil") {
          for (let p = 0; p < s.points.length - 1; p++) {
            const a = s.points[p];

            const b = s.points[p + 1];

            const dist = distanceToLine(a.x, a.y, b.x, b.y, x, y);

            if (dist < 8 / cameraRef.current.zoom) {
              return s;
            }
          }
        }

        if (s.type === "text") {
          if (
            x >= s.x &&
            x <= s.x + s.width &&
            y >= s.y - s.height &&
            y <= s.y
          ) {
            return s;
          }
        }
      }

      return null;
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawGrid(ctx, cameraRef.current, canvas.width, canvas.height);

      drawShapes(
        ctx,
        cameraRef.current,
        shapesRef.current,
        selectedShapeRef.current,
      );

      requestAnimationFrame(render);
    };

    render();

    const pointerDown = (e) => {
      const camera = cameraRef.current;

      const pos = screenToWorld(e.clientX, e.clientY, camera);

      lastRef.current = {
        x: e.clientX,
        y: e.clientY,
      };

      if (tool === "pan" || e.button === 1 || e.button === 2) {
        panningRef.current = true;

        return;
      }

      if (tool === "select") {
        const shape = getShapeAt(pos.x, pos.y);

        selectedShapeRef.current = shape;

        if (shape) {
          saveHistory();

          draggingRef.current = true;

          dragOffsetRef.current = {
            x: pos.x - shape.x,
            y: pos.y - shape.y,
          };
        }

        return;
      }

      if (tool === "eraser") {
        const shape = getShapeAt(pos.x, pos.y);

        if (shape) {
          saveHistory();

          shapesRef.current = shapesRef.current.filter(
            (s) => s.id !== shape.id,
          );
        }

        return;
      }

      drawingRef.current = true;

      saveHistory();

      if (tool === "rect") {
        const rect = {
          id: crypto.randomUUID(),
          type: "rect",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        };

        currentShapeRef.current = rect;

        shapesRef.current.push(rect);
      }

      if (tool === "ellipse") {
        const ellipse = {
          id: crypto.randomUUID(),
          type: "ellipse",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        };

        currentShapeRef.current = ellipse;

        shapesRef.current.push(ellipse);
      }

      if (tool === "line") {
        const line = {
          id: crypto.randomUUID(),
          type: "line",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
        };

        currentShapeRef.current = line;

        shapesRef.current.push(line);
      }

      if (tool === "pencil") {
        const pencil = {
          id: crypto.randomUUID(),
          type: "pencil",
          points: [pos],
        };

        currentShapeRef.current = pencil;

        shapesRef.current.push(pencil);
      }

      if (tool === "text") {
        drawingRef.current = false;

        const text = prompt("Enter text");

        if (text) {
          shapesRef.current.push({
            id: crypto.randomUUID(),
            type: "text",
            x: pos.x,
            y: pos.y,
            text,
            width: text.length * 9,
            height: 20,
          });
        }
      }
    };

    const pointerMove = (e) => {
      const camera = cameraRef.current;

      const pos = screenToWorld(e.clientX, e.clientY, camera);

      if (panningRef.current) {
        camera.x += (e.clientX - lastRef.current.x) / camera.zoom;

        camera.y += (e.clientY - lastRef.current.y) / camera.zoom;

        lastRef.current = {
          x: e.clientX,
          y: e.clientY,
        };
      }

      if (draggingRef.current && selectedShapeRef.current) {
        const shape = selectedShapeRef.current;

        const offset = dragOffsetRef.current;

        if (shape.type === "pencil") {
          const first = shape.points[0];
          const dx = pos.x - offset.x - first.x;
          const dy = pos.y - offset.y - first.y;

          shape.points = shape.points.map((p) => ({
            x: p.x + dx,
            y: p.y + dy,
          }));
        } else {
          shape.x = pos.x - offset.x;
          shape.y = pos.y - offset.y;
        }
      }

      if (drawingRef.current && currentShapeRef.current) {
        const shape = currentShapeRef.current;

        if (shape.type === "pencil") {
          shape.points.push(pos);
        } else {
          shape.width = pos.x - shape.x;
          shape.height = pos.y - shape.y;
        }
      }
    };

    const pointerUp = () => {
      drawingRef.current = false;

      panningRef.current = false;

      draggingRef.current = false;

      currentShapeRef.current = null;
    };

    const wheel = (e) => {
      e.preventDefault();

      const camera = cameraRef.current;

      const mouseBeforeZoom = screenToWorld(e.clientX, e.clientY, camera);

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

      camera.zoom *= zoomFactor;

      if (camera.zoom < 0.2) {
        camera.zoom = 0.2;
      }

      if (camera.zoom > 5) {
        camera.zoom = 5;
      }
      const mouseAfterZoom = screenToWorld(e.clientX, e.clientY, camera);
      camera.x += mouseAfterZoom.x - mouseBeforeZoom.x;
      camera.y += mouseAfterZoom.y - mouseBeforeZoom.y;
    };

    const keyDown = (e) => {
      if (e.key === "Delete" && selectedShapeRef.current) {
        saveHistory();

        shapesRef.current = shapesRef.current.filter(
          (s) => s.id !== selectedShapeRef.current.id,
        );

        selectedShapeRef.current = null;
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

    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("keydown", keyDown);

      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("wheel", wheel);
    };
  }, [tool, ref]);

  return <canvas ref={canvasRef} className="canvas" />;
});

export default Canvas;