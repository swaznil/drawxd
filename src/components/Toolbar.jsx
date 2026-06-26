import {
  MousePointer2,
  Hand,
  Pencil,
  Eraser,
  Square,
  Circle,
  Type,
  Minus,
  Trash2,
} from "lucide-react";

const tools = [
  { key: "select", icon: MousePointer2, label: "Pointer" },
  { key: "pan", icon: Hand, label: "Pan" },
  { key: "pencil", icon: Pencil, label: "Pencil" },
  { key: "eraser", icon: Eraser, label: "Eraser" },
  { key: "rect", icon: Square, label: "Rectangle" },
  { key: "ellipse", icon: Circle, label: "Ellipse" },
  { key: "line", icon: Minus, label: "Line" },
  { key: "text", icon: Type, label: "Text" },
];

export default function Toolbar({ tool, setTool, onClear }) {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        {tools.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              className={`tool-btn ${tool === item.key ? "active" : ""}`}
              onClick={() => setTool(item.key)}
              title={item.label}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>

      <div className="toolbar-divider" />

      <button
        className="tool-btn danger"
        onClick={onClear}
        title="Clear Canvas"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
