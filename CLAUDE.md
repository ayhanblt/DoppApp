@AGENTS.md

# DoppApp Project Context

## Project Goal

DoppApp is a Next.js clone/rebuild of `https://www.xn--lz2bv9nd1bm2a9lo9a.com/`.

The original site is a fake food delivery experience: users browse fictional restaurants, add meals to a cart, create a demo order, see the order confirmed, handed to a courier, and then track a courier on a map. There is no registration, payment, or real delivery.

This project keeps that core idea but uses Turkish and English i18n, a clean component/feature structure, responsive UI, and a starter admin panel so restaurants/items can be added later.

## Important Product Rules

- No real order, payment, account, or delivery should be created.
- Site languages are Turkish and English.
- Routes are locale based:
  - `/tr`
  - `/en`
  - `/tr/admin`
  - `/en/admin`
- Unknown product requirements should be clarified before inventing business behavior.
- Code should stay clean and feature-oriented because this may later be converted to React Native.
- Keep domain/data logic separate from UI where practical.
- The courier tracking must use a free map provider. Current implementation uses OpenStreetMap tiles through Leaflet.

## Current Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Leaflet + React Leaflet for the map
- Lucide React for icons
- `localStorage` for the temporary admin data store

Useful commands:

```bash
npm run dev
npm run lint
npm run build
```

Local dev URL:

```text
http://localhost:3000/tr
```

## Folder Structure

```text
src/app
  page.tsx                    Redirects `/` to `/tr`
  layout.tsx                  Root metadata/fonts/global shell
  globals.css                 Tailwind import and global marker styles
  [locale]/
    layout.tsx                Locale validation and static params
    page.tsx                  Customer app route
    admin/page.tsx            Admin route

src/features
  admin/AdminPanel.tsx        Local restaurant/item management UI
  catalog/FoodDeliveryApp.tsx Main customer experience
  catalog/data.ts             Seed restaurant/menu data
  order/cart.ts               Cart calculations and item lookup helpers
  tracking/geo.ts             Geocoding and route interpolation helpers
  tracking/TrackingMap.tsx    Leaflet map component

src/shared
  i18n/config.ts              Locale list and locale guard
  i18n/dictionaries.ts        TR/EN UI strings
  lib/types.ts                Shared domain types
  lib/format.ts               Money/number/id helpers
```

## Main User Flow

1. User opens `/tr` or `/en`.
2. Header shows theme buttons, address label, language switch, admin shortcut, cart, and app info.
3. User searches restaurants or menu items.
4. User selects delivery speed:
   - `rabbit`: faster tracking duration
   - `turtle`: slower tracking duration
5. User adds a menu item.
6. If the item has option groups, a modal opens:
   - Required flavor selection
   - Size selection
   - Multiple extras
   - Quantity stepper
7. Cart footer shows total.
8. Checkout modal collects:
   - Name
   - Phone
   - Address
   - Optional note
9. Address can be geocoded with Nominatim.
10. Demo order is created.
11. Tracking screen shows:
   - Order status steps
   - OpenStreetMap map
   - Restaurant marker
   - Destination marker
   - Motorcycle courier marker moving toward the destination
   - Saved calories

## i18n Notes

Locale type:

```ts
type Locale = "tr" | "en";
```

Locale config lives in:

```text
src/shared/i18n/config.ts
```

Translations live in:

```text
src/shared/i18n/dictionaries.ts
```

Seed restaurant/menu data stores localized fields as records:

```ts
name: { tr: "...", en: "..." }
description: { tr: "...", en: "..." }
category: { tr: "...", en: "..." }
```

When adding new UI text, add both Turkish and English strings to `dictionaries.ts`.

## Data Model

Core types live in:

```text
src/shared/lib/types.ts
```

Important types:

- `Restaurant`
- `MenuItem`
- `MenuOptionGroup`
- `CartItem`
- `Order`
- `DeliverySpeed`
- `OrderStatus`

Current seed data lives in:

```text
src/features/catalog/data.ts
```

The seed data currently contains 17 fictional restaurants to match the source site's restaurant-count feel.

## Admin Panel

Admin route:

```text
/{locale}/admin
```

Current implementation:

- Adds restaurants.
- Adds items to an existing restaurant.
- Saves to `localStorage` under:

```text
doppapp-restaurants
```

Important limitation:

- There is no backend yet.
- Changes are browser-local only.
- The data model is intentionally shaped so a backend can replace `localStorage` later without rewriting the customer flow.

## Tracking And Map Behavior

Map stack:

- `react-leaflet`
- `leaflet`
- OpenStreetMap tile URL:

```text
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

Address geocoding:

```text
src/features/tracking/geo.ts
```

Current geocoding uses free Nominatim:

```text
https://nominatim.openstreetmap.org/search
```

Courier movement:

- Order stores restaurant coordinate and destination coordinate.
- Status and progress are derived from timestamps.
- `rabbit` has a shorter delivery duration.
- `turtle` has a longer delivery duration.
- Courier coordinate is calculated with linear interpolation in `interpolateRoute`.

Important limitation:

- This is not a real courier feed.
- It is a time-based client-side simulation using a real geocoded destination.
- If a production-grade live tracker is needed later, replace the interpolation source with backend/socket/GPS events while keeping `TrackingMap` mostly reusable.

## Known Runtime Issue And Fix

A runtime error previously appeared:

```text
Cannot find module './331.js'
```

Cause:

- Dev server was running while `.next` chunks were changed by a production build.
- Next's dev cache became stale.

Fix:

```bash
lsof -ti tcp:3000 | xargs kill 2>/dev/null || true
rm -rf .next
npm run dev
```

After this, `/tr` rendered normally and browser console had no error logs.

## Design Notes

- UI intentionally resembles a mobile food delivery app but is responsive on desktop.
- Header is sticky.
- Cart footer is fixed.
- Cards use small radii and compact scan-friendly layout.
- Theme buttons update the CSS accent color.
- Keep buttons and controls touch-friendly for future React Native translation.
- Do not add a landing page; the first screen should be the app experience.

## Validation Status

Last verified:

```bash
npm run lint
npm run build
```

Both passed successfully after the 17-restaurant seed data update.

Browser checks completed:

- `/tr` desktop renders.
- `/tr` mobile renders.
- Product option modal opens.
- Cart/checkout works.
- Demo order tracking screen renders.
- OpenStreetMap/Leaflet map renders with restaurant, destination, and motorcycle markers.
- `/tr/admin` renders.

## Change Guidance

When modifying this project:

- Prefer adding product text through `dictionaries.ts`.
- Prefer adding new data through `data.ts` or a future backend adapter.
- Keep calculations in helpers like `cart.ts` and `geo.ts`.
- Keep UI components in feature folders.
- Do not hardcode Turkish-only strings in reusable components.
- If touching map/tracking, check both SSR safety and browser rendering because Leaflet must remain client-side.
- After changes, run:

```bash
npm run lint
npm run build
```
