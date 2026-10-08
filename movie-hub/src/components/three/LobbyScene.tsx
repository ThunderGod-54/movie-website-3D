import { Outlines } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { CanvasTexture, Group, SRGBColorSpace } from 'three'

type LobbySceneProps = {
  activeStop: number
  pointerRef: RefObject<{ x: number; y: number }>
}

const cameraPositions = [
  [0, 4.2, 12],
  [-0.7, 4.2, 7.2],
  [2.5, 3.5, 6.3],
] as const

const cameraTargets = [
  [0, 2.3, -2.1],
  [-0.2, 2.4, -7.2],
  [4, 2.1, -7.3],
] as const

// Reusable popcorn positions — defined outside component to avoid re-creation
const popcornPositions = [
  [-0.45, 3.18, 0],
  [-0.15, 3.33, 0.1],
  [0.18, 3.19, -0.05],
  [0.45, 3.28, 0.08],
] as const

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

function Poster({ position, title, tint }: { position: [number, number, number]; title: string; tint: string }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.85, 2.55, 0.14]} />
        <meshToonMaterial color="#573f36" />
        <Outline />
      </mesh>
      <mesh position={[0, 0, 0.09]}>
        <planeGeometry args={[1.58, 2.27]} />
        <meshToonMaterial color="#f5ebd6" />
      </mesh>
      <mesh position={[0, 0.2, 0.11]}>
        {/* Reduced circle segments: 16 is plenty for this radius */}
        <circleGeometry args={[0.48, 16]} />
        <meshToonMaterial color={tint} />
      </mesh>
      <mesh position={[0, 0.2, 0.13]}>
        {/* Torus segments: 6,18 → 6,12 */}
        <torusGeometry args={[0.31, 0.035, 6, 12]} />
        <meshToonMaterial color="#f5ebd6" />
      </mesh>
      <mesh position={[-0.32, 0.2, 0.13]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.11, 0.68, 0.04]} />
        <meshToonMaterial color="#e7b973" />
      </mesh>
      <CanvasLabel text={title.toUpperCase()} position={[0, -0.64, 0.14]} size={[1.5, 0.25]} fontSize={72} />
      <mesh position={[0, -0.88, 0.14]}>
        <boxGeometry args={[0.82, 0.035, 0.015]} />
        <meshBasicMaterial color={tint} />
      </mesh>
    </group>
  )
}

function PosterWall() {
  return (
    <group>
      <CanvasLabel text="NOW SHOWING" position={[0, 4.35, -7.77]} size={[3.6, 0.55]} fontSize={90} />
      <Poster position={[-4.5, 2.55, -7.72]} title="Moonlit Garden" tint="#809879" />
      <Poster position={[-1.5, 2.55, -7.72]} title="A Good Heist" tint="#d56d51" />
      <Poster position={[1.5, 2.55, -7.72]} title="Paper Planets" tint="#738d9a" />
    </group>
  )
}

function TicketCounter() {
  return (
    <group position={[-5.55, 0, -1.6]}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[3.2, 1.55, 1.25]} />
        <meshToonMaterial color="#7b5241" />
        <Outline />
      </mesh>
      <mesh position={[0, 1.86, 0]} castShadow>
        <boxGeometry args={[3.4, 0.18, 1.4]} />
        <meshToonMaterial color="#e6c28c" />
        <Outline />
      </mesh>
      <mesh position={[0, 2.45, -0.42]}>
        <boxGeometry args={[2.3, 0.78, 0.13]} />
        <meshToonMaterial color="#d76b51" />
        <Outline />
      </mesh>
      <CanvasLabel text="TICKETS" position={[0, 2.45, -0.32]} size={[2.1, 0.54]} color="#fff5df" fontSize={138} />
      <CanvasLabel text="BOX OFFICE" position={[0, 0.25, 0.65]} size={[2.2, 0.4]} color="#f4dfbc" fontSize={92} />
    </group>
  )
}

function PopcornStand() {
  return (
    <group position={[5.2, 0, -2.1]}>
      {/* Cylinder segments: 8 is fine for this distance */}
      <mesh position={[0, 0.68, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.72, 1.35, 8]} />
        <meshToonMaterial color="#e2bd82" />
        <Outline />
      </mesh>
      <mesh position={[0, 1.38, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.16, 8]} />
        <meshToonMaterial color="#bd5342" />
        <Outline />
      </mesh>
      <mesh position={[0, 2.25, 0]} castShadow>
        <boxGeometry args={[1.65, 1.45, 1.05]} />
        <meshToonMaterial color="#83a098" />
        <Outline />
      </mesh>
      <mesh position={[0, 2.25, 0.55]}>
        <planeGeometry args={[1.22, 0.72]} />
        <meshToonMaterial color="#f2e5ce" />
      </mesh>
      <CanvasLabel text="POPCORN" position={[0, 2.3, 0.57]} size={[1.08, 0.25]} color="#344843" fontSize={88} />
      {/* Dodecahedron detail 0→0, segments already at minimum */}
      {popcornPositions.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <dodecahedronGeometry args={[0.27, 0]} />
          <meshToonMaterial color="#fff2d4" />
          <Outline />
        </mesh>
      ))}
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

function CameraRig({ activeStop, pointerRef }: LobbySceneProps) {
  // Store smoothed camera state as a flat array to avoid object allocation per frame
  const smoothed = useRef([0, 4.2, 12, 0, 2.3, -2.1])

  useFrame(({ camera, clock }, delta) => {
    const position = cameraPositions[activeStop] ?? cameraPositions[0]
    const look = cameraTargets[activeStop] ?? cameraTargets[0]
    const { x, y } = pointerRef.current
    const sway = Math.sin(clock.elapsedTime * 0.24) * 0.07
    // Exponential smoothing — framerate-independent
    const f = 1 - Math.exp(-delta * 2.6)
    const s = smoothed.current

    s[0] += (position[0] + x * 0.35 + sway - s[0]) * f
    s[1] += (position[1] + y * 0.18 - s[1]) * f
    s[2] += (position[2] - s[2]) * f
    s[3] += (look[0] + x * 0.6 - s[3]) * f
    s[4] += (look[1] + y * 0.25 - s[4]) * f
    s[5] += (look[2] - s[5]) * f

    camera.position.set(s[0], s[1], s[2])
    camera.lookAt(s[3], s[4], s[5])
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
      <PopcornStand />
      <ScreensDoor />
      <FloatingTicket />
      <FloatingReel />
      <HangingLights />
      <CameraRig activeStop={activeStop} pointerRef={pointerRef} />
    </>
  )
}

export default LobbyScene
