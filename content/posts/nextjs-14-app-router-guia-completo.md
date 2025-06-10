---
title: "Next.js 14 e App Router: Um guia completo"
date: "2024-01-20"
excerpt: "Descubra as principais funcionalidades do Next.js 14 com App Router e como utilizá-las para criar aplicações web modernas e performáticas."
tags: ["nextjs", "react", "desenvolvimento", "frontend"]
author: "João de Almeida"
---

# Next.js 14 e App Router: Um guia completo

O Next.js 14 trouxe diversas melhorias significativas, especialmente com o **App Router**, que representa uma nova forma de estruturar aplicações React. Neste artigo, vou compartilhar minha experiência utilizando essas funcionalidades em projetos reais.

## O que é o App Router?

O App Router é uma nova abordagem para roteamento no Next.js que oferece:

- **Server Components por padrão**: Melhor performance e SEO
- **Layouts aninhados**: Estrutura mais flexível e reutilizável
- **Loading e Error states**: Tratamento de estados mais elegante
- **Streaming**: Carregamento progressivo de conteúdo

## Estrutura de pastas

Com o App Router, a estrutura de pastas se torna mais intuitiva:

```
src/
  app/
    layout.tsx          # Layout raiz
    page.tsx           # Página inicial
    loading.tsx        # Loading state
    error.tsx          # Error boundary
    blog/
      layout.tsx       # Layout específico do blog
      page.tsx         # Lista de posts
      [slug]/
        page.tsx       # Post individual
```

## Server vs Client Components

Uma das grandes mudanças é a distinção clara entre Server e Client Components:

### Server Components (padrão)
```tsx
// Este componente roda no servidor
export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}
```

### Client Components
```tsx
'use client'

import { useState } from 'react'

export function InteractiveComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Cliques: {count}
    </button>
  )
}
```

## Metadata API

O Next.js 14 oferece uma API poderosa para gerenciar metadados:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meu Blog Incrível',
  description: 'Um blog sobre tecnologia e desenvolvimento',
  openGraph: {
    title: 'Meu Blog Incrível',
    description: 'Um blog sobre tecnologia e desenvolvimento',
    images: ['/og-image.jpg'],
  },
}
```

## Performance e otimizações

O App Router traz diversas otimizações automáticas:

1. **Lazy loading** de componentes
2. **Code splitting** inteligente
3. **Prefetching** de rotas
4. **Streaming** de conteúdo

## Experiência na Allpines

Na Allpines, temos utilizado o Next.js 14 com App Router em diversos projetos, e os resultados têm sido excepcionais:

- **50% melhoria** no tempo de carregamento inicial
- **Desenvolvimento mais ágil** com a nova estrutura
- **SEO aprimorado** com Server Components
- **Experiência do usuário superior** com streaming

## Conclusão

O Next.js 14 com App Router representa um grande avanço no desenvolvimento de aplicações React. A separação clara entre Server e Client Components, junto com as otimizações automáticas, torna o desenvolvimento mais eficiente e as aplicações mais performáticas.

Se você ainda não experimentou o App Router, recomendo fortemente que teste em seu próximo projeto!

## Recursos úteis

- [Documentação oficial do Next.js](https://nextjs.org/docs)
- [Guia de migração para App Router](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [Exemplos no GitHub](https://github.com/vercel/next.js/tree/canary/examples)

---

*Tem dúvidas sobre Next.js ou quer discutir sobre desenvolvimento web? Entre em contato comigo!* 