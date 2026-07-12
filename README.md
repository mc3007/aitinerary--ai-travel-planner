# ✈️ AITinerary — AI-Powered Travel Planner

> **Plan smarter. Travel better.**

AITinerary is an AI-powered travel planning platform that combines conversational AI with interactive itinerary generation, maps, budgeting, and trip management.

Simply describe your trip in natural language, and AITinerary generates a personalized day-by-day itinerary complete with maps, estimated costs, and editable activities.

Built as a hackathon project to showcase how conversational AI can power the next generation of travel planning.

---

# 🚀 Features

- 🤖 AI Travel Copilot
- 🗺️ Interactive Map (MapLibre + OpenStreetMap)
- 📅 Editable Timeline
- 💰 Smart Budget Estimation
- 👤 Personalized Travel Profiles
- 💬 AI Conversation History
- 📍 Multi-Destination Planning
- ⭐ Saved Trips
- 🌙 Dark / Light Mode
- 📱 Responsive UI

---

# 🛠 Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Framer Motion

## Backend

- Supabase
- PostgreSQL
- Supabase Edge Functions
- Supabase Authentication

## AI

- Google Gemini
- Natively AI (Fallback)

## Maps

- MapLibre GL
- OpenStreetMap
- Nominatim
- Overpass API

---

# 📸 Screenshots

> Add your screenshots here before submission.

### Landing Page

![Landing](docs/screenshots/landing.png)

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Travel Copilot

![Copilot](docs/screenshots/copilot.png)

### Interactive Timeline

![Timeline](docs/screenshots/timeline.png)

### Map View

![Map](docs/screenshots/map.png)

---

# ⚡ Quick Start

## Clone

```bash
git clone <repository-url>
cd aitinerary
```

## Install

```bash
npm install
```

## Environment Variables

Create a `.env` file.

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Configure the following secrets in your Supabase Edge Function:

- GEMINI_API_KEY
- NATIVELY_API_KEY (optional)

---

## Run

```bash
npm run dev
```

The application will be available at

```
http://localhost:5173
```

---

# 🐳 Docker

## Build

```bash
docker build -t aitinerary .
```

## Run

```bash
docker run -p 3000:80 aitinerary
```

or using Docker Compose

```bash
docker compose up --build
```

The application will be available at

```
http://localhost:3000
```

---

# ☁️ Supabase Setup

1. Create a Supabase project.
2. Enable Email/Password Authentication.
3. Deploy the `generate-itinerary` Edge Function.
4. Configure:

- GEMINI_API_KEY
- NATIVELY_API_KEY (optional)

5. Update your `.env` file with:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

---

# 🎯 Demo Flow

1. Sign Up / Login

↓

2. Complete your Travel Profile

↓

3. Open Travel Copilot

↓

4. Ask:

```
Plan a one day solo trip to Chennai
```

↓

5. AI asks only the missing information

↓

6. AI generates the itinerary

↓

7. Timeline updates automatically

↓

8. Interactive map updates

↓

9. Budget is calculated

↓

10. Save or edit the trip

---

# 🏗 Architecture

```
User

↓

Travel Copilot

↓

AI Engine

↓

Structured Itinerary

↓

Timeline
Map
Budget

↓

Saved Trip
```

The AI acts as an **application controller**, automatically updating the planner instead of only generating text.

---

# 🌟 Future Roadmap

- Social Media → Trip (Instagram Reels & YouTube)
- Hotel & Flight Integrations
- AI Travel Companion
- Offline Support
- Collaborative Trip Planning
- Creator Marketplace

---

# 📄 License

This project was developed as part of a hackathon submission.

---

# 🙏 Acknowledgements

- React
- Supabase
- Google Gemini
- MapLibre
- OpenStreetMap
- Natively AI

---

# 👨‍💻 Authors

**Chaithanya M.C**

---

# ❤️ Thank You

AITinerary demonstrates how conversational AI can become an intelligent travel companion by combining AI, maps, budgeting, and interactive planning into a single seamless experience.

**Plan smarter. Travel better.**