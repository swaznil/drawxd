import { Pencil } from "lucide-react";
import { distanceToLine } from "../shapeUtils";
import { PENCIL_SAMPLE_DISTANCE } from "../constants";

export default {
  type: "pencil",
  label: "Pencil",
  icon: Pencil,

  create(x, y) {
    return {
      id: crypto.randomUUID(),
      type: "pencil",
      points: [{ x, y }],
    };
  },

  update(shape, pos) {
    const last = shape.points[shape.points.length - 1];
    const dx = pos.x - last.x;
    const dy = pos.y - last.y;
    const minDistance = pos.minDistance ?? PENCIL_SAMPLE_DISTANCE;

    if (dx * dx + dy * dy < minDistance * minDistance) {
      return;
    }

    shape.points.push({
      x: pos.x,
      y: pos.y,
      pressure: pos.pressure ?? 0.5,
    });
  },

  render(ctx, shape) {
    if (shape.points.length < 2) {
      return;
    }

    const baseWidth = ctx.lineWidth;

    for (let index = 1; index < shape.points.length; index++) {
      const previous = shape.points[index - 1];
      const point = shape.points[index];
      const beforePrevious = shape.points[index - 2];
      const start = beforePrevious
        ? {
            x: (beforePrevious.x + previous.x) / 2,
            y: (beforePrevious.y + previous.y) / 2,
          }
        : previous;
      const end =
        index === shape.points.length - 1
          ? point
          : {
              x: (previous.x + point.x) / 2,
              y: (previous.y + point.y) / 2,
            };
      const pressure = point.pressure ?? previous.pressure ?? 0.5;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(previous.x, previous.y, end.x, end.y);
      ctx.lineWidth = baseWidth * (0.55 + pressure * 0.9);
      ctx.stroke();
    }

    ctx.lineWidth = baseWidth;
  },

  hitTest(shape, x, y) {
    for (let i = 0; i < shape.points.length - 1; i++) {
      const a = shape.points[i];
      const b = shape.points[i + 1];

      if (distanceToLine(a.x, a.y, b.x, b.y, x, y) < 8) {
        return true;
      }
    }

    return false;
  },
};
