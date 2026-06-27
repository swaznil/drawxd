import { Square } from "lucide-react";

export default {
  type: "rect",
  label: "Rectangle",
  icon: Square,

  

  create(x, y) {
    return {
      id: crypto.randomUUID(),
      type: "rect",
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

    ctx.rect(
      shape.x,
      shape.y,
      shape.width,
      shape.height,
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