import { useState, useEffect, useCallback } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import CoursesOverview from './components/CoursesOverview';
import { demoCourseData, demoCoursesData } from './utils/demoData';
import { buildSchedule, recalculate, computeTopicStatuses, computeOverallStatus } from './utils/scheduleEngine';

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

function loadCoursesFromStorage() {
  try {
    const data = localStorage.getItem('examready_courses');
    if (data) return JSON.parse(data);
    // Migrate old single-course data
    const old = localStorage.getItem('examready_course');
    if (old) {
      const course = JSON.parse(old);
      if (!course.id) course.id = 'course-' + Date.now();
      if (!course.priority) course.priority = 'medium';
      return [course];
    }
  } catch {}
  return null;
}

function saveCoursesToStorage(courses) {
  localStorage.setItem('examready_courses', JSON.stringify(courses));
}

export default function App() {
  const [courses, setCourses] = useState(() => {
    if (isDemo) return demoCoursesData;
    return loadCoursesFromStorage() || [];
  });

  const [activeCourseId, setActiveCourseId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [schedule, setSchedule] = useState(null);

  const activeCourse = courses.find(c => c.id === activeCourseId) || null;

  const rebuildSchedule = useCallback((data) => {
    if (!data) return;
    const sched = recalculate(data.topics, data.hoursPerWeek, data.examDate);
    const withStatuses = computeTopicStatuses(sched, data.examDate);
    setSchedule({ ...sched, topics: withStatuses });
  }, []);

  useEffect(() => {
    if (activeCourse) {
      rebuildSchedule(activeCourse);
    } else {
      setSchedule(null);
    }
  }, [activeCourse, rebuildSchedule]);

  useEffect(() => {
    if (!isDemo && courses.length > 0) {
      saveCoursesToStorage(courses);
    }
  }, [courses]);

  const handleOnboardingComplete = (data) => {
    const newCourse = { ...data, id: 'course-' + Date.now(), priority: 'medium' };
    setCourses(prev => [...prev, newCourse]);
    setShowOnboarding(false);
    setActiveCourseId(newCourse.id);
  };

  const handleTopicStatusChange = (topicId, newStatus) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== activeCourseId) return c;
      return {
        ...c,
        topics: c.topics.map(t =>
          t.id === topicId ? { ...t, status: newStatus } : t
        ),
      };
    }));
  };

  const handleHoursChange = (newHours) => {
    setCourses(prev => prev.map(c =>
      c.id === activeCourseId ? { ...c, hoursPerWeek: newHours } : c
    ));
  };

  const handleResetCourse = () => {
    setActiveCourseId(null);
  };

  const handleResetAll = () => {
    localStorage.removeItem('examready_courses');
    localStorage.removeItem('examready_course');
    localStorage.removeItem('examready_syllabus_md');
    localStorage.removeItem('examready_schedule');
    setCourses(isDemo ? demoCoursesData : []);
    setActiveCourseId(null);
    setSchedule(null);
  };

  // Onboarding for adding a new course
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} onDemoEnter={() => setShowOnboarding(false)} />;
  }

  // No courses and not demo → show onboarding
  if (courses.length === 0) {
    return <Onboarding onComplete={handleOnboardingComplete} onDemoEnter={() => setShowOnboarding(false)} />;
  }

  // Single course drill-down view
  if (activeCourseId && activeCourse) {
    if (!schedule) {
      return (
        <div className="flex items-center justify-center h-screen bg-grey-bg">
          <p className="text-text-muted text-lg">טוען...</p>
        </div>
      );
    }

    const overallStatus = computeOverallStatus(activeCourse.topics, activeCourse.examDate, activeCourse.hoursPerWeek);

    return (
      <>
        {isDemo && (
          <div className="bg-orange/90 text-white text-center py-1.5 text-[12px] font-medium tracking-wide">
            מצב הדגמה — נתונים לדוגמה בלבד
          </div>
        )}
        <Dashboard
          courseData={activeCourse}
          schedule={schedule}
          overallStatus={overallStatus}
          onTopicStatusChange={handleTopicStatusChange}
          onHoursChange={handleHoursChange}
          onReset={handleResetCourse}
        />
      </>
    );
  }

  // Multi-course overview
  return (
    <>
      {isDemo && (
        <div className="bg-orange/90 text-white text-center py-1.5 text-[12px] font-medium tracking-wide">
          מצב הדגמה — נתונים לדוגמה בלבד
        </div>
      )}
      <CoursesOverview
        courses={courses}
        onSelectCourse={(id) => setActiveCourseId(id)}
        onAddCourse={() => setShowOnboarding(true)}
        onReset={handleResetAll}
      />
    </>
  );
}
