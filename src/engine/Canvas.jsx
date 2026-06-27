import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { createCamera, panCamera, zoomCamera } from "./camera";
import { drawGrid } from "./grid";
import { drawShapes } from "./renderer";
import { screenToWorld } from "./utils";
import {createRect, createEllipse, createLine, createPencil, 
  createText, updateShape, moveShape, getShapeAt,} from "./shapes";

const Canvas = forwardRef(({ tool }, ref) => {
  const canvasRef = useRef(null);
  const cameraRef = useRef(createCamera());
  const shapesRef = useRef([]);
  const currentShapeRef = useRef(null);
  const selectedShapeRef = useRef(null);
  const drawingRef = useRef(false);
  const panningRef = useRef(false);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastRef = useRef({ x: 0, y: 0 });

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
        const shape = getShapeAt(
          shapesRef.current,
          pos.x,
          pos.y,
          cameraRef.current.zoom,
        );

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
        const shape = getShapeAt(
          shapesRef.current,
          pos.x,
          pos.y,
          cameraRef.current.zoom,
        );

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
        const rect = createRect(pos.x, pos.y);

        currentShapeRef.current = rect;
        shapesRef.current.push(rect);
      }

      if (tool === "ellipse") {
        const ellipse = createEllipse(pos.x, pos.y);

        currentShapeRef.current = ellipse;
        shapesRef.current.push(ellipse);
      }

      if (tool === "line") {
        const line = createLine(pos.x, pos.y);

        currentShapeRef.current = line;
        shapesRef.current.push(line);
      }

      if (tool === "pencil") {
        const pencil = createPencil(pos);

        currentShapeRef.current = pencil;
        shapesRef.current.push(pencil);
      }

      if (tool === "text") {
        drawingRef.current = false;

        const text = prompt("Enter text");

        if (text) {
          shapesRef.current.push(createText(pos.x, pos.y, text));
        }
      }
    };

    const pointerMove = (e) => {
      const camera = cameraRef.current;

      const pos = screenToWorld(e.clientX, e.clientY, camera);

      if (panningRef.current) {
        panCamera(
          camera,
          e.clientX - lastRef.current.x,
          e.clientY - lastRef.current.y,
        );

        lastRef.current = {
          x: e.clientX,
          y: e.clientY,
        };
      }

      if (draggingRef.current && selectedShapeRef.current) {
        const shape = selectedShapeRef.current;
        const offset = dragOffsetRef.current;

        moveShape(shape, pos, offset);
      }

      if (drawingRef.current && currentShapeRef.current) {
        const shape = currentShapeRef.current;

        updateShape(shape, pos);
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

      camera.zoom *= e.deltaY > 0 ? 0.9 : 1.1;

      if (camera.zoom < 0.2) camera.zoom = 0.2;
      if (camera.zoom > 5) camera.zoom = 5;

      const mouseAfterZoom = screenToWorld(e.clientX, e.clientY, camera);

      zoomCamera(camera, mouseBeforeZoom, mouseAfterZoom);
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