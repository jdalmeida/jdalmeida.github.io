'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

export function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return

    const div = divRef.current
    const rect = div.getBoundingClientRect()

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleFocus = () => {
    setIsFocused(true)
    setOpacity(1)
  }

  const handleBlur = () => {
    setIsFocused(false)
    setOpacity(0)
  }

  const handleMouseEnter = () => {
    setOpacity(1)
  }

  const handleMouseLeave = () => {
    setOpacity(0)
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-3xl border border-gray-800 bg-gray-950/50 backdrop-blur-xl overflow-hidden ${className || ''}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 z-10"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,.15), transparent 40%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -inset-px transition duration-500 z-0"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,.1), transparent 40%)`,
        }}
      />
      {children}
    </div>
  )
}
