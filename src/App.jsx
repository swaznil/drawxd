import { useRef, useState } from "react";
import {
  Menu,
  Download,
  Link2,
  Info,
  Sun,
  Moon,
  Keyboard,
  RotateCcw,
} from "lucide-react";
import Toolbar from "./components/Toolbar";
import Canvas from "./engine/Canvas";

const bgPresets = ["#111111", "#0b1220", "#1a1a2e", "#fafafa", "#f1f0e8"];

const shortcutsList = [
  { keys: "1-6", label: "Switch tool" },
  { keys: "Ctrl Z", label: "Undo" },
  { keys: "Ctrl Y", label: "Redo" },
  { keys: "Ctrl C", label: "Copy" },
  { keys: "Ctrl V", label: "Paste" },
  { keys: "Ctrl A", label: "Select all" },
  { keys: "Delete", label: "Delete selected" },
  { keys: "Ctrl Shift X", label: "Clear canvas" },
];

const DEFAULT_THEME = "dark";
const DEFAULT_BG = "#111111";

export default function App() {
  const [tool, setTool] = useState("select");
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportWidth, setExportWidth] = useState(1920);
  const [exportHeight, setExportHeight] = useState(1080);
  const [exportTransparent, setExportTransparent] = useState(false);
  const [zoomLabel, setZoomLabel] = useState("100%");

  const canvasRef = useRef(null);

  const clearCanvas = () => {
    canvasRef.current?.clear();
  };

  const undo = () => {
    canvasRef.current?.undo();
  };

  const redo = () => {
    canvasRef.current?.redo();
  };

  const handleExport = () => {
    canvasRef.current?.exportPng(
      exportWidth,
      exportHeight,
      exportTransparent,
    );

    setExportOpen(false);
  };

  const resetAppearance = () => {
    setTheme(DEFAULT_THEME);
    setBgColor(DEFAULT_BG);
  };

  return (
    <div className={`app theme-${theme}`}>
      <Toolbar
        tool={tool}
        setTool={setTool}
        onClear={clearCanvas}
        onUndo={undo}
        onRedo={redo}
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
            <button
              className="shape-item"
              onClick={() => {
                setExportOpen(true);
                setMenuOpen(false);
              }}
            >
              <Download size={16} />
              <span>Export PNG</span>
            </button>

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
        onZoomChange={setZoomLabel}
      />

      <div className="zoom-indicator">
        <span>{zoomLabel}</span>
      </div>

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
            <h3>Export PNG</h3>

            <label className="modal-field">
              Width
              <input
                type="number"
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
                value={exportHeight}
                onChange={(e) =>
                  setExportHeight(Number(e.target.value))
                }
              />
            </label>

            <label className="modal-checkbox">
              <input
                type="checkbox"
                checked={exportTransparent}
                onChange={(e) =>
                  setExportTransparent(e.target.checked)
                }
              />
              Transparent background
            </label>

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
              >
                Export
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