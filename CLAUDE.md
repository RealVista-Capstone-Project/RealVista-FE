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
