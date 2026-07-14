import { Flower2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { storage } from '@/utils/storage'

const KEY = 'front-petals-enabled'
type Petal = {
  x: number
  y: number
  size: number
  speed: number
  drift: number
  rotation: number
}

export const FrontAtmosphere = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [enabled, setEnabled] = useState(
    () => storage.get<boolean>(KEY) ?? true,
  )
  useEffect(() => {
    storage.set(KEY, enabled)
  }, [enabled])
  useEffect(() => {
    if (
      !enabled ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    let frame = 0
    let active = !document.hidden
    let petals: Petal[] = []
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * ratio
      canvas.height = window.innerHeight * ratio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const count = window.innerWidth < 768 ? 12 : 25
      petals = Array.from({ length: count }, (_, index) => ({
        x: (window.innerWidth / count) * index + Math.random() * 60,
        y: Math.random() * window.innerHeight,
        size: 4 + Math.random() * 6,
        speed: 0.25 + Math.random() * 0.45,
        drift: 0.15 + Math.random() * 0.25,
        rotation: Math.random() * Math.PI,
      }))
    }
    const draw = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      context.fillStyle = 'rgba(238,142,167,.58)'
      for (const petal of petals) {
        petal.y += petal.speed
        petal.x += Math.sin(petal.y / 70) * petal.drift
        petal.rotation += 0.006
        if (petal.y > window.innerHeight + 15) {
          petal.y = -15
          petal.x = Math.random() * window.innerWidth
        }
        context.save()
        context.translate(petal.x, petal.y)
        context.rotate(petal.rotation)
        context.beginPath()
        context.ellipse(0, 0, petal.size, petal.size * 0.45, 0, 0, Math.PI * 2)
        context.fill()
        context.restore()
      }
      if (active) frame = requestAnimationFrame(draw)
    }
    const visibility = () => {
      active = !document.hidden
      if (active) {
        cancelAnimationFrame(frame)
        draw()
      }
    }
    resize()
    draw()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', visibility)
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [enabled])
  return (
    <>
      <canvas className="front-petals" ref={canvasRef} aria-hidden="true" />
      <button
        className="front-motion-toggle"
        type="button"
        aria-pressed={enabled}
        onClick={() => setEnabled((value) => !value)}
        title={enabled ? '关闭花瓣动画' : '开启花瓣动画'}
      >
        <Flower2 /> <span>{enabled ? '关闭动画' : '开启动画'}</span>
      </button>
    </>
  )
}
