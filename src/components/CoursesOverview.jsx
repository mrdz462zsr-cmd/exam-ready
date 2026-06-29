import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Label,
} from 'recharts';

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

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

function getPlannedHoursThisWeek(courses) {
  return courses.reduce((sum, c) => {
    const daysLeft = getDaysLeft(c.examDate);
    if (daysLeft <= 0) return sum;
    const completedHours = c.topics.filter(t => t.status === 'completed').reduce((s, t) => s + t.estimatedHours, 0);
    const totalHours = c.topics.reduce((s, t) => s + t.estimatedHours, 0);
    const remainingHours = totalHours - completedHours;
    const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
    return sum + Math.round(remainingHours / weeksLeft);
  }, 0);
}

function getTotalStudyDays(courses) {
  const maxExam = courses.reduce((max, c) => {
    const d = new Date(c.examDate);
    return d > max ? d : max;
  }, new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  maxExam.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((maxExam - today) / 86400000));
}

function getExamsThisMonth(courses) {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59);
  return courses.filter(c => {
    const exam = new Date(c.examDate);
    return exam >= now && exam <= endOfMonth;
  }).length;
}

function KPISummaryCard({ icon, title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-grey-border/60 p-4 flex flex-col gap-1 min-w-[140px]">
      <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">{icon} {title}</p>
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
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-grey-border/60 p-5 flex flex-col" style={{ minHeight: 400 }}>
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
      <div className="flex-1" style={{ minHeight: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.7} vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Heebo' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false}>
              <Label value="תאריך" position="bottom" offset={10} style={{ fontSize: 12, fill: '#64748B', fontFamily: 'Heebo', fontWeight: 700 }} />
            </XAxis>
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Heebo' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} orientation="right" width={45} label={{ value: 'אחוז כיסוי חומר (%)', angle: -90, position: 'insideLeft', offset: 15, style: { fontWeight: 'bold', fill: '#64748B', fontFamily: 'Heebo', fontSize: 11 } }} />
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
    </div>
  );
}

function CoursesGantt({ courses, onSelectCourse }) {
  const { weekLabels, courseRows } = useMemo(() => {
    if (courses.length === 0) return { weekLabels: [], courseRows: [] };
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
      const exam = new Date(c.examDate);
      exam.setHours(0, 0, 0, 0);
      const daysToExam = Math.max(0, Math.floor((exam - today) / 86400000));
      const completedPct = getCompletionPct(c.topics);
      const barWidthPct = Math.min(100, (daysToExam / (tw * 7)) * 100);
      return {
        id: c.id, name: c.courseName, daysLeft: daysToExam, completedPct, barWidthPct,
        color: c.color || '#2D5AA0', emoji: c.emoji || '',
      };
    });
    return { weekLabels: labels, courseRows: rows };
  }, [courses]);

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-grey-border/60 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-bold text-text-primary">גנט קורסים — מפת לימוד</h3>
        <span className="text-[11px] text-text-muted bg-grey-bg px-2.5 py-1 rounded-md font-medium">{courses.length} קורסים</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="flex items-center mb-3 mr-44">
            {weekLabels.map((label, i) => (
              <div key={i} className="flex-1 text-center text-[11px] font-medium text-text-muted">{label}</div>
            ))}
          </div>
          {courseRows.map((row, idx) => (
            <div key={row.id}>
              <div className="flex items-center cursor-pointer rounded-lg py-2.5 px-1 hover:bg-grey-bg/50 transition-colors" onClick={() => onSelectCourse(row.id)}>
                <span className="w-44 text-[13px] text-text-primary truncate shrink-0 pl-3 font-medium">
                  {row.emoji} {row.name}
                </span>
                <div className="flex-1 relative h-9">
                  <div className="absolute top-0.5 h-8 rounded-md transition-all duration-300" style={{ right: '0%', width: `${Math.max(row.barWidthPct, 4)}%`, backgroundColor: row.color, opacity: 0.15 }} />
                  <div className="absolute top-0.5 h-8 rounded-md transition-all duration-500 shadow-sm" style={{ right: '0%', width: `${Math.max((row.barWidthPct * row.completedPct) / 100, row.completedPct > 0 ? 2 : 0)}%`, backgroundColor: row.color }} />
                  <span className="absolute top-0.5 h-8 flex items-center px-2 text-[10px] font-medium" style={{ right: '4px', color: row.completedPct > 30 ? '#fff' : row.color }}>
                    {row.completedPct}% · {row.daysLeft} ימים
                  </span>
                  <div className="absolute top-0 h-9 w-0.5" style={{ right: `${row.barWidthPct}%`, backgroundColor: row.color }}>
                    <div className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: row.color }} />
                  </div>
                </div>
              </div>
              {idx < courseRows.length - 1 && <div className="mr-44 border-b border-grey-border/30" />}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-5 mt-5 pt-4 border-t border-grey-border/50">
        <div className="flex items-center gap-1.5"><span className="w-6 h-2.5 rounded-sm bg-navy-light" /><span className="text-[11px] text-text-muted font-medium">הושלם</span></div>
        <div className="flex items-center gap-1.5"><span className="w-6 h-2.5 rounded-sm bg-navy-light/20" /><span className="text-[11px] text-text-muted font-medium">זמן שנותר</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-navy-light" /><span className="text-[11px] text-text-muted font-medium">מועד מבחן</span></div>
      </div>
    </div>
  );
}

