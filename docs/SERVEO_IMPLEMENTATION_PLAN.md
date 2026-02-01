# Serveo Implementation Plan

## Overview
Transform the existing Menu Order SaaS into the Serveo platform with multi-branch support, delivery pricing zones, multi-currency, and payment method configuration.

---

## Current State Analysis

**Existing Schema:**
- Restaurant (single entity, no branches)
- Category, Item (linked to restaurant)
- Table (linked to restaurant)
- Order (basic, single delivery fee)
- User (1:1 with restaurant)

**Key Gaps to Address:**
1. No Branch concept (multi-location support)
2. No delivery zones or distance-based pricing
3. Prices stored as Float (should be Integer/cents)
4. No payment method configuration
5. No currency configuration per branch
6. No delivery fee calculation audit trail

---

## Implementation Phases

### Phase 1: Database Schema Migration
**Priority: Critical | Estimated Changes: ~300 lines**

#### 1.1 New Models to Add

```prisma
// Branch - core multi-location support
model Branch {
  id                String   @id @default(uuid())
  restaurantId      String
  name              String
  nameAr            String?
  slug              String   // unique within restaurant
  countryCode       String   @default("EG")
  currencyCode      String   @default("EGP")
  timezone          String   @default("Africa/Cairo")
  address           String
  addressAr         String?
  latitude          Float?
  longitude         Float?
  phone             String
  isActive          Boolean  @default(true)
  orderTypesEnabled Json     @default("[\"delivery\", \"pickup\", \"dine_in\"]")
  minOrderAmount    Int      @default(0)  // in smallest currency unit
  prepTimeMinutes   Int      @default(30)
  hoursJson         Json     @default("{}")

  // Relations
  restaurant        Restaurant @relation(...)
  tables            Table[]
  orders            Order[]
  deliveryZones     DeliveryZone[]
  distanceRules     DeliveryDistanceRule[]
  paymentMethods    PaymentMethodConfig[]
  menuOverrides     BranchMenuOverride[]
}

// Delivery Zone (manual pricing)
model DeliveryZone {
  id                String   @id @default(uuid())
  branchId          String
  name              String
  nameAr            String?
  polygon           Json?    // GeoJSON
  postalCodes       String[] // alternative to polygon
  deliveryFee       Int      // smallest currency unit
  minOrderAmount    Int
  estimatedMinutes  Int      @default(30)
  isActive          Boolean  @default(true)
  priority          Int      @default(0)
}

// Distance-based pricing rules
model DeliveryDistanceRule {
  id                String   @id @default(uuid())
  branchId          String
  minDistanceKm     Float
  maxDistanceKm     Float
  baseFee           Int
  perKmFee          Int
  minOrderAmount    Int
  isActive          Boolean  @default(true)
}

// Payment method configuration
model PaymentMethodConfig {
  id                String   @id @default(uuid())
  branchId          String
  methodType        PaymentMethodType
  isEnabled         Boolean  @default(true)
  displayOrder      Int      @default(0)
  availableFor      Json     @default("[\"delivery\", \"pickup\", \"dine_in\"]")
  minOrderAmount    Int?
  maxOrderAmount    Int?
}

// Branch-specific menu overrides
model BranchMenuOverride {
  id                String   @id @default(uuid())
  branchId          String
  itemId            String
  priceOverride     Int?     // null = use base price
  isAvailable       Boolean  @default(true)

  @@unique([branchId, itemId])
}

// Country/Currency configuration
model CountryConfig {
  countryCode       String   @id
  currencyCode      String
  currencySymbol    String
  symbolPosition    String   @default("after") // before/after
  decimalPlaces     Int      @default(2)
  roundingRule      String   @default("nearest_1")
  thousandSeparator String   @default(",")
}
```

#### 1.2 Models to Modify

