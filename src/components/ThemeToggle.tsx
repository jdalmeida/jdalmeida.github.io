'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      applyTheme('system')
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.toggle('dark', systemTheme === 'dark')
    } else {
      root.classList.toggle('dark', newTheme === 'dark')
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  if (!mounted) return null

  const themes = [
    { value: 'light', icon: Sun, label: 'Claro' },
    { value: 'dark', icon: Moon, label: 'Escuro' },
    { value: 'system', icon: Monitor, label: 'Sistema' }
  ] as const

  return (
    <div className="relative">
      <div className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-1 shadow-lg dark:shadow-gray-900/25">
        {themes.map((t) => {
          const IconComponent = t.icon
          const isActive = theme === t.value
          
          return (
            <button
              key={t.value}
              onClick={() => handleThemeChange(t.value)}
              className={`
                relative p-3 rounded-xl transition-all duration-300 group
                ${isActive 
                  ? 'bg-primary-500 dark:bg-primary-600 text-white shadow-lg transform scale-105 shadow-primary-500/25 dark:shadow-primary-600/30' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700/50'
                }
              `}
              aria-label={`Mudar para tema ${t.label.toLowerCase()}`}
            >
              <IconComponent 
                size={18} 
                className={`
                  transition-all duration-300 
                  ${isActive ? 'rotate-0 scale-110' : 'group-hover:scale-110 group-hover:rotate-12'}
                `}
              />
              
              {isActive && (
                <div className="absolute inset-0 bg-primary-500 dark:bg-primary-600 rounded-xl animate-pulse opacity-20 dark:opacity-30"></div>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Floating indicator */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-1 h-1 bg-primary-500 dark:bg-primary-400 rounded-full opacity-60"></div>
      </div>
    </div>
  )
} 