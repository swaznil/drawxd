import { Type } from "lucide-react";

export default {
  type: "text",
  label: "Text",
  icon: Type,

  create(x, y) {
    const text = prompt("Enter text");

    return {
      id: crypto.randomUUID(),
      type: "text",
      x,
      y,
      text: text || "Text",
    };
  },

  update() {},

  move(shape, dx, dy) {
    shape.x += dx;
    shape.y += dy;
  },

  render(ctx, shape) {
    ctx.fillStyle = "white";

    ctx.font = "16px sans-serif";

    ctx.fillText(shape.text, shape.x, shape.y);
  },

  hitTest(shape, x, y) {
    return (
      x >= shape.x &&
      x <= shape.x + 100 &&
      y >= shape.y - 20 &&
      y <= shape.y + 5
    );
  },
};