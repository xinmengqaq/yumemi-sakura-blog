import { useEffect, useState, type RefObject } from 'react'

export const calculateReadingProgress = (
  articleTop: number,
  articleHeight: number,
  viewportHeight: number,
  scrollY: number,
) => {
  const distance = Math.max(0, articleHeight - viewportHeight)
  if (distance === 0) return scrollY < articleTop ? 0 : 100
  if (scrollY <= articleTop) return 0
  return Math.min(100, Math.max(0, ((scrollY - articleTop) / distance) * 100))
}

export const useReadingProgress = (ref: RefObject<HTMLElement | null>) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const element = ref.current
        if (!element) return
        const top = element.getBoundingClientRect().top + window.scrollY
        setProgress(
          calculateReadingProgress(
            top,
            element.offsetHeight,
            window.innerHeight,
            window.scrollY,
          ),
        )
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ref])

  return progress
}
