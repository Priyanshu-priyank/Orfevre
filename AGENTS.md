# GramSphere — Codex Context File

This file gives Codex full context about the GramSphere project so it can assist effectively during development.

---

## What This Project Is

GramSphere is a community economic intelligence platform built for rural and semi-urban India. It connects three types of users — unemployed youth, small vendors/artisans, and district officials — within the same local ecosystem. The platform makes informal economic activity visible, matchable, and actionable using Google Gemini as the core AI layer.

Built for: GDG Hackathon (36 hours)
Domain: Community Economic Development
Primary AI: Google Gemini API

---

## Project Structure

```
gramsphere/
├── frontend/               # React + Tailwind (Person 2)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Shared entry point — renders role-based UI
│   │   │   ├── Onboarding.jsx       # Language select + role select on first launch
│   │   │   └── NotFound.jsx
│   │   ├── views/                   # Role-specific views rendered inside Dashboard
│   │   │   ├── YouthView.jsx        # SkillFlow user journey
│   │   │   ├── VendorView.jsx       # BazaarPulse + StartSmart
│   │   │   └── OfficialView.jsx     # GramLens dashboard
│   │   ├── components/
│   │   │   ├── VoiceInput.jsx       # Mic button + recording state
│   │   │   ├── LanguageSelector.jsx # Regional language picker
│   │   │   ├── ResultCard.jsx       # Generic output card (reused across all views)
│   │   │   ├── WhatsAppCard.jsx     # Shareable product card generator
│   │   │   ├── SkillTokenBadge.jsx  # Reputation badge display
│   │   │   └── ClusterMap.jsx       # Leaflet.js map component
│   │   └── App.jsx
├── backend/                # Node.js + Express (Person 1 + 3)
│   ├── routes/
│   │   ├── skillflow.js             # Skill matching endpoints
│   │   ├── bazaarpulse.js           # Demand insight endpoints
│   │   ├── startsmart.js            # Business idea endpoints
│   │   └── gramlens.js              # Dashboard data endpoints
│   ├── services/
│   │   ├── gemini.js                # All Gemini API calls
│   │   ├── speechToText.js          # Google Speech-to-Text
│   │   ├── clusterGraph.js          # Graph logic + trust scoring
│   │   └── skillToken.js            # Badge generation logic
│   ├── firebase.js                  # Firestore init + helpers
│   └── server.js
└── AGENTS.md               # This file
```

---

## Core Modules

### SkillFlow
Youth user speaks their skills and location in their regional language. Gemini extracts structured data, matches them to nearby vendors or gigs, and returns results in their language. Completed gigs generate a Skill Token (reputation badge) stored in Firestore.

**Key flow:** Voice input → Speech-to-Text → Gemini skill extraction → Firestore query for nearby matches → Return results in user language

### BazaarPulse
Vendor inputs inventory (text or voice) and optionally uploads a product photo. Gemini analyzes local demand patterns from the cluster graph and returns demand suggestions. Photo + voice note generates a WhatsApp-shareable product card.

**Key flow:** Photo + voice → Gemini Vision + text → Product listing generated → Demand suggestions from cluster data → WhatsApp card exported as image

### StartSmart
User describes their situation (skills, budget, local context) via voice. Gemini reasons over this plus local demand data and suggests 2–3 viable micro-business ideas with rough next steps.

**Key flow:** Voice input → Gemini reasoning with local context → 2–3 structured business ideas returned

### GramLens
District officer dashboard showing real community activity. Pulls aggregated data from Firestore (gigs completed, products listed, skills active) and displays on a Leaflet.js cluster map. Highlights low-activity vs growing areas.

**Key flow:** Firestore aggregation → Map visualization → Pattern highlighting

---

## Cluster Economy Graph

Not a formal graph database — implemented as an adjacency-list structure in Firestore. Every user interaction (gig completed, product sold, skill transferred) writes an edge to the graph collection. The graph powers:
- Matching in SkillFlow (who is connected to whom nearby)
- Demand signals in BazaarPulse (what is selling in this cluster)
- Trust scoring (how many verified connections does this user have)
- GramLens insights (which nodes are most active / most at risk)

**Firestore collections:**
- `users` — user profiles with skills, location, role, trust score
- `interactions` — every gig, sale, skill event (the graph edges)
- `skillTokens` — issued badges with issuer, recipient, skill, timestamp
- `inventory` — vendor product listings
- `clusterSnapshot` — aggregated weekly stats per geographic cluster

---

## Gemini API Usage

All Gemini calls go through `backend/services/gemini.js`. Never call Gemini directly from the frontend.

### Prompt patterns used

**Skill extraction (SkillFlow):**
```
System: You are a skill extraction assistant for a rural employment platform in India.
Extract skills and location from the user's voice input.
Respond only in JSON: { skills: [], location: "", language: "" }
User: [transcribed voice input]
```

