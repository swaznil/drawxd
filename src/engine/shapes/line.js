import { Minus } from "lucide-react";
import { distanceToLine } from "../shapeUtils";

export default {
  type: "line",
  label: "Line",
  icon: Minus,

  create(x, y) {
    return {
      id: crypto.randomUUID(),
      type: "line",
      x,
      y,
      width: 0,
      height: 0,
    };
  },

  update(shape, pos) {
    shape.width = pos.x - shape.x;
    shape.height = pos.y - shape.y;
  },

  render(ctx, shape) {
    ctx.beginPath();
    ctx.moveTo(shape.x, shape.y);
    ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
    ctx.stroke();
  },

  hitTest(shape, x, y) {
    return (
      distanceToLine(
        shape.x,
        shape.y,
        shape.x + shape.width,
        shape.y + shape.height,
        x,
        y,
      ) < 8
    );
  },
};
