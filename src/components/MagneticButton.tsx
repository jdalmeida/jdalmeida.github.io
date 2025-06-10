'use client'

import { useRef, useEffect, ReactNode } from 'react'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  strength?: number
  onClick?: () => void
}

export function MagneticButton({ 
  children, 
  className = '', 
  strength = 0.3,
  onClick 
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const maxDistance = 100
      
      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance
        const moveX = deltaX * force * strength
        const moveY = deltaY * force * strength
        
        button.style.transform = `translate(${moveX}px, ${moveY}px) scale(${1 + force * 0.1})`
      } else {
        button.style.transform = 'translate(0px, 0px) scale(1)'
      }
    }

    const handleMouseLeave = () => {
      button.style.transform = 'translate(0px, 0px) scale(1)'
    }

    document.addEventListener('mousemove', handleMouseMove)
    button.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      button.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [strength])

  return (
    <button
      ref={buttonRef}
      className={`
        relative transition-all duration-300 ease-out
        before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r 
        before:from-primary-400 before:to-purple-400 before:opacity-0 
        before:transition-opacity before:duration-300 before:blur-lg
        hover:before:opacity-30
        ${className}
      `}
      onClick={onClick}
      data-cursor="pointer"
    >
      <span className="relative z-10 block">
        {children}
      </span>
    </button>
  )
} 