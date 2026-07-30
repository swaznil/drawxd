import {
  IMAGE_EXPORT_PADDING,
  PROJECT_APP,
  PROJECT_VERSION,
} from "./constants";
import { getSelectionBounds } from "./shapeUtils";
import { getShape } from "./registry";

export function createProjectData(shapes, camera, background) {
  return {
    app: PROJECT_APP,
    version: PROJECT_VERSION,
    savedAt: new Date().toISOString(),
    background,
    camera: {
      x: camera.x,
      y: camera.y,
      zoom: camera.zoom,
    },
    shapes: structuredClone(shapes),
  };
}

export function parseProjectData(value) {
  const project = typeof value === "string" ? JSON.parse(value) : value;

  if (
    !project ||
    project.app !== PROJECT_APP ||
    !Array.isArray(project.shapes)
  ) {
    throw new Error("This is not a valid drawxd project file.");
  }

  if (project.version > PROJECT_VERSION) {
    throw new Error("This project was created by a newer drawxd version.");
  }

  return project;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function renderProjectImage({
  shapes,
  width,
  height,
  background,
  defaultStroke,
  mimeType,
  quality,
}) {
  const bounds = getSelectionBounds(shapes);
  const sourceWidth = bounds ? bounds.width + IMAGE_EXPORT_PADDING * 2 : width;
  const sourceHeight = bounds
    ? bounds.height + IMAGE_EXPORT_PADDING * 2
    : height;
  const offsetX = bounds ? -bounds.x + IMAGE_EXPORT_PADDING : 0;
  const offsetY = bounds ? -bounds.y + IMAGE_EXPORT_PADDING : 0;
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }

  const scale = Math.min(width / sourceWidth, height / sourceHeight);

  ctx.translate(
    (width - sourceWidth * scale) / 2,
    (height - sourceHeight * scale) / 2,
  );
  ctx.scale(scale, scale);
  ctx.translate(offsetX, offsetY);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  shapes.forEach((shape) => {
    const shapeDefinition = getShape(shape.type);

    if (!shapeDefinition) return;

    ctx.save();
    ctx.globalAlpha = shape.opacity ?? 1;
    ctx.strokeStyle = shape.stroke || defaultStroke;
    ctx.fillStyle = shape.fill || "transparent";
    ctx.lineWidth = shape.strokeWidth || 2;
    shapeDefinition.render(ctx, shape);
    ctx.restore();
  });

  return new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}
