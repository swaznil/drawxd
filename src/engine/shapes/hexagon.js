import { Hexagon } from "lucide-react";

export default {
  type: "hexagon",
  label: "Hexagon",
  icon: Hexagon,

  create(x, y) {
    return {
      id: crypto.randomUUID(),
      type: "hexagon",
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
    const w = shape.width;
    const h = shape.height;

    ctx.beginPath();

    ctx.moveTo(shape.x + w * 0.25, shape.y);

    ctx.lineTo(shape.x + w * 0.75, shape.y);

    ctx.lineTo(shape.x + w, shape.y + h * 0.5);

    ctx.lineTo(shape.x + w * 0.75, shape.y + h);

    ctx.lineTo(shape.x + w * 0.25, shape.y + h);

    ctx.lineTo(shape.x, shape.y + h * 0.5);

    ctx.closePath();

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