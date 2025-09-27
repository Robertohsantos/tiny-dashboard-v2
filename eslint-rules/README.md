# @saas-boilerplate/eslint-plugin

ESLint plugin for Igniter.js bundle contamination prevention.

This plugin provides rules to detect and prevent bundle contamination in Igniter.js applications by identifying improper imports and exports that could leak server-side code to client bundles.

## Installation

The plugin is included in the SaaS Boilerplate project and configured in the main ESLint configuration.

## Rules

### `no-presentation-exports`

Prevents presentation layer exports in feature index files.

**Problem:**

```typescript
// ❌ BAD: Feature index.ts exporting presentation components
export * from './presentation/components'
```

**Solution:**

```typescript
// ✅ GOOD: Feature index.ts only exporting server-side code
export * from './controllers/feature.controller'
export * from './procedures/feature.procedure'
export * from './feature.interface'

// Components should be imported directly by pages/components
import { MyComponent } from '@/features/my-feature/presentation/components'
```

### `no-controller-imports`

Prevents controller imports in client-side files.

**Problem:**

```typescript
// ❌ BAD: Client component importing controller directly
import { MyController } from '@/features/my-feature/controllers/my.controller'
```

**Solution:**

```typescript
// ✅ GOOD: Use api client instead
import { api } from '@/igniter.client'

const { data } = api.myFeature.myAction.useQuery()
```

### `no-procedure-imports`

Prevents procedure imports in client-side files.

**Problem:**

```typescript
// ❌ BAD: Client component importing procedure directly
import { MyProcedure } from '@/features/my-feature/procedures/my.procedure'
```

**Solution:**

```typescript
// ✅ GOOD: Use api client instead
import { api } from '@/igniter.client'

const mutation = api.myFeature.myAction.useMutation()
```

### `no-server-side-imports`

Prevents server-side code imports in hooks.

**Problem:**

```typescript
// ❌ BAD: Hook importing server-side code
import { MyService } from '@/modules/my-feature/services/my.service'
import { MyRepository } from '@/modules/my-feature/repositories/my.repository'
```

**Solution:**

```typescript
// ✅ GOOD: Hook using api client
import { api } from '@/igniter.client'

export function useMyData() {
  return api.myFeature.getData.useQuery()
}
```

## Configuration

Add to your `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript",
    "@igniter-js/eslint-config/next"
  ],
  "plugins": ["@saas-boilerplate/eslint-plugin"],
  "rules": {
    "@saas-boilerplate/eslint-plugin/no-presentation-exports": "error",
    "@saas-boilerplate/eslint-plugin/no-controller-imports": "error",
    "@saas-boilerplate/eslint-plugin/no-procedure-imports": "error",
    "@saas-boilerplate/eslint-plugin/no-server-side-imports": "error"
  }
}
```

Or use the recommended configuration:

```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript",
    "@igniter-js/eslint-config/next",
    "@saas-boilerplate/eslint-plugin/recommended"
  ]
}
```

## Usage

Run ESLint as usual:

```bash
npx eslint src/
```

## Examples

### Feature Structure (Correct)

```
src/features/my-feature/
├── index.ts                    # ✅ Only exports server-side code
├── my-feature.interface.ts
├── controllers/
│   └── my-feature.controller.ts
├── procedures/
│   └── my-feature.procedure.ts
└── presentation/
    └── components/             # ❌ NOT exported in index.ts
        └── my-component.tsx
```

### Component Usage (Correct)

```typescript
// src/app/my-page/page.tsx
import { MyComponent } from '@/features/my-feature/presentation/components/my-component';
import { api } from '@/igniter.client';

export default function MyPage() {
  const { data } = api.myFeature.getData.useQuery();

  return <MyComponent data={data} />;
}
```

## Contributing

When adding new rules:

1. Create a new file in `rules/` directory
2. Export the rule from `index.js`
3. Add to the recommended configuration
4. Update this README with documentation

## License

MIT
