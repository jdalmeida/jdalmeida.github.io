# 📝 Como adicionar novos posts ao blog

Este guia te ensina como adicionar novos artigos ao seu blog de forma simples e rápida.

## 🚀 Passos para adicionar um novo post

### 1. Crie um novo arquivo markdown

Navegue até a pasta `content/posts/` e crie um novo arquivo com extensão `.md`. 

**Convenção de nomenclatura:**
- Use apenas letras minúsculas
- Substitua espaços por hífens (-)
- Exemplo: `meu-novo-artigo.md`

### 2. Adicione o frontmatter

Todo post deve começar com metadados no formato YAML:

```markdown
---
title: "Título do seu artigo"
date: "2024-01-30"
excerpt: "Uma breve descrição que aparecerá na listagem e SEO"
tags: ["tag1", "tag2", "tecnologia"]
author: "João de Almeida"
---
```

**Campos obrigatórios:**
- `title`: Título do artigo
- `date`: Data no formato YYYY-MM-DD
- `excerpt`: Descrição breve (máx. 160 caracteres para SEO)
- `tags`: Array de tags para categorização
- `author`: Autor do artigo

### 3. Escreva o conteúdo

Após o frontmatter, escreva seu artigo em Markdown:

```markdown
# Título Principal

Introdução do artigo...

## Seção 1

Conteúdo da primeira seção.

### Subseção

Mais conteúdo...

## Código

Use blocos de código para exemplos:

```javascript
function exemplo() {
  console.log("Hello World!");
}
```

## Links e imagens

[Link para site](https://exemplo.com)

![Descrição da imagem](caminho/para/imagem.jpg)
```

### 4. Publique o post

Após criar o arquivo:

1. **Desenvolvimento local:**
   ```bash
   npm run dev
   ```
   Acesse http://localhost:3000/blog para ver seu post

2. **Publicar no GitHub Pages:**
   ```bash
   git add .
   git commit -m "Adiciona novo post: [nome do post]"
   git push origin main
   ```

O GitHub Actions irá automaticamente fazer o build e deploy!

## 📋 Template para novos posts

Copie e cole este template para começar rapidamente:

```markdown
---
title: "Seu título aqui"
date: "2024-MM-DD"
excerpt: "Breve descrição do post"
tags: ["tag1", "tag2"]
author: "João de Almeida"
---

# Seu título aqui

Introdução do seu artigo...

## Primeira seção

Conteúdo...

## Conclusão

Encerramento do artigo...

---

*Gostou do artigo? Entre em contato comigo para trocarmos ideias!*
```

## 🎨 Formatação avançada

### Citações
```markdown
> Esta é uma citação importante que se destaca do texto principal.
```

### Listas
```markdown
- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2

1. Primeiro
2. Segundo
3. Terceiro
```

### Tabelas
```markdown
| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Dado 1   | Dado 2   | Dado 3   |
| Dado 4   | Dado 5   | Dado 6   |
```

### Destaque
```markdown
**Texto em negrito**
*Texto em itálico*
`código inline`
```

## 🔍 SEO e boas práticas

1. **Título**: Seja claro e descritivo (máx. 60 caracteres)
2. **Excerpt**: Resuma bem o conteúdo (máx. 160 caracteres)
3. **Tags**: Use 3-5 tags relevantes
4. **Estrutura**: Use títulos hierárquicos (H1, H2, H3)
5. **Links**: Adicione links para recursos externos relevantes
6. **Conclusão**: Sempre termine com uma call-to-action

## 🐛 Solução de problemas

### Post não aparece no blog
- Verifique se o arquivo está na pasta `content/posts/`
- Certifique-se que o frontmatter está correto
- A data não pode ser futura
- Execute `npm run build` para verificar erros

### Erro no build
- Verifique a sintaxe do frontmatter (YAML)
- Certifique-se que todas as aspas estão fechadas
- Verifique se há caracteres especiais no título

### Formatação estranha
- Verifique se há espaços extras no markdown
- Certifique-se de usar a sintaxe correta
- Teste localmente com `npm run dev`

## 💡 Dicas extras

- **Preview local**: Sempre teste com `npm run dev` antes de publicar
- **Imagens**: Coloque na pasta `public/images/` e referencie como `/images/nome.jpg`
- **Backup**: Mantenha uma cópia dos posts importantes
- **Consistência**: Use um tom e estilo consistentes
- **Frequência**: Publique regularmente para manter o engajamento

---

Pronto! Agora você pode adicionar quantos posts quiser ao seu blog. 🚀 