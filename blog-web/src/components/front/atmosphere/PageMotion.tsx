import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

gsap.registerPlugin(useGSAP)

export const PageMotion = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()
  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          ref.current,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        )
        const articleRows = gsap.utils.toArray<HTMLElement>('.article-result')
        if (articleRows.length > 0) {
          gsap.fromTo(
            articleRows,
            { autoAlpha: 0, x: (index) => (index % 2 ? -20 : 20) },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.55,
              stagger: 0.08,
              ease: 'power2.out',
              clearProps: 'transform',
            },
          )
        }
        if (!sessionStorage.getItem('front-train-seen')) {
          const train = ref.current?.querySelector('.station-train')
          if (train) {
            gsap.fromTo(
              train,
              { x: '-20vw', autoAlpha: 0 },
              { x: '62vw', autoAlpha: 0.42, duration: 6, ease: 'none' },
            )
            sessionStorage.setItem('front-train-seen', '1')
          }
        }
      })
      return () => media.revert()
    },
    {
      scope: ref,
      dependencies: [location.pathname, location.search],
      revertOnUpdate: true,
    },
  )
  return <div ref={ref}>{children}</div>
}
