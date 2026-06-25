# ExamReady

An adaptive exam prep dashboard for Israeli university students.

<!-- add dashboard screenshot here -->

## What This Demonstrates

- Dynamic scheduling engine with real-time recalculation
- BI-style dashboard with KPIs, Gantt timeline, and progress analytics
- PDF parsing pipeline → structured markdown → schedule generation
- Claude API integration for intelligent syllabus analysis
- Hebrew RTL UI with full Tailwind customization
- Demo mode for zero-setup portfolio viewing

## Quick Start — Demo Mode

No API key needed:

```bash
npm install
echo "VITE_DEMO_MODE=true" > .env
npm run dev
```

## Quick Start — Real Mode

```bash
cp .env.example .env
# Add your VITE_ANTHROPIC_API_KEY
npm run dev
```

## Tech Stack

- React 18 + Vite
- Tailwind CSS (RTL-aware)
- Recharts
- Claude API (claude-sonnet-4-6)
- pdf.js (client-side PDF extraction)
- localStorage (all persistence, no backend)
- Font: Heebo (Google Fonts)

---

## בעברית

ExamReady היא מערכת לניהול תוכנית לימודים לפני תקופת מבחנים,
המבוססת על ניתוח הסילבוס ומבחנים קודמים.
