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
  const lastRef = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    clear() {
      shapesRef.current = [];
      selectedShapeRef.current = null;
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
    let animationFrame;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawGrid(ctx, cameraRef.current, canvas.width, canvas.height);

      drawShapes(
        ctx,
        cameraRef.current,
        shapesRef.current,
        selectedShapeRef.current,
      );

      animationFrame = requestAnimationFrame(render);
    };

    render();

    const getShapeAt = (x, y) => {
      for (let i = shapesRef.current.length - 1; i >= 0; i--) {
        const s = shapesRef.current[i];

        if (
          x >= Math.min(s.x, s.x + s.width) &&
          x <= Math.max(s.x, s.x + s.width) &&
          y >= Math.min(s.y, s.y + s.height) &&
          y <= Math.max(s.y, s.y + s.height)
        ) {
          return s;
        }
      }

      return null;
    };

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
          draggingRef.current = true;
        }

        return;
      }

      if (tool === "eraser") {
        const shape = getShapeAt(pos.x, pos.y);

        if (shape) {
          shapesRef.current = shapesRef.current.filter(
            (s) => s.id !== shape.id,
          );
        }

        return;
      }

      drawingRef.current = true;

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
        const text = prompt("Text");

        if (text) {
          shapesRef.current.push({
            id: crypto.randomUUID(),
            type: "text",
            x: pos.x,
            y: pos.y,
            text,
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
        selectedShapeRef.current.x = pos.x - selectedShapeRef.current.width / 2;

        selectedShapeRef.current.y =
          pos.y - selectedShapeRef.current.height / 2;
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
      camera.zoom *= e.deltaY > 0 ? 0.9 : 1.1;

      if (camera.zoom < 0.2) {
        camera.zoom = 0.2;
      }

      if (camera.zoom > 5) {
        camera.zoom = 5;
      }
    };

    const keyDown = (e) => {
      if (e.key === "Delete" && selectedShapeRef.current) {
        shapesRef.current = shapesRef.current.filter(
          (s) => s.id !== selectedShapeRef.current.id,
        );
        selectedShapeRef.current = null;
      }
    };

    canvas.addEventListener("pointerdown", pointerDown);

    window.addEventListener("pointermove", pointerMove);

    window.addEventListener("pointerup", pointerUp);

    window.addEventListener("keydown", keyDown);

    canvas.addEventListener("wheel", wheel, { passive: false });

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener("resize", resize);

      window.removeEventListener("pointermove", pointerMove);

      window.removeEventListener("pointerup", pointerUp);

      window.removeEventListener("keydown", keyDown);

      canvas.removeEventListener("pointerdown", pointerDown);

      canvas.removeEventListener("wheel", wheel);
    };
  }, [tool]);

  return <canvas ref={canvasRef} className="canvas" />;
});

export default Canvas;