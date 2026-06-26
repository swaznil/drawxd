import { useState } from "react"
import Toolbar from "./components/Toolbar"
import Canvas from "./engine/Canvas"

export default function App() {
  const [tool, setTool] = useState("rect")
  const [clearCounter, setClearCounter] = useState(0)

  return (
    <div className="app">
      <Toolbar
        tool={tool}
        setTool={setTool}
        onClear={() => setClearCounter((count) => count + 1)}
      />
      <Canvas tool={tool} clearSignal={clearCounter} />
    </div>
  )
}
