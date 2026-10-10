import { useEffect, useRef } from 'react'
import { moviePosters } from './three/moviePosters'
import './MoviePosterBurst.css'

interface MoviePosterBurstProps {
  isActivated: boolean
  isModalOpen?: boolean
}

const config = {
  depth: 2600,
  speed: 1.6,
  autoSpeed: 110,
  smoothing: 0.08,
  deadZone: 0.18,
  fadeIn: 0.18,
  fadeOut: 0.1,
}

export function MoviePosterBurst({ isActivated, isModalOpen = false }: MoviePosterBurstProps) {
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
        targetZRef.current += config.autoSpeed * deltaTime
      }

      currentZRef.current += (targetZRef.current - currentZRef.current) * config.smoothing
      const currentZ = currentZRef.current
      const posterCount = moviePosters.length
      
      const posterLayout = [
        [-0.42, -0.28],
        [0.42, -0.28],
        [-0.36, -0.06],
        [0.36, -0.06],
        [-0.42, 0.2],
        [0.42, 0.2],
        [-0.34, 0.4],
        [0.34, 0.4],
        [-0.46, 0.02],
        [0.46, 0.02],
        [-0.38, 0.32],
        [0.38, -0.36],
      ]

      for (let i = 0; i < posterCount; i++) {
        const poster = posterRefs.current[i]
        if (!poster) continue

        const raw = (i / posterCount) * config.depth + currentZ
        const wrapped = ((raw % config.depth) + config.depth) % config.depth
        const z = wrapped - config.depth
        const progress = (z + config.depth) / config.depth
        
        let opacity = progress < config.deadZone
          ? 0
          : progress < config.deadZone + config.fadeIn
            ? (progress - config.deadZone) / config.fadeIn
            : 1
        if (progress > 1 - config.fadeOut) {
          opacity = Math.min(opacity, (1 - progress) / config.fadeOut)
        }
        
        const [xRatio, yRatio] = posterLayout[i % posterLayout.length]
        const drift = Math.sin(progress * Math.PI * 2 + i) * 24
        const rotation = Math.sin(progress * Math.PI * 2 + i * 2) * 5
        
        poster.style.transform = `translate3d(${(window.innerWidth * xRatio + drift).toFixed(1)}px, ${(window.innerHeight * yRatio).toFixed(1)}px, ${z.toFixed(1)}px) translate(-50%, -50%) scale(0.9) rotate(${rotation.toFixed(1)}deg)`
        poster.style.opacity = opacity.toFixed(3)
      }

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
      if (!isModalOpen) targetZRef.current += event.deltaY * config.speed
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length > 0) touchYRef.current = event.touches[0].clientY
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (isModalOpen || event.touches.length === 0) return
      const nextY = event.touches[0].clientY
      targetZRef.current += (touchYRef.current - nextY) * config.speed * 1.5
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
      className={`movie-poster-burst ${isActivated ? 'is-active' : ''}`}
      aria-hidden={!isActivated}
    >
      <div className="movie-poster-scene" ref={sceneRef} aria-label="Movie poster background">
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
