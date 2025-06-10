'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Code, Rocket } from 'lucide-react'

export function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Inicializando...')
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const steps = [
      { progress: 20, text: 'Carregando componentes...' },
      { progress: 40, text: 'Preparando experiência...' },
      { progress: 60, text: 'Conectando elementos...' },
      { progress: 80, text: 'Otimizando performance...' },
      { progress: 100, text: 'Pronto!' }
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].progress)
        setLoadingText(steps[currentStep].text)
        currentStep++
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setIsVisible(false)
        }, 500)
      }
    }, 600)

    return () => clearInterval(interval)
  }, [])

  if (!isVisible) return null

  return (
    <div className={`
      fixed inset-0 z-[100] bg-gradient-to-br from-primary-600 via-purple-600 to-indigo-700
      flex items-center justify-center transition-opacity duration-1000
      ${progress === 100 ? 'opacity-0' : 'opacity-100'}
    `}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.3) 1px, transparent 0)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-white/10 rounded-full blur-xl floating-element"></div>
        <div className="absolute top-3/4 right-1/4 w-16 h-16 bg-yellow-300/20 rounded-full blur-xl floating-element animate-delay-300"></div>
        <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-pink-300/20 rounded-full blur-xl floating-element animate-delay-500"></div>
      </div>

      <div className="relative z-10 text-center text-white max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl">
            <Sparkles size={40} className="text-white animate-pulse" />
          </div>
          
          {/* Orbital Icons */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
            <Code size={24} className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-yellow-300" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}>
            <Rocket size={20} className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-pink-300" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black mb-2">
          <span className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
            João de Almeida
          </span>
        </h1>
        <p className="text-white/80 mb-8">Preparando sua experiência...</p>

        {/* Progress Bar */}
        <div className="relative mb-6">
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
            </div>
          </div>
          
          {/* Progress Percentage */}
          <div className="absolute -top-8 left-0 w-full text-center">
            <span className="text-2xl font-bold text-white/90">
              {progress}%
            </span>
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-white/70 text-sm font-medium min-h-[20px] transition-all duration-300">
          {loadingText}
        </p>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 