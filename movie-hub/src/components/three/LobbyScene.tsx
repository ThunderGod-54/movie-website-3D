import { Outlines } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import { CanvasTexture, Group, SRGBColorSpace, TextureLoader, Texture } from 'three'

type LobbySceneProps = {
  activeStop: number
  pointerRef: RefObject<{ x: number; y: number }>
  onTicketClick: () => void
}

const cameraPositions = [
  // 0 — Entrance: wide overview of the whole room
  [0, 4.2, 12],
  // 1 — Now Showing: back from the poster wall, centred
  [0, 3.8, -1.5],
  // 2 — Tickets: comfortable wide view — counter fits fully in frame
  [-2.6, 3.4, 2.8],
  // 3 — Food Court: comfortable wide view — counter fits fully in frame
  [2.2, 3.4, 2.8],
  // 4 — Screens door
  [0.5, 3.5, -4.2],
] as const

const cameraTargets = [
  [0, 2.3, -2.1],
  [0, 2.8, -7.7],
  // 2 — Centre of ticket counter, mid-height
  [-5.55, 1.8, -1.6],
  // 3 — Centre of food court counter, mid-height
  [4.8, 1.8, -1.8],
  [4.25, 1.9, -7.55],
] as const

// FOV stays consistent — models are now sized to fit naturally
const cameraFovs = [42, 42, 42, 42, 40] as const

// Reel spoke angles — kept for potential reuse
// const reelAngles removed

function Outline({ color = '#292620' }: { color?: string }) {
  return <Outlines thickness={0.035} color={color} screenspace={false} />
}

function CanvasLabel({
  text,
  position,
  size,
  color = '#292620',
  background = 'transparent',
  fontSize = 110,
}: {
  text: string
  position: [number, number, number]
  size: [number, number]
  color?: string
  background?: string
  fontSize?: number
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 256
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = background
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = color
      context.font = `700 ${fontSize}px Georgia, serif`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 48)
    }
    const labelTexture = new CanvasTexture(canvas)
    labelTexture.colorSpace = SRGBColorSpace
    return labelTexture
  }, [text, color, background, fontSize])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} transparent={background === 'transparent'} />
    </mesh>
  )
}

function Carpet() {
  return (
    <group position={[0, 0.015, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 18]} />
        <meshToonMaterial color="#c55f49" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <planeGeometry args={[13.5, 16]} />
        <meshToonMaterial color="#bd8064" />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, -7 + i * 2]}>
          <planeGeometry args={[13.4, 0.035]} />
          <meshBasicMaterial color="#e5b49a" transparent opacity={0.42} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[2.55, 2.62, 32]} />
        <meshBasicMaterial color="#f3d7b6" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[2.9, 2.94, 32]} />
        <meshBasicMaterial color="#7a433d" />
      </mesh>
    </group>
  )
}

