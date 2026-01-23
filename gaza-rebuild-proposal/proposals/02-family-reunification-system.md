# Family Reunification & Missing Persons System
## Priority: P0 (Immediate)

---

## The Problem

The war has torn families apart:
- Parents separated from children during evacuations
- Elderly left behind when families fled
- No central database of who is where
- Hospitals have unidentified injured
- Morgues have unidentified bodies
- Families searching desperately with no information

**A father in Khan Younis doesn't know if his son who was in Gaza City is alive or dead. He has no way to find out.**

---

## The Solution: "Liqa" (لقاء) - Reunification Platform

A platform to register, search, and reunite separated families.

### Core Features:

#### 1. Person Registration
- Anyone can register themselves or someone they're looking for
- Basic info: Name, age, photo, last known location
- Physical description for identification
- Medical conditions (for hospital matching)

#### 2. Search Capabilities
- Search by name (with Arabic fuzzy matching)
- Search by location (last seen)
- Search by physical description
- Search by age range
- Photo matching (AI-assisted)

#### 3. Hospital Integration
- Hospitals register unidentified patients
- Automatic matching with missing persons reports
- Notification when potential match found

#### 4. Shelter Registration
- All shelters register residents
- Automatic cross-reference with missing persons
- Privacy controls (some may be hiding for safety)

#### 5. Deceased Identification
- Dignified handling of unidentified deceased
- DNA sample coordination
- Photo identification (with consent)

#### 6. Communication Hub
- When match found, facilitate safe contact
- Don't reveal location without consent
- Support for domestic violence survivors

---

## User Flows

### For Someone Searching:
```
1. Go to website or call hotline
2. Register person you're looking for
   - Name, age, photo
   - Last known location
   - Any identifying features
3. System searches existing database
4. If match: notification sent
5. If no match: alert created for future matches
6. Receive SMS if match found later
```

### For Someone Registering Themselves:
```
1. Register at shelter, hospital, or online
2. Provide: Name, original location, family contacts
3. System checks if anyone is looking for you
4. If match: notification sent to both parties
5. Choose whether to share your location
```

### For Hospitals:
```
1. Register unidentified patient
2. Add photo, physical description, medical info
3. System searches for matches
4. If match: contact listed family
5. Update status (discharged, transferred, deceased)
```

### For Shelters:
```
1. Bulk register all residents
2. Daily sync with central database
3. Receive alerts for potential matches
4. Facilitate reunification
```

---

## Technical Implementation

### Multi-Channel Access
```
┌─────────────────────────────────────────────────┐
│                   Users                          │
└──────┬──────────────┬──────────────┬────────────┘
       │              │              │
   ┌───▼───┐    ┌─────▼─────┐   ┌────▼────┐
   │ Web   │    │  SMS/USSD │   │ Hotline │
   │ App   │    │  Gateway  │   │ (Voice) │
   └───┬───┘    └─────┬─────┘   └────┬────┘
       │              │              │
       └──────────────┼──────────────┘
                      │
              ┌───────▼───────┐
              │  Central API  │
              │  (Node.js)    │
              └───────┬───────┘
                      │
       ┌──────────────┼──────────────┐
       │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
│ PostgreSQL  │ │ Redis     │ │ Elasticsearch│
│ (Data)      │ │ (Cache)   │ │ (Search)     │
└─────────────┘ └───────────┘ └──────────────┘
```

### SMS Registration Flow
```
User sends: FIND محمد احمد غزة
System replies: تم تسجيل البحث. الرقم المرجعي: 12345. سنتواصل معك عند وجود معلومات.

User sends: REGISTER أحمد محمود خانيونس
System replies: تم تسجيلك. هل تبحث عائلتك عنك؟ سنتحقق ونتواصل معك.
```

