import {normalizeCatalog, courseQuestions} from './curriculum.js';
import {verifyMathematicalKey} from './content-checks.js';
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
export function questionsFor(course, mode = 'practice', lessonId = null, difficulty = 'all', chapterId = null) {
  let questions = lessonId ? course.lessons.find(lesson => lesson.id === lessonId)?.questions : course.lessons.flatMap(lesson => lesson.questions);
  if (!questions) throw new Error('Lesson not found.');
  if (mode === 'assessment') questions = course.assessment;
  if (mode === 'chapter') {
    questions = course.chapters?.find(chapter => chapter.id === chapterId)?.assessment;
    if (!questions) throw new Error('Chapter not found.');
  }
  if (difficulty !== 'all') questions = questions.filter(question => question.difficulty === difficulty);
  if (mode === 'diagnostic') {
    const selected = [];
    const lessons = course.lessons;
    const count = Math.min(6,lessons.length);
    for (let i=0;i<count;i++) selected.push(lessons[count===1?0:Math.round(i*(lessons.length-1)/(count-1))].questions[0]);
    for (const question of questions) if (selected.length < 6 && !selected.includes(question)) selected.push(question);
    return selected;
  }
  return [...questions];
}
export function validateCatalog(raw) {
  const data = normalizeCatalog(raw);
  if (!Array.isArray(data.courses) || !data.courses.length) throw new Error('Empty catalog.');
  const ids = new Set(), allQuestionIds = new Set(), sourceIds = new Set();
  for (const source of data.sources) {
    if (!source.id || sourceIds.has(source.id) || !source.title || !source.status) throw new Error('Invalid source.');
    sourceIds.add(source.id);
    if (source.url && new URL(source.url).protocol !== 'https:') throw new Error('References must use HTTPS.');
    if (source.verifiedOn != null && !/^\d{4}-\d{2}-\d{2}$/.test(source.verifiedOn)) throw new Error('Invalid verification date.');
  }
  for (const course of data.courses) {
    if (!/^[a-z0-9-]+$/.test(course.id) || ids.has(course.id)) throw new Error('Duplicate or invalid course ID.');
    ids.add(course.id);
    for (const field of ['title','academy','summary','audience','editorialStatus']) if (typeof course[field] !== 'string' || !course[field]) throw new Error(`Missing ${field}.`);
    for (const field of ['objectives','prerequisites','lessons','assessment']) if (!Array.isArray(course[field]) || !course[field].length) throw new Error(`Missing ${field}.`);
    if (!Number.isInteger(course.contentRevision) || course.contentRevision < 1 || !['activity','course-evidence'].includes(course.completion.type) || !Number.isFinite(course.completion.minimumPercent) || course.completion.minimumPercent < 1 || course.completion.minimumPercent > 100) throw new Error('Invalid course standard.');
    const questionIds = new Set(), lessonIds = new Set();
    for (const lesson of course.lessons) {
      if (!lesson.id || lessonIds.has(lesson.id) || !lesson.title || !lesson.paragraphs?.length || !lesson.example?.steps?.length || !lesson.questions?.length || !lesson.objectives?.length) throw new Error('Invalid lesson.');
      if (lesson.prerequisites.some(id => !lessonIds.has(id))) throw new Error('Lesson prerequisites must exist earlier in the course.');
      if (lesson.diagram) {
        const d = lesson.diagram;
        if (d.kind !== 'line' || !Number.isFinite(d.slope) || !Number.isFinite(d.intercept) || !Number.isInteger(d.xMin) || !Number.isInteger(d.xMax) || d.xMin < -2 || d.xMax > 2 || d.xMin >= d.xMax || [d.xMin,d.xMax].some(x => d.slope*x+d.intercept < -3 || d.slope*x+d.intercept > 5)) throw new Error('Diagram exceeds its supported coordinate window.');
      }
      lessonIds.add(lesson.id);
    }
    const chapterIds = new Set(), assignedLessons = new Set();
    for (const chapter of course.chapters) {
      if (!chapter.id || chapterIds.has(chapter.id) || !chapter.title || !chapter.assessment?.length || !chapter.lessonIds?.length) throw new Error('Invalid chapter.');
      chapterIds.add(chapter.id);
      for (const id of chapter.lessonIds) { if (!lessonIds.has(id) || assignedLessons.has(id)) throw new Error('Invalid chapter lesson membership.'); assignedLessons.add(id); }
    }
    if (course.completion.type === 'course-evidence' && (assignedLessons.size !== lessonIds.size || course.assessment.length < 12 || course.chapters.some(ch => ch.assessment.length < 6) || course.lessons.some(l => l.questions.length < 6))) throw new Error('Foundation standard needs complete chapter coverage and substantial assessments.');
    for (const question of courseQuestions(course)) {
      if (!question.id || questionIds.has(question.id) || allQuestionIds.has(question.id) || !question.prompt || !question.explanation || !question.misconception || !['introductory','application','challenge'].includes(question.difficulty)) throw new Error('Invalid or duplicate question.');
      questionIds.add(question.id);allQuestionIds.add(question.id);
      if (!Array.isArray(question.options) || question.options.length !== 4 || question.options.some(item => typeof item !== 'string') || new Set(question.options).size !== 4 || !Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) throw new Error('Invalid question choices.');
      if (raw.schemaVersion === 2 && (!question.skillId || !question.review?.history?.length || !question.revision || !Array.isArray(question.sourceRefs))) throw new Error('Missing question review trail.');
      if (question.sourceRefs?.some(id => !sourceIds.has(id))) throw new Error('Unknown question source reference.');
      verifyMathematicalKey(question);
    }
    if (raw.schemaVersion === 2 && (!course.review?.history?.length || course.sourceRefs.some(id => !sourceIds.has(id)))) throw new Error('Missing course review trail or source.');
  }
  const visit = (id, pending = new Set(), done = new Set()) => {
    if (pending.has(id)) throw new Error('Course prerequisite cycle.');
    if (done.has(id)) return;
    const course = data.courses.find(c => c.id === id); if (!course) throw new Error('Unknown prerequisite course.');
    pending.add(id);for (const dependency of course.prerequisiteCourseIds) visit(dependency,pending,done);pending.delete(id);done.add(id);
  };
  for (const course of data.courses) visit(course.id);
  return data;
}
