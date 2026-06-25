import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
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
}

export default function ProgressChart({ topics, examDate, schedule }) {
  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    const totalDays = Math.max(1, Math.floor((exam - today) / 86400000));
    const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

    const totalHours = topics.reduce((sum, t) => sum + t.estimatedHours, 0);
    const completedHours = topics
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.estimatedHours, 0);
    const actualPct = totalHours > 0 ? (completedHours / totalHours) * 100 : 0;

    const data = [];
    for (let w = 0; w <= totalWeeks; w++) {
      const weekDate = new Date(today);
      weekDate.setDate(weekDate.getDate() + w * 7);
      const label = weekDate.toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Jerusalem',
      });

      const plannedPct = Math.min(100, Math.round((w / totalWeeks) * 100));

      let actual = null;
      if (w === 0) {
        actual = Math.round(actualPct);
      } else if (w <= 1) {
        actual = Math.round(actualPct);
      }

      data.push({
        week: label,
        planned: plannedPct,
        actual,
      });
    }

    return { data, actualPct, gap: data.length > 0 ? (data[0]?.planned || 0) - actualPct : 0 };
  }, [topics, examDate]);

  const actualLineColor = useMemo(() => {
    const { gap } = chartData;
    if (gap > 25) return '#EF4444';
    if (gap > 15) return '#F59E0B';
    return '#22C55E';
  }, [chartData]);

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-grey-border/60 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-bold text-text-primary">התקדמות מול תוכנית</h3>
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

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData.data} margin={{ top: 10, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.7} vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Heebo' }}
            axisLine={{ stroke: '#E2E8F0' }}
            tickLine={false}
            reversed
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Heebo' }}
            tickFormatter={v => `${v}%`}
            axisLine={false}
            tickLine={false}
            orientation="right"
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={100} stroke="#E2E8F0" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="planned"
            stroke="#2D5AA0"
            strokeDasharray="8 4"
            strokeWidth={2}
            dot={false}
            name="planned"
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke={actualLineColor}
            strokeWidth={2.5}
            dot={{ fill: actualLineColor, r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            connectNulls={false}
            name="actual"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
