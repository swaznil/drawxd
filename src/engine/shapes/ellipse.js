import { Circle } from "lucide-react";

export default {
  type: "ellipse",
  label: "Ellipse",
  icon: Circle,

  create(x, y) {
    return {
      id: crypto.randomUUID(),
      type: "ellipse",
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

  move(shape, dx, dy) {
    shape.x += dx;
    shape.y += dy;
  },

  render(ctx, shape) {
    ctx.beginPath();

    ctx.ellipse(
      shape.x + shape.width / 2,
      shape.y + shape.height / 2,
      Math.abs(shape.width / 2),
      Math.abs(shape.height / 2),
      0,
      0,
      Math.PI * 2,
    );

    ctx.fill();
    ctx.stroke();
  },

  hitTest(shape, x, y) {
    return (
      x >= Math.min(shape.x, shape.x + shape.width) &&
      x <= Math.max(shape.x, shape.x + shape.width) &&
      y >= Math.min(shape.y, shape.y + shape.height) &&
      y <= Math.max(shape.y, shape.y + shape.height)
    );
  },
};