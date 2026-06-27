import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

const COURSE_META = {
  'course-1': {
    color: '#3B82F6',
    emoji: '🔵',
    details: ['⏱ 180 דקות', '🖩 מחשבון רגיל', '📊 90% מבחן', '📄 דף נוסחאות מהמרצה', '🏫 כיתה רגילה (ללא מחשבים)'],
    strategy: '💡 אסטרטגיה: תרגל הרבה תרגילים מספר שגיאות. Newton-Raphson ו-RK4 מופיעים כמעט בכל מבחן',
  },
  'course-2': {
    color: '#BE185D',
    emoji: '💜',
    details: ['⏱ 120 דקות', '🚫 חומר סגור', '📊 30% פרויקט + 70% מבחן', '🏫 כיתה רגילה · ללא עזרים · שינון נדרש!'],
  },
  'course-3': {
    color: '#16A34A',
    emoji: '🟢',
    details: ['⏱ 180 דקות', '📚 כל חומר כתוב + מחשבון מדעי', '📊 25% פרויקט + 75% מבחן', '💻 כיתת מחשבים'],
  },
  'course-4': {
    color: '#7C3AED',
    emoji: '🟣',
    details: ['⏱ 180 דקות', '✏️ 2 דפי A4 דו״צ כתיבה עצמית', '📊 10% תרגילים + 90% מבחן', '💻 כיתת מחשבים'],
  },
  'course-5': {
    color: '#0D9488',
    emoji: '💙',
    details: ['⏱ 180 דקות', '📝 6 דפים דו״צ כתיבה עצמית', '📊 10% תרגילים + 90% מבחן', '❌ לא כולל טבלאות גנריות'],
  },
  'course-6': {
    color: '#EA580C',
    emoji: '🟠',
    details: ['⏱ 180 דקות', '📚 כל חומר כתוב ומודפס', '📊 20% פרויקט + 80% מבחן', '🏫 כיתה רגילה'],
    strategy: '💡 אסטרטגיה: דגש על EOQ ומשפחתו, MRP, מוכר העיתונים, מודל QR — כל נושא יש לו נוסחה ספציפית',
  },
};

const DEFAULT_META = { color: '#6B7280', emoji: '📘', details: [] };

function getCourseMeta(course) {
  if (COURSE_META[course.id]) return COURSE_META[course.id];
  const name = course.courseName;
  if (name.includes('נומרית')) return COURSE_META['course-1'];
  if (name.includes('פסיכולוגיה')) return COURSE_META['course-2'];
  if (name.includes('שיטות')) return COURSE_META['course-3'];
  if (name.includes('אלגוריתמים')) return COURSE_META['course-4'];
  if (name.includes('איכות')) return COURSE_META['course-5'];
  if (name.includes('תפעול')) return COURSE_META['course-6'];
  return DEFAULT_META;
}

const PRIORITY_STYLES = {
  high: { label: 'עדיפות גבוהה', className: 'bg-red/10 text-red border border-red/15' },
  medium: { label: 'עדיפות בינונית', className: 'bg-orange/10 text-orange border border-orange/15' },
  low: { label: 'עדיפות נמוכה', className: 'bg-grey-bg text-text-muted border border-grey-border/60' },
};

function getDaysLeft(examDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((exam - today) / 86400000));
}

function getNextTopic(topics) {
  return topics.find(t => t.status === 'in_progress') ||
    topics.find(t => t.status === 'not_started');
}

function getCompletionPct(topics) {
  if (topics.length === 0) return 0;
  return Math.round((topics.filter(t => t.status === 'completed').length / topics.length) * 100);
}

function KPISummaryCard({ title, emoji, children }) {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-grey-border/60 p-4 flex flex-col gap-1.5 min-w-[140px] hover:shadow-md transition-shadow duration-200">
      <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold flex items-center gap-1.5">
        {emoji && <span className="text-sm">{emoji}</span>}
        {title}
      </p>
      {children}
    </div>
  );
}

