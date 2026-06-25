import { useState, useMemo } from 'react';

const STATUS_COLORS = {
  completed: { bar: 'bg-green', ring: 'ring-green/20' },
  in_progress: { bar: 'bg-navy-light', ring: 'ring-navy-light/20' },
  current: { bar: 'bg-navy-light', ring: 'ring-navy-light/20' },
  upcoming: { bar: 'bg-gray-300', ring: 'ring-gray-200' },
  at_risk: { bar: 'bg-orange', ring: 'ring-orange/20' },
  behind: { bar: 'bg-red', ring: 'ring-red/20' },
};

export default function GanttTimeline({ schedule, examDate, onTopicStatusChange }) {
  const [expandedTopic, setExpandedTopic] = useState(null);

  const { totalWeeks, currentWeek, weekLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    const totalDays = Math.max(1, Math.floor((exam - today) / 86400000));
    const tw = Math.max(1, Math.ceil(totalDays / 7));

    const startDate = new Date(today);
    const labels = [];
    for (let i = 0; i < tw; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      labels.push(
        weekStart.toLocaleDateString('he-IL', {
          day: 'numeric',
          month: 'short',
          timeZone: 'Asia/Jerusalem',
        })
      );
    }

    const elapsed = Math.floor((today - startDate) / 86400000);
    const cw = Math.max(1, Math.ceil(elapsed / 7) || 1);

    return { totalWeeks: tw, currentWeek: cw, weekLabels: labels };
  }, [examDate]);

  const topics = schedule.topics;

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-grey-border/60 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-bold text-text-primary">ציר זמן — גנט</h3>
        <span className="text-[11px] text-text-muted bg-grey-bg px-2.5 py-1 rounded-md font-medium">
          {topics.length} נושאים
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Week headers */}
          <div className="flex items-center mb-3 mr-40">
            {Array.from({ length: totalWeeks }, (_, i) => (
              <div
                key={i}
                className={`flex-1 text-center text-[11px] font-medium relative pb-2 ${
                  i + 1 === currentWeek ? 'text-navy-light' : 'text-text-muted'
                }`}
              >
                <span className={`${i + 1 === currentWeek ? 'bg-navy-light/10 px-2 py-0.5 rounded-md' : ''}`}>
                  {weekLabels[i] || `ש׳${i + 1}`}
                </span>
              </div>
            ))}
          </div>

          {/* Current week indicator line */}
          <div className="relative">
            {/* Topic rows */}
            {topics.map((topic, idx) => {
              const status = topic.computedStatus || topic.status || 'upcoming';
              const colors = STATUS_COLORS[status] || STATUS_COLORS.upcoming;
              const startPct = ((topic.startWeek - 1) / totalWeeks) * 100;
              const widthPct = ((topic.endWeek - topic.startWeek + 1) / totalWeeks) * 100;

              return (
                <div key={topic.id}>
                  <div
                    className={`flex items-center cursor-pointer rounded-lg py-2 px-1 transition-colors duration-150 ${
                      expandedTopic === topic.id ? 'bg-grey-bg/80' : 'hover:bg-grey-bg/50'
                    }`}
                    onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                  >
                    <span className="w-40 text-[13px] text-text-primary truncate shrink-0 pl-3 font-medium">
                      {topic.name}
                    </span>
                    <div className="flex-1 relative h-8">
                      <div
                        className={`absolute top-0.5 h-7 rounded-md ${colors.bar} transition-all duration-300 shadow-sm`}
                        style={{
                          right: `${startPct}%`,
                          width: `${Math.max(widthPct, 4)}%`,
                        }}
                      >
                        <span className="text-[10px] text-white/90 px-2 leading-7 whitespace-nowrap font-medium">
                          {topic.scheduledHours ? `${Math.round(topic.scheduledHours)} שעות` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded subtopics */}
                  {expandedTopic === topic.id && (
                    <div className="mr-40 bg-grey-bg/60 rounded-lg p-4 mb-2 border border-grey-border/40">
                      {topic.subtopics.map((sub, i) => (
                        <label
                          key={i}
                          className="flex items-center gap-2.5 py-1.5 text-[13px] text-text-primary cursor-pointer hover:text-navy-light transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={topic.status === 'completed'}
                            onChange={() => {
                              if (topic.status !== 'completed') {
                                onTopicStatusChange(topic.id, 'completed');
                              } else {
                                onTopicStatusChange(topic.id, 'not_started');
                              }
                            }}
                            className="accent-navy-light w-4 h-4 rounded"
                          />
                          {sub}
                        </label>
                      ))}
                    </div>
                  )}

                  {idx < topics.length - 1 && expandedTopic !== topic.id && (
                    <div className="mr-40 border-b border-grey-border/30" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-5 mt-5 pt-4 border-t border-grey-border/50">
        {[
          { label: 'הושלם', color: 'bg-green' },
          { label: 'בתהליך', color: 'bg-navy-light' },
          { label: 'לא התחיל', color: 'bg-gray-300' },
          { label: 'בסיכון', color: 'bg-orange' },
          { label: 'קריטי', color: 'bg-red' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
            <span className="text-[11px] text-text-muted font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
