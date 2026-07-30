export function getCanvasInkColor(bgColor) {
  const value = Number.parseInt(bgColor.replace("#", ""), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

  return luminance > 0.55 ? "#1c1917" : "#f5f5f4";
}
