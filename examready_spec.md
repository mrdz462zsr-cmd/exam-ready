# ExamReady — Claude Code Spec
> Paste this entire document into Claude Code as your opening prompt.

---

## Project Overview

Build a Hebrew-language, RTL exam prep dashboard for Israeli university students.
The student uploads a PDF syllabus (and optionally past exams) and enters their exam date.
The system parses the syllabus once into structured markdown, generates a dynamic
week-by-week study schedule, and tracks topic progress with BI-style analytics.

The schedule is fully dynamic — every time the student marks a topic complete or
updates their available hours, the entire plan recalculates forward in real time.
No alerts panel. The dashboard itself communicates status visually at all times.

This is a portfolio project targeting BI Analyst and PMO roles. The UI and architecture
must reflect dashboard thinking, planning logic, and data visualization fluency.

---

## Tech Stack

- React 18 + Vite
- Tailwind CSS (RTL-aware, all layouts must work right-to-left)
- Recharts (all charts)
- Claude API — model: claude-sonnet-4-6 (syllabus + exam parsing only)
- pdf.js (PDF text extraction client-side before sending to Claude)
- localStorage (all persistence, no backend)
- Set `dir="rtl"` and `lang="he"` on the root HTML element
- Font: Heebo from Google Fonts (best Hebrew web font)

---

## Color Tokens

Define these as Tailwind custom colors in tailwind.config.js:

```
navy-dark:   #0F1F3D   → sidebar, header background
navy-mid:    #1A3A6B   → card headers, active nav states
navy-light:  #2D5AA0   → buttons, accents, primary chart line
grey-bg:     #F4F6F9   → main page background
grey-card:   #FFFFFF   → card surfaces
grey-border: #E2E8F0   → dividers, table borders
text-primary:#1A202C   → all main Hebrew text
text-muted:  #64748B   → secondary labels, metadata
green:       #22C55E   → completed status
orange:      #F59E0B   → at risk status
red:         #EF4444   → behind / critical status
blue-accent: #3B82F6   → planned line on progress chart
```

---

## Demo Mode

The app must run with zero API key for portfolio viewing.

- If `VITE_DEMO_MODE=true` in `.env`, skip all API calls and load mock data from `demoData.js`
- Mock data: IE&M student, course "אלגוריתמים ומבנה נתונים", 6 topics, 3 weeks to exam,
  2 topics completed, 1 topic at risk, 3 past exams parsed
- Show a small banner: "מצב הדגמה — נתונים לדוגמה בלבד"
- Real mode: requires `VITE_ANTHROPIC_API_KEY` in `.env`
- `.env.example` must be included with both variables documented

---

## App Flow

### Step 1 — Onboarding Screen

Full-page Hebrew form, centered, navy-dark header with logo/title "ExamReady":

Fields:
- שם הקורס (text input, required)
- תאריך המבחן (date picker, required, min = tomorrow)
- שעות לימוד זמינות בשבוע (number input, default 10, min 1 max 40)
- העלאת סילבוס PDF (file input, required, accept=".pdf")
- העלאת מבחנים קודמים (file input, optional, accept=".pdf", multiple=true)
  - Label: "מבחנים קודמים (אופציונלי — משפר את דיוק התוכנית)"

Submit button: "בניית תוכנית לימוד ←" (navy-light background, full width)

On submit:
1. Show loading state: "מנתח סילבוס..." then "בונה תוכנית לימוד..."
2. Extract text from all PDFs using pdf.js
3. Send to Claude API with parsing prompt (see below)
4. Receive JSON response, validate structure
5. Convert JSON to .md format, save to localStorage key: `examready_syllabus`
6. Run schedule engine, save output to localStorage key: `examready_schedule`
7. Navigate to dashboard

---

### Step 2 — Dashboard

Three-column layout on desktop (sidebar / main / right panel).
On mobile: single column stack.

#### Layout

```
┌─────────────────────────────────────────────────────┐
│  HEADER: course name + exam countdown + status strip │
├──────────┬──────────────────────────┬────────────────┤
│          │                          │                │
│ Sidebar  │    Gantt Timeline        │  Progress      │
│ KPI Cards│                          │  Chart         │
│          ├──────────────────────────┤                │
│          │    Topic Table           │                │
│          │                          │                │
└──────────┴──────────────────────────┴────────────────┘
```

---

## Dashboard Components

### Header (full width, navy-dark background)

- Right: course name (white, large) + "ExamReady" logo
- Center: dynamic status strip — single Hebrew sentence, always current:
  - "במסלול — הנושא הבא: [topic], השבוע" (green dot)
  - "בסיכון — כדאי להוסיף [X] שעות השבוע" (orange dot)
  - "פיגור — התוכנית עודכנה בהתאם למצב הנוכחי" (red dot)
- Left: "איפוס / קורס חדש" button (ghost style)

---

### Sidebar — KPI Cards

