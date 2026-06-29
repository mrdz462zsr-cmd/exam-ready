import { useMemo } from 'react';
import { getDaysLeft } from '../utils/dateUtils';

export default function StatusStrip({ overallStatus, topics, examDate }) {
  const message = useMemo(() => {
    const nextTopic = topics.find(
      t => t.computedStatus === 'current' || t.computedStatus === 'upcoming' || t.computedStatus === 'in_progress'
    );

    if (overallStatus === 'on_track') {
      const topicName = nextTopic ? nextTopic.name : '';
      return {
        text: `במסלול — הנושא הבא: ${topicName}, השבוע`,
        dotColor: 'bg-green',
        bgColor: 'bg-green/10',
        borderColor: 'border-green/20',
      };
    }

    if (overallStatus === 'at_risk') {
      const completedHours = topics
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.estimatedHours, 0);
      const totalHours = topics.reduce((sum, t) => sum + t.estimatedHours, 0);
      const remainingHours = totalHours - completedHours;
      const daysLeft = Math.max(1, getDaysLeft(examDate));
      const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
      const neededExtra = Math.ceil(remainingHours / weeksLeft) - 10;
      const extra = Math.max(1, neededExtra);

      return {
        text: `בסיכון — כדאי להוסיף ${extra} שעות השבוע`,
        dotColor: 'bg-orange',
        bgColor: 'bg-orange/10',
        borderColor: 'border-orange/20',
      };
    }

    return {
      text: 'פיגור — התוכנית עודכנה בהתאם למצב הנוכחי',
      dotColor: 'bg-red',
      bgColor: 'bg-red/10',
      borderColor: 'border-red/20',
    };
  }, [overallStatus, topics, examDate]);

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2 rounded-lg border ${message.bgColor} ${message.borderColor}`}>
      <span className={`w-2 h-2 rounded-full ${message.dotColor} shadow-sm`} />
      <span className="text-[13px] text-white/85 font-medium">{message.text}</span>
    </div>
  );
}