**Order Model - Add:**
```prisma
model Order {
  // ... existing fields
  branchId              String
  branch                Branch @relation(...)
  currencyCode          String
  deliveryFeeCalculation Json?  // audit snapshot
  paymentStatus         PaymentStatus @default(UNPAID)
  paymentReference      String?
  deliveryLatitude      Float?
  deliveryLongitude     Float?
  pricingSnapshot       Json?  // item prices at order time
}
```

**Table Model - Change:**
```prisma
model Table {
  // Change restaurantId to branchId
  branchId     String
  branch       Branch @relation(...)
  qrToken      String @unique @default(uuid())  // for secure QR URLs
}
```

**Item Model - Add:**
```prisma
model Item {
  // ... existing
  basePriceCents  Int      // rename price -> basePriceCents
  baseCurrency    String   @default("EGP")
}
```

#### 1.3 New Enums

```prisma
enum PaymentMethodType {
  CASH_ON_DELIVERY
  CARD_ON_DELIVERY
  CARD_ONLINE
}

enum PaymentStatus {
  UNPAID
  PAID
  FAILED
  REFUNDED
}

enum DeliveryPricingStrategy {
  ZONES_ONLY
  DISTANCE_ONLY
  HYBRID
}
```

---

### Phase 2: Backend API Modules
**Priority: Critical | Files to create/modify: ~15**

#### 2.1 New Modules

| Module | Purpose | Key Endpoints |
|--------|---------|---------------|
| `branches` | Branch CRUD | POST/GET/PUT/DELETE /branches |
| `delivery-pricing` | Zone & distance pricing | GET /branches/:id/delivery-fee?lat=&lng= |
| `payment-config` | Payment method settings | GET/PUT /branches/:id/payment-methods |
| `country-config` | Currency settings | GET /countries, GET /countries/:code |

#### 2.2 Files to Create

```
apps/api/src/
├── branches/
│   ├── branches.module.ts
│   ├── branches.controller.ts
│   ├── branches.service.ts
│   └── dto/
│       ├── create-branch.dto.ts
│       └── update-branch.dto.ts
├── delivery-pricing/
│   ├── delivery-pricing.module.ts
│   ├── delivery-pricing.controller.ts
│   ├── delivery-pricing.service.ts
│   ├── dto/
│   │   ├── create-zone.dto.ts
│   │   ├── create-distance-rule.dto.ts
│   │   └── calculate-fee.dto.ts
│   └── utils/
│       └── geo.utils.ts  # point-in-polygon, distance calc
├── payment-config/
│   ├── payment-config.module.ts
│   ├── payment-config.controller.ts
│   └── payment-config.service.ts
└── country-config/
    ├── country-config.module.ts
    └── country-config.service.ts
```

#### 2.3 Files to Modify

| File | Changes |
|------|---------|
| `orders/orders.service.ts` | Add branch context, delivery fee calculation, payment status |
| `orders/orders.controller.ts` | Add branch parameter |
| `public/public.controller.ts` | Update for branch-aware menu |
| `public/public.service.ts` | Add delivery fee preview endpoint |
| `tables/tables.service.ts` | Link to branch instead of restaurant |
| `items/items.service.ts` | Support branch price overrides |

#### 2.4 Delivery Fee Calculation Logic

```typescript
// delivery-pricing.service.ts
async calculateDeliveryFee(branchId: string, lat: number, lng: number): Promise<DeliveryFeeResult> {
  const branch = await this.getBranchWithPricingRules(branchId);

  // Step 1: Check manual zones first (priority order)
  const matchingZone = await this.findMatchingZone(branchId, lat, lng);
  if (matchingZone) {
    return {
      method: 'zone',
      zoneId: matchingZone.id,
      zoneName: matchingZone.name,
      fee: matchingZone.deliveryFee,
      minOrder: matchingZone.minOrderAmount,
      estimatedMinutes: matchingZone.estimatedMinutes,
      // ... full audit data
    };
  }

  // Step 2: Fall back to distance-based pricing
  const distance = this.calculateDistance(branch.latitude, branch.longitude, lat, lng);
  const rule = await this.findDistanceRule(branchId, distance);

  if (rule) {
    const extraKm = Math.max(0, distance - rule.minDistanceKm);
    const fee = rule.baseFee + Math.ceil(extraKm * rule.perKmFee);
    return {
      method: 'distance',
      distanceKm: distance,
      fee: fee,
      // ... full audit data
    };
  }

  // Step 3: Outside delivery range
  return { available: false, reason: 'outside_delivery_area' };
}
```

