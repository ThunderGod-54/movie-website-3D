import { RoundedBox } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

function PremiumSeat({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.3, 0.3, 1.12]} radius={0.11} smoothness={3} position={[0, 0.26, 0]}>
        <meshToonMaterial color="#382c2c" />
      </RoundedBox>
      <RoundedBox args={[1.08, 0.2, 0.78]} radius={0.09} smoothness={3} position={[0, 0.53, -0.1]}>
        <meshToonMaterial color="#a43e46" />
      </RoundedBox>
      <RoundedBox
        args={[1.08, 1.05, 0.32]}
        radius={0.14}
        smoothness={4}
        position={[0, 1.06, 0.35]}
        rotation={[-0.1, 0, 0]}
      >
        <meshToonMaterial color="#8e303a" />
      </RoundedBox>
      {[-0.68, 0.68].map((x) => (
        <group key={x} position={[x, 0.48, 0.02]}>
          <RoundedBox args={[0.19, 0.52, 0.87]} radius={0.07} smoothness={3}>
            <meshToonMaterial color="#30292a" />
          </RoundedBox>
          <RoundedBox args={[0.2, 0.13, 0.65]} radius={0.05} smoothness={3} position={[0, 0.29, -0.02]}>
            <meshToonMaterial color="#ba5156" />
          </RoundedBox>
          <mesh position={[0, 0.56, -0.18]}>
            <cylinderGeometry args={[0.085, 0.085, 0.035, 16]} />
            <meshToonMaterial color="#c8a76d" />
          </mesh>
          <mesh position={[0, 0.59, -0.18]}>
            <cylinderGeometry args={[0.055, 0.055, 0.035, 16]} />
            <meshToonMaterial color="#211d1d" />
          </mesh>
        </group>
      ))}
      <RoundedBox args={[0.72, 0.12, 0.12]} radius={0.04} smoothness={2} position={[0, 1.53, 0.45]}>
        <meshToonMaterial color="#bd7773" />
      </RoundedBox>
    </group>
  )
}

function createScreenTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const context = canvas.getContext('2d')

  if (context) {
    const sky = context.createLinearGradient(0, 0, 0, canvas.height)
    sky.addColorStop(0, '#335878')
    sky.addColorStop(0.64, '#d58c72')
    sky.addColorStop(1, '#f0c795')
    context.fillStyle = sky
    context.fillRect(0, 0, canvas.width, canvas.height)

    context.fillStyle = '#ffd88d'
    context.beginPath()
    context.arc(730, 190, 76, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#4a5266'
    context.beginPath()
    context.moveTo(0, 390)
    context.lineTo(210, 215)
    context.lineTo(420, 390)
    context.lineTo(610, 250)
    context.lineTo(880, 405)
    context.lineTo(1024, 300)
    context.lineTo(1024, 512)
    context.lineTo(0, 512)
    context.fill()

    context.fillStyle = '#282d3b'
    context.beginPath()
    context.moveTo(0, 455)
    context.lineTo(260, 330)
    context.lineTo(490, 455)
    context.lineTo(730, 335)
    context.lineTo(1024, 450)
    context.lineTo(1024, 512)
    context.lineTo(0, 512)
    context.fill()
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function MovieScreen() {
  const texture = useMemo(createScreenTexture, [])
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <group position={[0, 0, -13]}>
      <mesh position={[0, 5.15, -0.22]}>
        <boxGeometry args={[14.6, 8.4, 0.5]} />
        <meshToonMaterial color="#342b2e" />
      </mesh>
      <mesh position={[0, 5.15, 0.05]}>
        <planeGeometry args={[13.8, 7.55]} />
        <meshBasicMaterial map={texture} />
      </mesh>
      <mesh position={[0, 9.3, 0.02]}>
        <boxGeometry args={[14.7, 0.18, 0.32]} />
        <meshToonMaterial color="#bd9b68" />
      </mesh>
      <pointLight position={[0, 5.3, 1.3]} intensity={55} distance={15} color="#f5bd8a" />
    </group>
  )
}

function SideWall({ side }: { side: -1 | 1 }) {
  return (
    <group position={[side * 8.8, 0, 0]}>
      <mesh position={[0, 5.3, 0]}>
        <boxGeometry args={[0.35, 10.6, 28]} />
        <meshToonMaterial color={side === -1 ? '#342b34' : '#3e3038'} />
      </mesh>
      {[-10, -6, -2, 2, 6, 10].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh position={[-side * 0.22, 5.2, 0]}>
            <boxGeometry args={[0.08, 3.3, 2.7]} />
            <meshToonMaterial color="#59414a" />
          </mesh>
          <mesh position={[-side * 0.38, 3.1, 0]}>
            <boxGeometry args={[0.12, 0.18, 0.65]} />
            <meshToonMaterial color="#e5c48b" />
          </mesh>
          <pointLight position={[-side * 0.6, 3.3, 0]} intensity={8} distance={5} color="#ffc982" />
        </group>
      ))}
    </group>
  )
}

