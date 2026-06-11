<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Delivery Timeline Configuration

All delivery timing is centralized in `DELIVERY_CONFIG` in `src/features/catalog/FoodDeliveryApp.tsx`:

```typescript
const DELIVERY_CONFIG = {
  // Step süreler (milisaniye)
  confirmedDuration: 2000,     // Sipariş onaylandı (2 saniye)
  preparingDuration: 8000,     // Restoran hazırlıyor (8 saniye)
  handoffDuration: 5000,       // Kuryeye verildi (5 saniye)
  deliveringDuration: 3000,    // Son 3 saniye delivering (teslimden 3sn önce)
  
  // Kurye hareket süreler (mesafeye bağlı)
  rabbit: {
    baseMs: 10000,             // Base 10 saniye
    kmMultiplierMs: 4000       // Her km için 4 saniye
  },
  turtle: {
    baseMs: 18000,             // Base 18 saniye
    kmMultiplierMs: 6000       // Her km için 6 saniye
  }
};
```

## Timeline Calculation

1. **placedAt**: Order creation time (now)
2. **confirmed**: placedAt → placedAt + 2000ms
3. **preparing**: placedAt + 2000ms → placedAt + 10000ms (2s + 8s)
4. **handoff**: placedAt + 10000ms → placedAt + 15000ms (2s + 8s + 5s)
5. **delivering**: placedAt + 15000ms → deliveredAt - 3000ms
6. **delivering** (last 3s): deliveredAt - 3000ms → deliveredAt
7. **delivered**: deliveredAt

Courier movement duration = baseMs + (distanceKm × kmMultiplierMs)

**Important**: When updating `DELIVERY_CONFIG`, all status transitions and courier animation timing are automatically synced.

