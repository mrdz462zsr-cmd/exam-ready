# ExamReady 📚
> An adaptive exam prep dashboard for university students

<img width="1690" height="893" alt="Pasted Graphic 1" src="https://github.com/user-attachments/assets/48905123-0baf-4411-b73e-b67de188c868" />

## What it does
Upload your PDF syllabus and exam date — ExamReady parses the material once using the Claude API, converts it to structured markdown saved locally, and generates a personalized week-by-week study schedule that updates in real time as you complete topics.

## Live Demo
👉 [exam-ready-blond.vercel.app](https://exam-ready-blond.vercel.app)
> Demo mode is on by default — no API key needed.

## What this demonstrates
- Dynamic scheduling engine with real-time recalculation
- BI-style dashboard: KPIs, Gantt timeline, progress analytics
- PDF parsing pipeline → structured markdown → schedule generation
- Claude API integration for intelligent syllabus analysis
- Priority scoring: syllabus weight (60%) + past exam frequency (40%)
- Hebrew RTL UI with full Tailwind customization
- Demo mode for zero-setup portfolio viewing

## Tech Stack
- React 18 + Vite
- Tailwind CSS (RTL)
- Recharts
- Claude API — claude-sonnet-4-6
- pdf.js (client-side PDF extraction)
- localStorage (no backend)

## Quick Start — Demo Mode (no API key needed)

[Open Live Demo](https://exam-ready-blond.vercel.app) — no setup needed

## Quick Start — Real Mode (your own syllabus)
```bash
git clone https://github.com/mrdz462zsr-cmd/exam-ready
cd exam-ready
npm install
cp .env.example .env
# Add your VITE_ANTHROPIC_API_KEY to .env
npm run dev
```
Then open http://localhost:5173, upload your PDF syllabus, set your exam date and get your personalized study plan.
Your API key stays on your machine — nothing is uploaded anywhere.

## How it works
1. **PDF extraction** — pdf.js reads your syllabus client-side, nothing is uploaded anywhere
2. **Claude API** — extracted text is sent once to Claude, returns structured JSON
3. **Markdown conversion** — JSON is saved as Hebrew .md to localStorage
4. **Schedule engine** — topics distributed across weeks by priority and time remaining
5. All subsequent operations read from localStorage only — API never called again

## Built by
Yonatan Gamlieli — Industrial Engineering & Management student
