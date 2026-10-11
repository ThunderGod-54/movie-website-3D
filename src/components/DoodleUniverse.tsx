import { useEffect, useRef } from 'react'
import { moviePosters } from './three/moviePosters'
import './DoodleUniverse.css'

interface DoodleUniverseProps {
  isActivated: boolean
  isModalOpen?: boolean
}

export function DoodleUniverse({ isActivated, isModalOpen = false }: DoodleUniverseProps) {
  const sceneRef = useRef<HTMLDivElement>(null)
  const posterRefs = useRef<(HTMLDivElement | null)[]>([])
  const touchYRef = useRef(0)
  const targetZRef = useRef(0)
  const currentZRef = useRef(0)
  const isReducedMotionRef = useRef(false)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    isReducedMotionRef.current = motionQuery.matches

    const handleMotionChange = (event: MediaQueryListEvent) => {
      isReducedMotionRef.current = event.matches
    }

    const updateScene = () => {
      if (sceneRef.current) {
        sceneRef.current.style.perspective = window.innerWidth <= 768 ? '720px' : '980px'
      }
    }

    motionQuery.addEventListener('change', handleMotionChange)
    window.addEventListener('resize', updateScene)
    updateScene()

    let frameId = 0
    let previousTime = performance.now()

    const animate = (now: number) => {
      const deltaTime = Math.min(0.05, (now - previousTime) / 1000)
      previousTime = now

      if (isActivated && !isModalOpen && !isReducedMotionRef.current) {
        targetZRef.current += 90 * deltaTime
      }

      currentZRef.current += (targetZRef.current - currentZRef.current) * 0.08
      const travel = currentZRef.current
      const posterCount = moviePosters.length
      const posterLayout = [
        [-0.5, -0.34],
        [0.04, -0.42],
        [0.5, -0.29],
        [-0.46, 0.3],
        [0.02, 0.4],
        [0.48, 0.27],
      ]

      posterRefs.current.forEach((poster, index) => {
        if (!poster) return

        const cycleLength = 1800
        const phase = (((travel + index * cycleLength / posterCount) % cycleLength) + cycleLength) % cycleLength
        const progress = phase / cycleLength
        const burstProgress = Math.min(progress / 0.78, 1)
        const easeOut = 1 - Math.pow(1 - burstProgress, 3)
        const [xRatio, yRatio] = posterLayout[index % posterLayout.length]
        const centerX = window.innerWidth * 0.5
        const centerY = window.innerHeight * 0.48
        const x = centerX + xRatio * window.innerWidth * easeOut
        const y = centerY + yRatio * window.innerHeight * easeOut
        const scale = 0.12 + easeOut * 0.62
        const rotation = (1 - easeOut) * (index % 2 === 0 ? -10 : 10)
        const fadeOut = progress > 0.78 ? 1 - (progress - 0.78) / 0.22 : 1
        const opacity = Math.min(burstProgress * 1.8, 1) * fadeOut

        poster.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${(easeOut * 90).toFixed(1)}px) translate(-50%, -50%) scale(${scale.toFixed(3)}) rotate(${rotation.toFixed(1)}deg)`
        poster.style.opacity = opacity.toFixed(3)
      })

      frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
      motionQuery.removeEventListener('change', handleMotionChange)
      window.removeEventListener('resize', updateScene)
    }
  }, [isActivated, isModalOpen])

  useEffect(() => {
    if (!isActivated) return

    const handleWheel = (event: WheelEvent) => {
      if (!isModalOpen) targetZRef.current += event.deltaY * 1.6
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length > 0) touchYRef.current = event.touches[0].clientY
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (isModalOpen || event.touches.length === 0) return
      const nextY = event.touches[0].clientY
      targetZRef.current += (touchYRef.current - nextY) * 1.5
      touchYRef.current = nextY
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [isActivated, isModalOpen])

  return (
    <div
      className={`doodle-universe-layer ${isActivated ? 'is-active' : 'is-paused'}`}
      aria-hidden={!isActivated}
    >
      <div className="doodle-scene" ref={sceneRef} aria-label="Movie poster background">
        <div className="movie-poster-flight" aria-hidden="true">
          {moviePosters.map((movie, index) => (
            <div
              key={movie.title}
              ref={(element) => {
                posterRefs.current[index] = element
              }}
              className="movie-poster-card"
              style={{ backgroundColor: movie.fallbackColor }}
            >
              <img src={movie.url} alt="" />
              <span>{movie.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
