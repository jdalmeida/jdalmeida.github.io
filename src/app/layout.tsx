import type { Metadata } from 'next'
import '../styles/globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    template: '%s | João de Almeida',
    default: 'João de Almeida - CTO & Tech Blog',
  },
  description: 'Blog pessoal de João de Almeida, CTO da Allpines. Insights sobre tecnologia, desenvolvimento de software e inovação.',
  keywords: ['tecnologia', 'desenvolvimento', 'software', 'inovação', 'allpines', 'CTO', 'blog'],
  authors: [{ name: 'João de Almeida', url: 'https://allpines.com.br' }],
  creator: 'João de Almeida',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://jdalmeida.github.io',
    title: 'João de Almeida - CTO & Tech Blog',
    description: 'Blog pessoal de João de Almeida, CTO da Allpines. Insights sobre tecnologia, desenvolvimento de software e inovação.',
    siteName: 'João de Almeida Blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'João de Almeida - CTO & Tech Blog',
    description: 'Blog pessoal de João de Almeida, CTO da Allpines. Insights sobre tecnologia, desenvolvimento de software e inovação.',
    creator: '@jdalmeida',
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  metadataBase: new URL('https://jdalmeida.github.io'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
} 