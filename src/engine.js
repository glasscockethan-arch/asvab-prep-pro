/** Pure study primitives; practice accuracy is never an official exam score. */
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function score(questions, answers) {
  if (answers.length !== questions.length) throw new Error('Answer count does not match questions.');
  const details = questions.map((question, i) => {
    const chosen = answers[i];
    if (chosen !== null && (!Number.isInteger(chosen) || chosen < 0 || chosen >= question.options.length)) throw new Error('Invalid answer choice.');
    return {id:question.id, chosen, correct:chosen === question.answer};
  });
  const correct = details.filter(item => item.correct).length;
  return {correct, total:questions.length, percent:questions.length ? Math.round(correct / questions.length * 100) : 0, details};
}
export function secondsLeft(deadline, now = Date.now()) {
  return deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000));
}
export function questionsFor(course, mode = 'practice', lessonId = null, difficulty = 'all') {
  let questions = lessonId ? course.lessons.find(lesson => lesson.id === lessonId)?.questions : course.lessons.flatMap(lesson => lesson.questions);
  if (!questions) throw new Error('Lesson not found.');
  if (mode === 'assessment') questions = course.assessment;
  if (difficulty !== 'all') questions = questions.filter(question => question.difficulty === difficulty);
  if (mode === 'diagnostic') return questions.slice(0, 6);
  return [...questions];
}
export function validateCatalog(data) {
  if (data.schemaVersion !== 1 || !Array.isArray(data.courses) || !data.courses.length) throw new Error('Unsupported catalog.');
  const ids = new Set();
  for (const course of data.courses) {
    if (!/^[a-z0-9-]+$/.test(course.id) || ids.has(course.id)) throw new Error('Duplicate or invalid course ID.');
    ids.add(course.id);
    for (const field of ['title','academy','summary','audience','editorialStatus']) if (typeof course[field] !== 'string' || !course[field]) throw new Error(`Missing ${field}.`);
    for (const field of ['objectives','prerequisites','lessons','assessment']) if (!Array.isArray(course[field]) || !course[field].length) throw new Error(`Missing ${field}.`);
    const questionIds = new Set(), lessonIds = new Set();
    for (const lesson of course.lessons) {
      if (!lesson.id || lessonIds.has(lesson.id) || !lesson.title || !lesson.paragraphs?.length || !lesson.example?.steps?.length || !lesson.questions?.length) throw new Error('Invalid lesson.');
      lessonIds.add(lesson.id);
    }
    for (const question of [...course.lessons.flatMap(lesson => lesson.questions), ...course.assessment]) {
      if (!question.id || questionIds.has(question.id) || !question.prompt || !question.explanation || !question.misconception || !['introductory','application'].includes(question.difficulty)) throw new Error('Invalid question.');
      questionIds.add(question.id);
      if (!Array.isArray(question.options) || question.options.length !== 4 || question.options.some(item => typeof item !== 'string') || new Set(question.options).size !== 4 || !Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) throw new Error('Invalid question choices.');
    }
  }
  return data;
}