function Room() {
  return (
    <group>
      <Carpet />
      <mesh position={[0, 4.5, -8]} receiveShadow>
        <boxGeometry args={[16, 9, 0.35]} />
        <meshToonMaterial color="#e4d9c3" />
        <Outline />
      </mesh>
      <mesh position={[-8, 4.5, 0]} receiveShadow>
        <boxGeometry args={[0.35, 9, 16]} />
        <meshToonMaterial color="#b7c5ad" />
        <Outline />
      </mesh>
      <mesh position={[8, 4.5, 0]} receiveShadow>
        <boxGeometry args={[0.35, 9, 16]} />
        <meshToonMaterial color="#d2b9a4" />
        <Outline />
      </mesh>
      <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshToonMaterial color="#eee7d8" side={2} />
      </mesh>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[16, 0.15, 18]} />
        <meshToonMaterial color="#b85945" />
      </mesh>
      <mesh position={[0, 0.55, -7.72]}>
        <boxGeometry args={[15.7, 0.75, 0.34]} />
        <meshToonMaterial color="#a7b498" />
        <Outline />
      </mesh>
      <mesh position={[-7.72, 0.55, 0]}>
        <boxGeometry args={[0.34, 0.75, 15.7]} />
        <meshToonMaterial color="#c7b89c" />
        <Outline />
      </mesh>
      <mesh position={[7.72, 0.55, 0]}>
        <boxGeometry args={[0.34, 0.75, 15.7]} />
        <meshToonMaterial color="#c7b89c" />
        <Outline />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// All 6 poster movies — rotated in pairs every 3.5s
// ---------------------------------------------------------------------------
const allMovies = [
  // Set A
  {
    title: 'The Odyssey',
    url: 'https://m.media-amazon.com/images/I/71qQXdOmSPL._AC_UF1000,1000_QL80_.jpg',
    fallbackColor: '#3a4a6b',
  },
  {
    title: 'Spider-Man: Brand New Day',
    url: 'https://i.scdn.co/image/ab67616d0000b2733b4123d5765f3068a788fa30',
    fallbackColor: '#b02020',
  },
  {
    title: 'F1',
    url: 'https://thumb.wikimedia.org/wikipedia/en/thumb/3/38/F1_%282025_film%29.png/250px-F1_%282025_film%29.png',
    fallbackColor: '#1a1a1a',
  },
  // Set B
  {
    title: 'Project Hail Mary',
    url: 'https://m.media-amazon.com/images/I/81o4R4G+xHL._UF1000,1000_QL80_.jpg',
    fallbackColor: '#1a3a5c',
  },
  {
    title: 'Dhurandhar 2',
    url: 'https://m.media-amazon.com/images/M/MV5BNzdkNjAxNWMtNWY3My00NTI1LTg2YWQtOGI3MDA0NzdhMjEyXkEyXkFqcGc@._V1_.jpg',
    fallbackColor: '#2a1a0a',
  },
  {
    title: 'Obsession',
    url: 'https://thumb.wikimedia.org/wikipedia/en/thumb/0/05/Obsession_theatrical_poster.jpeg/250px-Obsession_theatrical_poster.jpeg',
    fallbackColor: '#1a1a2e',
  },
] as const

function useRemoteTexture(url: string): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null)
  useEffect(() => {
    let alive = true
    const loader = new TextureLoader()
    loader.crossOrigin = 'anonymous'
    loader.load(url, (tex) => {
      if (!alive) return
      tex.colorSpace = SRGBColorSpace
      setTexture(tex)
    })
    return () => { alive = false }
  }, [url])
  useEffect(() => () => { texture?.dispose() }, [texture])
  return texture
}

// Preload all textures once at module level so they're ready before the slot is shown
function useAllTextures() {
  const textures = allMovies.map(m => useRemoteTexture(m.url)) // eslint-disable-line react-hooks/rules-of-hooks
  return textures
}

// A single poster slot that cross-fades between movies
function AnimatedPoster({
  position,
  setIndex,
  nextIndex,
  fade,
}: {
  position: [number, number, number]
  setIndex: number
  nextIndex: number
  fade: number
}) {
  const textures = useAllTextures()
  const curTex  = textures[setIndex]
  const nextTex = textures[nextIndex]
  const cur     = allMovies[setIndex]
  const nxt     = allMovies[nextIndex]

  return (
    <group position={position}>
      {/* Wooden frame */}
      <mesh castShadow>
        <boxGeometry args={[1.85, 2.55, 0.14]} />
        <meshToonMaterial color="#573f36" />
        <Outline />
      </mesh>
      {/* Current poster — fades out */}
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[1.58, 2.27]} />
        {curTex
          ? <meshBasicMaterial map={curTex} transparent opacity={1 - fade} />
          : <meshToonMaterial color={cur.fallbackColor} />}
      </mesh>
      {/* Next poster — fades in on top */}
      {fade > 0 && (
        <mesh position={[0, 0, 0.085]}>
          <planeGeometry args={[1.58, 2.27]} />
          {nextTex
            ? <meshBasicMaterial map={nextTex} transparent opacity={fade} />
            : <meshToonMaterial color={nxt.fallbackColor} />}
        </mesh>
      )}
      {/* Title strip */}
      <mesh position={[0, -1.02, 0.09]}>
        <boxGeometry args={[1.58, 0.32, 0.01]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.6} />
      </mesh>
      <CanvasLabel
        text={(fade > 0.5 ? nxt.title : cur.title).toUpperCase()}
        position={[0, -1.02, 0.1]}
        size={[1.55, 0.3]}
        color="#ffffff"
        fontSize={55}
      />
    </group>
  )
}

