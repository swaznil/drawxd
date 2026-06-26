import { useEffect, useRef } from 'react'

export default function Canvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // background
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} />
}