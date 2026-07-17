# ✈️ AITinerary — AI Travel Planner

**AITinerary** is an AI-powered travel planning platform that combines conversational AI with interactive itinerary generation, maps, budgeting, and trip management. Describe your dream trip in plain language and get a structured day-by-day itinerary with real cost estimates, local tips, and interactive visuals.

Built for the hackathon, AITinerary showcases what's possible when you blend large language models with a modern geospatial UI — all without booking APIs, payments, or external travel integrations.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **AI Travel Copilot** | Conversational chat that plans trips, modifies itineraries, and answers travel questions |
| **AI-Powered Itinerary Generation** | Structured day-by-day plans with activities, costs, locations, and local tips |
| **Interactive Timeline Editor** | Drag-and-drop reorder, inline edit, add/delete activities per day |
| **Interactive Map** | MapLibre GL-based view showing all locations across the itinerary |
| **Budget Estimation** | Per-activity costs, daily totals, currency detection & conversion |
| **Saved Trips** | Persistent trip storage via Supabase with full itinerary data |
| **Conversation History** | Every AI chat session is saved and recallable |
| **User Travel Profile** | Personalized preferences (pace, budget, interests, food, transport) |
| **Multi-Destination Planning** | Route between multiple cities with transport mode recommendations |
| **Explore View** | Discover trending destinations curated by the platform |
| **Saved Places** | Bookmark restaurants, attractions, viewpoints, and more |
| **Feedback Form** | Multi-step feedback flow with type selection, star rating, and email follow-up |
| **Interactive Demo Modal** | Image preview with play button overlay that transitions to embedded video |
| **Dark Mode / Light Mode** | Theme toggle with persistent preference |
| **Responsive UI** | Optimized for mobile, tablet, and desktop |
| **Smart Currency Detection** | Auto-detects local currency from destination and shows home currency conversions |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | ^19.2.7 | UI framework |
| **TypeScript** | ~5.9.3 | Type safety |
| **Vite** | ^7.2.4 | Build tool and dev server |
| **Tailwind CSS** | ^4.1.18 | Utility-first styling |
| **TanStack Query** | ^5.101.2 | Server state and caching |
| **Framer Motion** | ^12.42.2 | Animations and transitions |
| **React Router** | ^7.18.1 | Client-side routing |
| **React Hook Form** | ^7.81.0 | Form management |
| **Zod** | ^4.4.3 | Schema validation |
| **Lucide React** | ^1.24.0 | Icon set |
| **clsx + tailwind-merge** | — | Class name utilities |
| **class-variance-authority** | ^0.7.1 | Component variants |

### Maps & Geospatial
| Technology | Purpose |
|---|---|
| **MapLibre GL JS** | ^5.24.0 | Interactive map rendering |
| **OpenStreetMap** | Tile data source (free, no API key) |
| **Nominatim API** | Geocoding — search locations and reverse geocode (free, no API key) |
| **Open FreeMap** | Raster/vector tile hosting |

### Backend & Database
| Technology | Purpose |
|---|---|
| **Supabase** | Auth, PostgreSQL database, real-time |
| **PostgreSQL** | ^17 | Relational database |
| **Supabase Edge Functions** | Deno-based serverless functions for AI calls |
| **Supabase Auth** | Email/password authentication |

### AI / ML
| Technology | Role |
|---|---|
| **Google Gemini** (gemini-3.1-flash-lite) | Primary AI provider — fast, free tier available |
| **Natively AI** (GPT-4o via API) | Fallback AI provider |

### Development
| Technology | Version |
|---|---|
| **Node.js** | 20 (Alpine) |
| **npm** | Bundle with Node |
| **Supabase CLI** | Local development and deployments |

---

## 📁 Project Structure

