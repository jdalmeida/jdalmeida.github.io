---
title: "A IA é um junior sem acesso à documentação"
date: "2025-06-13"
excerpt: "Minhas aventuras utilizando o Cursor como editor principal por um mês."
tags: ["desenvolvimento", "IA", "cursor"]
author: "João de Almeida"
---

Hoje faz exatamente 1 mês que eu comecei a desenvolver meus apps utilizando o [Cursor](https://cursor.com).
Hoje nos vamos explorar minhas experiências com esse editor de código que pode fazer literalmente tudo! (Spoiler: ele também pode quebrar seu sistema)

## A experiência Cursor

> `"Ahhhhhhh!!! A IA vai roubar meu trabalho!"` <- Frase falada por alguém que vai perder o emprego pra quem sabe utilizar IA, e não pra IA.

O Cursor realmente é uma tecnologia assustadoramente boa, porém ainda não escreve código sozinha. O medo que muitos programadores tem, do júnior ao sênior, é perder seus empregos para uma inteligência artificial que sabe escrever código como ningúem, mas o que não contaram para eles é que até a IA pode ser burra às vezes.
Nesse tempo que venho utilizando o cursor no meu dia a dia posso dizer que minha velocidade de desenvolvimento aumentou uns `300%`. Bugs que levariam algumas horas para resolver se tornaram um simples "Estou com problema x na rota /dashboard/pagina_com_erro.tsx" `⏎ Enter` e boom! Erro corrigido!
Porém, contudo, entretanto, se você não sabe utilizar o cursor corretamente, você pode ficar desapontado com os resultados.

A "manha" para trabalhar com o cursor é escolher o LLM certo para a tarefa certa (e o editor até te ajuda com isso). Alguns usos por LLM que eu mapeei durante meus testes foram:

🧠 - Reasoning

| LLM | Pros ✅ | Cons ❌ |
| --- | -----| ---- |
| claude-4-sonnet | Bom para problemas de linter pequenos e problemas de interface gráfica | Em problemas maiores ele se atrapalha |
| claude-4-sonnet 🧠 | Ótimo para criação de interfaces gráficas mais complexas | Refatorações grandes e planejamento não são seus pontos fortes |
| gemini-2.5-pro 🧠 | Refatorações gigantes e planejamento de sprints | Interface gráfica é um problema para o Gemini |
| o3 🧠 | Problemas bem complexos e planejamento bem profundo | Lento e interfaces bem "padrão" |

Um ótimo fluxo de trabalho para seguir com esses LLMs é fazer um "Manus" manual. Primeiro você pede para o gemini definir os escopos da aplicação, o que ela será e como será construída, sugiro esrtuturar bem esse seu primeiro prompt ou ir construíndo um documento junto do Gemini e ir discutindo com ele pontos de melhoria ou outros pontos de vista;
depois disso passe para o o3 e defina as sprints e tarefas para seguir, caso for necessário, pessa para separar as tarefas para sua equipe, isso te ajudará a passar tarefas para os outros programadores, ou se você programa solo que nem eu, te ajudará a escolher o LLM perfeito para te ajudar no desenvolvimento.
A partir desse escopo que os LLMs criaram para você, escolha por onde quer começar, caso tenha escolhido o front, selecione o claude-4-sonnet e peça para ele desenvolver as tarefas descritas no arquivo que o o3 escreveu, mas caso tenha optado pelo backend, use o próprio o3 ou vá com o gemini-2.5-pro para desenvolver essa parte.
Pronto! assim você terá um app inteiramente feito por IA, como o Duckduki!

## Duckduki - o companion feito inteiramente por IA

O Duckduki foi um experimento feito por mim para testar até onde o Cursor iria (ele vai bem longe). Esse projeto começou com algns testes utilizando o Gemini e scripts do Powershell, estava tentando fazer um patinho que ficasse na minha tela me lembrando de tomar água.
Mas como sempre que eu começo uma coisa eu vou até o fim com ela (90% dos meus projetos estão criando teia em repositórios abandonados 💀), eu decidi dar uma outra vida para esse patinho: Ele seria meu companheiro de trabalho.
Para construir ele eu utilizei um prompt no chatgpt: `com base nas nossas connversas me dê ideias de ferramentas para o meu assistente de IA para desktop. O que eu posso colocar para melhorar minha produtividade?` - Com a resposta que eu obtive eu mandei para o Cursor desenvolver e adivinhe?
[Esse foi o resultado](https://duckduki.allpines.com.br).

Esse app se tornou minha ferramenta nº 1 no dia a dia do trabalho (claro, depois do cursor), nas últimas alterações que fiz nele consegui deixar parecido com a Spotlight do MacOs (bem de longe se parecem um pouco), optei por esse design pois ele fica no meio da tela e facilita na visualização do conteúdo.
Minhas ToDo lists que antes eram em papel agora são 100% no Duckduki. Meus emails? Só pergunto para ele se tem alguma coisa importante. O que eu tenho pra fazer amanhã mesmo? "Duki, dá uma olhada na minha agenda para amanhã".
Minha produtividade melhorou em 98%, e sabe por que não foi 100%? Porque a IA é um junior e não sabe o que está fazendo na maior parte das vezes.

## Como estragar seu sistema com um prompt?

Quando estava desenvolvendo o Duki, eu liguei o modo Auto-run do cursor, que roda todos os comandos do shell sozinho, a não ser que precise de root ou de um input de usuário, e isso me causou uma baita dor de cabeça.
Ao tentar deixar o modo Spotlight do app com um blur à lá MacOs, eu acabei descobrindo que o [Electron](https://www.electronjs.org) não suporta blur nativamente no windows ou linux (minhas duas plataformas de trabalho), mas nada que uma integração direto com o KDE não funcionaria né? Né???
Bom, rodei o prompt para o cursor fazer essa integração e fui tomar meu banho, e adivinhe? Quando voltei o Pc estava com tela preta. O que aconteceu foi que o Claude achou interessante reiniciar o KDE de um jeito que nem eu entendi o que ele fez, porém isso deixou o meu notebook em loop tentando iniciar o KDE, que só foi se resolver instalando o Gnome em cima.
Resumo da ópera: perdi todas as personalizações que eu tinha no KDE, não é um desastre, mas poderia ter sido evitado se eu tivesse dado as instruções certas para a IA.
E por esse motivo que a IA é só um programador junior, se estiver sem a documentação e sem um norte bem definido para seguir.


