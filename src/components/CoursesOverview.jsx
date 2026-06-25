import { useMemo } from 'react';

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

function getExamsThisMonth(courses) {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59);
  return courses.filter(c => {
    const exam = new Date(c.examDate);
    return exam >= now && exam <= endOfMonth;
  }).length;
}

function KPISummaryCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-grey-border/60 p-4 flex flex-col gap-1 min-w-[140px]">
      <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold">{title}</p>
      {children}
    </div>
  );
}

// Course color palette for timeline
const COURSE_COLORS = ['#2D5AA0', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

export default function CoursesOverview({ courses, onSelectCourse, onAddCourse, onReset }) {
  const closestExam = useMemo(() => {
    if (courses.length === 0) return null;
    return courses.reduce((min, c) => {
      const d = getDaysLeft(c.examDate);
      return d < getDaysLeft(min.examDate) ? c : min;
    });
  }, [courses]);

  const closestDays = closestExam ? getDaysLeft(closestExam.examDate) : 0;
  const examsThisMonth = useMemo(() => getExamsThisMonth(courses), [courses]);
  const plannedHours = useMemo(() => getPlannedHoursThisWeek(courses), [courses]);

  // Timeline: compute week range across all courses
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
        start: weekStart,
      });
    }

    const courseMarkers = courses.map((c, idx) => {
      const exam = new Date(c.examDate);
      exam.setHours(0, 0, 0, 0);
      const dayOffset = Math.max(0, Math.floor((exam - today) / 86400000));
      const pct = Math.min(100, (dayOffset / (totalWeeks * 7)) * 100);
      return {
        courseName: c.courseName,
        examDate: c.examDate,
        pct,
        color: COURSE_COLORS[idx % COURSE_COLORS.length],
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
        {/* KPI Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPISummaryCard title="סה״כ קורסים">
            <p className="text-[28px] font-bold text-text-primary leading-none">{courses.length}</p>
          </KPISummaryCard>
          <KPISummaryCard title="מבחן הבא">
            <div className="flex items-baseline gap-1.5">
              <p className={`text-[28px] font-bold leading-none ${closestDaysColor}`}>{closestDays}</p>
              <span className="text-text-muted text-xs">ימים</span>
            </div>
          </KPISummaryCard>
          <KPISummaryCard title="מבחנים החודש">
            <p className="text-[28px] font-bold text-text-primary leading-none">{examsThisMonth}</p>
          </KPISummaryCard>
          <KPISummaryCard title="שעות לימוד השבוע">
            <div className="flex items-baseline gap-1.5">
              <p className="text-[28px] font-bold text-navy-light leading-none">{plannedHours}</p>
              <span className="text-text-muted text-xs">שעות</span>
            </div>
          </KPISummaryCard>
        </div>

        {/* Weekly Timeline */}
        {timeline.weeks.length > 0 && (
          <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-grey-border/60 p-5">
            <h3 className="text-[15px] font-bold text-text-primary mb-4">ציר זמן — מבחנים קרובים</h3>
            <div className="relative">
              {/* Week labels */}
              <div className="flex mb-2">
                {timeline.weeks.map((w, i) => (
                  <div key={i} className="flex-1 text-center text-[11px] text-text-muted font-medium">
                    {w.label}
                  </div>
                ))}
              </div>
              {/* Track */}
              <div className="relative h-8 bg-grey-bg rounded-full overflow-visible">
                {/* Today marker */}
                <div className="absolute top-0 right-0 w-0.5 h-full bg-navy-dark/20" />
                {/* Exam markers */}
                {timeline.courseMarkers.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full flex items-center"
                    style={{ right: `${m.pct}%`, transform: 'translateX(50%)' }}
                  >
                    <div className="relative group">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer"
                        style={{ backgroundColor: m.color }}
                      />
                      <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 bg-navy-dark/95 text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10">
                        <p className="font-medium">{m.courseName}</p>
                        <p className="text-white/60">{m.daysLeft} ימים</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-3">
                {timeline.courseMarkers.map((m, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-[11px] text-text-muted font-medium">{m.courseName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, idx) => {
            const daysLeft = getDaysLeft(course.examDate);
            const daysColor = daysLeft <= 14 ? 'text-red' : daysLeft <= 21 ? 'text-orange' : 'text-green';
            const daysBg = daysLeft <= 14 ? 'bg-red/8' : daysLeft <= 21 ? 'bg-orange/8' : 'bg-green/8';
            const completionPct = getCompletionPct(course.topics);
            const nextTopic = getNextTopic(course.topics);
            const priority = PRIORITY_STYLES[course.priority || 'medium'];
            const barColor = daysLeft <= 14 ? 'bg-red' : daysLeft <= 21 ? 'bg-orange' : 'bg-navy-light';

            return (
              <div
                key={course.id}
                onClick={() => onSelectCourse(course.id)}
                className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-grey-border/60 cursor-pointer hover:shadow-md hover:border-navy-light/30 transition-all duration-200 flex flex-col"
              >
                <div className="p-5 flex-1">
                  {/* Top row: name + priority badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-[15px] font-bold text-text-primary leading-snug">{course.courseName}</h3>
                    <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${priority.className}`}>
                      {priority.label}
                    </span>
                  </div>

                  {/* Exam date */}
                  <p className="text-[12px] text-text-muted mb-4">
                    מבחן: {new Date(course.examDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', timeZone: 'Asia/Jerusalem' })}
                  </p>

                  {/* Days remaining badge */}
                  <div className={`inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg ${daysBg} mb-4`}>
                    <span className={`text-[24px] font-bold leading-none ${daysColor}`}>{daysLeft}</span>
                    <span className={`text-[11px] font-medium ${daysColor}`}>ימים למבחן</span>
                  </div>

                  {/* Next topic */}
                  {nextTopic && (
                    <p className="text-[12px] text-text-muted mb-1">
                      <span className="text-text-primary font-medium">הנושא הבא: </span>
                      {nextTopic.name}
                    </p>
                  )}

                  {/* Topics progress label */}
                  <p className="text-[11px] text-text-muted mt-3">
                    {course.topics.filter(t => t.status === 'completed').length}/{course.topics.length} נושאים הושלמו
                  </p>
                </div>

                {/* Progress bar at bottom */}
                <div className="px-5 pb-4">
                  <div className="w-full bg-grey-border/50 rounded-full h-2">
                    <div
                      className={`${barColor} h-2 rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${completionPct}%` }}
                    />
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
