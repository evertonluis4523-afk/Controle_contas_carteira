# Orange Finance 🍊

Aplicativo financeiro pessoal — PWA premium, rápido, offline-first, com tema escuro, sincronização preparada para nuvem e visual de app nativo.

## Stack

- **React 18 + Vite + TypeScript** — base do app
- **PWA (vite-plugin-pwa / Workbox)** — offline, cache inteligente, instalável, atualização automática
- **IndexedDB via Dexie.js** — banco de dados local reativo (`useLiveQuery` atualiza a UI em tempo real)
- **LocalForage** — configurações persistentes (PIN, moeda, metas)
- **React Router** — navegação SPA
- **Framer Motion** — animações (fade, slide, scale, bottom sheets)
- **Chart.js + react-chartjs-2** — gráficos (pizza, linha, barras, área, fluxo de caixa)
- **React Hook Form + Zod** — formulários validados e tipados
- **jsPDF + ExcelJS** — relatórios em PDF, Excel e CSV
- **date-fns** — datas em pt-BR
- **Material Symbols** — ícones
- **WebAuthn** — biometria / Face ID

## Como instalar e executar

```bash
# 1. Instale as dependências
npm install

# 2. Ambiente de desenvolvimento
npm run dev

# 3. Build de produção
npm run build

# 4. Pré-visualizar o build
npm run preview
```

Requisitos: Node.js 18+ e npm 9+.

## Estrutura do projeto

```
src/
  components/   → componentes reutilizáveis (Card, Sheet, TabBar, Skeleton...)
  pages/        → telas (Dashboard, Extrato, Carteira, Metas, Relatórios...)
  hooks/        → hooks reativos (useMonthData)
  services/     → regras de negócio (saúde financeira, insights, relatórios, backup, biometria)
  database/     → Dexie/IndexedDB (schema, seed, histórico)
  models/       → tipos TypeScript
  contexts/     → estado global (configurações + sessão)
  styles/       → tema escuro premium (design tokens em CSS variables)
  utils/        → formatação, setup de gráficos
```

## Publicar no GitHub Pages (deploy automático)

O projeto já vem com CI/CD para GitHub Pages: a cada `push` na branch `main`, o
workflow em `.github/workflows/deploy.yml` faz o build e publica o PWA.

**Passo a passo (uma vez só):**

1. Suba o código para o repositório do GitHub (`git push`).
2. No GitHub: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. Pronto. A cada push na `main` o app é reconstruído e publicado.

O app fica em: `https://<usuario>.github.io/<repositorio>/`
(ex.: `https://evertonluis4523-afk.github.io/Controle_contas_carteira/`).

> O `base` (subpasta do Pages) é detectado automaticamente pelo workflow a partir
> do nome do repositório — não precisa editar nada. Se o repositório for do tipo
> `usuario.github.io` (site raiz), o base vira `/` automaticamente.

O app usa **HashRouter**, então os links profundos (`.../#/app/...`) funcionam no
GitHub Pages sem configuração extra de rewrite.

## Publicar em outro host (Vercel, Netlify, Cloudflare...)

1. Rode `npm run build` — a pasta `dist/` contém o app completo com manifest e service worker.
2. Hospede `dist/` em qualquer host HTTPS: Vercel, Netlify, Firebase Hosting, Cloudflare Pages.
3. Se o app ficar na raiz do domínio, não é preciso definir base. Em subpasta, rode
   `VITE_BASE=/subpasta/ npm run build`.
4. HTTPS é obrigatório para service worker, instalação e biometria.
5. Acesse pelo celular → menu do navegador → **"Adicionar à tela inicial"**.

## Como gerar APK (Google Play)

A forma recomendada é **TWA (Trusted Web Activity)** com o Bubblewrap:

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://SEU-DOMINIO/manifest.webmanifest
bubblewrap build
```

Isso gera um `.aab`/`.apk` assinado pronto para o Google Play Console.
Alternativa sem terminal: [PWABuilder](https://www.pwabuilder.com) — cole a URL do app publicado e baixe os pacotes Android e iOS.

## Como empacotar para a App Store (iOS)

1. Use o **PWABuilder** para gerar o projeto Xcode (wrapper WKWebView), ou o **Capacitor**:
```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Orange Finance" com.seudominio.orange --web-dir=dist
npx cap add ios && npx cap open ios
```
2. No Xcode, configure o Bundle ID, ícones e assinatura, e envie via App Store Connect.

## Como configurar os ícones

- O ícone vetorial base está em `public/icons/icon.svg`.
- Os PNGs (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) são gerados com `npm run icons` (usa `sharp`).
- Edite o `icon.svg` e rode `npm run icons` novamente para regenerar todos os tamanhos.
- Já ficam em `public/icons/` — o manifest e o `index.html` já os referenciam, incluindo versão maskable.

## Como gerar uma atualização

1. Faça as alterações no código e rode `npm run build`.
2. Publique a nova pasta `dist/` no mesmo domínio.
3. O service worker (registerType `autoUpdate`) detecta a nova versão e atualiza o app automaticamente na próxima abertura — sem que o usuário precise reinstalar.
4. Para o APK/TWA nada muda: o conteúdo vem do seu domínio. Só gere novo pacote se mudar ícone, nome ou permissões.

## Funcionalidades

- Splash animada, login por PIN e biometria/Face ID (WebAuthn)
- Dashboard em tempo real: saldo, receitas, despesas, meta do mês, "pode gastar hoje", maior gasto, maior categoria, próximas contas, últimos lançamentos
- **Saúde Financeira**: algoritmo próprio com pontuação 0–100 (Excelente → Crítica)
- Contas múltiplas (Nubank, Caixa, BB, Santander, Inter, Dinheiro, Carteira...) com saldo individual
- Cartões de crédito: limite, disponível, fechamento, vencimento, bandeira e cor
- Receitas e despesas com categoria, conta, forma de pagamento, parcelamento (até 48x), status e observações
- Categorias ilimitadas com ícone, cor e tipo
- Pesquisa ampla + filtros (hoje, semana, mês, ano, categoria)
- Calendário financeiro com entradas, saídas, contas futuras e vencidas
- Metas com porcentagem e previsão de conclusão
- Insights de IA local (comparativos, previsão de fechamento, quanto gastar por dia)
- Relatórios diário/semanal/mensal/anual com exportação em PDF, Excel, CSV, compartilhamento e impressão
- Histórico completo de inclusões, edições, exclusões e backups
- Backup local JSON (exportar/importar) com estrutura pronta para nuvem
- Acessibilidade: alto contraste, fonte ajustável, navegação por teclado, aria-labels

## Segurança

- PIN armazenado apenas como hash SHA-256 (nunca em texto puro)
- Biometria via WebAuthn (autenticador de plataforma — Face ID / digital)
- Todos os dados ficam no dispositivo (IndexedDB); nada é enviado a servidores

## Roadmap preparado

- Sincronização em nuvem (camada `services/backup.ts` já isola a serialização)
- Open Finance (importação de extratos)
- Notificações push agendadas
