import { Outlines } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import { CanvasTexture, Group, SRGBColorSpace, TextureLoader, Texture } from 'three'

type LobbySceneProps = {
  activeStop: number
  pointerRef: RefObject<{ x: number; y: number }>
}

const cameraPositions = [
  // 0 — Entrance: wide overview of the whole room
  [0, 4.2, 12],
  // 1 — Now Showing: back from the poster wall, slightly elevated, centred
  [0, 3.8, -1.5],
  // 2 — Tickets: very close, tight on the counter
  [-3.8, 1.9, 1.4],
  // 3 — Food Court: very close, tight on the counter
  [2.8, 1.9, 1.4],
  // 4 — Screens door: pulled back from corner, looking at door (door at [4.25, 0, -7.55])
  [0.5, 3.5, -4.2],
] as const

const cameraTargets = [
  // 0 — Wide room: look toward the centre of the room
  [0, 2.3, -2.1],
  // 1 — Looking straight at the poster wall
  [0, 2.8, -7.7],
  // 2 — Tickets: look straight at the counter sign face, mid-height
  [-5.55, 2.4, -1.6],
  // 3 — Food Court: look straight at the menu board and counter face
  [4.8, 2.4, -1.8],
  // 4 — Looking at the screens door
  [4.25, 1.9, -7.55],
] as const

// popcornPositions no longer used after food court replacement — keep for reference
// const popcornPositions removed

// Reel spoke angles — computed once
const reelAngles = Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2)

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
  // Memoize texture so it's only created once per unique set of props
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
      {/* Reduced stripe count from 15 to 8 — visually equivalent at this scale */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, -7 + i * 2]}>
          <planeGeometry args={[13.4, 0.035]} />
          <meshBasicMaterial color="#e5b49a" transparent opacity={0.42} />
        </mesh>
      ))}
      {/* Reduced ring segment count: 64 → 32 — barely noticeable at this size */}
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
// Movie posters with real images
// ---------------------------------------------------------------------------

const posterMovies = [
  {
    title: 'The Odyssey',
    meta: 'Epic · 2h 50m',
    url: 'https://m.media-amazon.com/images/I/71qQXdOmSPL._AC_UF1000,1000_QL80_.jpg',
    fallbackColor: '#3a4a6b',
  },
  {
    title: 'Spider-Man: Brand New Day',
    meta: 'Action · 2h 15m',
    url: 'https://i.scdn.co/image/ab67616d0000b2733b4123d5765f3068a788fa30',
    fallbackColor: '#b02020',
  },
  {
    title: 'F1',
    meta: 'Drama · 2h 10m',
    url: 'https://thumb.wikimedia.org/wikipedia/en/thumb/3/38/F1_%282025_film%29.png/250px-F1_%282025_film%29.png',
    fallbackColor: '#1a1a1a',
  },
] as const

/** Load a remote image as a Three.js texture with CORS. Falls back to null on error. */
function useRemoteTexture(url: string): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    let alive = true
    const loader = new TextureLoader()
    loader.crossOrigin = 'anonymous'
    loader.load(
      url,
      (tex) => {
        if (!alive) return
        tex.colorSpace = SRGBColorSpace
        setTexture(tex)
      },
      undefined,
      () => {
        // CORS or 404 — silently fall back to the tint color
      },
    )
    return () => {
      alive = false
    }
  }, [url])

  // Dispose on unmount
  useEffect(() => () => { texture?.dispose() }, [texture])

  return texture
}

