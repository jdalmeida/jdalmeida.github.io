'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Code, Lightbulb, Users, Target, Terminal, ChevronRight } from 'lucide-react'
import PixelBlast from '@/components/PixelBlast'
import { playClickSound, playHoverSound } from '../SoundEffects'

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] as const }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
}

export function HomeClient({ posts }: { posts: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Hero Parallax
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 150])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const textX = useTransform(scrollYProgress, [0, 0.3], [0, 100])
  const textXReverse = useTransform(scrollYProgress, [0, 0.3], [0, -100])
  const imageY = useTransform(scrollYProgress, [0, 0.3], [0, -50])
  const imageScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.05])

  return (
    <div className="min-h-screen relative overflow-hidden bg-background" ref={containerRef}>
      
      {/* Immersive Hero Section */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center px-4 sm:px-8 z-10 pt-20">
        <motion.div onMouseDownCapture={playHoverSound} variants={fadeInUp} style={{ width: '100%', height: '100dvh', position: 'absolute', opacity: 0.7, top: -20 }}>
          <PixelBlast
            variant="square"
            pixelSize={3}
            color="#8eff00"
            patternScale={2}
            patternDensity={1}
            enableRipples
            rippleSpeed={0.3}
            rippleThickness={0.1}
            rippleIntensityScale={1}
            speed={0.5}
            transparent
            edgeFade={0.5} 
            className={undefined} 
            style={undefined}
          />
        </motion.div>
        <motion.div 
          className="w-full max-w-[90rem] mx-auto flex flex-col items-start"
          style={{ y: heroY, opacity: heroOpacity }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="pointer-events-none mb-4 sm:mb-8 ml-2 sm:ml-4 relative z-20">
            <div className="inline-flex backdrop-blur-sm items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 text-primary-500 uppercase tracking-[0.2em] font-display text-xs sm:text-sm font-bold w-fit">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
              Allpines CTO & Tech Lead
            </div>
          </motion.div>

          {/* Huge Typography Title & Image Interplay */}
          <div className="pointer-events-none relative w-full flex justify-center sm:justify-start">
            
            {/* Background Text Layer (JOÃO DE) */}
            <motion.h1 
              variants={fadeInUp}
              className="text-[14vw] sm:text-[12vw] md:text-[13vw] leading-[0.75] tracking-tighter uppercase relative z-20 md:z-10 w-full"
            >
              <motion.span style={{ x: textXReverse }} className="block text-gray-100 font-display font-black text-center sm:text-left">
                João de
              </motion.span>
            </motion.h1>

            {/* Floating Profile Image Over Background Text */}
            <motion.div 
              className="pointer-events-none absolute inset-x-0 bottom-[-5vw] sm:bottom-[-10vw] flex justify-center items-end sm:justify-center z-10 md:z-20 h-[50vh] sm:h-[80vh] md:h-[90vh]"
              style={{ y: imageY, scale: imageScale }}
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <div className="relative w-[70%] sm:w-[50%] md:w-[45%] lg:w-[40%] h-full">
                <Image 
                  src="/joao.png" 
                  alt="João de Almeida" 
                  fill
                  className="object-contain object-bottom filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                  priority
                />
              </div>
            </motion.div>

            {/* Foreground Text Layer (ALMEIDA) overlapping the image */}
            <motion.h1 
              variants={fadeInUp}
              className="text-[14vw] sm:text-[12vw] md:text-[13vw] leading-[0.75] tracking-tighter uppercase absolute top-[8vw] sm:top-[10vw] left-0 w-full z-30 pointer-events-none"
            >
              <motion.span style={{ x: textX }} className="block text-primary-500 font-serif font-black italic mix-blend-screen text-center sm:ml-[15vw] md:ml-[25vw] sm:text-left drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                Almeida
              </motion.span>
            </motion.h1>
          </div>

          <div className="mt-[15vw] sm:mt-32 w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-end relative z-40">
            <div className="md:col-span-7 lg:col-span-6 ml-2 sm:ml-4 bg-background/50 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none p-4 sm:p-0 rounded-2xl">
              <motion.p 
                variants={fadeInUp}
                className="pointer-events-none text-xl sm:text-2xl text-gray-400 font-sans font-light leading-relaxed mb-10 max-w-2xl text-shadow-md"
              >
                Transformando problemas complexos em <span className="text-gray-100 font-medium font-serif italic">arquiteturas escaláveis</span> e experiências <span className="text-primary-500 font-semibold uppercase tracking-wider font-display not-italic">impecáveis</span>.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6">
                <Link href="/blog" className="btn-primary w-full sm:w-auto text-center group flex justify-center items-center gap-3">
                   Explore o Blog
                   <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/sobre" className="btn-secondary w-full sm:w-auto text-center group flex justify-center items-center gap-3 bg-background/80">
                  Sobre Mim
                  <Target size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
              </motion.div>
            </div>

            {/* Aesthetic Stats/Data blocks */}
            <div className="md:col-span-5 lg:col-span-4 lg:col-start-9 hidden md:flex flex-col gap-6 text-right">
                <motion.div variants={fadeInUp} className="pt-4">
                  <div className="text-primary-500 font-display font-bold text-4xl mb-1 text-shadow-md">{new Date().getFullYear() - 2023}+</div>
                  <div className="text-gray-500 uppercase tracking-widest text-xs font-bold bg-background/80 inline-block px-2 rounded">Anos de Experiência</div>
                </motion.div>
                <motion.div variants={fadeInUp} className="border-t border-gray-800 pt-4">
                  <div className="text-primary-500 font-display font-bold text-4xl mb-1 text-shadow-md">∞</div>
                  <div className="text-gray-500 uppercase tracking-widest text-xs font-bold bg-background/80 inline-block px-2 rounded">Linhas de Código</div>
                </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Expertise Section - Asymmetric Grid */}
      <section className="py-32 relative z-20 border-t border-white/5 bg-background">
        <div className="container max-w-[90rem] mx-auto px-4 sm:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-24"
          >
            <div className="max-w-3xl ml-2 sm:ml-4">
              <motion.h2 
                variants={fadeInUp} 
                className="text-6xl md:text-8xl lg:text-[7rem] font-black font-display text-gray-100 uppercase tracking-tighter leading-[0.9] mb-8"
              >
                Minha <br/><span className="text-primary-500 italic font-serif tracking-normal lowercase">expertise</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-xl text-gray-400 font-light leading-relaxed max-w-xl">
                 Unindo visão técnica profunda, arquitetura resiliente e alto nível de execução visual no desenvolvimento de software.
              </motion.p>
            </div>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8"
          >
            {[
              {
                icon: Code,
                title: 'Full-Stack Moderno',
                desc: 'Engenharia de ponta a ponta utilizando ecossistemas modernos, robustos e seguros.',
                colSpan: 'md:col-span-8',
                delay: 0
              },
              {
                icon: Users,
                title: 'Liderança Técnica',
                desc: 'Mentorias de alto impacto, arquitetura escalável e facilitação de times ágeis para entrega contínua.',
                colSpan: 'md:col-span-4',
                delay: 0.1
              },
              {
                icon: Lightbulb,
                title: 'Inovação & IA',
                desc: 'Implementação de soluções inteligentes, transformando agentes LLM e automação em valor real de negócio.',
                colSpan: 'md:col-span-12',
                delay: 0.2
              }
            ].map((skill, i) => (
              <motion.div key={i} variants={fadeInUp} className={`h-full ${skill.colSpan}`}>
                <div className="h-full group relative overflow-hidden bg-white/5 border border-white/10 p-8 sm:p-12 hover:bg-white/10 transition-colors duration-500 flex flex-col justify-between min-h-[300px]">
                  {/* Hover abstract shapes */}
                  <div className="absolute -inset-x-20 -bottom-20 h-40 bg-primary-500/10 blur-[100px] rounded-full scale-0 group-hover:scale-100 transition-transform duration-1000 origin-bottom"></div>
                  
                  <div className="relative z-10">
                    <div className="mb-12 inline-flex">
                      <skill.icon size={48} strokeWidth={1} className="text-primary-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-3xl font-display font-bold uppercase tracking-wide text-gray-100 mb-6 group-hover:text-primary-500 transition-colors">{skill.title}</h3>
                      <p className="text-gray-400 font-light text-lg leading-relaxed max-w-2xl">
                        {skill.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Insights Section */}
      <section className="py-32 relative z-20 bg-[#080808] border-t border-white/5">
        <div className="container max-w-[90rem] mx-auto px-4 sm:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8 border-b border-white/10 pb-12 ml-2 sm:ml-4"
          >
            <div className="max-w-3xl">
              <motion.h2 
                variants={fadeInUp} 
                className="text-6xl md:text-8xl lg:text-[7rem] font-black font-display text-gray-100 uppercase tracking-tighter leading-[0.9] mb-6"
              >
                Últimos <br/><span className="text-primary-500 italic font-serif tracking-normal lowercase">insights</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-xl text-gray-400 font-light max-w-xl">
                Artigos sobre arquitetura, liderança e os desafios diários da engenharia.
              </motion.p>
            </div>
            <motion.div variants={fadeInUp}>
              <Link href="/blog" className="inline-flex items-center gap-3 text-primary-500 hover:text-white font-display uppercase tracking-widest font-bold text-sm transition-colors group">
                Ver todos os artigos
                <span className="p-2 border border-primary-500/30 rounded-full group-hover:bg-primary-500 group-hover:text-black transition-all">
                  <ArrowRight size={14} />
                </span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-white/10"
          >
            {posts.map((post, i) => (
              <motion.div key={post.slug} variants={fadeInUp} className="border-r border-b border-white/10">
                <Link href={`/blog/${post.slug}`} className="block h-full group p-8 sm:p-12 hover:bg-white/5 transition-colors duration-500 relative">
                  <div className="flex flex-col h-full z-10 relative">
                    <div className="flex items-center text-xs font-display font-bold tracking-widest uppercase text-primary-500/70 mb-8 group-hover:text-primary-500 transition-colors">
                      <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(' de ', ' ')}</time>
                      <span className="mx-4 w-6 h-[1px] bg-primary-500/30"></span>
                      <span>{post.readTime}</span>
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-100 mb-6 uppercase tracking-wide group-hover:text-white transition-colors">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-400 mb-12 text-lg font-light leading-relaxed flex-grow">
                      {post.excerpt}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between text-sm font-display font-bold uppercase tracking-widest text-gray-500 group-hover:text-primary-500 transition-colors">
                       Ler artigo
                       <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  )
}
