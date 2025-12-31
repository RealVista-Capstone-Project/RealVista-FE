# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

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

The app uses a locale-based routing structure where all pages are under `src/app/[locale]/`.

Key directories:
- `src/app/[locale]/` - Next.js App Router pages (locale-aware)
- `src/i18n/` - Internationalization configuration and locale files
- `src/lib/` - Utilities including HTTP client and environment config
- `src/stores/` - Zustand state stores
- `src/components/ui/` - shadcn/ui components
- `src/constants/` - Routes and system messages
- `src/validations/` - Form validation schemas
- `src/templates/` - Page templates

### Internationalization (i18n)

The app supports Vietnamese (`vi`) and English (`en`) with Vietnamese as the default locale. Locale files are organized by feature:
- `src/i18n/locales/common/{locale}.json` - Shared translations
- `src/i18n/locales/{FeatureName}/{locale}.json` - Feature-specific translations

When adding new features with translations:
1. Create locale JSON files under `src/i18n/locales/{FeatureName}/`
2. Import and merge them in `src/i18n/request.ts`

### HTTP Client

`src/lib/http.ts` provides a typed HTTP client with:
- Automatic Bearer token injection from `localStorage.sessionToken`
- Support for JSON and FormData bodies
- Custom error classes (`HttpError`, `EntityError`)
- Configurable `baseUrl` for API endpoints

Environment variables are validated at runtime via `@t3-oss/env-nextjs` in `src/lib/env.ts`.

### Git Workflow

The project uses Husky for git hooks and Commitlint for conventional commits.

**Commit format:** `<type>(<scope>): <subject>`

Allowed types: `feat`, `fix`, `improve`, `refactor`, `docs`, `chore`, `style`, `test`, `revert`, `ci`, `build`

- `pre-commit` - Runs `npm run lint`
- `commit-msg` - Validates commit message format
- `pre-push` - Blocks direct pushes to `main` and `develop` branches

### TypeScript Path Aliases

The project uses explicit path aliases configured in `tsconfig.json`:
- `@/components/*`, `@/lib/*`, `@/stores/*`, etc.

Note: The generic `@/*` alias is commented out - use specific aliases.
