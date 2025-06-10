'use client'

import { useEffect, useRef } from 'react'

export function SoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const isEnabledRef = useRef(false)

  useEffect(() => {
    // Check if audio is supported
    if (typeof window === 'undefined' || (!window.AudioContext && !(window as any).webkitAudioContext)) {
      return
    }

    // Initialize audio context on first user interaction
    const initAudio = () => {
      if (!audioContextRef.current && !isEnabledRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
          isEnabledRef.current = true
        } catch (error) {
          console.warn('AudioContext não disponível:', error)
          return
        }
      }
    }

    // Sound generation function
    const createSound = (frequency: number, type: OscillatorType = 'sine', duration: number = 0.1, volume: number = 0.1) => {
      if (!audioContextRef.current || !isEnabledRef.current) return

      try {
        const oscillator = audioContextRef.current.createOscillator()
        const gainNode = audioContextRef.current.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)

        oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
        oscillator.type = type

        gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration)

        oscillator.start(audioContextRef.current.currentTime)
        oscillator.stop(audioContextRef.current.currentTime + duration)
      } catch (error) {
        console.warn('Erro ao reproduzir som:', error)
      }
    }

    // Enable audio on first interaction
    const enableAudio = () => {
      initAudio()
      document.removeEventListener('click', enableAudio)
      document.removeEventListener('keydown', enableAudio)
    }

    // Add initialization listeners
    document.addEventListener('click', enableAudio)
    document.addEventListener('keydown', enableAudio)

    // Expose sound functions globally for easy access
    ;(window as any).playSound = {
      hover: () => createSound(800, 'sine', 0.1, 0.05),
      click: () => {
        createSound(600, 'square', 0.1, 0.05)
        setTimeout(() => createSound(800, 'sine', 0.1, 0.03), 50)
      },
      success: () => {
        createSound(523, 'sine', 0.15, 0.05) // C5
        setTimeout(() => createSound(659, 'sine', 0.15, 0.05), 100) // E5
        setTimeout(() => createSound(784, 'sine', 0.2, 0.05), 200) // G5
      },
      notification: () => {
        createSound(1000, 'sine', 0.1, 0.04)
        setTimeout(() => createSound(1200, 'sine', 0.1, 0.04), 100)
      }
    }

    return () => {
      document.removeEventListener('click', enableAudio)
      document.removeEventListener('keydown', enableAudio)
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return null
}

// Helper functions for triggering sounds from components
export const playHoverSound = () => {
  if ((window as any).playSound) {
    (window as any).playSound.hover()
  }
}

export const playClickSound = () => {
  if ((window as any).playSound) {
    (window as any).playSound.click()
  }
}

export const playSuccessSound = () => {
  if ((window as any).playSound) {
    (window as any).playSound.success()
  }
}

export const playNotificationSound = () => {
  if ((window as any).playSound) {
    (window as any).playSound.notification()
  }
} 