### Data Model
```sql
-- Missing Persons
missing_persons (
  id, reported_by_id,
  name, age_approx, gender,
  photo_url, physical_description,
  last_known_location, last_seen_date,
  medical_conditions, identifying_marks,
  status, -- searching, found_alive, found_deceased, closed
  created_at, updated_at
)

-- Found/Registered Persons
registered_persons (
  id, name, age, gender,
  photo_url, current_location_type, -- shelter, hospital, private
  current_location_id,
  original_location,
  share_location, -- privacy control
  contact_method,
  created_at
)

-- Matches
matches (
  id, missing_person_id, registered_person_id,
  match_score, match_type, -- name, photo, location
  verified, verified_by,
  reunification_status,
  created_at
)

-- Search Alerts
search_alerts (
  id, missing_person_id,
  notify_phone, notify_method,
  active
)
```

### Fuzzy Arabic Name Matching
```javascript
// Handle common Arabic name variations
function normalizeArabicName(name) {
  return name
    .replace(/[أإآا]/g, 'ا')  // Normalize alef
    .replace(/[ىي]/g, 'ي')   // Normalize ya
    .replace(/ة/g, 'ه')      // Ta marbuta
    .replace(/[ًٌٍَُِّْ]/g, '') // Remove tashkeel
    .trim();
}

// Fuzzy match score
function matchScore(name1, name2) {
  const n1 = normalizeArabicName(name1);
  const n2 = normalizeArabicName(name2);
  return levenshteinSimilarity(n1, n2);
}
```

---

## Privacy & Safety Considerations

### For Domestic Violence Survivors
- Option to register without sharing location
- Verification before revealing information
- Trained staff for sensitive cases

### For General Privacy
- Location shared only with consent
- Data encrypted at rest
- Access logs for all searches
- Data retention policy (delete after reunification)

### Against Exploitation
- Verification of searcher identity
- Rate limiting on searches
- Flag suspicious patterns
- Human review for sensitive matches

---

## Partnerships Required

| Organization | Role |
|--------------|------|
| ICRC (Red Cross) | Existing family tracing expertise |
| UNRWA | Shelter data, distribution network |
| Palestinian Red Crescent | Hospital data, emergency response |
| Ministry of Health | Hospital coordination |
| Gaza Municipality | Central coordination |
| Telecom (Jawwal/Ooredoo) | SMS gateway, data |

---

## Implementation Timeline

### Week 1-2: Core Platform
- [ ] Database design and setup
- [ ] Basic web registration form
- [ ] Simple search functionality
- [ ] Admin dashboard

### Week 3-4: Multi-Channel
- [ ] SMS registration and search
- [ ] Voice hotline with IVR
- [ ] Hospital integration API
- [ ] Shelter bulk upload

### Week 5-6: Intelligence
- [ ] Fuzzy name matching
- [ ] Photo comparison (basic)
- [ ] Automatic match suggestions
- [ ] Notification system

### Week 7-8: Scale
- [ ] Partner organization access
- [ ] Reporting and analytics
- [ ] Mobile app for field workers
- [ ] API for integration

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Persons registered | 50,000+ |
| Searches performed | 100,000+ |
| Successful reunifications | 5,000+ |
| Average time to match | < 48 hours |
| False positive rate | < 5% |

---

## Similar Systems (Learn From)

1. **ICRC Family Links** - International standard
2. **Google Person Finder** - Disaster response
3. **Facebook Safety Check** - Mass notification
4. **NamUs (USA)** - Missing persons database

---

## The Human Impact

**Story 1:**
Um Khalil, 67, was separated from her grandchildren when their building was bombed. She fled south alone. Three weeks later, through Liqa, she found them in a Rafah shelter. They thought she was dead.

**Story 2:**
A 4-year-old was found wandering alone near Al-Shifa hospital. Through the system, he was matched with his uncle who had been searching for days. His parents didn't survive.

**Story 3:**
Ahmed registered himself at a shelter. Within hours, his mother in Egypt received an SMS that he was alive. She hadn't slept in a week.

---

## Call to Action

Every day without this system is another day of uncertainty, grief, and despair for separated families.

**This can be built in 4 weeks. Let's start now.**
