# 🎨 Da Vinci - AI-Powered Web Studio

[![Da Vinci: Ultra Premium Web Development Platform](./public/social_preview_index.jpg)](https://studio.cybtek.fr)

**Da Vinci** est une plateforme de développement web **ultra premium** qui combine l'édition visuelle, le code, et l'exécution en temps réel - le tout dans un workspace intelligent alimenté par l'IA.

---

## 🌟 Vision

Da Vinci transforme le développement web en une expérience **visuelle, collaborative et intelligente**. Plus besoin de jongler entre plusieurs outils - tout est intégré dans un workspace moderne et performant.

## ✨ Fonctionnalités Principales

### 🤖 Phase 11.1 : AI Assistant Panel (Nouveau!)

- **Chat AI intégré** - Panneau conversationnel avec Claude Sonnet 4
- **Streaming en temps réel** - Réponses fluides et instantanées
- **Code blocks interactifs** - Syntax highlighting + boutons Apply/Copy
- **Context-aware** - Analyse de fichiers sélectionnés ou projet complet
- **Modes spécialisés** - Explore, Generate, Debug, Refactor
- **Quick actions** - Templates prédéfinis pour tâches courantes
- **History persistée** - Conversations sauvegardées (derniers 50 messages)
- **Markdown rendering** - Format professionnel des réponses

### 🚀 Phase 10 : WebContainer & Live Preview

- **Exécution de code dans le navigateur** - Node.js complet sans backend
- **NPM dans le navigateur** - Installation de packages en temps réel
- **Live Preview** - Vite/Next.js/CRA exécutés dans le browser
- **Terminal intégré** - Xterm.js avec commandes complètes
- **Hot reload** - Changements instantanés dans le preview

### 💻 Workspace 5 Panels

- **📝 Content Panel** - Éditeur Markdown/MDX avec preview
- **🎨 Design Panel** - Visual builder avec drag & drop
- **💻 Code Panel** - Monaco Editor avec TypeScript IntelliSense
- **🔮 Preview Panel** - Exécution live avec WebContainer
- **🤖 AI Panel** - Assistant conversationnel Claude Sonnet 4

### 🎯 Fonctionnalités Avancées

#### Monaco Editor Integration
- Auto-complétion TypeScript/JavaScript
- IntelliSense et suggestions contextuelles
- Thèmes personnalisés Da Vinci (dark/light)
- Format automatique (on type/paste)
- Multi-curseur et édition avancée
- Minimap et breadcrumbs

#### Virtual File System
- 400+ lignes de système de fichiers en mémoire
- Opérations CRUD complètes
- Navigation arbre de fichiers
- Recherche de fichiers et contenu
- Persistance localStorage + base de données
- Gestion parent/enfant

#### Keyboard Shortcuts
- **30+ raccourcis** pour power users
- `Ctrl+1/2/3/4` - Navigation panels
- `Ctrl+S` - Sauvegarde fichier
- `Ctrl+O` - Ouvrir fichier
- `Ctrl+N` - Nouveau fichier
- `Ctrl+W` - Fermer fichier
- `Ctrl+F` - Recherche
- `Ctrl+Tab` - Navigation onglets

#### WebContainer Features
- Bootup en ~2 secondes
- npm install dans le browser (~10-30s)
- Support Vite, Next.js, CRA, Astro
- Compilation TypeScript/Babel
- Tests (Jest, Vitest)
- Serveurs Node.js
- **Tout ça sans backend!**

### 🔧 Infrastructure & Déploiement

#### Coolify Integration
- Déploiement automatique via API
- Webhooks temps réel (HMAC SHA-256)
- Gestion de conteneurs Docker
- Logs de build en direct
- Restart/Cancel/Delete déploiements
- Statistiques et métriques

#### Authentik SSO
- OAuth2/OIDC avec PKCE flow
- Refresh automatique des tokens
- Session management sécurisé
- RBAC (ADMIN, DEVELOPER, VIEWER)
- Middleware de protection routes
- Synchronisation users BDD

### 🗄️ Base de Données

#### Prisma ORM
- PostgreSQL avec types TypeScript
- Modèles : User, Organization, Project, Deployment, File
- Relations et validations
- Migrations automatiques
- Client singleton optimisé

#### API Routes
- `/api/files` - CRUD fichiers complet
- `/api/deployments` - Gestion déploiements
- `/api/projects` - CRUD projets
- `/api/organizations` - CRUD organisations
- `/api/webhooks/coolify` - Events temps réel
- Toutes routes protégées par auth

## 🏗️ Architecture Technique

### Stack Technologique

**Frontend:**
- ⚛️ React 18 avec TypeScript
- 🎨 Remix Framework (SSR + API routes)
- 🎯 Zustand (State management)
- 🎨 Tailwind CSS
- 🔮 Monaco Editor
- 📦 WebContainer API
- 🖥️ Xterm.js

**Backend:**
- 🔥 Remix API Routes
- 🗄️ Prisma ORM
- 🐘 PostgreSQL
- 🔐 Authentik (OAuth2/OIDC)
- 🐳 Docker + Coolify

**DevOps:**
- 🌊 Coolify (Déploiement)
- 🔒 Cloudflare DNS
- 🔑 Let's Encrypt (SSL)
- 📊 Webhooks temps réel

### Structure du Projet

```
davinci/
├── app/
│   ├── components/
│   │   ├── workspace/
│   │   │   ├── panels/
│   │   │   │   ├── ContentPanel.tsx
│   │   │   │   ├── DesignPanel.tsx
│   │   │   │   ├── CodePanelOptimized.tsx
│   │   │   │   ├── PreviewPanel.tsx
│   │   │   │   └── AIPanel.tsx (Nouveau!)
│   │   │   ├── WorkspaceLayout.tsx
│   │   │   ├── WorkspaceToolbar.tsx
│   │   │   └── PanelResizer.tsx
│   │   ├── ai/
│   │   │   ├── ChatMessage.tsx (Nouveau!)
│   │   │   └── CodeBlock.tsx (Nouveau!)
│   │   └── terminal/
│   │       └── Terminal.tsx
│   ├── lib/
│   │   ├── hooks/
│   │   │   ├── useMonaco.ts
│   │   │   ├── useKeyboardShortcuts.ts
│   │   │   └── useAIChat.ts (Nouveau!)
│   │   ├── services/
│   │   │   ├── filesystem.ts (400+ lignes)
│   │   │   ├── webcontainer.client.ts (500+ lignes)
│   │   │   ├── files.server.ts
│   │   │   ├── coolify.server.ts
│   │   │   ├── auth.server.ts (600+ lignes)
│   │   │   └── notifications.server.ts
│   │   ├── stores/
│   │   │   └── workspace.store.ts
│   │   └── middleware/
│   │       ├── auth.middleware.ts
│   │       └── cors.middleware.ts
│   └── routes/
│       ├── api.files.ts
│       ├── api.files.$path.ts
│       ├── api.deployments.ts
│       ├── api.webhooks.coolify.ts
│       ├── workspace.tsx
│       └── login.tsx
├── prisma/
│   └── schema.prisma
└── .env.local
```

## 🚀 Installation

### Prérequis

- Node.js 20+
- PostgreSQL 14+
- pnpm (recommandé) ou npm

### Installation Rapide

```bash
# Cloner le repository
git clone https://github.com/cybtek-fr/davinci.git
cd davinci

# Installer les dépendances
pnpm install

# Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés

# Migrer la base de données
npx prisma db push
npx prisma generate

# Démarrer en développement
pnpm run dev
```

Accès local : http://localhost:5173

### Configuration Production (studio.cybtek.fr)

```bash
# Variables d'environnement production
NODE_ENV=production
PORT=3000
VITE_PUBLIC_APP_URL=https://studio.cybtek.fr

# Database
DATABASE_URL=postgresql://user:pass@host:5432/davinci

# Authentik SSO
AUTHENTIK_ISSUER=https://auth.cybtek.fr/application/o/davinci/
AUTHENTIK_CLIENT_ID=your_client_id
AUTHENTIK_CLIENT_SECRET=your_client_secret
AUTHENTIK_REDIRECT_URI=https://studio.cybtek.fr/api/auth/callback

# Coolify API
COOLIFY_API_URL=https://devops.cybtek.fr
COOLIFY_API_TOKEN=your_coolify_token
COOLIFY_SERVER_UUID=server_uuid
COOLIFY_DESTINATION_UUID=destination_uuid

# Sécurité
SESSION_SECRET=generate_with_openssl
JWT_SECRET=generate_with_openssl

# Features
ENABLE_MAGIC_WAND=true
ENABLE_KEYSTATIC=true
```

### Déploiement Coolify

Voir le fichier [PRODUCTION.md](./PRODUCTION.md) pour les instructions complètes.

## 📖 Utilisation

### Workspace Panels

1. **Content Panel** (Ctrl+1)
   - Éditeur Markdown/MDX
   - Preview en temps réel
   - Navigation fichiers

2. **Design Panel** (Ctrl+2)
   - Visual page builder
   - Drag & drop composants
   - Properties editor
   - Zoom 25-200%

3. **Code Panel** (Ctrl+3)
   - Monaco Editor
   - File tree sidebar
   - Terminal intégré
   - Multi-tab support

4. **Preview Panel** (Ctrl+4)
   - WebContainer execution
   - Live preview iframe
   - Terminal output
   - NPM install automatique

### Raccourcis Clavier

**Navigation:**
- `Ctrl+1/2/3/4` - Switcher entre panels
- `Ctrl+Shift+1/2/3/0` - Presets (Content/Design/Code/Full)
- `Ctrl+Tab` - Onglet suivant
- `Ctrl+Shift+Tab` - Onglet précédent

**Fichiers:**
- `Ctrl+S` - Sauvegarder
- `Ctrl+O` - Ouvrir
- `Ctrl+N` - Nouveau fichier
- `Ctrl+W` - Fermer fichier

**Éditeur:**
- `Ctrl+F` - Rechercher
- `Ctrl+H` - Remplacer
- `Ctrl+D` - Dupliquer ligne
- `Ctrl+/` - Commenter/décommenter

**Vue:**
- `Ctrl++` - Zoom in
- `Ctrl+-` - Zoom out
- `Ctrl+0` - Reset zoom
- `Ctrl+B` - Toggle sidebar

### WebContainer Usage

```typescript
// Boot WebContainer
const container = await bootWebContainer();

// Mount files from virtual filesystem
await mountFiles(container, filesystem.getFileTree());

// Install dependencies
await installDependencies(container, (output) => {
  console.log(output);
});

// Start dev server
const url = await startDevServer(container, 'npm', ['run', 'dev']);

// Preview is now live at the returned URL!
```

## 🎯 Roadmap

### ✅ Phases Complétées (1-10)

- [x] Phase 1-4: Prisma ORM, API Routes, Branding, Coolify
- [x] Phase 5-6: Deployment UI, Webhooks
- [x] Phase 7: Authentik SSO
- [x] Phase 8: Workspace Panels (Content/Design/Code)
- [x] Phase 9: Monaco Editor, Virtual FS, Keyboard Shortcuts
- [x] Phase 10: WebContainer, Live Preview, Terminal

### 🔜 Phases À Venir

#### Phase 11: AI Magic Wand (Q1 2026)
- [ ] Claude 3.5 Sonnet integration
- [ ] Code generation depuis prompts naturels
- [ ] AI code completion
- [ ] Auto-debugging avec IA
- [ ] Refactoring intelligent
- [ ] Documentation auto-générée

#### Phase 12: Collaboration Temps Réel (Q1 2026)
- [ ] WebSocket synchronization
- [ ] Curseurs multi-utilisateurs
- [ ] Chat intégré
- [ ] Présence indicators
- [ ] Commentaires collaboratifs
- [ ] Version control visuel

#### Phase 13: Templates & Marketplace (Q2 2026)
- [ ] Bibliothèque de templates premium
- [ ] Générateur de projets avec IA
- [ ] Intégration Keystatic CMS
- [ ] Composants réutilisables
- [ ] Marketplace communautaire

## 📊 Statistiques

```
✅ 10 Phases complétées
✅ 11 commits effectués
✅ 39,069+ lignes de code
✅ 4 panels workspace
✅ 30+ raccourcis clavier
✅ 30+ routes API
✅ In-browser code execution
✅ Live preview temps réel
✅ Production ready
```

## 🤝 Contributing

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour commencer.

### Développement

```bash
# Installer les dépendances
pnpm install

# Démarrer le serveur de dev
pnpm run dev

# Lancer les tests
pnpm test

# Type checking
pnpm run typecheck

# Linting
pnpm run lint
pnpm run lint:fix

# Build production
pnpm run build
```

## 📝 Scripts Disponibles

- `pnpm run dev` - Serveur de développement
- `pnpm run build` - Build production
- `pnpm run start` - Démarrer production
- `pnpm run preview` - Preview build
- `pnpm test` - Tests Vitest
- `pnpm run typecheck` - Vérification TypeScript
- `pnpm run lint` - ESLint
- `pnpm run clean` - Nettoyer artifacts

## 🔐 Sécurité

- OAuth2/OIDC avec PKCE flow
- Sessions HTTP-only cookies
- CSRF protection
- XSS prevention
- SQL injection protection (Prisma)
- RBAC (Role-Based Access Control)
- Cross-origin isolation (WebContainer)
- HMAC webhook verification

## 📄 License

MIT License - voir [LICENSE](./LICENSE) pour détails.

**Note WebContainer**: WebContainer API requiert une [licence commerciale](https://webcontainers.io/enterprise) pour usage production dans un contexte commercial. Les prototypes et POC ne nécessitent pas de licence.

## 🙏 Remerciements

- [Bolt.new](https://bolt.new) - Inspiration initiale
- [StackBlitz](https://stackblitz.com) - WebContainer technology
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code editor
- [Xterm.js](https://xtermjs.org/) - Terminal emulator
- [Remix](https://remix.run) - Full-stack framework
- [Prisma](https://www.prisma.io/) - ORM moderne
- [Coolify](https://coolify.io) - Self-hosted deployment

## 📞 Support & Contact

- **Production**: [https://studio.cybtek.fr](https://studio.cybtek.fr)
- **Documentation**: Voir [PRODUCTION.md](./PRODUCTION.md)
- **Issues**: [GitHub Issues](https://github.com/cybtek-fr/davinci/issues)
- **Coolify Dashboard**: [https://devops.cybtek.fr](https://devops.cybtek.fr)
- **Auth**: [https://auth.cybtek.fr](https://auth.cybtek.fr)

---

<p align="center">
  <strong>🎨 Construit avec passion par l'équipe Cybtek</strong><br>
  <em>Da Vinci - L'avenir du développement web</em>
</p>

<p align="center">
  <a href="https://studio.cybtek.fr">Website</a> •
  <a href="./PRODUCTION.md">Documentation</a> •
  <a href="./CONTRIBUTING.md">Contributing</a> •
  <a href="https://github.com/cybtek-fr/davinci">GitHub</a>
</p>
