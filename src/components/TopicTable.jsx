import { useState, useMemo } from 'react';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'לא התחלתי' },
  { value: 'in_progress', label: 'בתהליך' },
  { value: 'completed', label: 'הושלם' },
];

const PRIORITY_LABELS = {
  high: { label: 'גבוהה', className: 'bg-red/10 text-red border border-red/15' },
  medium: { label: 'בינונית', className: 'bg-orange/10 text-orange border border-orange/15' },
  low: { label: 'נמוכה', className: 'bg-grey-bg text-text-muted border border-grey-border/60' },
};

const STATUS_STYLES = {
  not_started: 'bg-grey-bg text-text-muted border-grey-border',
  in_progress: 'bg-navy-light/10 text-navy-light border-navy-light/20',
  completed: 'bg-green/10 text-green border-green/20',
};

const COLUMNS = [
  { key: 'name', label: 'נושא' },
  { key: 'subtopics', label: 'תת-נושאים' },
  { key: 'estimatedHours', label: 'שעות מוערכות' },
  { key: 'examFrequency', label: 'תדירות במבחנים' },
  { key: 'syllabusWeight', label: 'עדיפות' },
  { key: 'status', label: 'סטטוס' },
];

const WEIGHT_ORDER = { high: 3, medium: 2, low: 1 };
const STATUS_ORDER = { not_started: 1, in_progress: 2, completed: 3 };

export default function TopicTable({ topics, pastExamsCount, onTopicStatusChange }) {
  const [sortKey, setSortKey] = useState('priorityScore');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState(null);

  const sorted = useMemo(() => {
    const arr = [...topics];
    arr.sort((a, b) => {
      let va, vb;
      switch (sortKey) {
        case 'subtopics':
          va = a.subtopics.length;
          vb = b.subtopics.length;
          break;
        case 'syllabusWeight':
          va = WEIGHT_ORDER[a.syllabusWeight] || 0;
          vb = WEIGHT_ORDER[b.syllabusWeight] || 0;
          break;
        case 'status':
          va = STATUS_ORDER[a.status] || 0;
          vb = STATUS_ORDER[b.status] || 0;
          break;
        default:
          va = a[sortKey];
          vb = b[sortKey];
      }
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb, 'he') : vb.localeCompare(va, 'he');
      return sortAsc ? va - vb : vb - va;
    });
    return arr;
  }, [topics, sortKey, sortAsc]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-grey-border/60 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-bold text-text-primary">טבלת נושאים</h3>
        <span className="text-[11px] text-text-muted bg-grey-bg px-2.5 py-1 rounded-md font-medium">
          {topics.filter(t => t.status === 'completed').length}/{topics.length} הושלמו
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b-2 border-grey-border/70">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold cursor-pointer hover:text-navy-light select-none transition-colors"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-navy-light">{sortAsc ? '▲' : '▼'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((topic, idx) => {
              const priority = PRIORITY_LABELS[topic.syllabusWeight] || PRIORITY_LABELS.low;
              return (
                <tr
                  key={topic.id}
                  className={`border-b border-grey-border/30 hover:bg-grey-bg/50 transition-colors ${
                    idx % 2 === 1 ? 'bg-grey-bg/20' : ''
                  }`}
                >
                  <td
                    className="py-3.5 px-3 font-medium cursor-pointer hover:text-navy-light transition-colors"
                    onClick={() =>
                      setExpandedTopic(expandedTopic === topic.id ? null : topic.id)
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] transition-transform duration-200 text-text-muted ${expandedTopic === topic.id ? 'rotate-90' : ''}`}>
                        ◀
                      </span>
                      {topic.name}
                    </div>
                    {expandedTopic === topic.id && (
                      <ul className="mt-2.5 font-normal text-text-muted list-none mr-5 space-y-1">
                        {topic.subtopics.map((sub, i) => (
                          <li key={i} className="flex items-center gap-2 text-[12px]">
                            <span className="w-1 h-1 rounded-full bg-grey-border inline-block shrink-0" />
                            {sub}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center text-text-muted">
                    <span className="bg-grey-bg px-2 py-0.5 rounded text-[12px]">{topic.subtopics.length}</span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-medium">{topic.estimatedHours}</td>
                  <td className="py-3.5 px-3 text-center">
                    {pastExamsCount > 0 && topic.examFrequency > 0 ? (
                      <span className="bg-blue-accent/8 text-blue-accent border border-blue-accent/15 px-2.5 py-1 rounded-full text-[11px] font-medium">
                        הופיע ב-{Math.round(topic.examFrequency * pastExamsCount)}/{pastExamsCount} מבחנים
                      </span>
                    ) : (
                      <span className="text-text-muted text-[11px]">אין נתונים</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${priority.className}`}>
                      {priority.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <select
                      value={topic.status}
                      onChange={e => onTopicStatusChange(topic.id, e.target.value)}
                      className={`border rounded-lg px-3 py-1.5 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-navy-light/30 transition-all cursor-pointer ${STATUS_STYLES[topic.status] || STATUS_STYLES.not_started}`}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
