'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  size: number
  color: string
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000, radius: 150 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight

    const resizeCanvas = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      createParticles()
    }

    const createParticles = () => {
      const particles: Particle[] = []
      const particleCount = Math.min(200, Math.floor((width * height) / 9000))
      
      const colors = ['#6366f1', '#818cf8', '#c7d2fe', '#06b6d4', '#2dd4bf']

      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width
        const y = Math.random() * height
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
          color: colors[Math.floor(Math.random() * colors.length)]
        })
      }

      particlesRef.current = particles
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, width, height)

      particlesRef.current.forEach((particle, index) => {
        // Drift movement
        particle.baseX += particle.vx
        particle.baseY += particle.vy

        // Wrap around edges
        if (particle.baseX < 0) particle.baseX = width
        if (particle.baseX > width) particle.baseX = 0
        if (particle.baseY < 0) particle.baseY = height
        if (particle.baseY > height) particle.baseY = 0

        // Mouse interaction physics
        const dx = mouseRef.current.x - particle.baseX
        const dy = mouseRef.current.y - particle.baseY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        const forceDirectionX = dx / distance
        const forceDirectionY = dy / distance
        const maxDistance = mouseRef.current.radius
        const force = (maxDistance - distance) / maxDistance
        const directionX = forceDirectionX * force * 5
        const directionY = forceDirectionY * force * 5

        if (distance < maxDistance) {
          particle.x = particle.baseX - directionX * 20
          particle.y = particle.baseY - directionY * 20
        } else {
          // Return to base position smoothly
          particle.x += (particle.baseX - particle.x) * 0.1
          particle.y += (particle.baseY - particle.y) * 0.1
        }

        // Draw particle
        ctx.globalAlpha = 0.6
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Draw connections
        particlesRef.current.slice(index + 1).forEach(otherParticle => {
          const cDx = particle.x - otherParticle.x
          const cDy = particle.y - otherParticle.y
          const cDistance = Math.sqrt(cDx * cDx + cDy * cDy)

          if (cDistance < 120) {
            const opacity = (120 - cDistance) / 120 * 0.15
            ctx.globalAlpha = opacity
            ctx.strokeStyle = particle.color
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.stroke()
          }
        })
      })
    }

    const animate = () => {
      drawParticles()
      animationRef.current = requestAnimationFrame(animate)
    }

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = event.x
      mouseRef.current.y = event.y
    }
    
    const handleMouseLeave = () => {
      mouseRef.current.x = -1000
      mouseRef.current.y = -1000
    }

    resizeCanvas()
    animate()

    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen opacity-30 transition-opacity duration-1000"
    />
  )
}