function MoviePoster({
  position,
  title,
  imageUrl,
  fallbackColor,
}: {
  position: [number, number, number]
  title: string
  imageUrl: string
  fallbackColor: string
}) {
  const tex = useRemoteTexture(imageUrl)

  return (
    <group position={position}>
      {/* Wooden frame */}
      <mesh castShadow>
        <boxGeometry args={[1.85, 2.55, 0.14]} />
        <meshToonMaterial color="#573f36" />
        <Outline />
      </mesh>

      {/* Poster face — shows the real image once loaded, tint colour until then */}
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[1.58, 2.27]} />
        {tex ? (
          <meshBasicMaterial map={tex} />
        ) : (
          <meshToonMaterial color={fallbackColor} />
        )}
      </mesh>

      {/* Title label strip at the bottom */}
      <mesh position={[0, -1.02, 0.09]}>
        <boxGeometry args={[1.58, 0.32, 0.01]} />
        <meshBasicMaterial color="rgba(0,0,0,0.55)" transparent opacity={0.7} />
      </mesh>
      <CanvasLabel
        text={title.toUpperCase()}
        position={[0, -1.02, 0.1]}
        size={[1.55, 0.3]}
        color="#ffffff"
        fontSize={60}
      />
    </group>
  )
}

function PosterWall() {
  return (
    <group>
      <CanvasLabel text="NOW SHOWING" position={[0, 4.35, -7.77]} size={[3.6, 0.55]} fontSize={90} />
      {posterMovies.map((movie, i) => (
        <MoviePoster
          key={movie.title}
          position={[(-4.5 + i * 3) as number, 2.55, -7.72]}
          title={movie.title}
          imageUrl={movie.url}
          fallbackColor={movie.fallbackColor}
        />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Ticket Counter — redesigned: clean modern box-office desk
// Palette: charcoal body · off-white surfaces · accent terracotta sign only
// ---------------------------------------------------------------------------
function TicketCounter() {
  return (
    <group position={[-5.55, 0, -1.6]}>

      {/* ── Main desk body — dark charcoal ── */}
      <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 1.76, 1.1]} />
        <meshToonMaterial color="#2a2724" />
        <Outline />
      </mesh>

      {/* ── Counter top — light stone ── */}
      <mesh position={[0, 1.78, 0]} castShadow>
        <boxGeometry args={[3.7, 0.07, 1.2]} />
        <meshToonMaterial color="#d8d2c8" />
        <Outline />
      </mesh>

      {/* ── Glass sneeze-guard panel ── */}
      <mesh position={[0, 2.32, 0.42]}>
        <boxGeometry args={[3.5, 1.0, 0.04]} />
        <meshToonMaterial color="#c8d8dc" transparent />
      </mesh>
      {/* Guard frame — thin top rail */}
      <mesh position={[0, 2.84, 0.42]}>
        <boxGeometry args={[3.55, 0.05, 0.06]} />
        <meshToonMaterial color="#3a3734" />
        <Outline />
      </mesh>
      {/* Guard frame — two vertical side rails */}
      {[-1.75, 1.75].map((x, i) => (
        <mesh key={i} position={[x, 2.32, 0.42]}>
          <boxGeometry args={[0.05, 1.0, 0.06]} />
          <meshToonMaterial color="#3a3734" />
        </mesh>
      ))}
      {/* Speak-through gap — centre divider post */}
      <mesh position={[0, 2.32, 0.42]}>
        <boxGeometry args={[0.05, 1.0, 0.06]} />
        <meshToonMaterial color="#3a3734" />
      </mesh>

      {/* ── Digital display screen on desk ── */}
      <mesh position={[0, 2.05, 0.1]} rotation={[-0.18, 0, 0]} castShadow>
        <boxGeometry args={[1.6, 0.38, 0.05]} />
        <meshToonMaterial color="#1c1a18" />
        <Outline />
      </mesh>
      <CanvasLabel
        text="NEXT AVAILABLE"
        position={[0, 2.05, 0.13]}
        size={[1.52, 0.32]}
        color="#e8f4f8"
        fontSize={72}
      />

      {/* ── Overhead sign board ── */}
      <mesh position={[0, 3.6, -0.3]} castShadow>
        <boxGeometry args={[3.2, 0.72, 0.1]} />
        <meshToonMaterial color="#1c1a18" />
        <Outline />
      </mesh>
      <mesh position={[0, 3.6, -0.24]}>
        <planeGeometry args={[3.0, 0.52]} />
        <meshToonMaterial color="#242220" />
      </mesh>
      <CanvasLabel
        text="BOX OFFICE"
        position={[0, 3.68, -0.22]}
        size={[2.8, 0.28]}
        color="#ffffff"
        fontSize={100}
      />
      <CanvasLabel
        text="TICKETS"
        position={[0, 3.42, -0.22]}
        size={[2.8, 0.22]}
        color="#cf6148"
        fontSize={72}
      />
      {/* Sign support rods */}
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 2.88, -0.28]}>
          <cylinderGeometry args={[0.025, 0.025, 1.45, 6]} />
          <meshToonMaterial color="#3a3734" />
        </mesh>
      ))}

      {/* ── Queuing rope post (in front of counter) ── */}
      <group position={[2.2, 0, 0.9]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.045, 0.06, 1.1, 8]} />
          <meshToonMaterial color="#4a4643" />
          <Outline />
        </mesh>
        {/* Post cap */}
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshToonMaterial color="#3a3734" />
        </mesh>
        {/* Rope — simple stretched box */}
        <mesh position={[-1.1, 0.44, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[2.0, 0.025, 0.025]} />
          <meshBasicMaterial color="#6a5a52" />
        </mesh>
      </group>

      {/* ── Window number plaques — "01" and "02" ── */}
      {[-0.9, 0.9].map((x, i) => (
        <group key={i} position={[x, 1.62, 0.56]}>
          <mesh>
            <boxGeometry args={[0.28, 0.28, 0.03]} />
            <meshToonMaterial color="#3a3734" />
          </mesh>
          <CanvasLabel
            text={`0${i + 1}`}
            position={[0, 0, 0.03]}
            size={[0.24, 0.22]}
            color="#e8e4de"
            fontSize={120}
          />
        </group>
      ))}

    </group>
  )
}

