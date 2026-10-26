# GC Studio Mobile — Vale TV

Editor de GC (lower thirds) em HTML, CSS e JavaScript puro. Sem backend, sem dependências, 100% estático.

## Estrutura
- `index.html` — interface (campos, prévia, linha do tempo, exportação).
- `css/styles.css` — estilos mobile-first.
- `js/app.js` — lógica em seções numeradas: config/modelos, geometria e margens, animação, desenho em Canvas, loop, interface, exportação.
- `PROMPT_PARA_CLAUDE.md` — prompt original (referência).

## Como executar
- Rápido: abra `index.html` no Chrome/Edge.
- Servidor local (recomendado): `python3 -m http.server 8080` na pasta e acesse `http://localhost:8080`. No celular, use o IP do computador na mesma rede.
- Hospedar: envie a pasta inteira para GitHub Pages, Netlify, Cloudflare Pages ou qualquer hospedagem estática (use HTTPS).

## Como adicionar um modelo
Inclua uma entrada em `TEMPLATES` (`js/app.js`) e uma `<option>` em `#template` no `index.html`.

## Testes manuais sugeridos
1. Alternar os 5 modelos e os formatos 16:9 / 9:16; ligar "guias de margem" e conferir se o GC fica dentro do tracejado.
2. Arrastar a linha do tempo; mudar entrada/saída/duração e animações; testar "Permanência".
3. Importar PNG transparente e conferir o logotipo sem fundo; remover o logotipo.
4. Salvar PNG e abrir em editor com fundo escuro para ver a transparência.
5. Exportar vídeo transparente e ler a mensagem de verificação do alfa; importar no CapCut/DaVinci.
6. Se o alfa falhar: fundo "Verde chroma" → exportar → Chroma Key no editor.
7. Salvar e recarregar a configuração .json (inclusive a antiga, versão 2).

## Limitações
- Alfa em vídeo depende do navegador; o app testa o arquivo gerado, mas confirme sempre no editor.
- MP4/H.264 não guarda transparência (só é oferecido com fundo sólido).
- Margens de plataformas são aproximadas; confirme as diretrizes atuais de cada rede.
