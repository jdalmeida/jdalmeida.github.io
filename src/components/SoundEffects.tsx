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
      if (!audioContextRef.current) {
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
    const createSound = (frequency: number, type: OscillatorType = 'sine', duration: number = 0.1, volume: number = 1) => {
      // Se o contexto ainda não foi inicializado por uma interação do usuário (clique/tecla),
      // não tocamos nada para evitar o aviso do navegador "AudioContext was not allowed to start".
      // O listener global no `document` com `{ capture: true }` garante que o contexto
      // seja inicializado ANTES de qualquer onClick do React.
      if (!audioContextRef.current || !isEnabledRef.current) return

      try {
        // Tentar resumir se estiver suspenso (necessário em muitos navegadores)
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {})
        }

        // Se ainda está suspenso, não adianta tocar agora.
        if (audioContextRef.current.state === 'suspended') return

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
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {})
      }
      document.removeEventListener('click', enableAudio, { capture: true })
      document.removeEventListener('keydown', enableAudio, { capture: true })
    }

    // Add initialization listeners in capture phase so it fires before React events
    document.addEventListener('click', enableAudio, { capture: true })
    document.addEventListener('keydown', enableAudio, { capture: true })

    // Expose sound functions globally for easy access
    ;(window as any).playSound = {
      hover: () => {
        if (!audioContextRef.current || !isEnabledRef.current) return
        if (audioContextRef.current.state === 'suspended') return
        try {
          const ctx = audioContextRef.current
          const now = ctx.currentTime

          // Layer 1: soft descending sweep (main body)
          const osc1 = ctx.createOscillator()
          const gain1 = ctx.createGain()
          osc1.type = 'sine'
          osc1.frequency.setValueAtTime(1200, now)
          osc1.frequency.exponentialRampToValueAtTime(800, now + 0.08)
          gain1.gain.setValueAtTime(0.045, now)
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
          osc1.connect(gain1).connect(ctx.destination)
          osc1.start(now)
          osc1.stop(now + 0.1)

          // Layer 2: faint high harmonic for sparkle
          const osc2 = ctx.createOscillator()
          const gain2 = ctx.createGain()
          osc2.type = 'triangle'
          osc2.frequency.setValueAtTime(1800, now)
          gain2.gain.setValueAtTime(0.015, now)
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
          osc2.connect(gain2).connect(ctx.destination)
          osc2.start(now)
          osc2.stop(now + 0.07)
        } catch {}
      },
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
      document.removeEventListener('click', enableAudio, { capture: true })
      document.removeEventListener('keydown', enableAudio, { capture: true })
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