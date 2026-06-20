---
name: ui-design-icons-theme-update
description: Workflow command scaffold for ui-design-icons-theme-update in DoppApp.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /ui-design-icons-theme-update

Use this workflow when working on **ui-design-icons-theme-update** in `DoppApp`.

## Goal

Updates to UI design, icons, images, and color themes. Involves editing global styles, public image/icon assets, and sometimes layout or configuration files.

## Common Files

- `src/app/globals.css`
- `src/app/layout.tsx`
- `public/images/`
- `public/*.svg`
- `public/*.ico`
- `src/features/catalog/FoodDeliveryApp.tsx`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit src/app/globals.css for global style changes
- Update or add files in public/images/ or public/ (icons, logos, etc.)
- Modify layout files (src/app/layout.tsx) if needed
- Update related feature components to reflect new design

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.