const SWAP_INTERVAL = 3500  // ms between swaps
const FADE_DURATION = 800   // ms of cross-fade

function PosterWall() {
  // Each of the 3 slots cycles independently, offset by SWAP_INTERVAL/3
  const [slots, setSlots] = useState([
    { cur: 0, next: 3, fade: 0 },
    { cur: 1, next: 4, fade: 0 },
    { cur: 2, next: 5, fade: 0 },
  ])
  const fadingRef = useRef([false, false, false])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    const startFade = (slotIdx: number) => {
      if (fadingRef.current[slotIdx]) return
      fadingRef.current[slotIdx] = true

      const start = performance.now()
      const tick = () => {
        const elapsed = performance.now() - start
        const progress = Math.min(elapsed / FADE_DURATION, 1)

        setSlots(prev => {
          const next = [...prev]
          next[slotIdx] = { ...next[slotIdx], fade: progress }
          return next
        })

        if (progress < 1) {
          requestAnimationFrame(tick)
        } else {
          // Commit: current becomes next, pick a new next 3 slots ahead
          setSlots(prev => {
            const next = [...prev]
            const newCur = prev[slotIdx].next
            const newNext = (newCur + 3) % allMovies.length
            next[slotIdx] = { cur: newCur, next: newNext, fade: 0 }
            return next
          })
          fadingRef.current[slotIdx] = false
        }
      }
      requestAnimationFrame(tick)
    }

    // Stagger each slot by 1/3 of the interval
    slots.forEach((_, i) => {
      timers.push(setTimeout(() => {
        startFade(i)
        const interval = setInterval(() => startFade(i), SWAP_INTERVAL)
        timers.push(interval as unknown as ReturnType<typeof setTimeout>)
      }, i * (SWAP_INTERVAL / 3)))
    })

    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <group>
      <CanvasLabel text="NOW SHOWING" position={[0, 4.35, -7.77]} size={[3.6, 0.55]} fontSize={90} />
      {slots.map((slot, i) => (
        <AnimatedPoster
          key={i}
          position={[(-4.5 + i * 3) as number, 2.55, -7.72]}
          setIndex={slot.cur}
          nextIndex={slot.next}
          fade={slot.fade}
        />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Ticket Counter — compact size, fits fully in frame
// ---------------------------------------------------------------------------
function TicketCounter({ onClick }: { onClick: () => void }) {
  return (
    <group
      position={[-5.55, 0, -1.6]}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      // Cursor hint — R3F supports this via onPointerOver/Out
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'auto' }}
    >
      {/* Desk body */}
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.3, 0.85]} />
        <meshToonMaterial color="#2a2724" />
        <Outline />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, 1.32, 0]} castShadow>
        <boxGeometry args={[2.5, 0.06, 0.95]} />
        <meshToonMaterial color="#d8d2c8" />
        <Outline />
      </mesh>
      {/* Glass sneeze guard */}
      <mesh position={[0, 1.82, 0.38]}>
        <boxGeometry args={[2.3, 0.9, 0.03]} />
        <meshToonMaterial color="#c8d8dc" transparent />
      </mesh>
      <mesh position={[0, 2.28, 0.38]}>
        <boxGeometry args={[2.35, 0.04, 0.05]} />
        <meshToonMaterial color="#3a3734" />
      </mesh>
      {[-1.15, 0, 1.15].map((x, i) => (
        <mesh key={i} position={[x, 1.82, 0.38]}>
          <boxGeometry args={[0.04, 0.9, 0.05]} />
          <meshToonMaterial color="#3a3734" />
        </mesh>
      ))}
      {/* Desk screen */}
      <mesh position={[0, 1.55, 0.08]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[1.1, 0.28, 0.04]} />
        <meshToonMaterial color="#1c1a18" />
        <Outline />
      </mesh>
      <CanvasLabel text="NEXT AVAILABLE" position={[0, 1.55, 0.1]} size={[1.05, 0.23]} color="#e8f4f8" fontSize={80} />
      {/* Overhead sign */}
      <mesh position={[0, 2.9, -0.24]} castShadow>
        <boxGeometry args={[2.3, 0.58, 0.09]} />
        <meshToonMaterial color="#1c1a18" />
        <Outline />
      </mesh>
      <CanvasLabel text="BOX OFFICE" position={[0, 2.97, -0.19]} size={[2.1, 0.26]} color="#ffffff" fontSize={100} />
      <CanvasLabel text="TICKETS" position={[0, 2.74, -0.19]} size={[2.1, 0.2]} color="#cf6148" fontSize={80} />
      {/* Sign rods */}
      {[-1.0, 1.0].map((x, i) => (
        <mesh key={i} position={[x, 2.25, -0.22]}>
          <cylinderGeometry args={[0.02, 0.02, 1.1, 6]} />
          <meshToonMaterial color="#3a3734" />
        </mesh>
      ))}
      {/* Window plaques */}
      {[-0.62, 0.62].map((x, i) => (
        <group key={i} position={[x, 1.2, 0.44]}>
          <mesh>
            <boxGeometry args={[0.22, 0.22, 0.03]} />
            <meshToonMaterial color="#3a3734" />
          </mesh>
          <CanvasLabel text={`0${i + 1}`} position={[0, 0, 0.025]} size={[0.18, 0.17]} color="#e8e4de" fontSize={130} />
        </group>
      ))}
      {/* Rope post */}
      <group position={[1.6, 0, 0.75]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.035, 0.045, 0.95, 8]} />
          <meshToonMaterial color="#4a4643" />
          <Outline />
        </mesh>
        <mesh position={[0, 0.52, 0]}>
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshToonMaterial color="#3a3734" />
        </mesh>
        <mesh position={[-0.9, 0.36, 0]}>
          <boxGeometry args={[1.6, 0.02, 0.02]} />
          <meshBasicMaterial color="#6a5a52" />
        </mesh>
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Food Court — compact size, fits fully in frame
// ---------------------------------------------------------------------------
function FoodCourtCounter() {
  return (
    <group position={[4.8, 0, -1.8]}>
      {/* Counter body */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.44, 0.8]} />
        <meshToonMaterial color="#5c4033" />
        <Outline />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, 1.47, 0]} castShadow>
        <boxGeometry args={[2.9, 0.07, 0.9]} />
        <meshToonMaterial color="#e8dfd0" />
        <Outline />
      </mesh>
      {/* Front trim strips */}
      {[0.42, 0.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0.41]}>
          <boxGeometry args={[2.78, 0.05, 0.02]} />
          <meshBasicMaterial color="#4a4643" />
        </mesh>
      ))}
      {/* Menu board */}
      <mesh position={[0, 2.88, -0.34]} castShadow>
        <boxGeometry args={[2.7, 0.9, 0.1]} />
        <meshToonMaterial color="#1c1a18" />
        <Outline />
      </mesh>
      <mesh position={[0, 2.88, -0.28]}>
        <planeGeometry args={[2.5, 0.7]} />
        <meshToonMaterial color="#242220" />
      </mesh>
      <CanvasLabel text="FOOD COURT" position={[0, 2.98, -0.26]} size={[2.3, 0.3]} color="#ffffff" fontSize={110} />
      <CanvasLabel text="POPCORN · NACHOS · DRINKS" position={[0, 2.72, -0.26]} size={[2.4, 0.22]} color="#b0b8c0" fontSize={64} />
      {/* Board rods */}
      {[-1.2, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 2.3, -0.32]}>
          <cylinderGeometry args={[0.02, 0.02, 1.1, 6]} />
          <meshToonMaterial color="#3a3734" />
        </mesh>
      ))}
      {/* Overhead light */}
      <mesh position={[0, 3.5, -0.26]}>
        <boxGeometry args={[2.6, 0.06, 0.09]} />
        <meshBasicMaterial color="#e8ecf0" />
      </mesh>
      <pointLight position={[0, 3.3, 0.1]} intensity={16} distance={4.5} color="#dce8f0" />
      {/* Display dome — popcorn */}
      <group position={[-0.82, 1.54, 0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.19, 0.26, 14]} />
          <meshToonMaterial color="#4a4643" />
          <Outline />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.22, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshToonMaterial color="#b8d8dc" transparent />
        </mesh>
        {[[-0.07, 0.42, 0.04], [0.07, 0.45, -0.05], [0, 0.49, 0.0]].map(([px, py, pz], i) => (
          <mesh key={i} position={[px, py, pz]}>
            <dodecahedronGeometry args={[0.06, 0]} />
            <meshToonMaterial color="#fff2d4" />
          </mesh>
        ))}
      </group>
      {/* Display dome — nachos */}
      <group position={[0.08, 1.54, 0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.17, 0.22, 14]} />
          <meshToonMaterial color="#4a4643" />
          <Outline />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshToonMaterial color="#b8d8dc" transparent />
        </mesh>
        {[[-0.06, 0.36, 0], [0.05, 0.38, 0.04], [0, 0.41, -0.04]].map(([px, py, pz], i) => (
          <mesh key={i} position={[px, py, pz]} rotation={[0.3 * i, 0.8 * i, 0]}>
            <tetrahedronGeometry args={[0.08, 0]} />
            <meshToonMaterial color="#f0a830" />
          </mesh>
        ))}
      </group>
      {/* Soda machine */}
      <group position={[1.12, 1.54, -0.05]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.78, 0.44]} />
          <meshToonMaterial color="#3a4a52" />
          <Outline />
        </mesh>
        <mesh position={[0, 0.15, 0.23]}>
          <planeGeometry args={[0.38, 0.34]} />
          <meshToonMaterial color="#1a2830" />
        </mesh>
        {[-0.14, -0.05, 0.05, 0.14].map((nx, i) => (
          <mesh key={i} position={[nx, -0.25, 0.24]}>
            <cylinderGeometry args={[0.02, 0.016, 0.1, 6]} />
            <meshToonMaterial color="#5a6068" />
          </mesh>
        ))}
        <mesh position={[0, -0.4, 0.19]}>
          <boxGeometry args={[0.48, 0.03, 0.15]} />
          <meshToonMaterial color="#5a6068" />
        </mesh>
        <CanvasLabel text="DRINKS" position={[0, 0.15, 0.24]} size={[0.35, 0.14]} color="#e8f4f8" fontSize={90} />
      </group>
      {/* OPEN badge */}
      <mesh position={[-1.1, 1.1, 0.42]}>
        <boxGeometry args={[0.44, 0.18, 0.04]} />
        <meshToonMaterial color="#d75a3a" />
        <Outline />
      </mesh>
      <CanvasLabel text="OPEN" position={[-1.1, 1.1, 0.45]} size={[0.4, 0.14]} color="#ffffff" fontSize={100} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Lobby Seating — two sofas + side table in centre waiting area
