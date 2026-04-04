# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run Jest in watch mode
- `npm run test:coverage` - Run Jest with coverage report
- `npm test -- path/to/test.test.ts` - Run a single test file

## Architecture

### Tech Stack

- **Next.js 15** with App Router and React 19
- **next-intl** for internationalization (i18n) with locale routing
- **NextAuth v5** (beta) for authentication with OAuth providers
- **shadcn/ui** (New York style) for UI components
- **Zustand** for state management
- **TanStack Query v5** for data fetching with `queryOptions` pattern
- **Zod** + react-hook-form for form validation
- **Tailwind CSS v4** for styling
- **SockJS + STOMP** for WebSocket communication with Spring Boot backend
- **Google Maps** via `@vis.gl/react-google-maps`
- **TypeScript** with strict mode

### Project Structure

This project follows **Feature-Sliced Design (FSD)** methodology. The app uses a locale-based routing structure where all pages are under `src/app/[locale]/`.

**FSD Layers (dependency order: bottom → top):**

- `src/shared/` - Reusable utilities, UI components (shadcn/ui), HTTP client, configs, types
- `src/entities/` - Business domain objects (e.g., user entity with API, queryOptions, store)
- `src/features/` - User interactions and business logic (e.g., auth feature with hooks)
- `src/widgets/` - Compound components composed from features
- `src/screens/` - Full page compositions
- `src/app/` - Next.js App Router (routing layer only, imports from screens)

**Key Rule:** Only import from layers below you. Use public API (`index.ts`) for imports.

### Internationalization (i18n)

The app supports Vietnamese (`vi`) and English (`en`) with Vietnamese as the default locale. Locale files are organized by feature:

- `src/shared/segments/common/{locale}.json` - Shared translations
- `src/features/{FeatureName}/i18n/{locale}.json` - Feature-specific translations

When adding new features with translations:

1. Create locale JSON files under `src/features/{FeatureName}/i18n/`
2. Import and merge them in `src/shared/config/i18n/request.ts`

### HTTP Client

`src/shared/lib/http/` provides a typed HTTP client with:

- Automatic Bearer token injection from `localStorage.token`
- Support for JSON and FormData bodies
- Custom error classes (`HttpError`, `EntityError`)
- Configurable `baseUrl` for API endpoints

### Environment Variables

Environment variables are validated at runtime via `@t3-oss/env-nextjs` in `src/shared/lib/env/`.

Required variables (see `.env.example`):

- `NEXT_PUBLIC_API_ENDPOINT` - Backend API base URL
- `NEXT_PUBLIC_WS_ENDPOINT` - WebSocket endpoint for Spring Boot
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps JavaScript API key
- `NEXTAUTH_URL` - Full URL for NextAuth OAuth callbacks
- `NEXTAUTH_SECRET` - Secret for JWT/session encryption (min 32 chars)

### Git Workflow

The project uses Husky for git hooks and Commitlint for conventional commits.

**Commit format:** `<type>(<scope>): <subject>`

Allowed types: `feat`, `fix`, `improve`, `refactor`, `docs`, `chore`, `style`, `test`, `revert`, `ci`, `build`

- `pre-commit` - Runs `npm run lint`
- `commit-msg` - Validates commit message format (scope must not be empty)
- `pre-push` - Blocks direct pushes to `main` and `develop` branches

### TypeScript Path Aliases

The project uses explicit path aliases configured in `tsconfig.json`:

- `@/app/*` - FSD app layer
- `@/shared/*` - Shared utilities, UI, configs
- `@/entities/*` - Business domain objects
- `@/features/*` - User-interaction features
- `@/widgets/*` - Compound components
- `@/screens/*` - Application pages

### TypeScript Best Practices

**Critical Rule:** Never use the `any` type. Always use proper types or `unknown` when the type is truly unknown.

