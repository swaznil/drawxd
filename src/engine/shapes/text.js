import { Type } from "lucide-react";

export default {
  type: "text",
  label: "Text",
  icon: Type,

  create(x, y, text = "", width = 260, height = 80) {
    return {
      id: crypto.randomUUID(),
      type: "text",
      x,
      y,
      text,
      width,
      height,
      fontSize: 28,
      fill: "#ffffff",
    };
  },

  update() {},

  render(ctx, shape) {
    ctx.save();
    ctx.font = `${shape.fontSize}px Inter`;
    ctx.fillStyle = shape.fill;
    ctx.textBaseline = "top";

    const lineHeight = shape.fontSize * 1.3;
    const lines = shape.text.split("\n");

    lines.forEach((line, i) => {
      ctx.fillText(line, shape.x, shape.y + i * lineHeight);
    });

    ctx.restore();
  },

  hitTest(shape, x, y) {
    return (
      x >= shape.x &&
      x <= shape.x + shape.width &&
      y >= shape.y &&
      y <= shape.y + shape.height
    );
  },

  getBounds(shape) {
    return {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    };
  },
};