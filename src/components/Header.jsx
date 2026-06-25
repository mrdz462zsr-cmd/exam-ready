import { useMemo } from 'react';
import StatusStrip from './StatusStrip';

export default function Header({ courseName, examDate, overallStatus, topics, onReset }) {
  const daysLeft = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((exam - today) / 86400000));
  }, [examDate]);

  const examFormatted = new Date(examDate).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Jerusalem',
  });

  return (
    <header className="bg-navy-dark">
      <div className="px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Right: Logo + course */}
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-navy-light flex items-center justify-center">
              <span className="text-white font-bold text-sm">ER</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-white tracking-tight">ExamReady</h1>
                <div className="w-px h-5 bg-white/20" />
                <span className="text-white/90 text-[15px] font-medium">{courseName}</span>
              </div>
              <p className="text-white/40 text-xs mt-0.5">
                מבחן ב-{examFormatted}
              </p>
            </div>
          </div>

          {/* Center: Status strip */}
          <StatusStrip
            overallStatus={overallStatus}
            topics={topics}
            examDate={examDate}
          />

          {/* Left: Reset button */}
          <button
            onClick={onReset}
            className="border border-white/15 text-white/50 hover:text-white hover:border-white/40 hover:bg-white/5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          >
            איפוס / קורס חדש
          </button>
        </div>
      </div>
    </header>
  );
}
