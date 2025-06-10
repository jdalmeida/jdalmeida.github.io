'use client'

interface SpotlightTextProps {
  children: React.ReactNode
  className?: string
}

export default function SpotlightText({ children, className = '' }: SpotlightTextProps) {
  return (
    <span 
      className={`spotlight-effect relative inline-block cursor-pointer text-primary-500/30 ${className}`}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
        e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
      }}
    >
      {children}
    </span>
  )
} 