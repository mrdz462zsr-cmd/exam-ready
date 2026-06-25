const weightLabels = {
  high: 'גבוהה',
  medium: 'בינונית',
  low: 'נמוכה',
};

export function convertToMarkdown(courseData) {
  const { courseName, examDate, hoursPerWeek, topics, pastExamsCount } = courseData;

  const examDateFormatted = new Date(examDate).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jerusalem',
  });

  let md = `# ${courseName}\n`;
  md += `- תאריך מבחן: ${examDateFormatted}\n`;
  md += `- סה"כ נושאים: ${topics.length}\n`;
  md += `- שעות לימוד שבועיות: ${hoursPerWeek}\n\n`;
  md += `## נושאים\n\n`;

  topics.forEach((topic, i) => {
    md += `### ${i + 1}. ${topic.name}\n`;
    md += `- עדיפות: ${weightLabels[topic.syllabusWeight] || topic.syllabusWeight}\n`;
    md += `- שעות מוערכות: ${topic.estimatedHours}\n`;

    if (pastExamsCount && pastExamsCount > 0 && topic.examFrequency > 0) {
      const appeared = Math.round(topic.examFrequency * pastExamsCount);
      md += `- תדירות במבחנים: ${appeared}/${pastExamsCount}\n`;
    } else {
      md += `- תדירות במבחנים: אין נתונים\n`;
    }

    md += `- תת-נושאים:\n`;
    topic.subtopics.forEach(sub => {
      md += `  - ${sub}\n`;
    });
    md += `\n`;
  });

  return md;
}
