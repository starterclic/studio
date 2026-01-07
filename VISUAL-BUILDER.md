# Visual Builder - Ultra Premium Edition

> Drag & Drop Page Builder for Astro - Built with Da Vinci

## 🚀 Quick Start

### Access the Builder

Navigate to: **http://localhost:5173/builder**

Then click **"Launch Builder Demo"** to start building.

Demo URL: **http://localhost:5173/builder/demo**

## 📁 Architecture

### Phase 12.1: Foundation
**Multi-tenant architecture with RBAC**

- `prisma/schema.prisma` - Database schema (15+ models)
- `app/lib/rbac/permissions.ts` - Permission system (50+ permissions)
- `app/lib/middleware/rbac.middleware.ts` - Authorization middleware
- `app/lib/services/auth.server.ts` - Auth integration
- `app/routes/api.pages.ts` - Pages API
- `app/routes/api.components.ts` - Components API
- `app/routes/api.assets.ts` - Assets API

### Phase 12.2: Component Library
**Premium Astro components**

- `app/components/astro/layout/` - Section, Container, Grid
- `app/components/astro/content/` - Hero, Card
- `app/components/astro/forms/` - Button, Input
- `app/lib/components/registry.ts` - Component catalog (470 lines)
- `prisma/seed-components.ts` - Database seeding

**Components:**
1. **Section** - Full-width sections with backgrounds
2. **Container** - Glassmorphism containers
3. **Grid** - Responsive CSS Grid (1-12 columns)
4. **Hero Premium** - Ultra premium hero with animations
5. **Card** - 5 variants, 4 hover effects
6. **Button** - 7 variants, 5 sizes, loading states
7. **Input** - Form inputs with validation

### Phase 12.3: Visual Builder Core
**Drag & drop editor with state management**

- `app/lib/stores/builder.store.ts` (550+ lines) - Zustand + Immer
  - Component tree management
  - Undo/redo with 50-entry history
  - Selection, clipboard, viewport modes
  - Redux DevTools integration

- `app/components/builder/BuilderCanvas.tsx` - @dnd-kit canvas
- `app/components/builder/ComponentRenderer.tsx` - Recursive rendering
- `app/components/builder/DropZone.tsx` - Drop targets
- `app/components/builder/ComponentPalette.tsx` - Component library
- `app/components/builder/PropsInspector.tsx` - JSON Schema forms
- `app/components/builder/BuilderToolbar.tsx` - Actions & viewports
- `app/components/builder/BuilderLayout.tsx` - Layout orchestrator

**Features:**
- ✅ Drag & drop with @dnd-kit
- ✅ Nested component trees
- ✅ Undo/redo (Ctrl+Z, Ctrl+Y)
- ✅ Auto-save every 30 seconds
- ✅ Viewport modes (Desktop, Tablet, Mobile)
- ✅ Zoom (25-200%)
- ✅ Keyboard shortcuts
- ✅ Copy/paste components
- ✅ Lock/hide components

### Phase 12.4: Astro Integration
**Live preview & code generation**

- `app/lib/builder/astro-renderer.ts` (250+ lines)
  - `renderAstroComponent()` - ComponentNode → Astro
  - `renderAstroPage()` - Complete page generation
  - `serializeProps()` - Type-safe prop serialization

- `app/components/builder/BuilderPreview.tsx` (350+ lines)
  - Iframe-based preview with debouncing (500ms)
  - Simplified Astro → HTML converter
  - Tailwind CDN integration
  - CSS animations (fade-in-up, blob)

- `app/components/builder/BuilderRightPanel.tsx`
  - Tabbed panel: Inspector ⟷ Preview
  - Store-integrated state

**Features:**
- ✅ Live HTML preview
- ✅ Real-time updates
- ✅ Responsive preview
- ✅ Component-specific renderers

### Phase 12.5: Export System
**Download complete Astro projects**

- `app/lib/builder/project-exporter.ts` (400+ lines)
  - `exportAstroProject()` - Full project generator
  - package.json, astro.config.mjs, tsconfig.json
  - tailwind.config.mjs, README.md, .gitignore
  - Component file extraction
  - ZIP download (JSZip + file-saver)

- `app/components/builder/ExportDialog.tsx` (250+ lines)
  - Premium modal UI
  - Project configuration form
  - Component count display
  - Loading states

**Export Structure:**
```
project-name.zip
├── package.json              # Astro 4.16, Tailwind
├── astro.config.mjs          # Config
├── tsconfig.json             # TypeScript
├── tailwind.config.mjs       # Tailwind + animations
├── README.md                 # Setup guide
├── .gitignore
├── src/
│   ├── components/astro/     # All used components
│   │   ├── layout/
│   │   ├── content/
│   │   └── forms/
│   ├── layouts/
│   │   └── BaseLayout.astro
│   └── pages/
│       └── index.astro
└── public/
    └── .gitkeep
```

## 🎨 User Workflow

### 1. Build Page
1. Navigate to `/builder/demo`
2. Drag components from left palette to canvas
3. Configure component props in right panel
4. Nest components by dropping inside containers

### 2. Edit & Preview
1. Click components to select and edit
2. Switch to **Preview** tab to see live preview
3. Toggle viewport modes (Desktop/Tablet/Mobile)
4. Use zoom controls (25-200%)

### 3. Save & Export
1. Click **Save** to persist changes (Ctrl+S)
2. Click **Export** to download Astro project
3. Configure project name, title, description
4. Download complete ZIP file

### 4. Deploy
```bash
# Extract ZIP file
unzip project-name.zip
cd project-name

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to Netlify, Vercel, etc.
```