// ---------------------------------------------------------------------------
function Sofa({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.32, 0.72]} />
        <meshToonMaterial color="#8b7355" />
        <Outline />
      </mesh>
      {/* Back rest */}
      <mesh position={[0, 0.72, -0.3]} castShadow>
        <boxGeometry args={[1.8, 0.52, 0.2]} />
        <meshToonMaterial color="#8b7355" />
        <Outline />
      </mesh>
      {/* Arm rests */}
      {[-0.85, 0.85].map((x, i) => (
        <mesh key={i} position={[x, 0.5, -0.06]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.62]} />
          <meshToonMaterial color="#7a6248" />
          <Outline />
        </mesh>
      ))}
      {/* Seat cushions — two */}
      {[-0.46, 0.46].map((x, i) => (
        <mesh key={i} position={[x, 0.48, 0.06]}>
          <boxGeometry args={[0.82, 0.1, 0.65]} />
          <meshToonMaterial color="#9e8464" />
          <Outline />
        </mesh>
      ))}
      {/* Legs */}
      {[[-0.78, -0.28], [-0.78, 0.28], [0.78, -0.28], [0.78, 0.28]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.07, lz]}>
          <boxGeometry args={[0.07, 0.14, 0.07]} />
          <meshToonMaterial color="#4a3c2e" />
        </mesh>
      ))}
    </group>
  )
}

function SideTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table top */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
        <meshToonMaterial color="#d8d2c8" />
        <Outline />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.5, 8]} />
        <meshToonMaterial color="#5c4a38" />
      </mesh>
      {/* Base disc */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.06, 12]} />
        <meshToonMaterial color="#4a3c2e" />
        <Outline />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Floor Plants — tall fiddle-leaf style + small pot
// ---------------------------------------------------------------------------
function TallPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.17, 0.44, 12]} />
        <meshToonMaterial color="#8a7060" />
        <Outline />
      </mesh>
      {/* Soil top */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.03, 12]} />
        <meshToonMaterial color="#4a3828" />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.07, 1.1, 8]} />
        <meshToonMaterial color="#6a5240" />
      </mesh>
      {/* Leaves — staggered planes scaled to leaf-like proportions */}
      {[
        [0,     1.7,   0.18,  0  ],
        [0.14,  1.55, -0.12,  0.6],
        [-0.16, 1.62,  0.06, -0.5],
        [0.08,  1.82,  0.22,  1.1],
        [-0.1,  1.75, -0.2,   2.1],
      ].map(([lx, ly, lz, ry], i) => (
        <mesh key={i} position={[lx, ly, lz]} rotation={[0.15, ry, 0.1 * (i % 2 === 0 ? 1 : -1)]}
          scale={[0.56, 0.84, 1]}>
          <circleGeometry args={[0.38, 8]} />
          <meshToonMaterial color={i % 2 === 0 ? '#4a7c59' : '#3d6b4a'} side={2} />
        </mesh>
      ))}
    </group>
  )
}

