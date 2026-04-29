'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Text, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

type CartridgeModelProps = {
  title: string
  color: string
  hovered: boolean
  clicked: boolean
}

function CartridgeModel({ title, color, hovered, clicked }: CartridgeModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const scaleRef = useRef(1)

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const targetY = hovered && !clicked ? Math.PI : 0
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY,
      delta * 6
    )

    const targetScale = hovered && !clicked ? 1.06 : 1
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, delta * 8)
    groupRef.current.scale.setScalar(scaleRef.current)

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      hovered && !clicked ? -0.08 : 0,
      delta * 6
    )
  })

  const labelColor = color || '#e05a2b'

  return (
    <group ref={groupRef}>
      {/* Main cartridge body */}
      <RoundedBox args={[1.9, 1.95, 0.41]} radius={0.04} smoothness={4}>
        <meshStandardMaterial color="#1c1c1f" roughness={0.6} metalness={0.15} />
      </RoundedBox>

      {/* ── FRONT FACE (label side, shown on hover) ── */}

      {/* Label background */}
      <mesh position={[0, 0.1, 0.208]}>
        <planeGeometry args={[1.62, 1.52]} />
        <meshStandardMaterial color={labelColor} roughness={0.8} />
      </mesh>

      {/* Label white upper strip (LTO branding area) */}
      <mesh position={[0, 0.87, 0.209]}>
        <planeGeometry args={[1.62, 0.2]} />
        <meshStandardMaterial color="#f5f0eb" roughness={0.9} />
      </mesh>

      {/* LTO text on label */}
      <Text
        position={[-0.52, 0.87, 0.21]}
        fontSize={0.1}
        color="#1c1c1f"
        anchorX="left"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2"
      >
        LTO ULTRIUM 5
      </Text>

      {/* Title text — handwritten style */}
      <Text
        position={[0, 0.05, 0.215]}
        fontSize={0.19}
        maxWidth={1.4}
        textAlign="center"
        color="#fff"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/caveat/v17/WnznHAc5bAfYB2QRah7pcpNvOx-pjfJ9eIWpZA.woff2"
        lineHeight={1.3}
      >
        {title}
      </Text>

      {/* Memory chip bump */}
      <mesh position={[0.62, -0.75, 0.22]}>
        <boxGeometry args={[0.28, 0.14, 0.02]} />
        <meshStandardMaterial color="#2a2a30" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* ── BACK FACE (tape window side, default view) ── */}

      {/* Window frame */}
      <mesh position={[0, 0.12, -0.208]}>
        <planeGeometry args={[1.55, 1.35]} />
        <meshStandardMaterial color="#111113" roughness={0.5} />
      </mesh>

      {/* Tape reel — outer ring */}
      <mesh position={[0, 0.12, -0.212]} rotation={[0, Math.PI, 0]}>
        <ringGeometry args={[0.42, 0.58, 48]} />
        <meshStandardMaterial color="#7a5522" roughness={0.6} />
      </mesh>

      {/* Tape reel — tape fill */}
      <mesh position={[0, 0.12, -0.213]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.41, 48]} />
        <meshStandardMaterial color="#9b6d2a" roughness={0.7} />
      </mesh>

      {/* Reel hub */}
      <mesh position={[0, 0.12, -0.214]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.14, 24]} />
        <meshStandardMaterial color="#222226" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Hub spokes */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[0, 0.12, -0.213]} rotation={[0, Math.PI, (Math.PI * 2 / 3) * i]}>
          <planeGeometry args={[0.04, 0.27]} />
          <meshStandardMaterial color="#1a1a1e" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}

      {/* Write-protect switch */}
      <mesh position={[0.98, -0.6, 0]}>
        <boxGeometry args={[0.04, 0.18, 0.3]} />
        <meshStandardMaterial color="#2e2e35" roughness={0.5} />
      </mesh>

      {/* Bottom gripper teeth */}
      {[-0.5, -0.15, 0.15, 0.5].map((x, i) => (
        <mesh key={i} position={[x, -0.99, 0]}>
          <boxGeometry args={[0.18, 0.04, 0.41]} />
          <meshStandardMaterial color="#252528" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

type Props = {
  title: string
  color: string
  onClick: () => void
}

export default function LTOCartridge3D({ title, color, onClick }: Props) {
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    setClicked(true)
    setHovered(false)
    setTimeout(() => {
      onClick()
      setClicked(false)
    }, 400)
  }

  return (
    <div
      className="canvas-container w-full h-full"
      onPointerEnter={() => !clicked && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{ cursor: hovered ? 'pointer' : 'default' }}
    >
      <Canvas
        style={{ filter: clicked ? 'blur(4px)' : 'none', transition: 'filter 0.3s ease' }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 2.8]} fov={40} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 4]} intensity={1.4} castShadow />
        <directionalLight position={[-3, -2, -3]} intensity={0.3} color="#8090ff" />
        <pointLight position={[0, 0, 3]} intensity={0.6} color="#ffeedd" />

        <CartridgeModel
          title={title}
          color={color}
          hovered={hovered}
          clicked={clicked}
        />
      </Canvas>
    </div>
  )
}
