```markdown
# DoppApp Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the DoppApp repository, a Next.js codebase written in TypeScript. You'll learn how to structure files, write imports and exports, and follow commit and testing conventions to ensure consistency and maintainability.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userProfile.ts`, `orderHistory.tsx`

### Import Style
- Use **alias imports** for modules.
  - Example:
    ```typescript
    import { fetchUser } from '@/services/userService';
    ```

### Export Style
- Use **named exports**.
  - Example:
    ```typescript
    // userProfile.ts
    export function getUserProfile(id: string) { ... }
    ```

### Commit Patterns
- Commit messages are **freeform**, sometimes with prefixes.
- Average commit message length: **21 characters**.
  - Example:  
    ```
    fix login redirect bug
    ```

## Workflows

_No specific workflows were detected in the repository._

## Testing Patterns

- **Test File Pattern:** Files use the `*.test.*` naming convention.
  - Example: `userProfile.test.ts`
- **Testing Framework:** Not explicitly detected; check project dependencies for details.
- **Test Example:**
  ```typescript
  // userProfile.test.ts
  import { getUserProfile } from './userProfile';

  test('should fetch user profile', () => {
    const profile = getUserProfile('123');
    expect(profile).toBeDefined();
  });
  ```

## Commands
| Command | Purpose |
|---------|---------|
| /test   | Run all test files matching `*.test.*` |
```
