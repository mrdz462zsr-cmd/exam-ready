import { useState } from 'react';
import { extractTextFromPDF, extractTextsFromPDFs } from '../utils/pdfExtractor';
import { parseSyllabus } from '../utils/claudeAPI';
import { convertToMarkdown } from '../utils/markdownConverter';
import { buildSchedule } from '../utils/scheduleEngine';
import { demoCourseData, demoParsedResult } from '../utils/demoData';

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

export default function Onboarding({ onComplete }) {
  const [courseName, setCourseName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [examFiles, setExamFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isDemo) {
      setLoadingMsg('טוען נתוני הדגמה...');
      await new Promise(r => setTimeout(r, 800));
      onComplete(demoCourseData);
      return;
    }

    try {
      setLoadingMsg('מנתח סילבוס...');
      const syllabusText = await extractTextFromPDF(syllabusFile);

      let examTexts = [];
      if (examFiles.length > 0) {
        examTexts = await extractTextsFromPDFs(examFiles);
      }

      setLoadingMsg('בונה תוכנית לימוד...');
      const parsed = await parseSyllabus(syllabusText, examTexts);

      const md = convertToMarkdown({
        courseName: parsed.courseName || courseName,
        examDate,
        hoursPerWeek,
        topics: parsed.topics,
        pastExamsCount: examFiles.length,
      });
      localStorage.setItem('examready_syllabus_md', md);

      const topics = parsed.topics.map(t => ({
        ...t,
        status: 'not_started',
      }));

      const courseData = {
        courseName: parsed.courseName || courseName,
        examDate,
        hoursPerWeek,
        topics,
        pastExamsCount: examFiles.length,
      };

      const schedule = buildSchedule(topics, examDate, hoursPerWeek);
      localStorage.setItem('examready_schedule', JSON.stringify(schedule));

      onComplete(courseData);
    } catch (err) {
      setError(err.message || 'אירעה שגיאה. נסה שנית.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grey-bg flex flex-col">
      <header className="bg-navy-dark py-7 px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-light flex items-center justify-center">
            <span className="text-white font-bold text-sm">ER</span>
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold tracking-tight">ExamReady</h1>
            <p className="text-white/40 text-xs mt-0.5">תוכנית לימודים חכמה למבחנים</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-grey-border/50 p-8 w-full max-w-lg"
        >
          <h2 className="text-xl font-bold text-text-primary mb-1">יצירת תוכנית לימוד</h2>
          <p className="text-text-muted text-sm mb-7">מלא את הפרטים ונבנה עבורך תוכנית מותאמת אישית</p>

          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-text-primary mb-1.5">שם הקורס</label>
            <input
              type="text"
              required
              value={courseName}
              onChange={e => setCourseName(e.target.value)}
              className="w-full border border-grey-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary bg-grey-bg/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-light/30 focus:border-navy-light transition-all"
              placeholder="לדוגמה: אלגוריתמים ומבנה נתונים"
            />
          </div>

          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-text-primary mb-1.5">תאריך המבחן</label>
            <input
              type="date"
              required
              min={minDate}
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full border border-grey-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary bg-grey-bg/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-light/30 focus:border-navy-light transition-all"
            />
          </div>

          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-text-primary mb-1.5">שעות לימוד זמינות בשבוע</label>
            <input
              type="number"
              required
              min={1}
              max={40}
              value={hoursPerWeek}
              onChange={e => setHoursPerWeek(Number(e.target.value))}
              className="w-full border border-grey-border rounded-lg px-4 py-2.5 text-[14px] text-text-primary bg-grey-bg/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-light/30 focus:border-navy-light transition-all"
            />
          </div>

          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-text-primary mb-1.5">העלאת סילבוס PDF</label>
            <div className="border-2 border-dashed border-grey-border rounded-lg p-4 text-center hover:border-navy-light/40 transition-colors cursor-pointer">
              <input
                type="file"
                required={!isDemo}
                accept=".pdf"
                onChange={e => setSyllabusFile(e.target.files[0])}
                className="w-full text-[13px] text-text-muted file:ml-3 file:px-4 file:py-1.5 file:rounded-lg file:border-0 file:bg-navy-light file:text-white file:cursor-pointer file:text-[12px] file:font-medium"
              />
              {syllabusFile && (
                <p className="text-[12px] text-green font-medium mt-2">{syllabusFile.name}</p>
              )}
            </div>
          </div>

          <div className="mb-7">
            <label className="block text-[13px] font-semibold text-text-primary mb-1.5">
              מבחנים קודמים
              <span className="text-text-muted font-normal mr-1">(אופציונלי — משפר את דיוק התוכנית)</span>
            </label>
            <div className="border-2 border-dashed border-grey-border rounded-lg p-4 text-center hover:border-navy-light/40 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={e => setExamFiles(Array.from(e.target.files))}
                className="w-full text-[13px] text-text-muted file:ml-3 file:px-4 file:py-1.5 file:rounded-lg file:border-0 file:bg-navy-mid/80 file:text-white file:cursor-pointer file:text-[12px] file:font-medium"
              />
              {examFiles.length > 0 && (
                <p className="text-[12px] text-green font-medium mt-2">{examFiles.length} קבצים נבחרו</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red/5 border border-red/20 rounded-lg text-red text-[13px] font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-light hover:bg-navy-mid text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(45,90,160,0.3)] hover:shadow-[0_4px_12px_rgba(45,90,160,0.4)]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {loadingMsg}
              </span>
            ) : (
              'בניית תוכנית לימוד ←'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
