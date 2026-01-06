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

## Architecture

### Tech Stack
- **Next.js 15** with App Router and React 19
- **next-intl** for internationalization (i18n) with locale routing
- **shadcn/ui** (New York style) for UI components
- **Zustand** for state management
- **Zod** + react-hook-form for form validation
- **Tailwind CSS v4** for styling
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

Environment variables are validated at runtime via `@t3-oss/env-nextjs` in `src/shared/lib/env/`.

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
  current: () => queryOptions({
    queryKey: ['users', 'current'],
    queryFn: () => userApi.getCurrent(),
    staleTime: 5 * 60 * 1000,
  }),
}

// features/auth/api/use-current-user.ts
export function useCurrentUser() {
  return useQuery(userQueries.current())
}
```

**Important:** Mutations do NOT use `mutationOptions` pattern. Create `useMutation` hooks directly in features layer.

### Code Formatting

The project uses Prettier with specific rules (configured in `.prettierrc`):
- `semi: true` - Semicolons required
- `singleQuote: true` - Use single quotes
- `trailingComma: 'es5'` - Add trailing commas in ES5-safe locations
- `printWidth: 100` - Max line width
- `jsxSingleQuote: true` - Use single quotes for JSX props

Always run Prettier before committing to ensure consistent formatting.
