/** Content compatibility and transparent evidence; no credential or mastery guarantees. */
export function courseQuestions(course) {
  return [...course.lessons.flatMap(lesson => lesson.questions),
    ...(course.chapters || []).flatMap(chapter => chapter.assessment), ...course.assessment];
}
export function catalogQuestions(catalog) { return catalog.courses.flatMap(courseQuestions); }
export function normalizeCatalog(raw) {
  if (![1,2].includes(raw?.schemaVersion)) throw new Error('Unsupported catalog version.');
  const catalog = structuredClone(raw);
  catalog.schemaVersion = 2;
  catalog.sources ||= [];
  for (const course of catalog.courses || []) {
    course.contentRevision ||= 1;
    course.chapters ||= [];
    course.prerequisiteCourseIds ||= [];
    course.completion ||= {type:'activity',minimumPercent:80,requireAllLessonsRead:true,requireChapters:false,requireFinal:true};
    course.sourceRefs ||= [];
    for (const lesson of course.lessons || []) {
      lesson.objectives ||= [lesson.title];
      lesson.prerequisites ||= [];
    }
  }
  return catalog;
}
export function assessmentEvidence(course, attempts, chapterId = null) {
  const expected = chapterId ? course.chapters.find(chapter => chapter.id === chapterId)?.assessment : course.assessment;
  if (!expected?.length) return {percent:null,covered:false,passed:false};
  let percent = null;
  for (const attempt of attempts) {
    if (attempt.courseId !== course.id || attempt.mode !== (chapterId ? 'chapter' : 'assessment') ||
        (chapterId && attempt.chapterId !== chapterId) ||
        (attempt.contentRevision || 1) !== course.contentRevision ||
        attempt.details.length !== expected.length) continue;
    const responses = new Map(attempt.details.map(detail => [detail.id,detail]));
    if (responses.size !== expected.length || expected.some(question => !responses.has(question.id))) continue;
    // Derive evidence from actual choices and current keys, never an imported `correct` flag.
    const correct = expected.filter(question => responses.get(question.id).chosen === question.answer).length;
    const current = correct / expected.length * 100;
    percent = percent === null ? current : Math.max(percent,current);
  }
  return {percent:percent === null ? null : Math.round(percent),covered:percent !== null,
    passed:percent !== null && percent >= course.completion.minimumPercent};
}
export function topicEvidence(course, lesson, attempts) {
  const expected = new Map(lesson.questions.map(question => [question.id,question]));
  const latest = new Map();
  const ordered = attempts.filter(attempt => attempt.courseId === course.id)
    .slice().sort((a,b) => Date.parse(a.date)-Date.parse(b.date));
  for (const attempt of ordered) {
    for (const detail of attempt.details) if (expected.has(detail.id)) latest.set(detail.id,detail.chosen);
  }
  const answered = [...latest.values()].filter(choice => choice !== null).length;
  const correct = [...latest].filter(([id,choice]) => choice === expected.get(id).answer).length;
  const percent = answered ? Math.round(correct/answered*100) : null;
  const completePool = answered === expected.size;
  // Compare the raw ratio to avoid rounding 79.5% into an 80% pass.
  const met = completePool && expected.size >= 6 && correct/expected.size*100 >= course.completion.minimumPercent;
  return {answered,total:expected.size,correct,percent,met,
    label:!answered?'No practice yet':met?'Practice criterion met':'More practice recommended'};
}
export function courseEvidence(course, state) {
  const read = course.lessons.filter(lesson => state.lessons[`${course.id}-${lesson.id}`]).length;
  const topics = course.lessons.map(lesson => ({lessonId:lesson.id,...topicEvidence(course,lesson,state.attempts)}));
  const chapters = (course.chapters || []).map(chapter => ({chapterId:chapter.id,...assessmentEvidence(course,state.attempts,chapter.id)}));
  const final = assessmentEvidence(course,state.attempts);
  const foundation = course.completion.type === 'course-evidence';
  const met = read === course.lessons.length && final.passed &&
    (!foundation || (topics.every(topic => topic.met) && chapters.every(chapter => chapter.passed)));
  const nextTopic = topics.find(topic => !topic.met);
  const nextChapter = chapters.find(chapter => !chapter.passed);
  const unread = course.lessons.find(lesson => !state.lessons[`${course.id}-${lesson.id}`]);
  return {read,topics,chapters,final,met,foundation,
    next:unread?{kind:'lesson',id:unread.id}:foundation && nextTopic?{kind:'practice',id:nextTopic.lessonId}:
      foundation && nextChapter?{kind:'chapter',id:nextChapter.chapterId}:!final.passed?{kind:'assessment'}:null};
}
