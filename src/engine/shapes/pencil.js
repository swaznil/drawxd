import { Pencil } from "lucide-react";
import { distanceToLine } from "../shapeUtils";

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

    if (dx * dx + dy * dy < 4) {
      return;
    }

    shape.points.push(pos);
  },

  render(ctx, shape) {
    if (shape.points.length < 2) {
      return;
    }

    ctx.beginPath();

    shape.points.forEach((p, index) => {
      if (index === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    });

    ctx.stroke();
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