export default function CoursesOverview({ courses, onSelectCourse, onAddCourse, onReset }) {
  const closestExam = useMemo(() => {
    if (courses.length === 0) return null;
    return courses.reduce((min, c) => getDaysLeft(c.examDate) < getDaysLeft(min.examDate) ? c : min);
  }, [courses]);

  const closestDays = closestExam ? getDaysLeft(closestExam.examDate) : 0;
  const closestDaysColor = closestDays <= 14 ? 'text-red' : closestDays <= 21 ? 'text-orange' : 'text-green';
  const examsThisMonth = useMemo(() => getExamsThisMonth(courses), [courses]);
  const examsRemaining = useMemo(() => {
    return courses.filter(c => getCompletionPct(c.topics) < 100).length;
  }, [courses]);
  const examsRemainingColor = examsRemaining >= 6 ? 'text-red' : examsRemaining >= 3 ? 'text-orange' : 'text-green';

  const timelineData = useMemo(() => {
    if (courses.length === 0) return null;

    let firstDate, lastDate;
    if (isDemo) {
      firstDate = new Date('2026-06-29T00:00:00');
      lastDate = new Date('2026-07-30T00:00:00');
    } else {
      firstDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
      firstDate.setHours(0, 0, 0, 0);
      lastDate = courses.reduce((max, c) => { const d = new Date(c.examDate); return d > max ? d : max; }, new Date(firstDate));
      lastDate.setHours(0, 0, 0, 0);
    }

    const totalDays = Math.max(1, Math.floor((lastDate - firstDate) / 86400000));
    const padding = 40;
    const fmtDate = (d) => `${d.getDate()}.${d.getMonth() + 1}`;

    const axisDates = isDemo
      ? ['2026-06-29', '2026-07-06', '2026-07-13', '2026-07-20', '2026-07-27', '2026-07-30'].map(s => new Date(s))
      : (() => {
          const arr = [];
          for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 7)) arr.push(new Date(d));
          if (!arr.length || arr[arr.length - 1].getTime() !== lastDate.getTime()) arr.push(new Date(lastDate));
          return arr;
        })();

    const exams = courses.map((c) => {
      const exam = new Date(c.examDate);
      exam.setHours(0, 0, 0, 0);
      const daysFromStart = Math.floor((exam - firstDate) / 86400000);
      const passed = !isDemo && exam < firstDate;
      return { courseName: c.courseName, color: c.color || '#2D5AA0', emoji: c.emoji || '', daysFromStart, dateLabel: fmtDate(exam), passed, daysLeft: getDaysLeft(c.examDate) };
    });

    return { totalDays, padding, axisDates, exams, firstDate, fmtDate };
  }, [courses]);

  return (
    <div className="min-h-screen bg-grey-bg">
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
              <button onClick={onAddCourse} className="bg-navy-light hover:bg-navy-mid text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors">+ קורס חדש</button>
              <button onClick={onReset} className="border border-white/15 text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200">איפוס הכל</button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* KPI Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPISummaryCard icon="📚" title="סה״כ קורסים">
            <p className="text-[28px] font-bold text-text-primary leading-none">{courses.length}</p>
          </KPISummaryCard>
          <KPISummaryCard icon="🎯" title="מבחן הבא">
            <div className="flex items-baseline gap-1.5">
              <p className={`text-[28px] font-bold leading-none ${closestDaysColor}`}>{closestDays}</p>
              <span className="text-text-muted text-xs">ימים</span>
            </div>
            {closestExam && <p className="text-[11px] text-text-muted truncate">{closestExam.emoji} {closestExam.courseName}</p>}
          </KPISummaryCard>
          <KPISummaryCard icon="📅" title="מבחנים החודש">
            <p className="text-[28px] font-bold text-text-primary leading-none">{examsThisMonth}</p>
          </KPISummaryCard>
          <KPISummaryCard icon="📝" title="מבחנים שנותרו">
            <p className="text-[28px] font-bold leading-none">
              <span className={examsRemainingColor}>{examsRemaining}</span>
              <span className="text-text-muted text-lg font-normal mx-0.5">/</span>
              <span className="text-text-muted text-lg font-normal">{courses.length}</span>
            </p>
          </KPISummaryCard>
        </div>

        {/* Weekly Timeline — SVG */}
        {timelineData && (
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-grey-border/60 w-full" style={{ padding: 24 }}>
            <h3 className="text-[15px] font-bold text-text-primary mb-2">ציר זמן — מבחנים קרובים</h3>
            <div style={{ width: '100%' }}>
            <svg width="100%" height="120" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ display: 'block', width: '100%' }}>
              {(() => {
                const W = 1200, pad = 80, lineY = 50;
                const { totalDays, exams, axisDates, firstDate, fmtDate } = timelineData;
                const calcX = (daysFromStart) => W - pad - (daysFromStart / totalDays) * (W - 2 * pad);

                const sortedExams = [...exams].sort((a, b) => a.daysFromStart - b.daysFromStart);
                const labelYs = sortedExams.map((e, i) => {
                  const x = calcX(e.daysFromStart);
                  const prev = i > 0 ? calcX(sortedExams[i - 1].daysFromStart) : x + 100;
                  return Math.abs(x - prev) < 60 ? (i % 2 === 0 ? 85 : 100) : 85;
                });

                return (
                  <>
                    {/* Horizontal line */}
                    <line x1={pad} y1={lineY} x2={W - pad} y2={lineY} stroke="#E2E8F0" strokeWidth="2" />

                    {/* Axis ticks */}
                    {axisDates.map((d, i) => {
                      const days = Math.floor((d - firstDate) / 86400000);
                      const x = calcX(days);
                      return (
                        <g key={`tick-${i}`}>
                          <line x1={x} y1={lineY} x2={x} y2={lineY + 6} stroke="#94A3B8" strokeWidth="1" />
                          <text x={x} y={lineY + 18} textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="Heebo">{fmtDate(d)}</text>
                        </g>
                      );
                    })}

                    {/* Exam dots + labels */}
                    {sortedExams.map((e, i) => {
                      const x = calcX(e.daysFromStart);
                      const dotColor = e.passed ? '#94A3B8' : e.color;
                      const opacity = e.passed ? 0.3 : 1;
                      const nameLabel = `${e.emoji} ${e.courseName.split(' ').slice(0, 2).join(' ')}`;
                      return (
                        <g key={`exam-${i}`} opacity={opacity}>
                          {/* Date label above */}
                          <text x={x} y={lineY - 18} textAnchor="middle" fill={dotColor} fontSize="11" fontWeight="bold" fontFamily="Heebo">{e.dateLabel}</text>
                          {/* Dot */}
                          <circle cx={x} cy={lineY} r="8" fill={dotColor} stroke="white" strokeWidth="2" />
                          {/* Dashed line below */}
                          <line x1={x} y1={lineY + 8} x2={x} y2={labelYs[i] - 8} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2" />
                          {/* Course name below */}
                          <text x={x} y={labelYs[i]} textAnchor="middle" fill="#64748B" fontSize="10" fontFamily="Heebo">{nameLabel}</text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
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
            const daysLeft = getDaysLeft(course.examDate);
            const daysColor = daysLeft <= 14 ? 'text-red' : daysLeft <= 21 ? 'text-orange' : 'text-green';
            const daysBg = daysLeft <= 14 ? 'bg-red/8' : daysLeft <= 21 ? 'bg-orange/8' : 'bg-green/8';
            const completionPct = getCompletionPct(course.topics);
            const nextTopic = getNextTopic(course.topics);
            const priority = PRIORITY_STYLES[course.priority || 'medium'];
            const courseColor = course.color || '#2D5AA0';
            const courseEmoji = course.emoji || '';

            return (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-grey-border/40 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Colored header banner */}
                <div className="px-5 py-4" style={{ backgroundColor: courseColor }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{courseEmoji}</span>
                      <h3 className="text-[15px] font-bold text-white leading-snug">{course.courseName}</h3>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white border border-white/30`}>
                      {priority.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-[12px] text-white/80">
                      {new Date(course.examDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', timeZone: 'Asia/Jerusalem' })}
                      {course.examTime && ` · ${course.examTime}`}
                    </p>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  {/* Days remaining badge */}
                  <div className={`inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg ${daysBg} mb-3 self-start`}>
                    <span className={`text-[26px] font-bold leading-none ${daysColor}`}>{daysLeft}</span>
                    <span className={`text-[11px] font-medium ${daysColor}`}>ימים למבחן</span>
                  </div>

                  {/* Exam detail pills */}
                  {course.examDetails && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {course.examDetails.map((d, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-grey-bg text-text-muted text-[10px] px-2 py-0.5 rounded-md font-medium border border-grey-border/40">
                          <span>{d.icon}</span> {d.text}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Strategy tip */}
                  {course.strategy && (
                    <div className="bg-orange/5 border border-orange/15 rounded-lg px-3 py-2 mb-3">
                      <p className="text-[11px] text-text-primary leading-relaxed">
                        <span className="font-bold">💡 אסטרטגיה:</span> {course.strategy}
                      </p>
                    </div>
                  )}

                  {/* Next topic */}
                  {nextTopic && (
                    <p className="text-[12px] text-text-muted mb-1">
                      <span className="text-text-primary font-medium">הנושא הבא: </span>
                      {nextTopic.name}
                    </p>
                  )}

                  <p className="text-[11px] text-text-muted mt-auto pt-2">
                    {course.topics.filter(t => t.status === 'completed').length}/{course.topics.length} נושאים הושלמו
                  </p>
                </div>

                {/* Progress bar */}
                <div className="px-5 pb-4">
                  <div className="w-full bg-grey-border/40 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${completionPct}%`, backgroundColor: courseColor }} />
                  </div>
                  <p className="text-[11px] text-text-muted mt-1 text-left">{completionPct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