// ---------------------------------------------------------------------------
// Food Court — replaces the old popcorn stand
// A proper cinema concessions counter: service bar, menu board, food domes,
// soda fountain, warm overhead strip light.
// ---------------------------------------------------------------------------

function FoodCourtCounter() {
  return (
    <group position={[4.8, 0, -1.8]}>

      {/* ── Main counter bar ── */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 1.1, 0.9]} />
        <meshToonMaterial color="#5c4033" />
        <Outline />
      </mesh>
      {/* Marble-ish counter top */}
      <mesh position={[0, 1.58, 0]} castShadow>
        <boxGeometry args={[3.9, 0.08, 1.0]} />
        <meshToonMaterial color="#e8dfd0" />
        <Outline />
      </mesh>
      {/* Front panel detail strip */}
      <mesh position={[0, 0.55, 0.46]}>
        <boxGeometry args={[3.78, 0.06, 0.02]} />
        <meshBasicMaterial color="#4a4643" />
      </mesh>
      <mesh position={[0, 0.28, 0.46]}>
        <boxGeometry args={[3.78, 0.06, 0.02]} />
        <meshBasicMaterial color="#4a4643" />
      </mesh>

      {/* ── Overhead menu board ── */}
      <mesh position={[0, 3.55, -0.38]} castShadow>
        <boxGeometry args={[3.6, 1.1, 0.12]} />
        <meshToonMaterial color="#1c1a18" />
        <Outline />
      </mesh>
      {/* Board face */}
      <mesh position={[0, 3.55, -0.31]}>
        <planeGeometry args={[3.4, 0.9]} />
        <meshToonMaterial color="#242220" />
      </mesh>
      <CanvasLabel
        text="FOOD COURT"
        position={[0, 3.72, -0.28]}
        size={[3.0, 0.38]}
        color="#ffffff"
        fontSize={110}
      />
      <CanvasLabel
        text="POPCORN · NACHOS · HOT DOGS · DRINKS"
        position={[0, 3.35, -0.28]}
        size={[3.2, 0.28]}
        color="#b0b8c0"
        fontSize={56}
      />
      {/* Board support brackets */}
      {[-1.6, 1.6].map((x, i) => (
        <mesh key={i} position={[x, 2.85, -0.36]}>
          <boxGeometry args={[0.07, 1.4, 0.07]} />
          <meshToonMaterial color="#2e251e" />
        </mesh>
      ))}

      {/* ── Overhead light strip ── */}
      <mesh position={[0, 4.2, -0.3]}>
        <boxGeometry args={[3.4, 0.07, 0.1]} />
        <meshBasicMaterial color="#e8ecf0" />
      </mesh>
      <pointLight position={[0, 3.9, 0.1]} intensity={18} distance={5} color="#dce8f0" />

      {/* ── Glass food display domes ── */}
      {/* Dome 1 — left: popcorn tub */}
      <group position={[-1.1, 1.62, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.28, 0.24, 0.32, 16]} />
          <meshToonMaterial color="#4a4643" />
          <Outline />
        </mesh>
        {/* Glass dome */}
        <mesh position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.28, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshToonMaterial color="#b8d8dc" transparent />
        </mesh>
        {/* Popcorn puffs */}
        {[[-0.1, 0.52, 0.05], [0.09, 0.56, -0.06], [0, 0.6, 0.0], [-0.07, 0.64, 0.08]].map(([px, py, pz], i) => (
          <mesh key={i} position={[px, py, pz]}>
            <dodecahedronGeometry args={[0.07, 0]} />
            <meshToonMaterial color="#fff2d4" />
          </mesh>
        ))}
      </group>

      {/* Dome 2 — centre: nachos chip pile */}
      <group position={[0.1, 1.62, 0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.26, 0.22, 0.28, 16]} />
          <meshToonMaterial color="#4a4643" />
          <Outline />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <sphereGeometry args={[0.26, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshToonMaterial color="#b8d8dc" transparent />
        </mesh>
        {/* Triangular chip shapes approximated with tetrahedron */}
        {[[-0.08, 0.44, 0], [0.07, 0.48, 0.05], [0, 0.52, -0.06]].map(([px, py, pz], i) => (
          <mesh key={i} position={[px, py, pz]} rotation={[0.3 * i, 0.8 * i, 0]}>
            <tetrahedronGeometry args={[0.1, 0]} />
            <meshToonMaterial color="#f0a830" />
          </mesh>
        ))}
      </group>

      {/* ── Soda fountain machine (right side) ── */}
      <group position={[1.55, 1.62, -0.1]}>
        {/* Machine body */}
        <mesh castShadow>
          <boxGeometry args={[0.68, 0.9, 0.5]} />
          <meshToonMaterial color="#3a4a52" />
          <Outline />
        </mesh>
        {/* Screen panel */}
        <mesh position={[0, 0.18, 0.26]}>
          <planeGeometry args={[0.5, 0.42]} />
          <meshToonMaterial color="#1a2830" />
        </mesh>
        {/* Nozzle row */}
        {[-0.18, -0.06, 0.06, 0.18].map((nx, i) => (
          <mesh key={i} position={[nx, -0.3, 0.28]}>
            <cylinderGeometry args={[0.025, 0.02, 0.12, 6]} />
            <meshToonMaterial color="#5a6068" />
          </mesh>
        ))}
        {/* Drip tray */}
        <mesh position={[0, -0.48, 0.22]}>
          <boxGeometry args={[0.6, 0.04, 0.18]} />
          <meshToonMaterial color="#5a6068" />
          <Outline />
        </mesh>
        <CanvasLabel
          text="DRINKS"
          position={[0, 0.18, 0.27]}
          size={[0.46, 0.18]}
          color="#e8f4f8"
          fontSize={80}
        />
      </group>

      {/* ── "OPEN" neon-style badge on counter front ── */}
      <mesh position={[-1.5, 1.3, 0.48]}>
        <boxGeometry args={[0.55, 0.22, 0.04]} />
        <meshToonMaterial color="#d75a3a" />
        <Outline />
      </mesh>
      <CanvasLabel
        text="OPEN"
        position={[-1.5, 1.3, 0.51]}
        size={[0.5, 0.18]}
        color="#fff5df"
        fontSize={90}
      />

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
        {/* Sphere segments: 12,8 → 10,6 for door knob */}
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

function FloatingReel() {
  const groupRef = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.position.y = 2.75 + Math.sin(t * 0.72 + 1.4) * 0.2
    groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.1
    groupRef.current.rotation.y += 0.003
  })

  return (
    <group ref={groupRef} position={[-2.7, 2.75, 1.2]}>
      {/* Reel body: 32 → 24 segments */}
      <mesh>
        <cylinderGeometry args={[0.62, 0.62, 0.16, 24]} />
        <meshToonMaterial color="#85a29a" />
        <Outline />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.035, 6, 24]} />
        <meshToonMaterial color="#282620" />
      </mesh>
      {reelAngles.map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * 0.33, Math.sin(angle) * 0.33, 0.1]}>
          {/* Spoke cylinders: 12 → 8 segments */}
          <cylinderGeometry args={[0.11, 0.11, 0.04, 8]} />
          <meshToonMaterial color="#f4ead5" />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.1]}>
        {/* Center hub: 16 → 12 segments */}
        <cylinderGeometry args={[0.14, 0.14, 0.05, 12]} />
        <meshToonMaterial color="#d76b51" />
      </mesh>
    </group>
  )
}

