const ISRAEL_TZ = 'Asia/Jerusalem';

export function getIsraelDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: ISRAEL_TZ }));
}

export function buildSchedule(topics, examDate, hoursPerWeek) {
  const today = getIsraelDate();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);

  const totalDays = Math.floor((exam - today) / 86400000);
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

  if (totalDays < 3) {
    const highPriority = topics.filter(t => t.syllabusWeight === 'high');
    return {
      mode: 'emergency',
      topics: highPriority.map((t, i) => ({
        ...t,
        startWeek: 1,
        endWeek: 1,
        scheduledHours: t.estimatedHours,
        status: t.status || 'not_started',
      })),
      activeWeeks: 1,
      totalWeeks: 1,
      reviewWeek: null,
    };
  }

  if (totalDays < 14) {
    const activeWeeks = totalWeeks;
    const totalAvailableHours = activeWeeks * hoursPerWeek;
    const totalEstimatedHours = topics.reduce((sum, t) => sum + t.estimatedHours, 0);
    const scaleFactor = totalAvailableHours / totalEstimatedHours;

    let currentWeek = 1;
    const scheduled = topics.map(topic => {
      const scaledHours = topic.estimatedHours * scaleFactor;
      const startWeek = currentWeek;
      const weeksNeeded = Math.max(1, Math.ceil(scaledHours / hoursPerWeek));
      const endWeek = Math.min(startWeek + weeksNeeded - 1, activeWeeks);
      currentWeek = endWeek + 1;
      if (currentWeek > activeWeeks) currentWeek = activeWeeks;
      return {
        ...topic,
        startWeek,
        endWeek,
        scheduledHours: scaledHours,
        status: topic.status || 'not_started',
      };
    });

    return { mode: 'compressed', topics: scheduled, activeWeeks, totalWeeks, reviewWeek: null };
  }

  const activeWeeks = Math.max(1, totalWeeks - 1);
  const totalAvailableHours = activeWeeks * hoursPerWeek;
  const totalEstimatedHours = topics.reduce((sum, t) => sum + t.estimatedHours, 0);
  const scaleFactor = totalAvailableHours / totalEstimatedHours;

  let currentWeek = 1;
  const scheduled = topics.map(topic => {
    const scaledHours = topic.estimatedHours * scaleFactor;
    const startWeek = currentWeek;
    const weeksNeeded = Math.max(1, Math.ceil(scaledHours / hoursPerWeek));
    const endWeek = Math.min(startWeek + weeksNeeded - 1, activeWeeks);
    currentWeek = endWeek + 1;
    if (currentWeek > activeWeeks) currentWeek = activeWeeks;
    return {
      ...topic,
      startWeek,
      endWeek,
      scheduledHours: scaledHours,
      status: topic.status || 'not_started',
    };
  });

  return { mode: 'normal', topics: scheduled, activeWeeks, totalWeeks, reviewWeek: totalWeeks };
}

export function recalculate(allTopics, hoursPerWeek, examDate) {
  const completed = allTopics.filter(t => t.status === 'completed');
  const remaining = allTopics.filter(t => t.status !== 'completed');

  const schedule = buildSchedule(remaining, examDate, hoursPerWeek);

  schedule.topics = [...completed.map(t => ({ ...t, startWeek: 1, endWeek: 1 })), ...schedule.topics];
  return schedule;
}

export function getCurrentWeek(examDate) {
  const today = getIsraelDate();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const totalDays = Math.floor((exam - today) / 86400000);
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));
  const daysPassed = Math.max(0, totalDays - Math.floor((exam - today) / 86400000));
  const startDate = new Date(exam);
  startDate.setDate(startDate.getDate() - totalWeeks * 7);
  const elapsed = Math.floor((today - startDate) / 86400000);
  return Math.max(1, Math.ceil(elapsed / 7));
}

export function computeTopicStatuses(schedule, examDate) {
  const today = getIsraelDate();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const totalDays = Math.floor((exam - today) / 86400000);
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

  const startDate = new Date(exam);
  startDate.setDate(startDate.getDate() - totalWeeks * 7);
  const elapsed = Math.floor((today - startDate) / 86400000);
  const currentWeek = Math.max(1, Math.ceil(elapsed / 7));

  return schedule.topics.map(topic => {
    if (topic.status === 'completed') return { ...topic, computedStatus: 'completed' };
    if (topic.status === 'in_progress') {
      if (currentWeek > topic.endWeek) return { ...topic, computedStatus: 'at_risk' };
      return { ...topic, computedStatus: 'in_progress' };
    }
    if (currentWeek > topic.endWeek) return { ...topic, computedStatus: 'at_risk' };
    if (currentWeek >= topic.startWeek && currentWeek <= topic.endWeek) return { ...topic, computedStatus: 'current' };
    return { ...topic, computedStatus: 'upcoming' };
  });
}

export function computeOverallStatus(topics, examDate, hoursPerWeek) {
  const today = getIsraelDate();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const totalDays = Math.floor((exam - today) / 86400000);

  if (totalDays <= 0) return 'behind';

  const totalHours = topics.reduce((sum, t) => sum + t.estimatedHours, 0);
  const completedHours = topics
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.estimatedHours, 0);

  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));
  const startDate = new Date(exam);
  startDate.setDate(startDate.getDate() - totalWeeks * 7);
  const elapsed = Math.floor((today - startDate) / 86400000);
  const progress = elapsed / (totalWeeks * 7);

  const expectedCompletion = progress * totalHours;
  const actualCompletion = completedHours;

  const gap = expectedCompletion - actualCompletion;
  const gapRatio = gap / totalHours;

  if (gapRatio > 0.25) return 'behind';
  if (gapRatio > 0.1) return 'at_risk';
  return 'on_track';
}
