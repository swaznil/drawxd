import { Heart } from "lucide-react";

export default {
  type: "heart",
  label: "Heart",
  icon: Heart,
  
  create(x, y) {
    return {
      id: crypto.randomUUID(),
      type: "heart",
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
    const x = shape.x;
    const y = shape.y;
    const w = shape.width;
    const h = shape.height;

    ctx.beginPath();

    ctx.moveTo(x + w / 2, y + h);

    ctx.bezierCurveTo(
      x + w * 1.2,
      y + h * 0.7,
      x + w * 0.8,
      y,
      x + w / 2,
      y + h * 0.3,
    );

    ctx.bezierCurveTo(
      x + w * 0.2,
      y,
      x - w * 0.2,
      y + h * 0.7,
      x + w / 2,
      y + h,
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