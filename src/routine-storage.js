import {questions, buildRoutine} from './routine.js';
export const routineStorageKey = 'skin-signal:routine:v1';
export function validSavedRoutine(value) {
  if (!value || value.version !== 1 || !value.answers || !Number.isInteger(value.step) || value.step < 0 || value.step > questions.length) return false;
  if (!questions.every(q => q.options.some(([option]) => option === value.answers[q.id]))) return false;
  const length = buildRoutine(value.answers).steps.length;
  return Array.isArray(value.checked) && value.checked.every(n => Number.isInteger(n) && n >= 0 && n < length) && new Set(value.checked).size === value.checked.length;
}
export function routineText(answers, checked) {
  const routine = buildRoutine(answers);
  return ['Minha rotina · Skin Signal', `${routine.moment} · ${routine.duration}${answers.moment === 'both' ? ' por momento' : ''}`, '', routine.anchor, '', ...routine.steps.map((step, i) => `${checked.includes(i) ? '✓' : '☐'} ${step}`), '', 'Checklist de organização de hábitos, sem recomendações de tratamento.', 'https://skin-signal.vercel.app/rotina'].join('\n');
}