function SmallPot({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.1, 0.28, 10]} />
        <meshToonMaterial color="#8a7060" />
        <Outline />
      </mesh>
      <mesh position={[0, 0.29, 0]}>
        <cylinderGeometry args={[0.135, 0.135, 0.02, 10]} />
        <meshToonMaterial color="#4a3828" />
      </mesh>
      {/* Round bush */}
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshToonMaterial color="#5a8c62" />
        <Outline />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Lobby Furniture — walls & corners like a real theater
// ---------------------------------------------------------------------------
function LobbyFurniture() {
  return (
    <group>
      {/* ── Sofas against the side walls ── */}
      {/* Left wall sofa — faces right into the room */}
      <Sofa position={[-6.2, 0, 1.0]} rotation={Math.PI / 2} />
      {/* Right wall sofa — faces left into the room */}
      <Sofa position={[6.2, 0, 1.0]} rotation={-Math.PI / 2} />

      {/* Side tables next to each sofa */}
      <SideTable position={[-6.2, 0, 2.4]} />
      <SideTable position={[6.2, 0, 2.4]} />

      {/* ── Tall corner plants — all four back corners ── */}
      <TallPlant position={[-7.0, 0, -6.5]} />
      <TallPlant position={[7.0, 0, -6.5]} />

      {/* ── Small accent pots — beside each sofa table ── */}
      <SmallPot position={[-6.2, 0.63, 2.4]} />
      <SmallPot position={[6.2, 0.63, 2.4]} />

      {/* Small pots near entrance corners */}
      <SmallPot position={[-6.8, 0, 6.5]} />
      <SmallPot position={[6.8, 0, 6.5]} />
    </group>
  )
}

