import { ArrowRight } from "lucide-react";

export default {
  type: "arrow",
  label: "Arrow",
  icon: ArrowRight,

  create(x, y) {
    return {
      id: crypto.randomUUID(),
      type: "arrow",
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
    const x1 = shape.x;
    const y1 = shape.y;

    const x2 = shape.x + shape.width;
    const y2 = shape.y + shape.height;

    ctx.beginPath();

    ctx.moveTo(x1, y1);

    ctx.lineTo(x2, y2);

    ctx.stroke();

    const angle = Math.atan2(y2 - y1, x2 - x1);

    const size = 15;

    ctx.beginPath();

    ctx.moveTo(x2, y2);

    ctx.lineTo(
      x2 - size * Math.cos(angle - Math.PI / 6),
      y2 - size * Math.sin(angle - Math.PI / 6),
    );

    ctx.lineTo(
      x2 - size * Math.cos(angle + Math.PI / 6),
      y2 - size * Math.sin(angle + Math.PI / 6),
    );

    ctx.closePath();

    ctx.fill();
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