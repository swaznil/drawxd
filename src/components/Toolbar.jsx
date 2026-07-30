import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Eraser,
  Hand,
  Minus,
  MousePointer2,
  Palette,
  Pencil,
  Redo2,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { getAllShapes } from "../engine/registry";

const baseTools = [
  { key: "select", icon: MousePointer2, label: "Pointer", shortcut: "1" },
  { key: "pan", icon: Hand, label: "Pan", shortcut: "2" },
  { key: "pencil", icon: Pencil, label: "Pencil", shortcut: "3" },
  { key: "line", icon: Minus, label: "Line", shortcut: "4" },
  { key: "eraser", icon: Eraser, label: "Eraser", shortcut: "5" },
  { key: "text", icon: Type, label: "Text", shortcut: "6" },
];

const drawingColors = [
  "#f5f5f4",
  "#1c1917",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

const strokeWidths = [1, 2, 4, 8];

export default function Toolbar({
  tool,
  setTool,
  onClear,
  onUndo,
  onRedo,
  onOpen,
  drawingColor,
  drawingColorAuto,
  onDrawingColorChange,
  strokeWidth,
  onStrokeWidthChange,
  drawingOpacity,
  onDrawingOpacityChange,
}) {
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const shapeDropdownRef = useRef(null);
  const colorPickerRef = useRef(null);

  const shapes = getAllShapes().filter(
    (shape) => !["pencil", "text", "line"].includes(shape.type),
  );
  const mainShape = shapes.find((shape) => shape.type === tool) || shapes[0];
  const MainShapeIcon = mainShape?.icon;

  useEffect(() => {
    const closeOnOutsideClick = (event) => {

      if (!shapeDropdownRef.current?.contains(event.target)) {
        setShapeMenuOpen(false);
      }
      if (!colorPickerRef.current?.contains(event.target)) {
        setColorMenuOpen(false);
      }

    };

    window.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      window.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        {baseTools.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              className={`tool-btn ${tool === item.key ? "active" : ""}`}
              onClick={() => setTool(item.key)}
              title={`${item.label} (${item.shortcut})`}
              aria-label={`${item.label} tool`}
              aria-pressed={tool === item.key}
            >
              <Icon size={18} />
            </button>
          );
        })}

        <div className="shape-dropdown" ref={shapeDropdownRef}>
          <button
            className={`tool-btn ${
              shapes.some((shape) => shape.type === tool) ? "active" : ""
            }`}
            onClick={() => {
              if (!shapeMenuOpen) onOpen?.();
              setShapeMenuOpen(!shapeMenuOpen);
              setColorMenuOpen(false);
            }}
            title={`${mainShape?.label || "Shape"} tool`}
            aria-label="Choose a shape tool"
            aria-expanded={shapeMenuOpen}
          >
            {MainShapeIcon && <MainShapeIcon size={18} />}
            <ChevronDown size={14} />
          </button>

          {shapeMenuOpen && (
            <div className="shape-menu">
              {shapes.map((shape) => {
                const Icon = shape.icon;

                return (
                  <button
                    key={shape.type}
                    className="shape-item"
                    onClick={() => {
                      setTool(shape.type);
                      setShapeMenuOpen(false);
                    }}
                    aria-pressed={tool === shape.type}
                  >
                    <Icon size={16} />
                    <span>{shape.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="color-picker" ref={colorPickerRef}>
        <button
          className={`tool-btn color-trigger ${
            colorMenuOpen ? "active" : ""
          }`}
          onClick={() => {
            if (!colorMenuOpen) onOpen?.();
            setColorMenuOpen(!colorMenuOpen);
            setShapeMenuOpen(false);
          }}
          title="Drawing color"
          aria-label="Choose drawing color"
          aria-expanded={colorMenuOpen}
        >
          <Palette size={17} />
          <span
            className="color-trigger-dot"
            style={{ backgroundColor: drawingColor }}
          />
        </button>

        {colorMenuOpen && (
          <div className="color-menu">
            <div className="color-menu-heading">
              <span>Style</span>
              <span>{Math.round(drawingOpacity * 100)}%</span>
            </div>

            <div className="style-section-label">
              <span>Stroke color</span>
              <span>{drawingColor.toUpperCase()}</span>
            </div>

            <div className="drawing-color-grid">
              {drawingColors.map((color) => {
                const selected = !drawingColorAuto && drawingColor === color;

                return (
                  <button
                    key={color}
                    className={`drawing-color-swatch ${
                      selected ? "active" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => onDrawingColorChange(color)}
                    title={color}
                    aria-label={`Use ${color} for drawing`}
                    aria-pressed={selected}
                  >
                    {selected && <Check size={13} />}
                  </button>
                );
              })}
            </div>

            <div className="color-menu-actions">
              <button
                className={`auto-color-btn ${
                  drawingColorAuto ? "active" : ""
                }`}
                onClick={() => onDrawingColorChange(null)}
              >
                <span className="auto-color-preview" />
                <span>Auto contrast</span>
                {drawingColorAuto && <Check size={14} />}
              </button>

              <label className="custom-drawing-color">
                <span>Custom</span>
                <input
                  type="color"
                  value={drawingColor}
                  onChange={(event) =>
                    onDrawingColorChange(event.target.value)
                  }
                  aria-label="Choose a custom drawing color"
                />
              </label>
            </div>

            <div className="style-divider" />

            <div className="style-section-label">
              <span>Stroke width</span>
              <span>{strokeWidth}px</span>
            </div>

            <div className="stroke-width-options">
              {strokeWidths.map((width) => (
                <button
                  key={width}
                  className={`stroke-width-btn ${
                    strokeWidth === width ? "active" : ""
                  }`}
                  onClick={() => onStrokeWidthChange(width)}
                  aria-label={`Use ${width} pixel stroke width`}
                  aria-pressed={strokeWidth === width}
                >
                  <span style={{ height: `${width}px` }} />
                </button>
              ))}
            </div>

            <div className="style-section-label opacity-label">
              <span>Opacity</span>
              <span>{Math.round(drawingOpacity * 100)}%</span>
            </div>

            <input
              className="opacity-slider"
              type="range"
              min="10"
              max="100"
              step="5"
              value={Math.round(drawingOpacity * 100)}
              onChange={(event) =>
                onDrawingOpacityChange(Number(event.target.value) / 100)
              }
              aria-label="Drawing opacity"
            />
          </div>
        )}
      </div>

      <button
        className="tool-btn"
        onClick={onUndo}
        title="Undo (Ctrl Z)"
        aria-label="Undo"
      >
        <Undo2 size={18} />
      </button>

      <button
        className="tool-btn"
        onClick={onRedo}
        title="Redo (Ctrl Y)"
        aria-label="Redo"
      >
        <Redo2 size={18} />
      </button>

      <button
        className="tool-btn danger"
        onClick={onClear}
        title="Clear canvas (Ctrl Shift X)"
        aria-label="Clear canvas"
      >

        <Trash2 size={18} />
      </button>
    </div>
  );
}