function HangingLights() {
  // Light positions defined outside render to avoid array recreation every frame
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
            {/* Bulb sphere: 12,8 → 10,6 */}
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

// Per-stop FOV — tighter for close-up counters, wide for overview
const cameraFovs = [42, 42, 26, 26, 40] as const

function CameraRig({ activeStop, pointerRef }: LobbySceneProps) {
  const smoothed = useRef([0, 4.2, 12, 0, 2.3, -2.1])
  const smoothedFov = useRef(42)

  useFrame(({ camera, clock }, delta) => {
    const position = cameraPositions[activeStop] ?? cameraPositions[0]
    const look     = cameraTargets[activeStop]   ?? cameraTargets[0]
    const targetFov = cameraFovs[activeStop]     ?? 42
    const { x, y } = pointerRef.current
    const sway = Math.sin(clock.elapsedTime * 0.24) * 0.07
    const f = 1 - Math.exp(-delta * 2.6)
    const s = smoothed.current

    s[0] += (position[0] + x * 0.35 + sway - s[0]) * f
    s[1] += (position[1] + y * 0.18          - s[1]) * f
    s[2] += (position[2]                     - s[2]) * f
    s[3] += (look[0]    + x * 0.6            - s[3]) * f
    s[4] += (look[1]    + y * 0.25           - s[4]) * f
    s[5] += (look[2]                         - s[5]) * f

    camera.position.set(s[0], s[1], s[2])
    camera.lookAt(s[3], s[4], s[5])

    // Smooth FOV transition — only update when it's changed noticeably
    const fovDiff = targetFov - smoothedFov.current
    if (Math.abs(fovDiff) > 0.01) {
      smoothedFov.current += fovDiff * f
      ;(camera as THREE.PerspectiveCamera).fov = smoothedFov.current
      ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
    }
  })

  return null
}

function LobbyScene({ activeStop, pointerRef }: LobbySceneProps) {
  return (
    <>
      <ambientLight intensity={1.7} />
      <hemisphereLight args={['#fff1d5', '#705448', 1.2]} />
      {/* Shadow map size lowered to 512 on mobile, 1024 on desktop — handled by dpr cap */}
      <directionalLight position={[-4, 8, 6]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]} />
      <Room />
      <PosterWall />
      <TicketCounter />
      <FoodCourtCounter />
      <ScreensDoor />
      <FloatingTicket />
      <HangingLights />
      <CameraRig activeStop={activeStop} pointerRef={pointerRef} />
    </>
  )
}

export default LobbyScene