- Use `unknown` instead of `any` for values of uncertain type
- Use proper type definitions, interfaces, or type inference
- If a type cannot be determined immediately, add a `// TODO` comment with a specific type to be defined later
- The project uses TypeScript strict mode - leverage it for type safety

### TanStack Query + FSD Architecture

**Key Pattern:** Entities layer provides data sources, Features layer provides usage logic.

- **Entities Layer** (`src/entities/user/`):
  - API functions (HTTP calls)
  - Query factory with `queryOptions()` (TanStack Query v5)
  - Domain types
  - Zustand stores

- **Features Layer** (`src/features/auth/`):
  - React Query hooks (`useQuery`, `useMutation`)
  - Business logic
  - UI components

**Example:**

```typescript
// entities/user/api/user.queries.ts
export const userQueries = {
  current: () =>
    queryOptions({
      queryKey: ['users', 'current'],
      queryFn: () => userApi.getCurrent(),
      staleTime: 5 * 60 * 1000,
    }),
};

// features/auth/api/use-current-user.ts
export function useCurrentUser() {
  return useQuery(userQueries.current());
}
```

**Important:** Mutations do NOT use `mutationOptions` pattern. Create `useMutation` hooks directly in features layer.

### Custom UI Components

Beyond shadcn/ui, the project includes custom branded components in `src/shared/ui/`:

- **RealVistaButton** - Custom button with variants (primary, secondary, google) and sizes
  - Uses `class-variance-authority` for type-safe variants
  - Supports `asChild` for rendering as Next.js Link
  - Custom color tokens matching Figma design (e.g., `bg-main-primary`, `border-purple-92`)

```typescript
import { RealVistaButton } from '@/shared/ui/real-vista-button';

<RealVistaButton variant="primary" size="large" withIcon>
  Submit
</RealVistaButton>
```

### Code Formatting

The project uses Prettier with specific rules (configured in `.prettierrc`):

- `semi: true` - Semicolons required
- `singleQuote: true` - Use single quotes
- `trailingComma: 'es5'` - Add trailing commas in ES5-safe locations
- `printWidth: 100` - Max line width
- `jsxSingleQuote: true` - Use single quotes for JSX props

Always run Prettier before committing to ensure consistent formatting.

- When creating Pull Requests, always use 'develop' as the base branch.
- When creating Pull Requests, follow the template in '.github/pull_request_template.md'

### WebSocket/STOMP Integration

The app includes a WebSocket client for real-time communication with Spring Boot backends using **SockJS** and **STOMP protocol**.

**Location:** `src/shared/lib/websocket/`

**Usage:**

```typescript
import { useWebSocket } from '@/shared/lib/websocket';

const { isConnected, subscribe, send } = useWebSocket({
  endpoint: process.env.NEXT_PUBLIC_WS_ENDPOINT,
  onConnect: () => console.log('Connected'),
});

// Subscribe to topic
useEffect(() => {
  if (!isConnected) return;
  const unsubscribe = subscribe({
    destination: '/topic/messages',
    onMessage: (msg) => console.log(msg.body),
  });
  return unsubscribe;
}, [isConnected, subscribe]);
```

**STOMP Endpoints:**

- Subscribe: `/topic/{name}` (public) or `/user/queue/{name}` (private)
- Send: `/app/{endpoint}`

See `src/shared/lib/websocket/README.md` for complete documentation.

### Route Constants

Centralized route definitions in `src/shared/config/routes.ts`:

```typescript
import { ROUTES } from '@/shared/config/routes';

// Usage
<Link href={ROUTES.dashboard.messages} />
```

All routes are defined as `const` for type safety and should be imported from this file.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **RealVista-FE** (1614 symbols, 3289 relationships, 51 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/RealVista-FE/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/RealVista-FE/context` | Codebase overview, check index freshness |
| `gitnexus://repo/RealVista-FE/clusters` | All functional areas |
| `gitnexus://repo/RealVista-FE/processes` | All execution flows |
| `gitnexus://repo/RealVista-FE/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
