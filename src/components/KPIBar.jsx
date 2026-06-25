import { useMemo } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

function KPICard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border border-grey-border/60 p-5 border-r-[3px] border-r-navy-mid min-w-[170px]">
      <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2 font-semibold">{title}</p>
      {children}
    </div>
  );
}

export default function KPIBar({ topics, examDate, overallStatus }) {
  const daysLeft = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((exam - today) / 86400000));
  }, [examDate]);

  const daysColor = daysLeft <= 14 ? 'text-red' : daysLeft <= 21 ? 'text-orange' : 'text-green';

  const completed = topics.filter(t => t.status === 'completed').length;
  const total = topics.length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const completedHours = topics
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.estimatedHours, 0);
  const totalHours = topics.reduce((sum, t) => sum + t.estimatedHours, 0);
  const coveragePct = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

  const radialData = [{ value: completionPct, fill: '#2D5AA0' }];

  const statusLabel = overallStatus === 'on_track' ? 'במסלול' : overallStatus === 'at_risk' ? 'בסיכון' : 'פיגור';
  const statusColor =
    overallStatus === 'on_track'
      ? 'bg-green/12 text-green border border-green/20'
      : overallStatus === 'at_risk'
        ? 'bg-orange/12 text-orange border border-orange/20'
        : 'bg-red/12 text-red border border-red/20';

  return (
    <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 snap-x md:snap-none">
      <KPICard title="ימים למבחן">
        <div className="flex items-baseline gap-1.5">
          <p className={`text-[32px] font-bold leading-none ${daysColor}`}>{daysLeft}</p>
          <span className="text-text-muted text-xs">ימים</span>
        </div>
      </KPICard>

      <KPICard title="נושאים שהושלמו">
        <div className="flex items-center justify-between">
          <p className="text-[28px] font-bold text-text-primary leading-none">
            <span>{completed}</span>
            <span className="text-text-muted text-lg font-normal mx-0.5">/</span>
            <span className="text-text-muted text-lg font-normal">{total}</span>
          </p>
          <div className="w-14 h-14 -mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="65%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={90 - (completionPct / 100) * 360}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
                <RadialBar
                  dataKey="value"
                  background={{ fill: '#E2E8F0' }}
                  cornerRadius={6}
                  angleAxisId={0}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </KPICard>

      <KPICard title="כיסוי חומר">
        <p className="text-[28px] font-bold text-text-primary leading-none mb-3">
          {coveragePct}<span className="text-lg text-text-muted font-normal">%</span>
        </p>
        <div className="w-full bg-grey-border/70 rounded-full h-1.5">
          <div
            className="bg-navy-light h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${coveragePct}%` }}
          />
        </div>
      </KPICard>

      <KPICard title="סטטוס כולל">
        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${statusColor}`}>
          {statusLabel}
        </span>
      </KPICard>
    </div>
  );
}