Four stacked cards, white background, navy-mid left border:

1. **ימים למבחן**
   - Large number, countdown updated daily
   - Red if ≤ 14 days, orange if ≤ 21, green otherwise

2. **נושאים שהושלמו**
   - Format: "X / Y"
   - Circular progress ring (Recharts RadialBarChart)

3. **כיסוי חומר**
   - Percentage of total estimated hours completed
   - Thin horizontal progress bar below the number

4. **סטטוס כולל**
   - "במסלול" / "בסיכון" / "פיגור"
   - Color-coded pill badge
   - Logic: compare actual completion rate vs. expected rate at this point in the plan

---

### Gantt Timeline (main panel, top)

- One row per topic
- X axis: weeks from today to exam date
- Each topic is a horizontal bar spanning its scheduled study weeks
- Bar colors:
  - Completed: green (#22C55E)
  - In progress: navy-light (#2D5AA0)
  - Not started / upcoming: grey (#94A3B8)
  - At risk (behind schedule): orange (#F59E0B)
  - Critical (past due, not done): red (#EF4444)
- Clicking a topic bar opens an inline expansion showing subtopics with checkboxes
- Marking subtopics complete contributes to topic completion %
- "שבוע נוכחי" is highlighted with a vertical dashed line

**Dynamic behavior:**
When any topic status changes → recalculate all remaining topic positions →
redraw all bars → update KPI cards → update status strip. All in real time.

---

### Topic Table (main panel, bottom)

Sortable Hebrew table with columns (RTL order):

| נושא | תת-נושאים | שעות מוערכות | תדירות במבחנים | עדיפות | סטטוס |
|------|-----------|--------------|----------------|--------|--------|

- נושא: topic name
- תת-נושאים: count of subtopics (expandable on click)
- שעות מוערכות: from Claude parsing
- תדירות במבחנים: shown as pill "הופיע ב-X/Y מבחנים" or "אין נתונים" if no past exams
- עדיפות: color-coded pill — גבוהה (red) / בינונית (orange) / נמוכה (grey)
- סטטוס: dropdown — לא התחלתי / בתהליך / הושלם

Changing status dropdown → triggers full schedule recalculation.
Table is sortable by any column header click.

---

### Progress Chart (right panel)

Recharts LineChart, two lines:

- X axis: dates from today to exam date, weekly intervals, Hebrew date format
- Y axis: % of material covered (0–100)
- Line 1 (navy-light, dashed): planned coverage curve — calculated at setup, never changes
- Line 2 (green, solid): actual coverage curve — updates as topics are marked complete
- If actual line falls more than 15% below planned: actual line turns orange
- If gap exceeds 25%: actual line turns red
- Chart title: "התקדמות מול תוכנית"
- Legend in Hebrew: "מתוכנן" / "בפועל"

---

## Claude API — Syllabus + Exam Parsing

### Prompt

```
System:
You are an academic syllabus and exam analyzer for Israeli university courses.
You will receive syllabus text and optionally past exam texts.
Return ONLY a valid JSON object. No explanation, no markdown, no extra text.

User:
SYLLABUS:
[extracted syllabus text]

PAST EXAMS (may be empty):
[extracted past exam texts, separated by "---EXAM BREAK---"]

Return this exact JSON structure:
{
  "courseName": "string in Hebrew if syllabus is in Hebrew",
  "topics": [
    {
      "id": 1,
      "name": "string",
      "subtopics": ["string", "string"],
      "syllabusWeight": "high|medium|low",
      "examFrequency": 0.0,
      "priorityScore": 0.0,
      "estimatedHours": number
    }
  ]
}

Rules:
- examFrequency: ratio 0.0–1.0 of past exams where this topic appeared. 0.0 if no past exams provided.
- priorityScore: calculate as (syllabusWeight_numeric * 0.6) + (examFrequency * 0.4)
  where high=1.0, medium=0.6, low=0.3
- estimatedHours: realistic per topic. Total across all topics should be 40–80 hours for a semester course.
- Sort topics by priorityScore descending in the output array.
```

### After receiving JSON

1. Validate the structure. If malformed, show Hebrew error and allow retry.
2. Convert to .md and save to localStorage.
3. Pass to schedule engine.

---

## Schedule Engine Logic (`scheduleEngine.js`)

```javascript
// Inputs
// topics: array from Claude JSON, sorted by priorityScore desc
// examDate: Date object
// hoursPerWeek: number

function buildSchedule(topics, examDate, hoursPerWeek) {
  const today = new Date()
  const totalDays = Math.floor((examDate - today) / 86400000)
  const totalWeeks = Math.floor(totalDays / 7)

  // Edge cases
  if (totalDays < 3) return { mode: 'emergency', topics: topics.filter(t => t.syllabusWeight === 'high') }
  if (totalDays < 14) return { mode: 'compressed', ... }

  // Normal mode
  const activeWeeks = Math.max(1, totalWeeks - 1) // last week = review only
  const totalAvailableHours = activeWeeks * hoursPerWeek
  const totalEstimatedHours = topics.reduce((sum, t) => sum + t.estimatedHours, 0)
  const scaleFactor = totalAvailableHours / totalEstimatedHours

  // Assign each topic a start week and end week
  let currentWeek = 1
  let hoursUsedThisWeek = 0

  topics.forEach(topic => {
    const scaledHours = topic.estimatedHours * scaleFactor
    topic.startWeek = currentWeek
    const weeksNeeded = Math.ceil(scaledHours / hoursPerWeek)
    topic.endWeek = Math.min(currentWeek + weeksNeeded - 1, activeWeeks)
    topic.scheduledHours = scaledHours
    currentWeek = topic.endWeek + 1
    if (currentWeek > activeWeeks) currentWeek = activeWeeks
  })

  return { mode: 'normal', topics, activeWeeks, totalWeeks, reviewWeek: totalWeeks }
}

// Recalculate on any status change
function recalculate(schedule, updatedTopics, hoursPerWeek, examDate) {
  const remaining = updatedTopics.filter(t => t.status !== 'completed')
  return buildSchedule(remaining, examDate, hoursPerWeek)
}
```

Dynamic status logic per topic:
- `completed`: student marked it done
- `in_progress`: student marked it started
- `at_risk`: topic's endWeek has passed and status is not completed
- `upcoming`: not yet reached startWeek
- `current`: today falls within startWeek–endWeek range

---

## Markdown Converter (`markdownConverter.js`)

After receiving Claude JSON, convert and save:

```markdown
# [courseName]
- תאריך מבחן: DD/MM/YYYY
- סה"כ נושאים: N
- שעות לימוד שבועיות: N

## נושאים

### 1. [topic name]
- עדיפות: גבוהה/בינונית/נמוכה
- שעות מוערכות: N
- תדירות במבחנים: X/Y (or אין נתונים)
- תת-נושאים:
  - [subtopic 1]
  - [subtopic 2]
```

Save as string to localStorage key `examready_syllabus_md`.
This is never sent to the API again.

---

## File Structure

```
exam-ready/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Onboarding.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Header.jsx
│   │   ├── KPIBar.jsx
│   │   ├── GanttTimeline.jsx
│   │   ├── TopicTable.jsx
│   │   ├── ProgressChart.jsx
│   │   └── StatusStrip.jsx
│   ├── utils/
│   │   ├── pdfExtractor.js
│   │   ├── claudeAPI.js
│   │   ├── scheduleEngine.js
│   │   ├── markdownConverter.js
│   │   └── demoData.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css        ← import Heebo font, set dir=rtl, base RTL styles
├── tailwind.config.js   ← custom color tokens
├── .env.example
├── README.md
└── package.json
```

---

## README Requirements

The README is critical for portfolio visibility. It must include:

1. **Project title + one-line description in English**
   "ExamReady — An adaptive exam prep dashboard for Israeli university students"

2. **Screenshot** (add placeholder comment: `<!-- add dashboard screenshot here -->`)

3. **What this demonstrates** (for recruiters):
   - Dynamic scheduling engine with real-time recalculation
   - BI-style dashboard with KPIs, Gantt timeline, and progress analytics
   - PDF parsing pipeline → structured markdown → schedule generation
   - Claude API integration for intelligent syllabus analysis
   - Hebrew RTL UI with full Tailwind customization
   - Demo mode for zero-setup portfolio viewing

4. **Quick start — demo mode** (no API key needed):
   ```bash
   npm install
   echo "VITE_DEMO_MODE=true" > .env
   npm run dev
   ```

5. **Quick start — real mode**:
   ```bash
   cp .env.example .env
   # Add your VITE_ANTHROPIC_API_KEY
   npm run dev
   ```

6. **Tech stack section**

7. **Hebrew section** (short, for Israeli recruiters):
   "ExamReady היא מערכת לניהול תוכנית לימודים לפני תקופת מבחנים,
   המבוססת על ניתוח הסילבוס ומבחנים קודמים."

---

## Important Implementation Notes

1. All user-facing text is Hebrew. Variable names and code comments can be English.
2. Every layout must be tested RTL — flex rows reverse, text aligns right, icons mirror.
3. The schedule recalculation must feel instant — no loading state, pure state update.
4. localStorage is the only persistence layer. No backend, no auth, no database.
5. pdf.js runs entirely client-side. Never send raw PDF binary to Claude — extract text first.
6. The Gantt is built with Recharts or plain SVG/div — not a third-party Gantt library.
7. Mobile layout: stack all panels vertically, KPI cards become horizontal scroll row.
8. On first load with no localStorage data → redirect to Onboarding automatically.
9. "איפוס / קורס חדש" clears all localStorage keys and returns to Onboarding.
10. All date logic uses the Israel timezone (Asia/Jerusalem).
