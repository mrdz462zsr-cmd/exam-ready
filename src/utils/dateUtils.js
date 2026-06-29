export function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getDaysLeft(examDate) {
  const today = normalizeDate(new Date());
  const exam = normalizeDate(examDate);
  return Math.max(0, Math.floor((exam - today) / 86400000));
}

export function getDaysColor(daysLeft) {
  if (daysLeft <= 14) return 'text-red';
  if (daysLeft <= 21) return 'text-orange';
  return 'text-green';
}
