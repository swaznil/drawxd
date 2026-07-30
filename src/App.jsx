import { useRef, useState } from "react";
import {
  Menu,
  Download,
  FolderOpen,
  Link2,
  Info,
  Save,
  Sun,
  Moon,
  Keyboard,
  RotateCcw,
} from "lucide-react";
import Toolbar from "./components/Toolbar";
import Canvas from "./engine/Canvas";
import { getCanvasInkColor } from "./engine/color";

const bgPresets = ["#111111", "#0b1220", "#1a1a2e", "#fafafa", "#f1f0e8"];

const shortcutsList = [
  { keys: "1-6", label: "Switch tool" },
  { keys: "Ctrl Z", label: "Undo" },
  { keys: "Ctrl Y", label: "Redo" },
  { keys: "Ctrl C", label: "Copy" },
  { keys: "Ctrl V", label: "Paste" },
  { keys: "Ctrl D", label: "Duplicate" },
  { keys: "Ctrl A", label: "Select all" },
  { keys: "Shift Click", label: "Add to selection" },
  { keys: "Arrow", label: "Nudge selection" },
  { keys: "Space Drag", label: "Pan canvas" },
  { keys: "Delete", label: "Delete selected" },
  { keys: "Ctrl Shift X", label: "Clear canvas" },
];

const DEFAULT_THEME = "dark";
const DEFAULT_BG = "#111111";

