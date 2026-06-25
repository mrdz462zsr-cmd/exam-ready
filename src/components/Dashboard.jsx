import Header from './Header';
import KPIBar from './KPIBar';
import GanttTimeline from './GanttTimeline';
import TopicTable from './TopicTable';
import ProgressChart from './ProgressChart';

export default function Dashboard({
  courseData,
  schedule,
  overallStatus,
  onTopicStatusChange,
  onHoursChange,
  onReset,
}) {
  return (
    <div className="min-h-screen bg-grey-bg">
      <Header
        courseName={courseData.courseName}
        examDate={courseData.examDate}
        overallStatus={overallStatus}
        topics={schedule.topics}
        onReset={onReset}
      />

      <div className="p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr_320px] gap-5 lg:gap-6">
          {/* Sidebar - KPI Cards */}
          <div className="order-1 md:order-1">
            <KPIBar
              topics={courseData.topics}
              examDate={courseData.examDate}
              overallStatus={overallStatus}
            />
          </div>

          {/* Main panel */}
          <div className="order-2 md:order-2 flex flex-col gap-5 lg:gap-6">
            <GanttTimeline
              schedule={schedule}
              examDate={courseData.examDate}
              onTopicStatusChange={onTopicStatusChange}
            />
            <TopicTable
              topics={schedule.topics}
              pastExamsCount={courseData.pastExamsCount}
              onTopicStatusChange={onTopicStatusChange}
            />
          </div>

          {/* Right panel */}
          <div className="order-3 md:order-3">
            <ProgressChart
              topics={courseData.topics}
              examDate={courseData.examDate}
              schedule={schedule}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
