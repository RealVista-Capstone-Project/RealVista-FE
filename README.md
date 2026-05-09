# Next.js 15 Boilerplate with Feature-Sliced Design

A scalable Next.js 15 boilerplate following **Feature-Sliced Design (FSD)** architecture, with internationalization support, modern UI components, and best practices built-in.

## 💖 Heartfelt Gratitude

We want to express our deepest appreciation to the incredible developers who have poured their passion and dedication into **RealVista**. This project wouldn't be where it is today without your hard work and commitment.

<div align="center">
  <table style="border: none; border-collapse: collapse;">
    <tr>
      <td align="center" valign="bottom">
        <a href="https://github.com/toki-ai">
          <img src="https://github.com/toki-ai.png" width="100px;" alt="toki-ai" style="border-radius: 50%; border: 2px solid #ffcc00;"/><br />
          <sub><b>toki-ai</b></sub>
        </a>
      </td>
      <td align="center" valign="bottom">
        <a href="https://github.com/Hoang-Nguyen-Huy">
          <img src="https://github.com/Hoang-Nguyen-Huy.png" width="130px;" alt="Hoang-Nguyen-Huy" style="border-radius: 50%; border: 2px solid #ffcc00;"/><br />
          <sub><b>Hoang-Nguyen-Huy</b></sub>
        </a>
      </td>
      <td align="center" valign="bottom">
        <a href="https://github.com/HuyDiCode">
          <img src="https://github.com/HuyDiCode.png" width="160px;" alt="HuyDiCode" style="border-radius: 50%; border: 4px solid #ffd700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);"/><br />
          <sub style="font-size: 1.2em;"><b>👑 HuyDiCode</b></sub>
        </a>
      </td>
      <td align="center" valign="bottom">
        <a href="https://github.com/nguyenhcp2004">
          <img src="https://github.com/nguyenhcp2004.png" width="130px;" alt="Damien Huynh" style="border-radius: 50%; border: 2px solid #ffcc00;"/><br />
          <sub><b>Damien Huynh</b></sub>
        </a>
      </td>
      <td align="center" valign="bottom">
        <a href="https://github.com/ThanhTriIsCoding">
          <img src="https://github.com/ThanhTriIsCoding.png" width="100px;" alt="ThanhTriIsCoding" style="border-radius: 50%; border: 2px solid #ffcc00;"/><br />
          <sub><b>ThanhTriIsCoding</b></sub>
        </a>
      </td>
    </tr>
  </table>

  <p align="center">
    <i>"Alone we can do so little; together we can do so much."</i>
  </p>
  
  **Marked on: 08.05.2026**
</div>

