import type { Metadata } from 'next'
import '../styles/globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { SoundEffects } from '@/components/SoundEffects'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

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
      <body className="antialiased overflow-x-hidden dark">
        <Analytics />
        <SpeedInsights />
        {/* Sound Effects */}
        <SoundEffects />

        {/* Minimalist Matte Background with Subtle Topo or Grid Pattern */}
        <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
          <div className="noise-overlay"></div>
          
          <div 
            className="absolute inset-0 opacity-[0.03] dark:opacity-10 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        {/* Very subtle glow for depth only */}
        <div className="fixed inset-0 -z-5 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-[30vw] h-[30vw] max-w-sm max-h-sm bg-primary-500/5 rounded-full blur-[100px]"></div>
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
          className="fixed top-0 left-0 z-[999] h-1 bg-primary-500 dark:bg-primary-500 transition-transform duration-300 origin-left scale-x-0"
        ></div>

        {/* Scroll Progress Indicator */}
        <div className="fixed top-0 left-0 right-0 z-[999] h-1 bg-gray-200/20 dark:bg-gray-800/50 transition-colors duration-300">
          <div 
            id="scroll-progress" 
            className="h-full bg-primary-500 dark:bg-primary-500 transition-transform duration-150 origin-left scale-x-0"
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