```
aitinerary/
├── public/                        # Static assets (logos, SVGs)
├── src/
│   ├── components/
│   │   ├── layout/                # AppShell, Header, Footer, ThemeToggle, ProfileMenu
│   │   └── ui/                    # Reusable UI primitives (Button, Card, Tabs, Badge, Dialog, etc.)
│   ├── constants/
│   │   └── config.ts              # AI config, Supabase config, site config, features, FAQs
│   ├── features/
│   │   ├── auth/                  # Login, Signup, Forgot Password forms
│   │   ├── dashboard/             # Dashboard — trip overview, stats, AI copilot, explore
│   │   ├── feedback/              # Feedback form — multi-step with type selection, rating
│   │   ├── landing/               # Landing page — Hero, Features, Pricing, Testimonials, FAQ
│   │   ├── notifications/         # Notification center
│   │   ├── onboarding/            # User profile setup wizard
│   │   ├── planner/               # Core trip planner — form, timeline, map, AI chat, explore
│   │   ├── profile/               # User profile page
│   │   ├── recommendations/       # AI-powered destination recommendations
│   │   ├── saved-places/          # Bookmarked places management
│   │   └── settings/              # App settings
│   ├── hooks/                     # Custom React hooks (useAuth, useTrips, useConversations, etc.)
│   ├── lib/                       # Core libraries (supabase client, AI service, geocoding, currency)
│   ├── providers/                 # React context providers (Auth, Theme, Query, Toast)
│   ├── types/                     # TypeScript type definitions (database, itinerary)
│   ├── App.tsx                    # Root app with routing
│   ├── main.tsx                   # Vite entry point
│   └── index.css                  # Tailwind CSS + design system tokens
├── supabase/
│   ├── functions/
│   │   └── generate-itinerary/    # Edge Function — AI itinerary generation & chat
│   │       ├── index.ts           # Main handler with Gemini + Natively fallback
│   │       └── deno.json          # Deno import map
│   └── migrations/                # Database migration files
│       ├── 002_add_phase2_features.sql
│       ├── 003_add_trip_destinations.sql
│       └── 004_add_feedback_table.sql
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite configuration
└── README.md                      # This file
```