---

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router and [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) with strict mode
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (New York style)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/) with locale routing
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Form Validation**: [Zod](https://zod.dev/) + [react-hook-form](https://react-hook-form.com/)
- **HTTP Client**: Custom typed client with error handling
- **Code Quality**: ESLint, Prettier, Husky, Commitlint

## 📁 Feature-Sliced Design Architecture

This project follows the [Feature-Sliced Design](https://feature-sliced.design/) methodology for scalable frontend applications.

### Directory Structure

```
boilerplate-nextjs/
├── app/                              # Next.js App Router (routing layer)
│   └── [locale]/
│       ├── layout.tsx                # Root layout with providers
│       ├── page.tsx                  # Routes → imports from @/screens
│       └── globals.css               # Global styles
│
├── src/                              # FSD Architecture (business logic)
│   ├── app/                          # FSD app layer
│   │   └── styles/
│   │       └── globals.css           # Application-level styles
│   │
│   ├── shared/                       # Shared layer (reusable across all layers)
│   │   ├── ui/                       # UI components (shadcn/ui)
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   ├── input/
│   │   │   └── ...
│   │   ├── lib/                      # Utilities & libraries
│   │   │   ├── http/                 # HTTP client
│   │   │   ├── utils/                # Helper functions (cn, format, etc.)
│   │   │   └── env/                  # Environment config
│   │   ├── config/                   # Configuration files
│   │   │   ├── i18n/                 # i18n routing, navigation
│   │   │   └── routes.ts             # Route definitions
│   │   ├── segments/                 # i18n shared translations
│   │   │   └── common/               # Common translations (vi, en)
│   │   ├── constants/                # System-wide constants
│   │   └── types/                    # Shared TypeScript types
│   │
│   ├── entities/                     # Entities layer (business domain objects)
│   │   └── user/                     # User entity
│   │       ├── model/
│   │       │   ├── types.ts          # User types
│   │       │   └── store.ts          # Zustand store
│   │       └── index.ts              # Public API
│   │
│   ├── features/                     # Features layer (user interactions)
│   │   └── home/                     # Home feature
│   │       ├── ui/                   # Feature components
│   │       ├── i18n/                 # Feature translations
│   │       │   ├── vi.json
│   │       │   └── en.json
│   │       └── index.ts              # Public API
│   │
│   ├── widgets/                      # Widgets layer (compound components)
│   │   └── .gitkeep
│   │
│   └── screens/                      # Screens layer (full page compositions)
│       └── home/
│           ├── ui/
│           │   └── home-page.tsx     # Full page component
│           └── index.ts              # Public API
│
├── public/                           # Static assets
├── middleware.ts                     # Next.js middleware
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── components.json                   # shadcn/ui configuration
└── package.json                      # Dependencies
```

### FSD Layers & Dependency Rules

```
┌─────────────────────────────────────────┐
│  app (Next.js Router)                   │  ← Can import from all FSD layers
├─────────────────────────────────────────┤
│  screens (FSD)                          │  ← Can import from: widgets, features, entities, shared
├─────────────────────────────────────────┤
│  widgets (FSD)                          │  ← Can import from: features, entities, shared
├─────────────────────────────────────────┤
│  features (FSD)                         │  ← Can import from: entities, shared
├─────────────────────────────────────────┤
│  entities (FSD)                         │  ← Can import from: shared
├─────────────────────────────────────────┤
│  shared (FSD)                           │  ← Cannot import from any FSD layer
└─────────────────────────────────────────┘
```

**Key Rules:**

1. **Dependency Rule**: Only import from layers below you

   - ✅ `features` can import from `entities` and `shared`
   - ❌ `features` cannot import from `screens` or `widgets`

2. **Public API**: Each slice exports through `index.ts`

   - ✅ Use: `import { HomeHero } from '@/features/home'`
   - ❌ Avoid: `import { HomeHero } from '@/features/home/ui/home-hero'`

3. **Slice Independence**: Each feature slice should be self-contained
   - Co-locate components, logic, styles, and translations
   - Avoid tight coupling between slices

## 🏗️ Path Aliases

TypeScript path aliases configured in `tsconfig.json`:

```json
{
  "@/app/*": "./src/app/*", // FSD app layer
  "@/shared/*": "./src/shared/*", // Shared utilities, UI, configs
  "@/entities/*": "./src/entities/*", // Business domain objects
  "@/features/*": "./src/features/*", // User-interaction features
  "@/widgets/*": "./src/widgets/*", // Compound components
  "@/screens/*": "./src/screens/*" // Application pages
}
```

## 🌍 Internationalization (i18n)

### Supported Locales

- **Vietnamese (vi)** - Default locale
- **English (en)**

### Translation Structure

```
src/
├── shared/segments/common/           # Shared translations
│   ├── vi.json
│   └── en.json
└── features/
    └── home/i18n/                   # Feature-specific translations
        ├── vi.json
        └── en.json
```

### Adding New Translations

1. **For a new feature**:

   ```bash
   src/features/my-feature/i18n/
   ├── vi.json
   └── en.json
   ```

2. **Update i18n config** (`src/shared/config/i18n/request.ts`):
   ```typescript
   messages: {
     ...(await import(`@/shared/segments/common/${locale}.json`)).default,
     ...(await import(`@/features/my-feature/i18n/${locale}.json`)).default
   }
   ```

## 🎨 UI Components (shadcn/ui)

This project uses [shadcn/ui](https://ui.shadcn.com/) components.

### Adding New Components

```bash
npx shadcn@latest add [component-name]
```

Components will be installed to `src/shared/ui/[component]/` following the FSD architecture.

**Example:**

```bash
npx shadcn@latest add dialog
```

This will create:

```
src/shared/ui/dialog/
├── dialog.tsx
└── index.ts
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun

### Installation

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Development

```bash
# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

### Build

```bash
# Build for production
npm run build
# or
yarn build
# or
pnpm build
```

### Production

```bash
# Start production server
npm run start
# or
yarn start
# or
pnpm start
```

### Linting

```bash
# Run ESLint
npm run lint
# or
yarn lint
# or
pnpm lint
```

## 📝 Adding New Features

Follow this pattern when adding new features:

### 1. Create a Feature Slice

```
src/features/cart/
├── ui/
│   ├── cart-item.tsx
│   └── cart-summary.tsx
├── model/
│   ├── use-cart.ts
│   └── types.ts
├── api/
│   ├── add-item.ts
│   └── remove-item.ts
├── i18n/
│   ├── vi.json
│   ├── en.json
│   └── index.ts
└── index.ts              # Public API: export * from './ui', etc.
```

### 2. Create an Entity (if needed)

```
src/entities/product/
├── model/
│   ├── types.ts
│   └── store.ts
└── index.ts
```

### 3. Create a Widget (optional, for composition)

```
src/widgets/shopping-cart/
├── ui/
│   └── shopping-cart.tsx
└── index.ts
```

### 4. Create a Screen (full page)

```
src/screens/cart/
├── ui/
│   └── cart-page.tsx
└── index.ts
```

### 5. Add Next.js Route

```typescript
// app/[locale]/cart/page.tsx
import { CartPage } from '@/screens/cart'

export default function Cart() {
  return <CartPage />
}
```

## 💡 Code Examples

Complete examples to help you get started with the FSD architecture.

### Example 1: User Entity (Data Layer)

```typescript
// ========== entities/user/api/index.ts ==========
import http from '@/shared/lib/http'

export const userApi = {
  getCurrent: () => http.get('/user/profile'),
  login: (credentials) => http.post('/auth/login', credentials),
  update: (data) => http.put('/user/profile', data),
} as const

// ========== entities/user/api/keys.ts ==========
export const userKeys = {
  all: ['users'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  profile: () => [...userKeys.current(), 'profile'] as const,
} as const

// ========== entities/user/model/types.ts ==========
export interface User {
  id: string
  email: string
  name?: string
}

// ========== entities/user/model/store.ts ==========
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
    }),
    { name: 'auth-storage' }
  )
)

// ========== entities/user/api/user.queries.ts ==========
import { queryOptions } from '@tanstack/react-query'
import { userApi } from './index'

/**
 * User Query Factory
 * TanStack Query v5 queryOptions for type-safe queries
 */
export const userQueries = {
  all: () => ['users'] as const,

  current: () => queryOptions({
    queryKey: [...userQueries.all(), 'current'],
    queryFn: () => userApi.getCurrent(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  }),

  detail: (id: string) => queryOptions({
    queryKey: [...userQueries.all(), 'detail', id],
    queryFn: () => userApi.getById(id),
    enabled: !!id,
  }),
}
```

### Example 2: Auth Feature - Usage Layer

**Important:** TanStack Query hooks belong in the `features` layer, not `entities`. The entities layer provides the data source (API + queryOptions), while features layer provides the usage logic (hooks).

```typescript
// ========== features/auth/api/use-current-user.ts ==========
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { userQueries } from '@/entities/user/api'
import { useAuthStore } from '@/entities/user/model/store'

/**
 * useCurrentUser Hook
 * Fetches current user using queryOptions from entities
 */
export function useCurrentUser() {
  const setUser = useAuthStore((state) => state.setUser)

  const query = useQuery(userQueries.current())

  // Update store when data changes
  useEffect(() => {
    if (query.data) {
      setUser(query.data.payload)
    }
  }, [query.data, setUser])

  return query
}
```

### Example 3: Auth Feature (Business Logic)

```typescript
// ========== features/auth/model/use-auth.ts ==========
import { useAuthStore } from '@/entities/user'

export function useAuth() {
  const { user, isAuthenticated } = useAuthStore()

  const logout = () => {
    // Add auth-specific logic
    localStorage.removeItem('token')
    // Clear store
  }

  return { user, isAuthenticated, logout }
}

// ========== features/auth/model/use-login.ts ==========
import { useMutation } from '@tanstack/react-query'
import { userApi } from '@/entities/user/api'

export function useLogin() {
  return useMutation({
    mutationFn: userApi.login,
    onSuccess: (response) => {
      const { token, user } = response.payload
      localStorage.setItem('token', token)
      // Redirect, etc.
    },
  })
}
```

### Example 4: Using in Components

```typescript
// ========== features/auth/ui/login-form.tsx ==========
'use client'

import { useLogin } from '@/features/auth'

export function LoginForm() {
  const { mutate: login, isPending } = useLogin()

  return (
    <form onSubmit={(data) => login(data)}>
      <input name="email" />
      <input name="password" type="password" />
      <button disabled={isPending}>Login</button>
    </form>
  )
}

// ========== features/auth/ui/logout-button.tsx ==========
'use client'

import { useAuth } from '@/features/auth'

export function LogoutButton() {
  const { logout, user } = useAuth()

  return (
    <button onClick={logout}>
      Logout, {user?.name}
    </button>
  )
}
```

For more detailed examples, check the actual code:
- `entities/user/` - User entity with API, queryOptions, store, and types
- `features/auth/` - Auth feature with hooks, forms, and business logic

## 📊 TanStack Query + FSD Architecture

This project follows the official [Feature-Sliced Design React Query guide](https://feature-sliced.design/docs/guides/tech/with-react-query) for data fetching.

### Layer Responsibilities

**Entities Layer** (`src/entities/user/`)
- ✅ API methods (HTTP calls)
- ✅ Query factory with `queryOptions` (TanStack Query v5)
- ✅ Domain types
- ✅ Zustand stores
- ❌ NOT: React Query hooks (belongs in features)

**Features Layer** (`src/features/auth/`)
- ✅ React Query hooks (`useQuery`, `useMutation`)
- ✅ Business logic
- ✅ UI components
- ❌ NOT: API methods or queryOptions (belongs in entities)

### Key Benefits of queryOptions Pattern

```typescript
// ✅ Type-safe - autocomplete for query keys and parameters
const { data } = useQuery(userQueries.current())
const { data } = useQuery(userQueries.detail(userId))

// ✅ Centralized configuration
// All query options (staleTime, retry, etc.) defined in one place

// ✅ Easy refetching
queryClient.invalidateQueries({ queryKey: userQueries.current().queryKey })
```

### File Structure

```
src/
├── entities/user/
│   ├── api/
│   │   ├── index.ts           # API methods
│   │   ├── keys.ts            # Query keys (legacy)
│   │   └── user.queries.ts    # queryOptions factory ⭐
│   └── model/
│       ├── types.ts           # Domain types
│       └── store.ts           # Zustand store
│
└── features/auth/
    ├── api/
    │   ├── use-current-user.ts    # Query hooks ⭐
    │   └── use-update-user.ts     # Mutation hooks ⭐
    ├── model/
    │   └── use-auth.ts           # Business logic
    └── ui/
        ├── login-form.tsx
        └── logout-button.tsx
```

This architecture ensures:
- **Separation of Concerns**: Data source (entities) vs usage (features)
- **Type Safety**: queryOptions provide full TypeScript autocomplete
- **Maintainability**: Easy to modify and extend queries
- **Reusability**: queryOptions can be used across multiple features

## 🔄 Mutations vs Queries: Important Differences

### Key Concept: Mutations Don't Use `mutationOptions`

Unlike queries, **mutations do NOT have a `mutationOptions` pattern** in TanStack Query. This is intentional:

| Aspect | Queries (Read) | Mutations (Write) |
|--------|---------------|-------------------|
| **Pattern** | `queryOptions` in entities | `useMutation` in features |
| **Entities Layer** | API functions + `queryOptions()` | API functions only |
| **Features Layer** | Optional custom hooks | Required `useMutation` hooks |
| **Configuration** | Declarative (staleTime, retry) | Imperative (onSuccess, onError) |
| **Invalidation** | Automatic refetching | Manual invalidation |
| **Trigger** | Automatic on mount | Manual (`mutate()` call) |

### Mutation Pattern

**Entities Layer** (`src/entities/user/api/index.ts`) - API Functions Only
```typescript
export const userApi = {
  // Mutation functions (pure HTTP calls)
  login: (credentials: LoginCredentials) =>
    http.post<LoginResponse>('/auth/login', credentials),

  update: (data: UpdateUserData) =>
    http.put<User>('/user/profile', data),

  delete: (id: string) =>
    http.delete(`/users/${id}`),
}
```

**Features Layer** (`src/features/auth/api/`) - useMutation Hooks
```typescript
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const updateUser = useAuthStore(s => s.updateUser)

  return useMutation({
    mutationFn: userApi.update,              // API call from entities
    onSuccess: (response) => {
      // Side effects
      updateUser(response.payload)            // Update Zustand store
      queryClient.invalidateQueries({         // Refetch queries
        queryKey: userQueries.current().queryKey
      })
    },
  })
}
```

### Query Invalidation Strategy

Mutations should invalidate related queries after success:

```typescript
// ✅ Good: Invalidate specific queries
queryClient.invalidateQueries({
  queryKey: userQueries.current().queryKey
})

// ✅ Good: Invalidate all user queries
queryClient.invalidateQueries({
  queryKey: userKeys.all()
})

// ❌ Avoid: Too broad (may cause unnecessary refetches)
queryClient.invalidateQueries()
```

### Complete Example: CRUD Pattern

```typescript
// ========== ENTITIES: API functions ==========
// entities/user/api/index.ts
export const userApi = {
  // Queries
  getCurrent: () => http.get<User>('/user/profile'),
  list: () => http.get<User[]>('/users'),

  // Mutations
  create: (data: CreateUserData) => http.post<User>('/users', data),
  update: (id: string, data: UpdateUserData) => http.put<User>(`/users/${id}`, data),
  delete: (id: string) => http.delete(`/users/${id}`),
}

// ========== FEATURES: Mutation hooks ==========
// features/user-management/api/use-user-mutations.ts

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      // Invalidate list query to show new user
      queryClient.invalidateQueries({
        queryKey: userQueries.lists().queryKey
      })
      toast.success('User created!')
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: (updatedUser) => {
      // Update specific user in cache (optimistic)
      queryClient.setQueryData(
        userQueries.detail(updatedUser.payload.id).queryKey,
        updatedUser
      )
      // Invalidate list as well
      queryClient.invalidateQueries({
        queryKey: userQueries.lists().queryKey
      })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userApi.delete,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: userQueries.detail(deletedId).queryKey
      })
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: userQueries.lists().queryKey
      })
      toast.success('User deleted!')
    },
  })
}
```

### Usage in Components

```typescript
function UserProfile() {
  // Query hook
  const { data: user, isLoading } = useQuery(userQueries.current())

  // Mutation hooks
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const { mutate: deleteAccount } = useDeleteUser()

  const handleUpdate = (newData: UpdateUserData) => {
    updateProfile(newData)  // Trigger mutation
  }

  const handleDelete = () => {
    deleteAccount(userId)  // Trigger mutation
  }

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={() => handleUpdate({ name: 'New Name' })}>
        Update Profile
      </button>
      <button onClick={handleDelete}>Delete Account</button>
    </div>
  )
}
```

### Summary

✅ **DO:**
- Keep mutation API functions in entities
- Create `useMutation` hooks in features
- Invalidate queries using `queryKeys` from entities
- Handle side effects in `onSuccess`/`onError`

❌ **DON'T:**
- Create a `mutationOptions` pattern (doesn't exist)
- Put mutation hooks in entities
- Forget to invalidate related queries
- Mix queries and mutations in the same hook

## 🔧 Environment Variables

Create a `.env.local` file in the root directory:

```env
# API
NEXT_PUBLIC_API_ENDPOINT=http://localhost:4000/api

# Add other environment variables here
```

See `.env.example` for reference.

## 📚 HTTP Client

The project includes a typed HTTP client (`@/shared/lib/http`) with:

- Automatic Bearer token injection from localStorage
- Support for JSON and FormData
- Custom error classes (`HttpError`, `EntityError`)
- Configurable base URL

**Usage:**

```typescript
import http from '@/shared/lib/http'

// GET request
const response = await http.get<User>('/user/profile')

// POST request
const result = await http.post<LoginResponse>('/auth/login', { email, password })

// With custom options
const data = await http.get<Data>('/endpoint', {
  baseUrl: '' // Empty string for relative API calls to Next.js
})
```

## 🎯 Git Workflow

This project uses:

- **Husky** for Git hooks
- **Commitlint** for conventional commits
- **Lint-staged** for pre-commit checks

### Commit Message Format

Follow the conventional commits format:

```
<type>(<scope>): <subject>

[optional body]
```

**Allowed types:**

- `feat` - New feature
- `fix` - Bug fix
- `improve` - Improvement
- `refactor` - Code refactoring
- `docs` - Documentation
- `chore` - Maintenance tasks
- `style` - Code style changes
- `test` - Adding tests
- `revert` - Revert a commit
- `ci` - CI/CD changes
- `build` - Build system changes

**Examples:**

```bash
feat(auth): add login form
fix(api): handle token expiration
docs(readme): update FSD architecture section
```

### Pre-commit Hooks

- `pre-commit` - Runs `npm run lint`
- `commit-msg` - Validates commit message format
- `pre-push` - Blocks direct pushes to `main` and `develop` branches

## 🚀 Deployment

### Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=readme):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=readme)

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Zustand Guide](https://zustand-demo.pmnd.rs/)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Built with ❤️ using Next.js 15 and Feature-Sliced Design**
