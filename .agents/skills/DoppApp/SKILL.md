```markdown
# DoppApp Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the key development patterns, coding conventions, and workflows used in the DoppApp repository—a Next.js application written in TypeScript. You'll learn how to structure features, update UI themes, manage documentation, and handle configuration changes, following the project's established conventions. This guide also covers commit patterns, file organization, and testing practices to help you contribute effectively.

## Coding Conventions

### File Naming

- Use **camelCase** for file and folder names.
  - Example: `catalogList.tsx`, `editStoreModal.tsx`

### Import Style

- Use **alias imports** for modules.
  - Example:
    ```typescript
    import { CatalogList } from '@/features/catalog/CatalogList';
    import { sharedType } from '@/shared/lib/types';
    ```

### Export Style

- Mixed usage: both **named** and **default exports** are present.
  - Example (named export):
    ```typescript
    export function TrackingMap() { /* ... */ }
    ```
  - Example (default export):
    ```typescript
    export default AdminPanel;
    ```

### Commit Patterns

- Prefixes: `feat`, `updates`, `chore`, `update`
- Messages are concise (~44 characters on average).
  - Example: `feat: add tracking map and celebration popup`

## Workflows

### Feature Development: Catalog, Admin, Tracking

**Trigger:** When you want to add or update catalog, admin, or tracking features (UI or logic).  
**Command:** `/feature-catalog-admin-tracking`

1. Edit or add files in `src/features/catalog/`, `src/features/admin/`, and/or `src/features/tracking/`.
2. Update shared types in `src/shared/lib/types.ts` if new data structures are needed.
3. Optionally update API route files in `src/app/api/` for backend changes.
4. Update i18n dictionaries (`src/shared/i18n/dictionaries.ts`) if new UI text is introduced.
5. Commit with a descriptive message, e.g., `feat: update admin panel and tracking`.

**Example:**
```typescript
// src/features/catalog/CatalogList.tsx
import { CatalogItem } from '@/shared/lib/types';

export function CatalogList({ items }: { items: CatalogItem[] }) {
  // ...component logic
}
```

### UI Design, Icons, and Theme Update

**Trigger:** When you want to refresh the UI, update branding, or change icons/colors.  
**Command:** `/update-ui-theme-icons`

1. Edit `src/app/globals.css` for global style changes.
2. Update or add files in `public/images/` or `public/` (icons, logos, etc.).
3. Modify layout files (`src/app/layout.tsx`) if needed.
4. Update related feature components to reflect the new design.
5. Commit with a message like `update: refresh theme and icons`.

**Example:**
```css
/* src/app/globals.css */
:root {
  --primary-color: #0055ff;
}
```

### Documentation and Markdown Update

**Trigger:** When you want to update project documentation or agent configuration.  
**Command:** `/update-docs`

1. Edit or add Markdown files in `docs/`, `AGENTS.md`, `CLAUDE.md`, etc.
2. Edit or add agent config files in `.codex/`, `.agents/`, `.claude/`.
3. Commit all related documentation changes together with a clear message.

**Example:**
```markdown
# AGENTS.md

## DoppApp Agent
- Description: Handles catalog and tracking features.
```

### Package and Config Update

**Trigger:** When you want to update dependencies, scripts, or project configuration.  
**Command:** `/update-packages-config`

1. Edit `package.json` and/or `package-lock.json` for dependency updates.
2. Optionally update `next.config.ts`, `tsconfig.json`, or `eslint.config.mjs` for configuration changes.
3. Commit with related feature or maintenance changes.

**Example:**
```json
// package.json
{
  "dependencies": {
    "next": "^13.4.0",
    "typescript": "^5.0.0"
  }
}
```

## Testing Patterns

- **Framework:** Unknown (not detected in analysis).
- **File Pattern:** Test files use the `*.test.*` convention.
  - Example: `catalogList.test.tsx`
- **Location:** Typically alongside the files they test or in a `__tests__` directory.
- **Best Practice:** Write clear, isolated tests for each component or function.

## Commands

| Command                        | Purpose                                                      |
|---------------------------------|--------------------------------------------------------------|
| /feature-catalog-admin-tracking | Add or update catalog, admin, or tracking features           |
| /update-ui-theme-icons          | Refresh UI design, icons, images, or color themes            |
| /update-docs                    | Update documentation or agent configuration                  |
| /update-packages-config         | Update dependencies or project configuration files           |
```
