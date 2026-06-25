const SYSTEM_PROMPT = `You are an academic syllabus and exam analyzer for Israeli university courses.
You will receive syllabus text and optionally past exam texts.
Return ONLY a valid JSON object. No explanation, no markdown, no extra text.`;

function buildUserPrompt(syllabusText, examTexts) {
  let prompt = `SYLLABUS:\n${syllabusText}\n\n`;

  if (examTexts && examTexts.length > 0) {
    prompt += `PAST EXAMS:\n${examTexts.join('\n---EXAM BREAK---\n')}\n\n`;
  } else {
    prompt += `PAST EXAMS (may be empty):\n\n`;
  }

  prompt += `Return this exact JSON structure:
{
  "courseName": "string in Hebrew if syllabus is in Hebrew",
  "topics": [
    {
      "id": 1,
      "name": "string",
      "subtopics": ["string", "string"],
      "syllabusWeight": "high|medium|low",
      "examFrequency": 0.0,
      "priorityScore": 0.0,
      "estimatedHours": number
    }
  ]
}

Rules:
- examFrequency: ratio 0.0–1.0 of past exams where this topic appeared. 0.0 if no past exams provided.
- priorityScore: calculate as (syllabusWeight_numeric * 0.6) + (examFrequency * 0.4) where high=1.0, medium=0.6, low=0.3
- estimatedHours: realistic per topic. Total across all topics should be 40–80 hours for a semester course.
- Sort topics by priorityScore descending in the output array.`;

  return prompt;
}

export function validateParsedResult(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.courseName || typeof data.courseName !== 'string') return false;
  if (!Array.isArray(data.topics) || data.topics.length === 0) return false;

  return data.topics.every(t =>
    t.id && t.name && Array.isArray(t.subtopics) &&
    ['high', 'medium', 'low'].includes(t.syllabusWeight) &&
    typeof t.examFrequency === 'number' &&
    typeof t.priorityScore === 'number' &&
    typeof t.estimatedHours === 'number'
  );
}

export async function parseSyllabus(syllabusText, examTexts = []) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('מפתח API חסר. הוסף VITE_ANTHROPIC_API_KEY לקובץ .env');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(syllabusText, examTexts),
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`שגיאת API: ${response.status} — ${err}`);
  }

  const result = await response.json();
  let text = result.content[0].text.trim();

  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Find the JSON object boundaries if there's extra text
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('התגובה מ-Claude אינה JSON תקין. נסה שנית.');
  }

  if (!validateParsedResult(parsed)) {
    throw new Error('מבנה התגובה אינו תואם את הפורמט הנדרש. נסה שנית.');
  }

  return parsed;
}
