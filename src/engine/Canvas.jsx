import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { createCamera, panCamera, zoomCamera } from "./camera";
import { drawGrid } from "./grid";
import { drawShapes } from "./renderer";
import { screenToWorld } from "./utils";

import "./shapes/index";

import { getShape } from "./registry";

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

      if (shapeDef?.hitTest(shape, x, y)) {
        return shape;
      }
    }

    return null;
  };

  useImperativeHandle(ref, () => ({
    clear() {
      saveHistory();

      shapesRef.current = [];

      selectedShapeRef.current = null;
    },

    undo() {
      if (historyRef.current.length === 0) return;

      redoRef.current.push(structuredClone(shapesRef.current));

      shapesRef.current = historyRef.current.pop();
    },

    redo() {
      if (redoRef.current.length === 0) return;

      historyRef.current.push(structuredClone(shapesRef.current));

      shapesRef.current = redoRef.current.pop();
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;

    const ctx = canvas.getContext("2d");

    let frame;

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

      frame = requestAnimationFrame(render);
    };

    render();

    const pointerDown = (e) => {
      const camera = cameraRef.current;

      const pos = screenToWorld(e.clientX, e.clientY, camera);

      lastRef.current = {
        x: e.clientX,
        y: e.clientY,
      };

      // PAN

      if (tool === "pan" || e.button === 1 || e.button === 2) {
        panningRef.current = true;

        return;
      }

      // SELECT

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

      // ERASER

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

      // DRAW

      const shapeDef = getShape(tool);

      if (!shapeDef) return;

      drawingRef.current = true;

      saveHistory();

      const shape = shapeDef.create(pos.x, pos.y);

      currentShapeRef.current = shape;

      shapesRef.current.push(shape);
    };

    const pointerMove = (e) => {
      const camera = cameraRef.current;

      const pos = screenToWorld(e.clientX, e.clientY, camera);

      // PAN

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

      // DRAG

      if (draggingRef.current && selectedShapeRef.current) {
        const shape = selectedShapeRef.current;

        const offset = dragOffsetRef.current;

        const dx = pos.x - offset.x - shape.x;

        const dy = pos.y - offset.y - shape.y;

        const shapeDef = getShape(shape.type);

        shapeDef?.move(shape, dx, dy);
      }

      // DRAW UPDATE

      if (drawingRef.current && currentShapeRef.current) {
        const shape = currentShapeRef.current;

        const shapeDef = getShape(shape.type);

        shapeDef?.update(shape, pos);
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

      if (camera.zoom < 0.2) {
        camera.zoom = 0.2;
      }

      if (camera.zoom > 5) {
        camera.zoom = 5;
      }

      const mouseAfterZoom = screenToWorld(e.clientX, e.clientY, camera);

      zoomCamera(camera, mouseBeforeZoom, mouseAfterZoom);
    };

    const keyDown = (e) => {
      // DELETE

      if (e.key === "Delete" && selectedShapeRef.current) {
        saveHistory();

        shapesRef.current = shapesRef.current.filter(
          (s) => s.id !== selectedShapeRef.current.id,
        );

        selectedShapeRef.current = null;
      }

      // UNDO REDO

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
      cancelAnimationFrame(frame);

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