function AuditoriumRows() {
  const rows = [
    { z: -7.2, y: 0.35 },
    { z: -3.7, y: 0.7 },
    { z: -0.2, y: 1.05 },
    { z: 3.3, y: 1.4 },
    { z: 6.8, y: 1.75 },
  ]
  const seatPositions = [-6.35, -4.75, -3.15, 3.15, 4.75, 6.35]

  return (
    <group>
      {rows.map((row, rowIndex) => (
        <group key={row.z}>
          <mesh position={[0, row.y - 0.14, row.z]}>
            <boxGeometry args={[15.8, 0.28, 2.3]} />
            <meshToonMaterial color={rowIndex % 2 === 0 ? '#59363a' : '#633c40'} />
          </mesh>
          {seatPositions.map((x) => (
            <PremiumSeat key={x} position={[x, row.y, row.z]} />
          ))}
          <mesh position={[0, row.y + 0.015, row.z + 0.98]}>
            <boxGeometry args={[1.3, 0.035, 0.08]} />
            <meshBasicMaterial color="#d5aa68" />
          </mesh>
          {[-7.45, 7.45].map((x) => (
            <mesh key={x} position={[x, row.y + 0.08, row.z + 0.88]}>
              <sphereGeometry args={[0.07, 12, 8]} />
              <meshBasicMaterial color="#ffd78d" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

export default function Auditorium() {
  return (
    <>
      <color attach="background" args={['#211b24']} />
      <ambientLight intensity={0.85} />
      <hemisphereLight args={['#e7c8ab', '#32202a', 1.05]} />
      <directionalLight position={[-4, 9, 8]} intensity={1.35} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <planeGeometry args={[18, 28]} />
        <meshToonMaterial color="#332831" />
      </mesh>
      <mesh position={[0, 10.8, 0]}>
        <boxGeometry args={[18, 0.3, 28]} />
        <meshToonMaterial color="#29232c" />
      </mesh>
      <SideWall side={-1} />
      <SideWall side={1} />

      <mesh position={[0, 5.1, 13.8]}>
        <boxGeometry args={[18, 10.2, 0.35]} />
        <meshToonMaterial color="#342a32" />
      </mesh>
      <mesh position={[0, 1.5, 13.57]}>
        <boxGeometry args={[2.8, 3, 0.08]} />
        <meshToonMaterial color="#754a4c" />
      </mesh>
      <mesh position={[0, 3.05, 13.5]}>
        <boxGeometry args={[2.95, 0.18, 0.15]} />
        <meshToonMaterial color="#c8a36a" />
      </mesh>

      <MovieScreen />
      <AuditoriumRows />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[2.4, 25]} />
        <meshToonMaterial color="#784248" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.25, 0.015, 0]}>
        <planeGeometry args={[0.045, 25]} />
        <meshBasicMaterial color="#c49a60" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.25, 0.015, 0]}>
        <planeGeometry args={[0.045, 25]} />
        <meshBasicMaterial color="#c49a60" />
      </mesh>
    </>
  )
}
