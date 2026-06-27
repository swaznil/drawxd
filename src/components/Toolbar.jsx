import { useState } from "react";

import {
  MousePointer2,
  Hand,
  Pencil,
  Minus,
  Eraser,
  Type,
  Trash2,
  Undo2,
  Redo2,
  ChevronDown,
} from "lucide-react";

import { getAllShapes } from "../engine/registry";

const baseTools = [
  {
    key: "select",
    icon: MousePointer2,
    label: "Pointer",
    shortcut: "1",
  },

  {
    key: "pan",
    icon: Hand,
    label: "Pan",
    shortcut: "2",
  },

  {
    key: "pencil",
    icon: Pencil,
    label: "Pencil",
    shortcut: "3",
  },

  {
    key: "line",
    icon: Minus,
    label: "Line",
    shortcut: "4",
  },

  {
    key: "eraser",
    icon: Eraser,
    label: "Eraser",
    shortcut: "5",
  },

  {
    key: "text",
    icon: Type,
    label: "Text",
    shortcut: "6",
  },
];

export default function Toolbar({
  tool,
  setTool,
  onClear,
  onUndo,
  onRedo,
}) {
  const [open, setOpen] = useState(false);

  const shapes = getAllShapes().filter(
    (shape) =>
      ![
        "pencil",
        "text",
        "line",
      ].includes(shape.type),
  );

  const mainShape =
    shapes.find((s) => s.type === tool) ||
    shapes[0];

  const MainShapeIcon =
    mainShape?.icon;

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        {baseTools.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              className={`tool-btn ${
                tool === item.key
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setTool(item.key)
              }
              title={`${item.label} (${item.shortcut})`}
            >
              <Icon size={18} />
            </button>
          );
        })}

        {/* SHAPE DROPDOWN */}

        <div className="shape-dropdown">
          <button
            className={`tool-btn ${
              shapes.some(
                (s) =>
                  s.type === tool,
              )
                ? "active"
                : ""
            }`}
            onClick={() =>
              setOpen(!open)
            }
          >
            {MainShapeIcon && (
              <MainShapeIcon size={18} />
            )}

            <ChevronDown size={14} />
          </button>

          {open && (
            <div className="shape-menu">
              {shapes.map((shape) => {
                const Icon =
                  shape.icon;

                return (
                  <button
                    key={shape.type}
                    className="shape-item"
                    onClick={() => {
                      setTool(
                        shape.type,
                      );

                      setOpen(false);
                    }}
                  >
                    <Icon size={16} />

                    <span>
                      {shape.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-divider" />

      <button
        className="tool-btn"
        onClick={onUndo}
        title="Undo (Ctrl Z)"
      >
        <Undo2 size={18} />
      </button>

      <button
        className="tool-btn"
        onClick={onRedo}
        title="Redo (Ctrl Y)"
      >
        <Redo2 size={18} />
      </button>

      <button
        className="tool-btn danger"
        onClick={onClear}
        title="Clear canvas (Ctrl Shift X)"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}