**Job matching (SkillFlow):**
```
System: Given these skills and this location, match from the following list of local opportunities.
Respond in [user's language]. Be simple and direct.
User: skills: [...], location: "...", opportunities: [...]
```

**Demand insights (BazaarPulse):**
```
System: You are a demand advisor for small vendors in rural India.
Given the vendor's inventory and recent local sales data, suggest what to produce more of,
what to discount, and when to push offers. Keep it simple. Respond in [user's language].
User: inventory: [...], recent cluster sales: [...]
```

**Product listing (BazaarPulse):**
```
System: Generate a product listing from the vendor's photo description and voice note.
Return JSON: { title: "", description: "", suggestedPrice: "", tags: [] }
Respond in both English and [user's language].
User: photo_description: "...", voice_note: "..."
```

**Business ideas (StartSmart):**
```
System: Suggest 2-3 practical micro-business ideas for someone in rural India.
Base suggestions on their skills, budget, and what is in demand locally.
Keep suggestions realistic and actionable. Respond in [user's language].
User: skills: [...], budget: "...", local_demand: [...], location: "..."
```

---

## Language Handling

Supported languages: Hindi (`hi`), Kannada (`kn`), Tamil (`ta`), Telugu (`te`), Marathi (`mr`), English (`en`)

- Language is selected once on the language selector screen and stored in React state + passed as a parameter to all API calls
- All Gemini prompts include `respond in [language]` instruction
- Speech-to-Text is initialized with the selected language code
- The `language` param must be passed in every API request body — backend should never assume English

---

## Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| Frontend | React + Tailwind | Mobile-first, max-width phone size |
| Backend | Node.js + Express | REST APIs only |
| AI | Google Gemini API | All calls server-side only |
| Voice | Web Speech API + Google Speech-to-Text | Web Speech for browser, GCP for accuracy |
| Database | Firebase Firestore | Flexible schema, fast setup |
| Maps | Leaflet.js | Free, no API key needed for basic use |
| Hosting | Google Cloud Run | Containerized deployment |
| Auth | Firebase Auth | Multi-role: youth / vendor / official |

---

## Environment Variables

```env
GEMINI_API_KEY=
GOOGLE_CLOUD_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=
SPEECH_TO_TEXT_API_KEY=
PORT=8080
```

Never commit these. Use `.env` locally, Google Cloud Secret Manager in production.

---

## Coding Conventions

- **Mobile-first always** — all UI designed for 375px width first
- **No English hardcoded in UI strings** — use a language map object, never inline text
- **All Gemini calls are async/await** — always wrap in try/catch with a meaningful fallback response, never let a Gemini failure crash the UI silently
- **ResultCard is reused** across all three views — keep it generic, never add view-specific logic to it
- **Voice input component** must handle three states: idle, recording, processing
- **No business logic in frontend** — all matching, scoring, and AI calls go through backend
- **Error handling on every API route** — every Express route must have a try/catch and return a consistent `{ error: true, message: "..." }` shape so the frontend always knows what to expect
- **Log meaningfully, not noisily** — `console.error` on every caught exception with the route name and input shape; `console.log` only for significant state changes (user matched, token issued, graph edge written). Remove all debug logs before demo.
- **Role is set at login** — `Dashboard.jsx` reads role from Firebase Auth claims and renders the correct view; never pass role as a URL param or query string
- **Seed data lives in** `backend/seed.js` — run before demo to populate Firestore

---

## Demo Data

Before the pitch, run `node backend/seed.js` to populate Firestore with:
- 15 fake users across three roles (5 youth, 7 vendors, 3 officials)
- 30 fake interactions (gigs, sales, skill events) to make the cluster map look alive
- 10 skill tokens distributed among youth users
- 3 geographic clusters with distinct Cluster Velocity Scores

The demo should show: a youth speaks in Kannada → gets matched to a local tailor → map updates → Cluster Velocity Score ticks up.

---

## Known Constraints (36-hour hackathon)

- Micro-credit feature is **not built** — mention as future vision only
- Cluster graph is simplified — adjacency list in Firestore, not a full graph DB
- Speech-to-Text accuracy may vary — have a text fallback input on every voice screen
- WhatsApp card export is a static image download — no actual WhatsApp API integration
- GramLens dashboard uses seeded data — real aggregation is wired but lightly tested

---

## What Makes This Different

When a judge asks "why not just use Naukri or Google Business Profile?" — the answer is:

1. Those platforms require English, forms, and digital literacy this audience doesn't have
2. They treat each person as an isolated user — GramSphere treats the whole community as a connected network
3. The cluster graph means the platform gets smarter as more people use it — it learns what's working locally
4. All three user types (youth, vendor, official) are on the same platform, feeding the same picture — solving one supports the others
