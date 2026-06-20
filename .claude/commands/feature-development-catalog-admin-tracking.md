---
name: feature-development-catalog-admin-tracking
description: Workflow command scaffold for feature-development-catalog-admin-tracking in DoppApp.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /feature-development-catalog-admin-tracking

Use this workflow when working on **feature-development-catalog-admin-tracking** in `DoppApp`.

## Goal

Implements or updates features related to catalog, admin, and tracking modules, often in parallel. Typically involves updating multiple React component files, shared types, and sometimes API routes.

## Common Files

- `src/features/catalog/CatalogLayout.tsx`
- `src/features/catalog/CatalogList.tsx`
- `src/features/catalog/data.ts`
- `src/features/admin/AdminPanel.tsx`
- `src/features/admin/EditStoreModal.tsx`
- `src/features/admin/EditProductsModal.tsx`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit or add files in src/features/catalog/, src/features/admin/, and/or src/features/tracking/
- Update shared types in src/shared/lib/types.ts
- Optionally update API route files in src/app/api/
- Update i18n dictionaries if needed

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.