---

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js 20+** (the project runs on `node:20-alpine`)
- **npm** (ships with Node.js)
- **A Supabase account** (free tier at [supabase.com](https://supabase.com)) — for database, auth, and edge functions
- **Supabase CLI** (optional, for local development) — install via `npm install -g supabase`
- **At least one AI provider API key** — either Google Gemini or Natively AI

---

## 🔧 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd aitinerary
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

The app currently has Supabase config hardcoded in `src/constants/config.ts` for the hackathon. To set up your own Supabase project, create a `.env` file:

```bash
touch .env
```

See the [Environment Variables](#-environment-variables) section below for all required values.

### 4. Set up Supabase

#### Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a name (e.g., "AITinerary") and select a region close to you.
3. Save your **project URL** and **anon key** from the project's API settings.

#### Apply database migrations

The simplest way is to run each migration file against your Supabase project via the SQL Editor in the Supabase Dashboard:

1. Open **SQL Editor** in your Supabase dashboard.
2. Copy and execute the contents of `supabase/migrations/002_add_phase2_features.sql`
3. Copy and execute the contents of `supabase/migrations/003_add_trip_destinations.sql`
4. Copy and execute the contents of `supabase/migrations/004_add_feedback_table.sql`

> **Note:** The `profiles` and `trips` tables are created by Supabase Auth triggers — migration 001 is auto-generated by the `supabase init` command. If these tables are missing, run the following first:
>
> ```sql
> CREATE TABLE IF NOT EXISTS public.profiles (
>   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
>   name TEXT DEFAULT '',
>   email TEXT DEFAULT '',
>   avatar_url TEXT DEFAULT '',
>   travel_style TEXT[] DEFAULT '{}',
>   budget_range TEXT DEFAULT '',
>   interests TEXT[] DEFAULT '{}',
>   created_at TIMESTAMPTZ DEFAULT now(),
>   updated_at TIMESTAMPTZ DEFAULT now()
> );
>
> CREATE TABLE IF NOT EXISTS public.trips (
>   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
>   destination TEXT NOT NULL DEFAULT '',
>   budget NUMERIC DEFAULT 0,
>   currency TEXT DEFAULT 'USD',
>   duration INT DEFAULT 3,
>   start_date DATE,
>   end_date DATE,
>   interests TEXT[] DEFAULT '{}',
>   itinerary_data JSONB,
>   created_at TIMESTAMPTZ DEFAULT now(),
>   updated_at TIMESTAMPTZ DEFAULT now()
> );
>
> CREATE TABLE IF NOT EXISTS public.conversations (
>   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
>   title TEXT DEFAULT 'New Chat',
>   summary TEXT DEFAULT '',
>   messages JSONB DEFAULT '[]',
>   message_count INT DEFAULT 0,
>   is_pinned BOOLEAN DEFAULT false,
>   is_archived BOOLEAN DEFAULT false,
>   created_at TIMESTAMPTZ DEFAULT now(),
>   updated_at TIMESTAMPTZ DEFAULT now()
> );
> ```

#### Set up Auth

1. Go to **Authentication → Providers** in the Supabase Dashboard.
2. Ensure **Email/Password** is enabled.
3. If you want to test the app in a preview environment (like NativelyAI), configure the redirect URLs. See [Troubleshooting](#-troubleshooting) below.

#### Deploy the Edge Function

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref ydrinzubpvfpgelwvrkd

# Deploy the generate-itinerary function
supabase functions deploy generate-itinerary

# Set the required secrets
supabase secrets set GEMINI_API_KEY=your_gemini_key_here
supabase secrets set NATIVELY_API_KEY=your_natively_key_here
```

Secrets can also be managed via the Supabase Dashboard under **Edge Functions → Secrets**.

### 5. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔐 Environment Variables

### Required — Frontend (Vite)

Create a `.env` file at the project root. Vite variables must be prefixed with `VITE_`.

| Variable | Purpose | Example Value | Required |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project API URL | `https://ydrinzubpvfpgelwvrkd.supabase.co` | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (publishable) key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Yes |

> **Note:** For the hackathon, these values are hardcoded in `src/constants/config.ts`. To use your own Supabase project, update that file or switch to `.env` variables.

### Required — Supabase Edge Function Secrets

These are set via `supabase secrets set` or the Supabase Dashboard. They never touch the browser.

| Secret | Purpose | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for primary AI provider | At least one of `GEMINI_API_KEY` or `NATIVELY_API_KEY` |
| `NATIVELY_API_KEY` | Natively AI / ML API key for fallback | At least one of `GEMINI_API_KEY` or `NATIVELY_API_KEY` |

### Getting API Keys

**Google Gemini (free):**
1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy the key — it starts with `AIza...`

**Natively AI:**
1. Go to [natively.xyz](https://natively.xyz) and create an account
2. Navigate to API keys and generate one

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server with HMR
npm run dev
```

The dev server starts at `http://localhost:5173`. The app uses Vite's optimized dev experience — changes reflect instantly.

> **Note:** The Edge Function (`generate-itinerary`) runs on Supabase's infrastructure, not locally. You don't need to run it locally — the frontend calls it via the Supabase project URL.

---

## 🗄️ Supabase Setup

### Project Details

| Property | Value |
|---|---|
| **Project Ref** | `ydrinzubpvfpgelwvrkd` |
| **Region** | `us-east-1` |
| **DB Host** | `db.ydrinzubpvfpgelwvrkd.supabase.co` |
| **PostgreSQL Version** | 17 |

### Architecture

```
┌─────────────┐     POST /functions/v1/generate-itinerary     ┌──────────────────────┐
│  Frontend   │ ────────────────────────────────────────────▶ │  Edge Function       │
│  (Vite)     │                                               │  (Deno)              │
│             │ ◀──────────────────────────────────────────── │                      │
│             │    200 { itinerary, provider, model }          │  ┌──────┐ ┌────────┐ │
│             │                                               │  │Gemini│ │Natively│ │
│             │     ┌────────────┐                            │  └──┬───┘ └───┬────┘ │
│             │     │ Supabase   │                            │     │ fallback │     │
│             │     │ Auth + DB  │                            └─────┴──────────┴─────┘
│             │     └────────────┘
└─────────────┘
```

### Edge Function: `generate-itinerary`

The function supports three modes:

| Mode | Purpose |
|---|---|
| `generate` | Creates a complete structured itinerary from form data |
| `chat` | Conversational travel assistant that outputs action blocks + itinerary data |
| `interactive` | Step-by-step wizard that asks one question at a time with clickable options |

**Provider fallback chain:** Gemini (primary) → Natively AI (fallback) → error

### Database Tables

| Table | Purpose |
|---|---|
| `profiles` | User preferences, travel style, onboarding status |
| `trips` | Saved trips with itinerary data (JSONB) |
| `trip_destinations` | Multi-destination mapping (order, nights per city) |
| `conversations` | AI chat history with message arrays |
| `saved_places` | Bookmarked locations with type, tags, ratings |
| `collections` | Groups of saved places |
| `notifications` | In-app notifications |
| `ai_memory` | Key-value store for AI context about users |
| `ai_suggestions` | AI-generated recommendations per user/trip |
| `feedback` | User-submitted feedback with type, rating, and follow-up contact |

All tables have Row-Level Security (RLS) enabled — users can only access their own data. The `feedback` table is the exception: anyone (authenticated or anonymous) can insert, but only admins and the submitting user can view.

---

## 🏗️ Building

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

The build output goes to `dist/` and is ready for deployment to any static hosting provider.

---

## 🌐 Deployment

### Vercel (recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --build --prod
```

Make sure to set the environment variables in the Netlify Dashboard under **Site Settings → Environment Variables**.

### Manual

Upload the contents of the `dist/` folder to any static hosting provider (GitHub Pages, Cloudflare Pages, AWS S3, etc.).

> **Important:** If deploying to a custom domain or subpath, update `index.html` and `vite.config.ts` to use the correct base path.

---

## 👤 Demo Credentials

The app uses **email/password authentication** via Supabase Auth. No demo account is pre-configured.

### Creating a Test Account

1. Open the app at your deployed URL (or `http://localhost:5173`)
2. Click **Get Started** or navigate to `/signup`
3. Enter any email and password (min 6 characters)
4. You'll be logged in automatically and redirected to the dashboard

---

## 🎯 Example User Flow

Here's a complete walkthrough suitable for a hackathon demo (2–3 minutes):

```
1. Sign Up
   └─ Navigate to /signup, create account with email/password

2. Complete Travel Profile
   └─ "Complete My Profile" banner → Set travel style, budget, pace, interests

3. Dashboard
   └─ Shows stats (Total Trips, Days Planned, Saved Places, Memories)
   └─ Quick Actions: New Trip, Explore, Travel Copilot

4. Open Travel Copilot
   └─ Click "Travel Copilot" card
   └─ Type: "Plan a one-day solo trip to Chennai"
   └─ AI asks clarifying questions → answers processing

5. AI Generates Itinerary
   └─ Timeline view populates automatically
   └─ Map markers appear with locations
   └─ Budget calculated per activity and total
   └─ Success card with checkmarks
   └─ Trip saved automatically

6. Explore the Timeline
   └─ Switch between days
   └─ Toggle between Timeline tab and Map View tab

7. Open Full Planner
   └─ Click "Open Full Planner" button
   └─ Edit activities inline (time, title, cost)
   └─ Drag-and-drop reorder activities

8. Refine with Copilot
   └─ "Make it cheaper" or "Add more food spots"
   └─ Timeline and map update in-place

9. Save & Return
   └─ Trips persist in Supabase
   └─ Reload the dashboard → trip appears in "Your Trips" section
```

---

## ⚠️ Known Limitations

| Limitation | Explanation |
|---|---|
| **No booking APIs** | The app generates itineraries but cannot book flights, hotels, or activities |
| **No payment integration** | Budgets are estimated — no actual payments or reservations |
| **No offline mode** | An internet connection is required for AI generation and map tiles |
| **No collaborative planning** | Multi-user trip editing is not yet implemented |
| **Single AI model per phase** | Gemini 3.1 Flash Lite is fast but may not match GPT-4 quality on complex routing |
| **Geocoding rate limit** | Nominatim limits to 1 request/second — batch operations may be slow |
| **No social media import** | Cannot parse Instagram Reels or YouTube videos into itineraries yet |
| **No mobile app** | The responsive web app works on mobile but there's no native iOS/Android build |

---

## 🗺️ Roadmap

- [x] **Phase 1** — Core trip planning with AI itinerary generation
- [x] **Phase 2** — Saved places, notifications, AI memory, user profiles
- [x] **Phase 3** — AI Travel Copilot, interactive chat, inline preview
- [ ] **Phase 4** — Social media to itinerary (paste a reel, get a plan)
- [ ] **Phase 5** — Booking integrations (hotel, flight, activity APIs)
- [ ] **Phase 6** — Collaborative trip planning (share, edit with friends)
- [ ] **Phase 7** — AI travel companion (real-time recommendations during trip)
- [ ] **Phase 8** — Offline mode, Progressive Web App (PWA)

---

## 🔍 Troubleshooting

### "All AI providers failed" error

The Edge Function needs at least one API key configured.

1. Open your Supabase Dashboard → **Edge Functions** → `generate-itinerary`
2. Click **Secrets** and verify `GEMINI_API_KEY` and/or `NATIVELY_API_KEY` are set
3. If set, check the keys are valid and have quota remaining

### "You must be logged in" error

The Edge Function requires a valid Supabase JWT. Make sure:
- You are signed in (check `localStorage` for a `supabase.auth.token`)
- The token hasn't expired (Supabase tokens expire after 1 hour by default)
- Auth is properly configured in your Supabase project

### Edge Function returns 401

This can happen if redirect URLs aren't configured for the preview domain.

In your Supabase Dashboard, go to **Authentication → URL Configuration** and add these redirect URL patterns for NativelyAI preview environments:
- `https://*.nativelyai.app/**`
- `https://**.webcontainer-api.io/**`

### Build fails with "Cannot find module"

Run `npm install` again. If the issue persists, delete `node_modules` and `package-lock.json`, then reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Map tiles not loading

The app uses Open FreeMap's free tile service. If tiles are blank, check your browser's network tab — Open FreeMap has generous usage limits but some ad-blockers may block tile requests. The map should work in most browsers without any API key.

### "VITE_SUPABASE_URL" not found

If switching from the hardcoded config to environment variables, ensure:
1. A `.env` file exists at the project root
2. Variables are prefixed with `VITE_`
3. The dev server was restarted after creating the file

### Exchange rate API fails

The app uses `open.er-api.com` (free, no key required). It's updated daily and cached for 30 minutes. If it's down, cached rates are used. Eventually the cache expires and costs will show as raw numbers without conversion.

---

## 📄 License

This project is created for **hackathon purposes**. No license specified — all rights reserved unless otherwise noted.

---

## 🤝 Contributing

This is a hackathon project and is not actively maintained for public contributions. However, feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Development Tips

- Keep the codebase clean — no dead code or unused imports
- Follow the existing patterns for hooks, components, and styling
- Use the Tailwind CSS design tokens defined in `src/index.css` (`--color-primary`, `--color-muted`, etc.)
- Test RLS policies when adding new database tables
- Use `search_docs` or the Supabase docs before adding new backend features

---

## 🏆 Hackathon Notes

Built for the NativelyAI hackathon. The app demonstrates:

- **Conversational AI** that understands travel intent and generates structured data
- **Multi-modal UI** — same data rendered as timeline, map, and budget simultaneously
- **Zero-cost infrastructure** — Supabase free tier, Gemini free tier, OpenStreetMap free tiles
- **Production-quality UX** — Framer Motion animations, drag-and-drop, dark/light mode
- **Works end-to-end** — from signup → AI chat → itinerary → interactive editing → persistence

---

*Made with ⚡ by the AITinerary team*
