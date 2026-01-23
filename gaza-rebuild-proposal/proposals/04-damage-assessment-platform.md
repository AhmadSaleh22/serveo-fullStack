# Damage Assessment & Reconstruction Mapping Platform
## Priority: P1 (Critical for Planning)

---

## The Problem

Reconstruction requires data we don't have:
- No comprehensive map of what's destroyed
- Unknown number of buildings affected
- Land ownership records destroyed
- No way to prioritize reconstruction
- Multiple organizations rebuilding without coordination
- Disputes over property boundaries
- No tracking of reconstruction progress

**An engineer arrives to rebuild a school, but discovers three other organizations already started. Meanwhile, a destroyed hospital has no one assigned.**

---

## The Solution: "Bina" (بناء) - Reconstruction Platform

A unified mapping and coordination platform for rebuilding Gaza.

### Core Modules:

#### 1. Damage Mapping
- Satellite imagery analysis
- Crowdsourced damage reports
- Categorize damage levels
- Generate comprehensive damage database

#### 2. Property Registry
- Restore land ownership records
- Crowdsource boundary documentation
- Dispute resolution system
- Legal verification process

#### 3. Reconstruction Coordination
- Assign buildings to organizations
- Track reconstruction status
- Prevent duplication of effort
- Resource allocation

#### 4. Progress Monitoring
- Before/after imagery
- Milestone tracking
- Public transparency dashboard
- Donor reporting

#### 5. Priority Scoring
- Algorithm to prioritize reconstruction
- Based on: criticality, population served, feasibility
- Input from community

---

## Damage Classification System

### Damage Levels:
```
Level 1: Minor Damage (Repairable)
- Broken windows, doors
- Minor structural cracks
- Cosmetic damage
- Estimated repair: < $5,000

Level 2: Moderate Damage (Major Repair)
- Significant structural damage
- Partial collapse
- Major systems damaged
- Estimated repair: $5,000 - $50,000

Level 3: Severe Damage (Reconstruction Required)
- Majority of structure collapsed
- Foundation compromised
- Not safe to repair
- Estimated rebuild: $50,000+

Level 4: Complete Destruction
- Building no longer exists
- Rubble only
- Full reconstruction needed
- Estimated rebuild: Full cost
```

### Building Categories:
```
Critical Infrastructure:
- Hospitals
- Schools
- Water treatment
- Power stations
- Government buildings

Residential:
- Single family homes
- Apartment buildings
- Shelters

Commercial:
- Markets
- Shops
- Offices

Religious/Cultural:
- Mosques
- Churches
- Historical sites
```

---

## Mapping Interface

### Public Map View:
```
┌─────────────────────────────────────────────────────────┐
│  Gaza Reconstruction Map                                 │
│  ══════════════════════════════════════════════════════ │
│                                                          │
│  Legend:                                                 │
│  🔴 Destroyed  🟠 Severe  🟡 Moderate  🟢 Minor  ⬜ OK  │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                  │    │
│  │     [Interactive Map of Gaza]                   │    │
│  │                                                  │    │
│  │     🔴🔴🔴⬜⬜🟠🟠🔴🔴🔴                          │    │
│  │     🔴🟠⬜⬜⬜⬜🟠🔴🔴🔴                          │    │
│  │     🟠⬜⬜⬜⬜⬜⬜🟠🔴🔴                          │    │
│  │     ⬜⬜⬜🟢⬜⬜⬜⬜🟠🔴                          │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Statistics:                                             │
│  • Total Buildings Assessed: 45,234                     │
│  • Destroyed: 12,456 (28%)                              │
│  • Severe Damage: 8,234 (18%)                           │
│  • Moderate Damage: 6,789 (15%)                         │
│  • Minor/None: 17,755 (39%)                             │
│                                                          │
│  [Report Damage] [View Details] [Download Data]         │
└─────────────────────────────────────────────────────────┘
```

### Damage Report Form:
```
Report Building Damage
━━━━━━━━━━━━━━━━━━━━━

Location: [Pin on map or enter address]
Building Type: [Dropdown: Residential/Commercial/etc.]
Damage Level: [1-4 scale with descriptions]
Description: [Text field]
Photos: [Upload up to 5 photos]
Owner/Contact: [Optional]
Your Contact: [For verification]

[Submit Report]
```

---

## Property Registry System

### The Challenge:
- Municipal records destroyed
- Deeds lost in bombings
- Boundary disputes common
- Multiple claims on same property

### Solution: Community-Verified Registry

#### Step 1: Crowdsource Boundaries
```
1. Property owner registers claim
2. Uploads any documentation (old deeds, photos, utility bills)
3. Draws approximate boundary on map
4. Lists witnesses (neighbors, family)
```

#### Step 2: Neighbor Verification
```
1. Adjacent property owners notified
2. They confirm or dispute boundary
3. Disputes flagged for mediation
4. Agreements recorded
```

#### Step 3: Community Validation
```
1. Local mukhtar (community leader) reviews
2. Community members can comment
3. Historical evidence considered
4. Final registration issued
```

#### Step 4: Legal Integration
```
1. Municipality reviews verified claims
2. Cross-reference with surviving records
3. Issue temporary ownership certificates
4. Full legal process when possible
```

---

## Reconstruction Coordination