---

### Phase 3: Frontend Updates
**Priority: High | Files to create/modify: ~12**

#### 3.1 New Pages/Components

```
apps/web/src/app/
├── r/[restaurantSlug]/[branchSlug]/
│   ├── page.tsx              # Branch menu page
│   └── components/
│       ├── DeliveryChecker.tsx
│       ├── OrderTypeSelector.tsx
│       └── PaymentSelector.tsx
├── (dashboard)/
│   ├── branches/
│   │   ├── page.tsx          # List branches
│   │   ├── [id]/
│   │   │   ├── page.tsx      # Edit branch
│   │   │   ├── delivery/
│   │   │   │   └── page.tsx  # Delivery zones config
│   │   │   └── payments/
│   │   │       └── page.tsx  # Payment methods config
│   │   └── new/
│   │       └── page.tsx      # Create branch
```

#### 3.2 Key UI Components

**DeliveryChecker.tsx** - Shows delivery fee before checkout:
```
┌─────────────────────────────────────────┐
│ Delivery to: [Enter address...]         │
│                                         │
│ ✓ Delivery available!                   │
│ Fee: EGP 25.00 (Zamalek zone)           │
│ Est. time: 20-30 min                    │
│ Min order: EGP 100.00                   │
└─────────────────────────────────────────┘
```

**DeliveryZoneEditor.tsx** - Admin zone configuration:
- Map with polygon drawing tool
- Zone list with fees
- Test address calculator

---

### Phase 4: Data Migration
**Priority: Critical**

#### 4.1 Migration Strategy

1. Create new tables (Branch, DeliveryZone, etc.)
2. For each existing Restaurant:
   - Create a default Branch with restaurant's current settings
   - Move delivery fee to a default DeliveryZone or DistanceRule
   - Update Tables to reference new Branch
   - Update Orders to reference new Branch
3. Convert Float prices to Int (multiply by 100)
4. Backfill currencyCode on existing orders

#### 4.2 Migration Script Outline

```typescript
// prisma/migrations/seed-branches.ts
async function migrateToBranches() {
  const restaurants = await prisma.restaurant.findMany();

  for (const restaurant of restaurants) {
    // Create default branch
    const branch = await prisma.branch.create({
      data: {
        restaurantId: restaurant.id,
        name: restaurant.name,
        slug: 'main',
        address: restaurant.address,
        phone: restaurant.phone,
        currencyCode: restaurant.currency,
        minOrderAmount: Math.round(restaurant.minOrder * 100),
      }
    });

    // Create default delivery zone if deliveryFee > 0
    if (restaurant.deliveryFee > 0) {
      await prisma.deliveryDistanceRule.create({
        data: {
          branchId: branch.id,
          minDistanceKm: 0,
          maxDistanceKm: 10,
          baseFee: Math.round(restaurant.deliveryFee * 100),
          perKmFee: 0,
          minOrderAmount: Math.round(restaurant.minOrder * 100),
        }
      });
    }

    // Update tables
    await prisma.table.updateMany({
      where: { restaurantId: restaurant.id },
      data: { branchId: branch.id }
    });

    // Update orders
    await prisma.order.updateMany({
      where: { restaurantId: restaurant.id },
      data: { branchId: branch.id }
    });
  }
}
```

---

## Implementation Order

### Week 1: Foundation
1. [ ] Create Prisma schema migration
2. [ ] Run migration on dev database
3. [ ] Create data migration script
4. [ ] Create `branches` module (CRUD)
5. [ ] Create `country-config` module