export default function App() {
  const [tool, setTool] = useState("select");
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [drawingColor, setDrawingColor] = useState(null);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [drawingOpacity, setDrawingOpacity] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportWidth, setExportWidth] = useState(1920);
  const [exportHeight, setExportHeight] = useState(1080);
  const [exportTransparent, setExportTransparent] = useState(false);
  const [exportFormat, setExportFormat] = useState("png");
  const [exportQuality, setExportQuality] = useState(0.9);
  const [zoomLabel, setZoomLabel] = useState("100%");
  const [localSaveStatus, setLocalSaveStatus] = useState("saved");
  const [notice, setNotice] = useState("");

  const canvasRef = useRef(null);
  const importInputRef = useRef(null);
  const noticeTimerRef = useRef(null);

  const clearCanvas = () => {
    canvasRef.current?.clear();
  };

  const undo = () => {
    canvasRef.current?.undo();
  };

  const redo = () => {
    canvasRef.current?.redo();
  };

  const showNotice = (message) => {
    setNotice(message);
    window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(
      () => setNotice(""),
      3200,
    );
  };

  const handleExport = async () => {
    try {
      await canvasRef.current?.exportImage({
        width: exportWidth,
        height: exportHeight,
        format: exportFormat,
        transparent: exportTransparent,
        quality: exportQuality,
      });
      setExportOpen(false);
      showNotice(`Exported ${exportFormat.toUpperCase()} image`);
    } catch (error) {
      showNotice(error.message || "Could not export this image");
    }
  };

  const saveProject = () => {
    canvasRef.current?.saveProject();
    setMenuOpen(false);
    showNotice("Project file saved");
  };

  const openProject = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const result = await canvasRef.current?.importProject(file);
      setMenuOpen(false);
      showNotice(
        `Opened ${result.shapeCount} ${
          result.shapeCount === 1 ? "object" : "objects"
        }`,
      );
    } catch (error) {
      showNotice(error.message || "Could not open this project");
    }
  };

  const resetAppearance = () => {
    setTheme(DEFAULT_THEME);
    setBgColor(DEFAULT_BG);
    setDrawingColor(null);
  };

  const activeDrawingColor = drawingColor || getCanvasInkColor(bgColor);

  const changeDrawingColor = (color) => {
    setDrawingColor(color);
    canvasRef.current?.setSelectedStyle({ color });
  };

  const changeStrokeWidth = (width) => {
    setStrokeWidth(width);
    canvasRef.current?.setSelectedStyle({ strokeWidth: width });
  };

  const changeDrawingOpacity = (opacity) => {
    setDrawingOpacity(opacity);
    canvasRef.current?.setSelectedStyle({ opacity });
  };

  return (
    <div className={`app theme-${theme}`}>
      <Toolbar
        tool={tool}
        setTool={setTool}
        onClear={clearCanvas}
        onUndo={undo}
        onRedo={redo}
        drawingColor={activeDrawingColor}
        drawingColorAuto={drawingColor === null}
        onDrawingColorChange={changeDrawingColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={changeStrokeWidth}
        drawingOpacity={drawingOpacity}
        onDrawingOpacityChange={changeDrawingOpacity}
      />

      <div className="top-menu">
        <button
          className="tool-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          title="Menu"
        >
          <Menu size={18} />
        </button>

        {menuOpen && (
          <div className="top-menu-panel">
            <button className="shape-item" onClick={saveProject}>
              <Save size={16} />
              <span>Save project</span>
            </button>

            <button
              className="shape-item"
              onClick={() => importInputRef.current?.click()}
            >
              <FolderOpen size={16} />
              <span>Open project</span>
            </button>

            <button
              className="shape-item"
              onClick={() => {
                setExportOpen(true);
                setMenuOpen(false);
              }}
            >
              <Download size={16} />
              <span>Export Image</span>
            </button>

            <div className="top-menu-divider" />

            <button
              className="shape-item"
              onClick={() => {
                setAboutOpen(true);
                setMenuOpen(false);
              }}
            >
              <Info size={16} />
              <span>About</span>
            </button>

            <a
              className="shape-item"
              href="https://github.com/swaznil/drawxd"
              target="_blank"
              rel="noreferrer"
            >
              <Link2 size={16} />
              <span>GitHub</span>
            </a>

            <div className="top-menu-divider" />

            <button
              className="shape-item"
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
            >
              {theme === "dark" ? (
                <Sun size={16} />
              ) : (
                <Moon size={16} />
              )}
              <span>
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            </button>

            <div className="top-menu-label">
              Canvas background
              <span className="top-menu-label-value">{bgColor}</span>
            </div>

            <div className="bg-swatches">
              {bgPresets.map((color) => (
                <button
                  key={color}
                  className={`bg-swatch ${
                    bgColor === color ? "active" : ""
                  }`}
                  style={{ background: color }}
                  onClick={() => setBgColor(color)}
                  title={color}
                />
              ))}

              <input
                type="color"
                className="bg-swatch-custom"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                title="Custom color"
              />
            </div>

            <div className="top-menu-divider" />

            <button className="shape-item" onClick={resetAppearance}>
              <RotateCcw size={16} />
              <span>Reset appearance</span>
            </button>
          </div>
        )}
      </div>

      <Canvas
        ref={canvasRef}
        tool={tool}
        setTool={setTool}
        bgColor={bgColor}
        drawingColor={drawingColor}
        strokeWidth={strokeWidth}
        drawingOpacity={drawingOpacity}
        onZoomChange={setZoomLabel}
        onBackgroundChange={setBgColor}
        onSaveStatusChange={setLocalSaveStatus}
      />

      <div className="zoom-indicator">
        <span>{zoomLabel}</span>
        <span
          className={`local-save-status status-${localSaveStatus}`}
        >
          {localSaveStatus === "saving"
            ? "Saving..."
            : localSaveStatus === "error"
              ? "Local save unavailable"
              : "Saved locally"}
        </span>
      </div>

      <input
        ref={importInputRef}
        className="project-file-input"
        type="file"
        accept=".drawxd,.json,application/json"
        onChange={openProject}
        tabIndex={-1}
      />

      {notice && (
        <div className="app-notice" role="status">
          {notice}
        </div>
      )}

      <div className="shortcuts-hint">
        {shortcutsOpen && (
          <div className="shortcuts-panel">
            {shortcutsList.map((s) => (
              <div key={s.label} className="shortcuts-row">
                <span className="shortcuts-key">{s.keys}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <button
          className="tool-btn"
          onClick={() => setShortcutsOpen(!shortcutsOpen)}
          title="Keyboard shortcuts"
        >
          <Keyboard size={18} />
        </button>
      </div>

      {exportOpen && (
        <div
          className="modal-overlay"
          onClick={() => setExportOpen(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Export image</h3>

            <label className="modal-field">
              Format
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="png">PNG — lossless</option>
                <option value="jpeg">JPEG — smaller file</option>
                <option value="webp">WebP — modern format</option>
              </select>
            </label>

            <div className="modal-fields">
              <label className="modal-field">
                Width
                <input
                  type="number"
                  min="1"
                  max="8192"
                  value={exportWidth}
                  onChange={(e) =>
                    setExportWidth(Number(e.target.value))
                  }
                />
              </label>

              <label className="modal-field">
                Height
                <input
                  type="number"
                  min="1"
                  max="8192"
                  value={exportHeight}
                  onChange={(e) =>
                    setExportHeight(Number(e.target.value))
                  }
                />
              </label>
            </div>

            <label className="modal-checkbox">
              <input
                type="checkbox"
                checked={exportTransparent}
                disabled={exportFormat === "jpeg"}
                onChange={(e) =>
                  setExportTransparent(e.target.checked)
                }
              />
              Transparent background
              {exportFormat === "jpeg" && (
                <span className="field-note">Not available for JPEG</span>
              )}
            </label>

            {exportFormat !== "png" && (
              <label className="modal-field">
                Quality
                <div className="quality-control">
                  <input
                    type="range"
                    min="40"
                    max="100"
                    step="5"
                    value={Math.round(exportQuality * 100)}
                    onChange={(e) =>
                      setExportQuality(Number(e.target.value) / 100)
                    }
                  />
                  <span>{Math.round(exportQuality * 100)}%</span>
                </div>
              </label>
            )}

            <div className="modal-actions">
              <button
                className="modal-btn"
                onClick={() => setExportOpen(false)}
              >
                Cancel
              </button>

              <button
                className="modal-btn primary"
                onClick={handleExport}
                disabled={!exportWidth || !exportHeight}
              >
                Export {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {aboutOpen && (
        <div
          className="modal-overlay"
          onClick={() => setAboutOpen(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>drawxd</h3>

            <p className="about-text">
              Experimenting on building a whiteboard with infinite canvas 
            </p>

            <a
              className="shape-item"
              href="https://github.com/swaznil/drawxd"
              target="_blank"
              rel="noreferrer"
            >
              <Link2 size={16} />
              <span>View on GitHub</span>
            </a>

            <div className="modal-actions">
              <button
                className="modal-btn primary"
                onClick={() => setAboutOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
