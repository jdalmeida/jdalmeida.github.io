import type { Metadata } from 'next'
import '../styles/globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ParticleBackground } from '@/components/ParticleBackground'
import { SoundEffects } from '@/components/SoundEffects'

export const metadata: Metadata = {
  title: {
    template: '%s | João de Almeida',
    default: 'João de Almeida - CTO & Tech Lead',
  },
  description: 'CTO da Allpines, especialista em desenvolvimento de software, liderança técnica e transformação digital. Compartilhando insights sobre tecnologia e inovação.',
  keywords: ['João de Almeida', 'CTO', 'Allpines', 'desenvolvimento de software', 'liderança técnica', 'transformação digital', 'Next.js', 'React', 'Node.js', 'tecnologia', 'inovação'],
  authors: [{ name: 'João de Almeida', url: 'https://github.com/jdalmeida' }],
  creator: 'João de Almeida',
  publisher: 'João de Almeida',
  metadataBase: new URL('https://jdalmeida.github.io'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://jdalmeida.github.io',
    title: 'João de Almeida - CTO & Tech Lead',
    description: 'CTO da Allpines, especialista em desenvolvimento de software, liderança técnica e transformação digital.',
    siteName: 'João de Almeida Blog',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'João de Almeida - CTO & Tech Lead',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'João de Almeida - CTO & Tech Lead',
    description: 'CTO da Allpines, especialista em desenvolvimento de software, liderança técnica e transformação digital.',
    images: ['/og-image.png'],
    creator: '@jdalmeida',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className="antialiased overflow-x-hidden">
        
        {/* Particle Background */}
        <ParticleBackground />
        
        {/* Sound Effects */}
        <SoundEffects />

        {/* Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-colors duration-300"></div>
          <div 
            className="absolute inset-0 opacity-30 dark:opacity-10 transition-opacity duration-300"
            style={{
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)
              `,
              backgroundSize: '50px 50px'
            }}
          ></div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="fixed inset-0 -z-5 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-200/20 dark:bg-primary-400/10 rounded-full blur-3xl floating-element transition-colors duration-300"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-purple-200/20 dark:bg-purple-400/10 rounded-full blur-3xl floating-element animate-delay-300 transition-colors duration-300"></div>
          <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-indigo-200/20 dark:bg-indigo-400/10 rounded-full blur-3xl floating-element animate-delay-500 transition-colors duration-300"></div>
        </div>

        <div className="flex min-h-screen flex-col relative">
          <Header />
          
          {/* Main content with proper spacing for fixed header */}
          <main className="flex-1 pt-20">
            {children}
          </main>
          
          <Footer />
        </div>

        {/* Scroll Progress Bar */}
        <div 
          id="progress-bar" 
          className="fixed top-0 left-0 z-[999] h-1 bg-gradient-to-r from-primary-500 to-purple-500 dark:from-primary-400 dark:to-purple-400 transition-transform duration-300 origin-left scale-x-0"
        ></div>

        {/* Scroll Progress Indicator */}
        <div className="fixed top-0 left-0 right-0 z-[999] h-1 bg-gray-200/50 dark:bg-gray-700/50 transition-colors duration-300">
          <div 
            id="scroll-progress" 
            className="h-full bg-gradient-to-r from-primary-500 to-purple-500 dark:from-primary-400 dark:to-purple-400 transition-transform duration-150 origin-left scale-x-0"
          ></div>
        </div>

        {/* Enhanced Scripts for Better UX */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Scroll progress indicator
              function updateScrollProgress() {
                const scrollTop = window.pageYOffset;
                const docHeight = document.body.scrollHeight - window.innerHeight;
                const scrollPercent = Math.min(scrollTop / docHeight, 1);
                const progressBar = document.getElementById('scroll-progress');
                if (progressBar) {
                  progressBar.style.transform = 'scaleX(' + scrollPercent + ')';
                }
              }

              // Smooth reveal animations with intersection observer
              function initializeAnimations() {
                const observerOptions = {
                  threshold: 0.1,
                  rootMargin: '0px 0px -50px 0px'
                };

                const observer = new IntersectionObserver((entries) => {
                  entries.forEach(entry => {
                    if (entry.isIntersecting) {
                      entry.target.style.opacity = '1';
                      if (entry.target.classList.contains('slide-in-up')) {
                        entry.target.style.transform = 'translateY(0)';
                      } else if (entry.target.classList.contains('slide-in-left')) {
                        entry.target.style.transform = 'translateX(0)';
                      } else if (entry.target.classList.contains('slide-in-right')) {
                        entry.target.style.transform = 'translateX(0)';
                      }
                      observer.unobserve(entry.target);
                    }
                  });
                }, observerOptions);

                // Observe elements with animation classes
                document.querySelectorAll('.slide-in-up, .slide-in-left, .slide-in-right, .fade-in').forEach(el => {
                  el.style.opacity = '0';
                  if (el.classList.contains('slide-in-up')) {
                    el.style.transform = 'translateY(30px)';
                  } else if (el.classList.contains('slide-in-left')) {
                    el.style.transform = 'translateX(-30px)';
                  } else if (el.classList.contains('slide-in-right')) {
                    el.style.transform = 'translateX(30px)';
                  }
                  observer.observe(el);
                });
              }

              // Parallax effect for hero sections
              function handleParallax() {
                const scrolled = window.pageYOffset;
                const parallaxElements = document.querySelectorAll('.parallax-element');
                
                parallaxElements.forEach(element => {
                  const speed = element.dataset.speed || 0.5;
                  const yPos = -(scrolled * speed);
                  element.style.transform = 'translateY(' + yPos + 'px)';
                });
              }

              // Enhanced page load detection
              function handlePageLoad() {
                const progressBar = document.getElementById('progress-bar');
                if (progressBar) {
                  progressBar.style.transform = 'scaleX(1)';
                  setTimeout(() => {
                    progressBar.style.transform = 'scaleX(0)';
                  }, 800);
                }
              }

              // Initialize everything
              document.addEventListener('DOMContentLoaded', function() {
                initializeAnimations();
                updateScrollProgress();
              });

              // Event listeners
              window.addEventListener('scroll', function() {
                updateScrollProgress();
                handleParallax();
              });

              window.addEventListener('load', handlePageLoad);

              // Performance optimization: throttle scroll events
              let ticking = false;
              function requestTick() {
                if (!ticking) {
                  requestAnimationFrame(() => {
                    updateScrollProgress();
                    handleParallax();
                    ticking = false;
                  });
                  ticking = true;
                }
              }

              window.addEventListener('scroll', requestTick);
            `,
          }}
        />
      </body>
    </html>
  )
} 