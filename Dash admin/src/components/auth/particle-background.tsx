"use client"

import * as React from "react"
import { useMemo } from "react"

type Bean = {
  id: number
  left: number
  size: number
  opacity: number
  duration: number
  delay: number
  drift: number
  blur: number
}

/**
 * Floating coffee bean particles with SVG icons and premium animations.
 */
export function ParticleBackground({ count = 25 }: { count?: number }) {
  const beans = useMemo<Bean[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const r = (n: number) => {
        const x = Math.sin((i + 1) * (n + 13.37)) * 10000
        return x - Math.floor(x)
      }
      return {
        id: i,
        left: r(2) * 100,
        size: 16 + r(3) * 20,
        opacity: 0.15 + r(4) * 0.35,
        duration: 12 + r(5) * 10,
        delay: -r(6) * 20,
        drift: (r(7) - 0.5) * 180,
        blur: r(8) > 0.7 ? Math.floor(r(9) * 2) : 0,
      }
    })
  }, [count])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Background image with warm cinematic overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url(/coffee-shop-bg.jpg)",
          filter: "blur(4px) brightness(0.4) saturate(1.1)",
          transform: "scale(1.05)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent, rgba(34, 12, 2, 0.4)), linear-gradient(180deg, rgba(34, 12, 2, 0.3), rgba(34, 12, 2, 0.7))",
        }}
      />

      {/* Floating SVG Particles */}
      {beans.map((b) => (
        <div
          key={b.id}
          className="bean flex items-center justify-center"
          style={
            {
              left: `${b.left}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
              opacity: b.opacity,
              "--bean-opacity": b.opacity,
              "--bean-drift": `${b.drift}px`,
            } as React.CSSProperties
          }
        >
          <svg
            viewBox="0 0 512 512"
            fill="currentColor"
            className="text-[#2A1A15]"
            style={{ 
              filter: b.blur ? `blur(${b.blur}px)` : undefined,
              transform: `rotate(${b.id * 72}deg)`,
            }}
          >
            <path d="M410.1,230.1c-1.4-13.4-4.2-26.6-8.3-39.4c-4.1-12.8-9.4-25.1-15.8-36.9c-12.8-23.6-29.6-45-49.8-63.5 c-20.2-18.5-43.3-33.8-68.5-45.3c-25.2-11.5-52.1-19.1-79.8-22.6c-27.7-3.5-55.8-3-83.3,1.5c-27.5,4.5-54.2,13.2-79.5,25.8 c-25.3,12.6-48.4,28.8-68.5,48.2c-20.1,19.4-36.8,41.9-49.3,66.9c-12.5,25-20.8,52.2-24.5,80.4c-3.7,28.2-3.1,56.9,1.6,84.9 c4.7,28,13.6,55.3,26.4,80.9c12.8,25.6,29.4,49,49.1,69.5c19.7,20.5,42.4,37.8,67.5,51.3c25.1,13.5,52.2,23.1,80.4,28.5 c28.2,5.4,57.1,6.6,85.8,3.5c28.7-3.1,56.8-10.4,83.4-21.7c26.6-11.3,51.2-26.4,72.7-44.9c21.5-18.5,39.8-40.3,54-64.7 c14.2-24.4,24.4-50.9,30.1-78.9c5.7-28,7.3-56.7,4.8-85.3C414.3,257.6,412.3,243.6,410.1,230.1z M256,416 c-88.4,0-160-71.6-160-160c0-10.5,1-20.8,3-30.8C110.8,245.9,139.3,266,171,274c31.7,8,64.2,6.5,94.9-4.2 c30.7-10.7,57.8-29.3,77.5-53.1c19.7-23.8,31.7-52.6,34.4-83.2c16,19.4,27.8,41.9,34.2,66.3c6.4,24.4,8.5,50.1,6,75.7 c-2.5,25.6-9.1,50.2-19.5,72.9c-10.4,22.7-24.7,43-42.3,60c-17.6,17-38.4,30.3-61.4,39.3C285.9,411.3,271.2,414.7,256,416z"/>
          </svg>
        </div>
      ))}
    </div>
  )
}
