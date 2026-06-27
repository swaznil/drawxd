import { Pencil } from "lucide-react";

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
    shape.points.push(pos);
  },

  move(shape, dx, dy) {
    shape.points = shape.points.map((p) => ({
      x: p.x + dx,
      y: p.y + dy,
    }));
  },

  render(ctx, shape) {
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

  hitTest() {
    return false;
  },
};