### Assignment System:
```
Building: Al-Shifa Hospital - Ward B
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Damage Level: 4 (Complete Destruction)
Priority Score: 98/100
Category: Critical Infrastructure

Assigned To: WHO + Ministry of Health
Start Date: 2025-01-15
Target Completion: 2025-06-30
Budget: $2.5M
Status: Planning Phase

Milestones:
☑ Site assessment complete
☐ Rubble cleared
☐ Foundation laid
☐ Structure complete
☐ Systems installed
☐ Final inspection
☐ Operational

[Update Progress] [View Documents] [Contact Team]
```

### Prevent Duplication:
```
⚠️ Warning: This building already assigned

Building: Al-Nour School
Current Assignment: UNICEF (since Dec 1, 2024)
Status: Foundation phase

Options:
• Contact assigned organization
• Request collaboration
• Find alternative project
```

---

## Priority Scoring Algorithm

```python
def calculate_priority(building):
    score = 0

    # Criticality (40 points max)
    if building.type == 'hospital':
        score += 40
    elif building.type == 'school':
        score += 35
    elif building.type == 'water_facility':
        score += 38
    elif building.type == 'power_station':
        score += 36
    elif building.type == 'residential':
        score += 20 + (building.units * 0.5)  # More units = higher priority

    # Population Impact (30 points max)
    population_served = estimate_population(building)
    score += min(30, population_served / 100)

    # Damage Level (20 points max)
    # Counter-intuitive: moderate damage = higher priority (quicker to fix)
    if building.damage_level == 2:
        score += 20  # Fixable with big impact
    elif building.damage_level == 3:
        score += 15
    elif building.damage_level == 4:
        score += 10  # Major rebuild = longer timeline

    # Feasibility (10 points max)
    if building.has_clear_ownership:
        score += 5
    if building.has_access_route:
        score += 3
    if building.materials_available:
        score += 2

    return score
```

---

## Technical Implementation

### Data Sources:
1. **Satellite Imagery**: Before/after comparison, AI damage detection
2. **Drone Surveys**: High-resolution local mapping
3. **Crowdsourced Reports**: Community damage reports
4. **Historical Records**: Surviving municipal data
5. **Utility Records**: Electric, water connection data

### Technology Stack:
```
Frontend: React + Mapbox GL
Backend: Node.js + Express
Database: PostgreSQL + PostGIS
Image Storage: S3-compatible (MinIO)
AI/ML: TensorFlow for damage detection
Mobile: React Native
Offline: PouchDB sync
```

### Architecture:
```
┌───────────────────────────────────────────────────┐
│                   Users                            │
│  (Citizens, NGOs, Government, Donors)             │
└──────────────────────┬────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   Web/Mobile    │
              │   Application   │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │   API Gateway   │
              └────────┬────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
┌───▼───┐        ┌─────▼─────┐      ┌─────▼─────┐
│ Map   │        │ Building  │      │ Property  │
│ Tiles │        │ Registry  │      │ Registry  │
└───────┘        └───────────┘      └───────────┘
                       │
              ┌────────▼────────┐
              │   PostGIS DB    │
              │   (Geospatial)  │
              └─────────────────┘
```

---

## Data Model

```sql
-- Buildings
buildings (
  id,
  geom GEOMETRY(POLYGON),
  address, neighborhood, city,
  building_type, floors, units,
  damage_level, damage_description,
  assessed_date, assessed_by,
  photos, -- JSON array of URLs
  reconstruction_status,
  assigned_organization_id,
  priority_score,
  created_at, updated_at
)

-- Property Claims
property_claims (
  id, building_id,
  claimant_name, claimant_id,
  claim_type, -- owner, tenant, heir
  documentation, -- JSON array of document URLs
  witnesses, -- JSON array
  status, -- pending, verified, disputed, rejected
  verified_by, verified_at
)

-- Reconstruction Projects
reconstruction_projects (
  id, building_id,
  organization_id,
  budget, funding_source,
  start_date, target_end_date, actual_end_date,
  status, current_phase,
  milestones, -- JSON array
  updates, -- JSON array of progress updates
)

-- Damage Reports (Crowdsourced)
damage_reports (
  id,
  location GEOMETRY(POINT),
  building_id, -- linked after verification
  damage_level, description,
  photos,
  reporter_contact,
  verified, verified_by,
  created_at
)
```

---

## Implementation Timeline

### Phase 1: Mapping Foundation (Week 1-4)
- [ ] Set up mapping infrastructure
- [ ] Import available satellite imagery
- [ ] Build damage report interface
- [ ] Create basic building registry

### Phase 2: Crowdsourcing (Week 5-8)
- [ ] Launch public damage reporting
- [ ] Mobile app for field assessment
- [ ] Verification workflow
- [ ] Property claim system

### Phase 3: Coordination (Week 9-12)
- [ ] Organization registration
- [ ] Project assignment system
- [ ] Progress tracking
- [ ] Duplication prevention

### Phase 4: Analytics (Week 13-16)
- [ ] Priority scoring
- [ ] Reconstruction dashboards
- [ ] Donor reporting
- [ ] Public transparency portal

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Buildings assessed | 100% of affected areas |
| Assessment accuracy | 90%+ |
| Property claims resolved | 80% within 6 months |
| Reconstruction projects tracked | 100% |
| Duplication incidents | < 5% |

---

## Why This Matters

**Without this system:**
- No one knows the full extent of damage
- Property disputes delay reconstruction
- Organizations duplicate efforts or miss areas
- No accountability for reconstruction funds
- Years of chaos and inefficiency

**With this system:**
- Clear picture of what needs rebuilding
- Fair and transparent property resolution
- Coordinated, efficient reconstruction
- Donor confidence and accountability
- Faster return to normalcy

---

**Rebuilding requires knowing what was lost. This system provides that foundation.**
