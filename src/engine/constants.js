export const TOOL_SHORTCUTS = {
  1: "select",
  2: "pan",
  3: "pencil",
  4: "line",
  5: "eraser",
  6: "text",
};

export const HANDLE_SIZE = 10;
export const GRID_SIZE = 50;
export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 5;

export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_DRAWING_OPACITY = 1;
export const DEFAULT_THEME = "dark";
export const DEFAULT_CANVAS_BACKGROUND = "#111111";
export const CANVAS_BACKGROUND_PRESETS = [
  "#111111",
  "#0b1220",
  "#1a1a2e",
  "#fafafa",
  "#f1f0e8",
];
export const DEFAULT_TEXT_WIDTH = 260;
export const DEFAULT_TEXT_HEIGHT = 80;
export const DEFAULT_FONT_SIZE = 28;
export const PENCIL_SAMPLE_DISTANCE = 1.25;
export const HISTORY_LIMIT = 50;

export const PROJECT_APP = "drawxd";
export const PROJECT_VERSION = 1;
export const LOCAL_PROJECT_KEY = "drawxd:autosave:v1";
export const AUTOSAVE_DELAY = 600;
export const MAX_PROJECT_FILE_SIZE = 25 * 1024 * 1024;

export const MAX_EXPORT_DIMENSION = 8192;
export const DEFAULT_EXPORT_WIDTH = 1920;
export const DEFAULT_EXPORT_HEIGHT = 1080;
export const DEFAULT_EXPORT_QUALITY = 0.9;
export const IMAGE_EXPORT_PADDING = 40;
export const EXPORT_FORMATS = {
  png: { mimeType: "image/png", extension: "png" },
  jpeg: { mimeType: "image/jpeg", extension: "jpg" },
  webp: { mimeType: "image/webp", extension: "webp" },
};