## ⌨️ Keyboard Shortcuts

- **Ctrl+S** - Save page
- **Ctrl+Z** - Undo
- **Ctrl+Y** / **Ctrl+Shift+Z** - Redo
- **Escape** - Deselect component
- **Delete** / **Backspace** - Delete selected component
- **Ctrl+C** - Copy component
- **Ctrl+V** - Paste component

## 🔧 Technical Stack

- **Framework**: Remix (React)
- **State**: Zustand + Immer
- **DnD**: @dnd-kit
- **Styling**: Tailwind CSS
- **Database**: Prisma + PostgreSQL
- **Export**: JSZip + file-saver
- **Validation**: JSON Schema
- **Output**: Astro 4.16

## 📊 Statistics

- **Total Files**: 25+
- **Total Lines**: 5,000+
- **Components**: 7 premium Astro components
- **Permissions**: 50+ granular RBAC permissions
- **Database Models**: 15+
- **Store Actions**: 30+
- **Commits**: 5 phases

## 🎯 Key Features

### Visual Builder
- ✅ Drag & drop components
- ✅ Nested component trees
- ✅ Real-time preview
- ✅ Undo/redo history
- ✅ Auto-save
- ✅ Multi-viewport support
- ✅ Props inspector with validation
- ✅ Component search & filter
- ✅ Copy/paste/duplicate

### Code Generation
- ✅ ComponentNode → Astro conversion
- ✅ Type-safe prop serialization
- ✅ Import management
- ✅ Frontmatter generation

### Export
- ✅ Complete project structure
- ✅ All dependencies configured
- ✅ TypeScript support
- ✅ Tailwind CSS with animations
- ✅ README with instructions
- ✅ Production-ready code

### Multi-tenant
- ✅ Organization isolation
- ✅ Role-based access control
- ✅ Agency tier system
- ✅ Client management
- ✅ Storage quotas

## 🚧 Planned Features

### Phase 12.6: WebContainer (Planned)
- Real Astro compilation in browser
- Live SSR preview
- Hot module replacement
- Full dev server in browser

### Future Enhancements
- Multi-page support
- Asset upload/management
- Custom component creation
- Component variants
- Responsive breakpoints editor
- CSS customization panel
- Animation timeline
- A/B testing
- Analytics integration
- Coolify deployment integration

## 📖 Component Registry

All components are defined in `app/lib/components/registry.ts`:

```typescript
interface ComponentDefinition {
  slug: string;              // 'hero-premium'
  name: string;              // 'Hero Premium'
  description: string;
  category: ComponentCategory;
  astroCode: string;         // Full Astro component code
  propsSchema: object;       // JSON Schema for validation
  isGlobal: boolean;         // Available to all organizations
  isPremium: boolean;        // Requires PRO/ENTERPRISE tier
  tags: string[];
  version: string;
}
```

## 🔐 RBAC Permissions

Builder-specific permissions:
- `USE_VISUAL_BUILDER` - Access visual builder
- `VIEW_CODE_PANEL` - View generated code
- `EDIT_CODE` - Edit code directly
- `CREATE_PAGE` - Create new pages
- `EDIT_PAGE` - Modify pages
- `DELETE_PAGE` - Delete pages
- `PUBLISH_PAGE` - Publish to production
- `MANAGE_COMPONENTS` - Manage component library
- `CREATE_CUSTOM_COMPONENT` - Create custom components
- `UPLOAD_ASSET` - Upload media files

## 🎨 UI/UX Features

- **Premium Design**: Gradient buttons, glassmorphism, smooth animations
- **Dark Mode**: Full dark mode support
- **Responsive**: Works on all screen sizes
- **Accessibility**: Keyboard navigation, ARIA labels
- **Performance**: Debounced updates, lazy loading
- **Error Handling**: Comprehensive error states
- **Loading States**: Spinners, skeletons, progress bars
- **Toast Notifications**: Success/error feedback

## 📝 Data Models

### Page
```typescript
{
  id: string;
  title: string;
  slug: string;
  path: string;
  content: Json;           // ComponentNode[]
  status: 'draft' | 'published';
  projectId: string;
  organizationId: string;
}
```

### ComponentNode
```typescript
{
  id: string;              // UUID
  type: string;            // Component slug
  props: Record<string, any>;
  children: ComponentNode[];
  parentId: string | null;
  order: number;
  locked?: boolean;
  hidden?: boolean;
}
```

## 🔄 State Management

### Zustand Store
- **Immutability**: Immer middleware
- **DevTools**: Redux DevTools integration
- **Persistence**: localStorage sync
- **Selectors**: Memoized selectors for performance

### Store Structure
```typescript
{
  // Page
  pageId, pagePath, isDirty, lastSaved,

  // Components
  components: ComponentNode[],
  selectedId, hoveredId, clipboard,

  // History
  history, historyIndex, maxHistorySize,

  // UI
  viewportMode, zoom, panelState,
  activeRightPanel, isExportDialogOpen,
  isDragging, draggedId
}
```

## 🎉 Summary

The Visual Builder is a complete, production-ready drag & drop page builder for Astro. It features:

- **Zero-code** visual editing experience
- **Professional** component library
- **Real-time** preview
- **Complete** project export
- **Enterprise** multi-tenant architecture
- **Premium** UI/UX design

Built with ultra premium standards, TypeScript strict mode, and comprehensive error handling.

---

**Built with Claude Code** 🤖
Ultra Premium Edition - Da Vinci Visual Builder