### Week 2: Delivery Pricing
6. [ ] Create `delivery-pricing` module
7. [ ] Implement zone-based pricing
8. [ ] Implement distance-based pricing
9. [ ] Implement hybrid logic
10. [ ] Add delivery fee preview endpoint

### Week 3: Orders & Payments
11. [ ] Update orders module for branch context
12. [ ] Add delivery fee calculation to order creation
13. [ ] Add pricing snapshot to orders
14. [ ] Create `payment-config` module
15. [ ] Add payment status tracking

### Week 4: Frontend
16. [ ] Add branch selection UI
17. [ ] Add delivery address checker
18. [ ] Add order type selector
19. [ ] Update checkout flow
20. [ ] Add branch management dashboard
21. [ ] Add delivery zone editor

---

## Files to Modify (Summary)

### Backend
| File | Action |
|------|--------|
| `prisma/schema.prisma` | Major changes - add 6 models, modify 3 |
| `src/orders/orders.service.ts` | Add branch context, fee calculation |
| `src/orders/orders.controller.ts` | Add branch parameter |
| `src/public/public.service.ts` | Branch-aware menu, delivery preview |
| `src/tables/tables.service.ts` | Link to branch |
| `src/items/items.service.ts` | Branch price overrides |
| `src/app.module.ts` | Register new modules |

### Frontend
| File | Action |
|------|--------|
| `app/r/[slug]/page.tsx` | Add branch selection |
| `app/(dashboard)/layout.tsx` | Add branches nav |
| New: `app/(dashboard)/branches/*` | Branch management pages |
| New: `components/DeliveryChecker.tsx` | Delivery fee preview |
| New: `components/OrderTypeSelector.tsx` | Delivery/pickup/dine-in |

---

## Verification Plan

### API Testing
```bash
# Test branch creation
curl -X POST http://localhost:4000/branches \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Downtown", "slug": "downtown", ...}'

# Test delivery fee calculation
curl "http://localhost:4000/public/branches/{id}/delivery-fee?lat=30.05&lng=31.23"

# Test order with branch
curl -X POST http://localhost:4000/public/branches/{id}/orders \
  -d '{"items": [...], "deliveryAddress": {...}}'
```

### Frontend Testing
1. Open restaurant page with multiple branches
2. Select branch, choose delivery
3. Enter address, verify fee shown
4. Complete checkout
5. Verify order in admin dashboard shows fee breakdown

### Database Verification
```sql
-- Check migration
SELECT COUNT(*) FROM branches;
SELECT COUNT(*) FROM delivery_zones;

-- Check order has branch and fee snapshot
SELECT id, branch_id, delivery_fee_calculation
FROM orders
WHERE created_at > NOW() - INTERVAL '1 day';
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Data migration corrupts orders | Run on staging first, backup before prod |
| Float→Int conversion loses precision | Round carefully, verify totals match |
| Existing URLs break | Keep /r/[slug] working, redirect to default branch |
| Geocoding API costs | Cache results, use free tier initially |

---

## User Decisions

- **Data strategy:** Migrate existing data (preserve restaurants, convert to branches)
- **Starting point:** Database schema first
- **Geocoding:** Use OpenStreetMap/Nominatim (free, rate-limited)
- **Pricing strategy:** Hybrid (zones + distance fallback)
- **Currency handling:** Integer storage in smallest unit (cents/piasters)

## Geocoding Implementation

Using OpenStreetMap Nominatim API (free):
```typescript
// utils/geocoding.ts
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export async function geocodeAddress(address: string): Promise<{lat: number, lng: number}> {
  const response = await fetch(
    `${NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(address)}`,
    { headers: { 'User-Agent': 'Serveo/1.0' } }  // Required by Nominatim
  );
  const data = await response.json();
  if (data[0]) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  throw new Error('Address not found');
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Haversine formula for straight-line distance
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

**Rate Limiting:** Nominatim allows 1 request/second. We'll cache geocoded addresses in the database.
