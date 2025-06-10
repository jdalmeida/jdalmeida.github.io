# Blog Pessoal - João de Almeida

Blog pessoal moderno criado com Next.js 14, Tailwind CSS e Markdown, otimizado para GitHub Pages.

## 🚀 Tecnologias

- **Next.js 14** com App Router
- **TypeScript** para tipagem estática
- **Tailwind CSS** para estilização
- **Markdown** para posts do blog (Gray Matter + Remark)
- **Lucide React** para ícones
- **Date-fns** para formatação de datas

## 📝 Funcionalidades

- ✅ Design moderno e responsivo
- ✅ Sistema de blog com Markdown
- ✅ Otimizado para SEO
- ✅ Páginas estáticas geradas automaticamente
- ✅ Sintaxe highlighting para código
- ✅ Sistema de tags
- ✅ Tempo de leitura estimado
- ✅ Compatível com GitHub Pages

## 🛠️ Como usar

### Instalação

```bash
# Clone o repositório
git clone https://github.com/jdalmeida/jdalmeida.github.io.git

# Entre no diretório
cd jdalmeida.github.io

# Instale as dependências
npm install
```

### Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver o resultado.

### Produção

```bash
# Build e exportação para GitHub Pages
npm run build
npm run export

# Ou usar o comando combinado
npm run deploy
```

## 📖 Adicionando Posts

Para adicionar um novo post, crie um arquivo `.md` na pasta `content/posts/` com o seguinte formato:

```markdown
---
title: "Título do Post"
date: "2024-01-20"
excerpt: "Breve descrição do post que aparecerá na listagem"
tags: ["tag1", "tag2", "tag3"]
author: "João de Almeida"
---

# Título do Post

Conteúdo do post em Markdown...

## Seção

Mais conteúdo...
```

### Frontmatter suportado:

- `title`: Título do post (obrigatório)
- `date`: Data no formato YYYY-MM-DD (obrigatório)
- `excerpt`: Descrição breve para SEO e listagem
- `tags`: Array de tags para categorização
- `author`: Autor do post (padrão: "João de Almeida")

## 🎨 Personalização

### Cores

As cores principais podem ser alteradas no arquivo `tailwind.config.js`:

```javascript
colors: {
  primary: {
    // Edite aqui para mudar a cor principal
  }
}
```

### Tipografia

A tipografia utiliza a fonte Inter por padrão. Para alterar, edite o arquivo `src/styles/globals.css`.

## 📁 Estrutura do projeto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial
│   ├── blog/              # Páginas do blog
│   ├── sobre/             # Página sobre
│   └── contato/           # Página de contato
├── components/            # Componentes React
├── lib/                   # Utilitários e helpers
└── styles/               # Estilos globais

content/
└── posts/                # Posts em Markdown

public/                   # Arquivos estáticos
```

## 🌐 Deploy

O projeto está configurado para deployment automático no GitHub Pages. Qualquer push para a branch `main` irá disparar o build e deployment.

### Configuração do GitHub Pages

1. Vá nas configurações do repositório
2. Na seção "Pages", selecione "GitHub Actions" como source
3. O workflow `.github/workflows/deploy.yml` será executado automaticamente

## 🔧 Scripts disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run export` - Exporta os arquivos estáticos
- `npm run deploy` - Build + export + preparação para GitHub Pages

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**João de Almeida**  
CTO @ Allpines  
[Email](mailto:joao@allpines.com.br) • [GitHub](https://github.com/jdalmeida) • [LinkedIn](https://linkedin.com/in/jdalmeida)

---

Feito com ❤️ usando Next.js e Tailwind CSS 