function ScreensDoor() {
  return (
    <group position={[4.25, 0, -7.55]}>
      <mesh position={[0, 1.72, 0]} castShadow>
        <boxGeometry args={[2.35, 3.45, 0.24]} />
        <meshToonMaterial color="#526b63" />
        <Outline />
      </mesh>
      <mesh position={[0, 1.68, 0.14]}>
        <boxGeometry args={[1.95, 3.08, 0.12]} />
        <meshToonMaterial color="#d8c49f" />
        <Outline />
      </mesh>
      <mesh position={[0, 1.65, 0.22]}>
        <boxGeometry args={[1.57, 2.7, 0.12]} />
        <meshToonMaterial color="#765244" />
      </mesh>
      <mesh position={[0.56, 1.55, 0.31]}>
        <sphereGeometry args={[0.075, 10, 6]} />
        <meshToonMaterial color="#e8c982" />
      </mesh>
      <CanvasLabel text="SCREENS" position={[0, 3.25, 0.23]} size={[1.8, 0.36]} color="#3a3028" fontSize={100} />
    </group>
  )
}

function FloatingTicket() {
  const groupRef = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.position.y = 3.6 + Math.sin(t * 0.65) * 0.16
    groupRef.current.rotation.y = Math.sin(t * 0.34) * 0.15
    groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.08
  })
  return (
    <group ref={groupRef} position={[2.75, 3.6, 1.4]}>
      <mesh>
        <boxGeometry args={[1.05, 0.56, 0.08]} />
        <meshToonMaterial color="#e8bf79" />
        <Outline />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.035, 0.4, 0.02]} />
        <meshBasicMaterial color="#885448" />
      </mesh>
    </group>
  )
}

function HangingLights() {
  const xPositions = [-5.6, 0, 5.6] as const
  return (
    <group>
      {xPositions.map((x) => (
        <group key={x} position={[x, 7.3, -1.8]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 1.4, 4]} />
            <meshBasicMaterial color="#423d33" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.25, 10, 6]} />
            <meshToonMaterial color="#f0d79e" />
            <Outline />
          </mesh>
          <pointLight position={[0, -0.2, 0]} intensity={18} distance={6} color="#ffddb0" />
        </group>
      ))}
    </group>
  )
}

function CameraRig({ activeStop, pointerRef }: Pick<LobbySceneProps, 'activeStop' | 'pointerRef'>) {
  const smoothed    = useRef([0, 4.2, 12, 0, 2.3, -2.1])
  const smoothedFov = useRef(42)

  useFrame(({ camera, clock }, delta) => {
    const position  = cameraPositions[activeStop] ?? cameraPositions[0]
    const look      = cameraTargets[activeStop]   ?? cameraTargets[0]
    const targetFov = cameraFovs[activeStop]      ?? 42
    const { x, y }  = pointerRef.current
    const sway = Math.sin(clock.elapsedTime * 0.24) * 0.07
    const f    = 1 - Math.exp(-delta * 2.6)
    const s    = smoothed.current

    s[0] += (position[0] + x * 0.35 + sway - s[0]) * f
    s[1] += (position[1] + y * 0.18          - s[1]) * f
    s[2] += (position[2]                     - s[2]) * f
    s[3] += (look[0]    + x * 0.6            - s[3]) * f
    s[4] += (look[1]    + y * 0.25           - s[4]) * f
    s[5] += (look[2]                         - s[5]) * f

    camera.position.set(s[0], s[1], s[2])
    camera.lookAt(s[3], s[4], s[5])

    const fovDiff = targetFov - smoothedFov.current
    if (Math.abs(fovDiff) > 0.01) {
      smoothedFov.current += fovDiff * f
      ;(camera as THREE.PerspectiveCamera).fov = smoothedFov.current
      ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
    }
  })
  return null
}

function LobbyScene({ activeStop, pointerRef, onTicketClick }: LobbySceneProps) {
  return (
    <>
      <ambientLight intensity={1.7} />
      <hemisphereLight args={['#fff1d5', '#705448', 1.2]} />
      <directionalLight position={[-4, 8, 6]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]} />
      <Room />
      <PosterWall />
      <TicketCounter onClick={onTicketClick} />
      <FoodCourtCounter />
      <ScreensDoor />
      <FloatingTicket />
      <HangingLights />
      <LobbyFurniture />
      <CameraRig activeStop={activeStop} pointerRef={pointerRef} />
    </>
  )
}

export default LobbyScene