function OverallProgressChart({ courses }) {
  const { data, actualLineColor } = useMemo(() => {
    if (courses.length === 0) return { data: [], actualLineColor: '#22C55E' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxExam = courses.reduce((max, c) => {
      const d = new Date(c.examDate);
      return d > max ? d : max;
    }, today);

    const totalDays = Math.max(1, Math.floor((maxExam - today) / 86400000));
    const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

    const totalHours = courses.reduce((s, c) => s + c.topics.reduce((s2, t) => s2 + t.estimatedHours, 0), 0);
    const completedHours = courses.reduce((s, c) => s + c.topics.filter(t => t.status === 'completed').reduce((s2, t) => s2 + t.estimatedHours, 0), 0);
    const actualPct = totalHours > 0 ? (completedHours / totalHours) * 100 : 0;

    const points = [];
    for (let w = 0; w <= totalWeeks; w++) {
      const weekDate = new Date(today);
      weekDate.setDate(weekDate.getDate() + w * 7);
      const label = weekDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', timeZone: 'Asia/Jerusalem' });
      const plannedPct = Math.min(100, Math.round((w / totalWeeks) * 100));
      points.push({ week: label, planned: plannedPct, actual: w <= 1 ? Math.round(actualPct) : null });
    }

    const gap = (points[0]?.planned || 0) - actualPct;
    const color = gap > 25 ? '#EF4444' : gap > 15 ? '#F59E0B' : '#22C55E';
    return { data: points, actualLineColor: color };
  }, [courses]);

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-grey-border/60 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-bold text-text-primary">התקדמות כוללת מול תוכנית</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-px border-t-2 border-dashed border-navy-light" />
            <span className="text-[11px] text-text-muted font-medium">מתוכנן</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: actualLineColor }} />
            <span className="text-[11px] text-text-muted font-medium">בפועל</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 10, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.7} vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Heebo' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} reversed />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Heebo' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} orientation="right" width={40} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload) return null;
            return (
              <div className="bg-navy-dark/95 backdrop-blur-sm text-white text-[12px] px-3 py-2 rounded-lg shadow-lg border border-white/10" dir="rtl">
                <p className="font-medium text-white/70 mb-1">{label}</p>
                {payload.map((entry, i) => (
                  <p key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name === 'planned' ? 'מתוכנן' : 'בפועל'}:</span>
                    <span className="font-bold">{Math.round(entry.value)}%</span>
                  </p>
                ))}
              </div>
            );
          }} />
          <ReferenceLine y={100} stroke="#E2E8F0" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="planned" stroke="#2D5AA0" strokeDasharray="8 4" strokeWidth={2} dot={false} name="planned" />
          <Line type="monotone" dataKey="actual" stroke={actualLineColor} strokeWidth={2.5} dot={{ fill: actualLineColor, r: 4, strokeWidth: 2, stroke: '#fff' }} connectNulls={false} name="actual" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CoursesGantt({ courses, onSelectCourse }) {
  const { totalWeeks, weekLabels, courseRows } = useMemo(() => {
    if (courses.length === 0) return { totalWeeks: 0, weekLabels: [], courseRows: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxExam = courses.reduce((max, c) => {
      const d = new Date(c.examDate);
      return d > max ? d : max;
    }, today);

    const totalDays = Math.max(7, Math.ceil((maxExam - today) / 86400000) + 7);
    const tw = Math.ceil(totalDays / 7);

    const labels = [];
    for (let i = 0; i < tw; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() + i * 7);
      labels.push(weekStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', timeZone: 'Asia/Jerusalem' }));
    }

    const rows = courses.map((c) => {
      const meta = getCourseMeta(c);
      const exam = new Date(c.examDate);
      exam.setHours(0, 0, 0, 0);
      const daysToExam = Math.max(0, Math.floor((exam - today) / 86400000));
      const completedPct = getCompletionPct(c.topics);
      const barWidthPct = Math.min(100, (daysToExam / (tw * 7)) * 100);

      let status = 'upcoming';
      if (completedPct === 100) status = 'completed';
      else if (completedPct > 0) status = 'in_progress';
      if (daysToExam <= 7 && completedPct < 50) status = 'at_risk';

      return {
        id: c.id,
        name: c.courseName,
        emoji: meta.emoji,
        daysLeft: daysToExam,
        completedPct,
        barWidthPct,
        color: meta.color,
        status,
        examDate: c.examDate,
      };
    });

    return { totalWeeks: tw, weekLabels: labels, courseRows: rows };
  }, [courses]);

  const STATUS_BAR_CLASSES = {
    completed: 'opacity-100',
    in_progress: 'opacity-100',
    upcoming: 'opacity-60',
    at_risk: 'opacity-100',
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-grey-border/60 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-bold text-text-primary">גנט קורסים — מפת לימוד</h3>
        <span className="text-[11px] text-text-muted bg-grey-bg px-2.5 py-1 rounded-md font-medium">
          {courses.length} קורסים
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="flex items-center mb-3 mr-48">
            {weekLabels.map((label, i) => (
              <div key={i} className="flex-1 text-center text-[11px] font-medium text-text-muted">
                {label}
              </div>
            ))}
          </div>

          {courseRows.map((row, idx) => (
            <div key={row.id}>
              <div
                className="flex items-center cursor-pointer rounded-lg py-2.5 px-1 hover:bg-grey-bg/50 transition-colors"
                onClick={() => onSelectCourse(row.id)}
              >
                <span className="w-48 text-[13px] text-text-primary truncate shrink-0 pl-3 font-medium flex items-center gap-1.5">
                  <span className="text-sm">{row.emoji}</span>
                  {row.name}
                </span>
                <div className="flex-1 relative h-9">
                  <div
                    className={`absolute top-0.5 h-8 rounded-md transition-all duration-300 shadow-sm ${STATUS_BAR_CLASSES[row.status]}`}
                    style={{
                      right: '0%',
                      width: `${Math.max(row.barWidthPct, 4)}%`,
                      backgroundColor: row.color,
                      opacity: 0.2,
                    }}
                  />
                  <div
                    className="absolute top-0.5 h-8 rounded-md transition-all duration-500 shadow-sm"
                    style={{
                      right: '0%',
                      width: `${Math.max((row.barWidthPct * row.completedPct) / 100, row.completedPct > 0 ? 2 : 0)}%`,
                      backgroundColor: row.color,
                    }}
                  />
                  <span className="absolute top-0.5 h-8 flex items-center px-2 text-[10px] font-medium" style={{ right: '4px', color: row.completedPct > 30 ? '#fff' : row.color }}>
                    {row.completedPct}% · {row.daysLeft} ימים
                  </span>
                  <div
                    className="absolute top-0 h-9 w-0.5"
                    style={{ right: `${row.barWidthPct}%`, backgroundColor: row.color }}
                  >
                    <div className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: row.color }} />
                  </div>
                </div>
              </div>
              {idx < courseRows.length - 1 && <div className="mr-48 border-b border-grey-border/30" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-5 mt-5 pt-4 border-t border-grey-border/50">
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-2.5 rounded-sm bg-navy-light" />
          <span className="text-[11px] text-text-muted font-medium">הושלם</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-2.5 rounded-sm bg-navy-light/20" />
          <span className="text-[11px] text-text-muted font-medium">זמן שנותר</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-navy-light" />
          <span className="text-[11px] text-text-muted font-medium">מועד מבחן</span>
        </div>
      </div>
    </div>
  );
}

export default function CoursesOverview({ courses, onSelectCourse, onAddCourse, onReset }) {
  const closestExam = useMemo(() => {
    if (courses.length === 0) return null;
    return courses.reduce((min, c) => {
      const d = getDaysLeft(c.examDate);
      return d < getDaysLeft(min.examDate) ? c : min;
    });
  }, [courses]);

  const closestDays = closestExam ? getDaysLeft(closestExam.examDate) : 0;
  const closestMeta = closestExam ? getCourseMeta(closestExam) : null;

  const upcomingExams = useMemo(() => courses.filter(c => getDaysLeft(c.examDate) > 0).length, [courses]);

  const lastExamInfo = useMemo(() => {
    if (courses.length === 0) return { daysLeft: 0, dateLabel: '' };
    const lastExam = courses.reduce((max, c) => {
      const d = new Date(c.examDate);
      return d > new Date(max.examDate) ? c : max;
    });
    const d = new Date(lastExam.examDate);
    return {
      daysLeft: getDaysLeft(lastExam.examDate),
      dateLabel: `${d.getDate()}.${d.getMonth() + 1}`,
    };
  }, [courses]);

  const timeline = useMemo(() => {
    if (courses.length === 0) return { weeks: [], courseMarkers: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxExam = courses.reduce((max, c) => {
      const d = new Date(c.examDate);
      return d > max ? d : max;
    }, today);

    const totalDays = Math.max(7, Math.ceil((maxExam - today) / 86400000) + 7);
    const totalWeeks = Math.ceil(totalDays / 7);

    const weeks = [];
    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() + i * 7);
      weeks.push({
        label: weekStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', timeZone: 'Asia/Jerusalem' }),
      });
    }

    const courseMarkers = courses.map((c) => {
      const meta = getCourseMeta(c);
      const exam = new Date(c.examDate);
      exam.setHours(0, 0, 0, 0);
      const dayOffset = Math.max(0, Math.floor((exam - today) / 86400000));
      const pct = Math.min(100, (dayOffset / (totalWeeks * 7)) * 100);
      const examDay = exam.getDate();
      const examMonth = exam.getMonth() + 1;
      return {
        courseName: c.courseName,
        emoji: meta.emoji,
        dateLabel: `${examDay}.${examMonth}`,
        pct,
        color: meta.color,
        daysLeft: getDaysLeft(c.examDate),
      };
    });

    return { weeks, courseMarkers };
  }, [courses]);

  const closestDaysColor = closestDays <= 14 ? 'text-red' : closestDays <= 21 ? 'text-orange' : 'text-green';

  return (
    <div className="min-h-screen bg-grey-bg">
      {/* Header */}
      <header className="bg-navy-dark">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-navy-light flex items-center justify-center">
                <span className="text-white font-bold text-sm">ER</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">ExamReady</h1>
                <p className="text-white/40 text-xs mt-0.5">ניהול תקופת מבחנים</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onAddCourse}
                className="bg-navy-light hover:bg-navy-mid text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                + קורס חדש
              </button>
              <button
                onClick={onReset}
                className="border border-white/15 text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              >
                איפוס הכל
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Global KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPISummaryCard title="סה״כ קורסים" emoji="📚">
            <p className="text-[28px] font-bold text-text-primary leading-none">{courses.length}</p>
          </KPISummaryCard>
          <KPISummaryCard title="מבחן הבא" emoji="🎯">
            {closestExam ? (
              <div>
                <p className="text-[13px] font-semibold text-text-primary leading-tight truncate">{closestExam.courseName}</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <p className={`text-[28px] font-bold leading-none ${closestDaysColor}`}>{closestDays}</p>
                  <span className="text-text-muted text-xs">ימים</span>
                </div>
              </div>
            ) : (
              <p className="text-text-muted text-sm">אין מבחנים</p>
            )}
          </KPISummaryCard>
          <KPISummaryCard title="מבחנים החודש" emoji="📅">
            <p className="text-[28px] font-bold text-text-primary leading-none">{upcomingExams}</p>
          </KPISummaryCard>
          <KPISummaryCard title="ימי לימוד נותרו" emoji="⏰">
            <div className="flex items-baseline gap-1.5">
              <p className="text-[28px] font-bold text-navy-light leading-none">{lastExamInfo.daysLeft}</p>
              <span className="text-text-muted text-xs">עד {lastExamInfo.dateLabel}</span>
            </div>
          </KPISummaryCard>
        </div>

        {/* Timeline Bar */}
        {timeline.weeks.length > 0 && (
          <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-grey-border/60 p-5">
            <h3 className="text-[15px] font-bold text-text-primary mb-4">ציר זמן — מבחנים קרובים</h3>
            <div className="relative">
              <div className="flex mb-2">
                {timeline.weeks.map((w, i) => (
                  <div key={i} className="flex-1 text-center text-[11px] text-text-muted font-medium">
                    {w.label}
                  </div>
                ))}
              </div>
              <div className="relative h-12 bg-grey-bg rounded-full">
                <div className="absolute top-0 right-0 w-0.5 h-full bg-navy-dark/20" />
                {timeline.courseMarkers.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full flex flex-col items-center justify-center"
                    style={{ right: `${m.pct}%`, transform: 'translateX(50%)' }}
                    title={`${m.courseName} — ${m.daysLeft} ימים`}
                  >
                    <span className="text-lg leading-none cursor-pointer drop-shadow-sm">{m.emoji}</span>
                    <span
                      className="text-[9px] font-bold mt-0.5 leading-none"
                      style={{ color: m.color }}
                    >
                      {m.dateLabel}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                {timeline.courseMarkers.map((m, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-sm">{m.emoji}</span>
                    <span className="text-[11px] text-text-muted font-medium">{m.courseName}</span>
                    <span className="text-[10px] font-semibold" style={{ color: m.color }}>{m.dateLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gantt + Progress Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <CoursesGantt courses={courses} onSelectCourse={onSelectCourse} />
          <OverallProgressChart courses={courses} />
        </div>

        {/* Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const meta = getCourseMeta(course);
            const daysLeft = getDaysLeft(course.examDate);
            const daysColor = daysLeft <= 14 ? 'text-red' : daysLeft <= 21 ? 'text-orange' : 'text-green';
            const daysBg = daysLeft <= 14 ? 'bg-red/8' : daysLeft <= 21 ? 'bg-orange/8' : 'bg-green/8';
            const completionPct = getCompletionPct(course.topics);
            const nextTopic = getNextTopic(course.topics);
            const priority = PRIORITY_STYLES[course.priority || 'medium'];
            const completed = course.topics.filter(t => t.status === 'completed').length;

            return (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                className="bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-grey-border/60 cursor-pointer hover:shadow-[0_12px_30px_rgba(0,0,0,0.15)] hover:scale-105 hover:z-10 transition-all duration-200 ease-out flex flex-col relative"
              >
                {/* Colored header banner */}
                <div className="px-4 py-3.5" style={{ backgroundColor: meta.color }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{meta.emoji}</span>
                      <h3 className="text-[14px] font-bold text-white leading-snug truncate">{course.courseName}</h3>
                    </div>
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white backdrop-blur-sm">
                      {priority.label}
                    </span>
                  </div>
                  <p className="text-white/70 text-[11px] mt-1.5">
                    מבחן: {new Date(course.examDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', timeZone: 'Asia/Jerusalem' })}
                  </p>
                </div>

                {/* Card body */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Strategy tip */}
                  {meta.strategy && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-[11px] text-amber-800 leading-relaxed">
                      {meta.strategy}
                    </div>
                  )}

                  {/* Days remaining badge */}
                  <div className={`inline-flex items-baseline gap-1.5 px-3 py-2 rounded-lg ${daysBg} mb-3 self-start`}>
                    <span className={`text-[28px] font-bold leading-none ${daysColor}`}>{daysLeft}</span>
                    <span className={`text-[11px] font-medium ${daysColor}`}>ימים למבחן</span>
                  </div>

                  {/* Detail pills */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {meta.details.map((detail, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium border"
                        style={{
                          backgroundColor: `${meta.color}0D`,
                          borderColor: `${meta.color}25`,
                          color: '#374151',
                        }}
                      >
                        {detail}
                      </span>
                    ))}
                  </div>

                  {/* Next topic */}
                  {nextTopic && (
                    <div className="bg-grey-bg rounded-lg px-3 py-2 mb-3">
                      <p className="text-[12px] text-text-muted">
                        <span className="text-text-primary font-semibold">הנושא הבא: </span>
                        {nextTopic.name}
                      </p>
                    </div>
                  )}

                  <div className="flex-1" />

                  {/* Progress bar */}
                  <div className="mt-3 pt-3 border-t border-grey-border/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-text-muted font-medium">
                        {completed}/{course.topics.length} נושאים הושלמו
                      </span>
                      <span className="text-[12px] font-bold" style={{ color: meta.color }}>
                        {completionPct}%
                      </span>
                    </div>
                    <div className="w-full bg-grey-border/40 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${completionPct}%`, backgroundColor: meta.color }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
