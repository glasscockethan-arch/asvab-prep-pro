export const STORAGE_KEY = 'aptitude-beacon-v1';
export const LEGACY_KEY = 'asvab-prep-pro-v3';
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const id = value => typeof value === 'string' && /^[a-z0-9-]{1,120}$/.test(value);
const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const fail = () => { throw new Error('Backup format is invalid. Your current progress has not been replaced.'); };
export function emptyState() { return {schemaVersion:2, lessons:{}, bookmarks:[], enrollments:{}, attempts:[], goals:{daily:10,weekly:50}, legacy:null, active:null}; }
export function validateLegacy(value) {
  if (!plain(value) || !Array.isArray(value.history) || !Array.isArray(value.missed) || !value.missed.every(item => /^q\d{4}$/.test(item)) || !integer(value.week ?? 1,1,6)) fail();
  const history = value.history.map(attempt => {
    if (!plain(attempt) || !date(attempt.date) || typeof attempt.mode !== 'string' || !Array.isArray(attempt.details) || !attempt.details.length || attempt.details.length > 540) fail();
    const details = attempt.details.map(item => {
      if (!plain(item) || !/^q\d{4}$/.test(item.id) || typeof item.subject !== 'string' || typeof item.q !== 'string' || !Array.isArray(item.options) || item.options.length !== 4 || !item.options.every(option => typeof option === 'string') || !integer(item.answer,0,3) || !(item.chosen === null || integer(item.chosen,0,3)) || typeof item.explanation !== 'string') fail();
      const clean = {id:item.id,subject:item.subject,q:item.q,options:[...item.options],answer:item.answer,chosen:item.chosen,correct:item.chosen === item.answer,explanation:item.explanation};
      if (item.visual !== undefined) {
        const shape = points => Array.isArray(points) && points.length > 0 && points.length <= 200 && points.every(point => Array.isArray(point) && point.length === 2 && point.every(n => integer(n,0,100)));
        if (!plain(item.visual) || !shape(item.visual.target) || !Array.isArray(item.visual.options) || item.visual.options.length !== 4 || !item.visual.options.every(shape)) fail();
        clean.visual = {target:item.visual.target.map(point => [...point]),options:item.visual.options.map(points => points.map(point => [...point]))};
      }
      return clean;
    });
    return {date:attempt.date,mode:attempt.mode,sub:typeof attempt.sub === 'string' ? attempt.sub : '',details};
  });
  return {history, missed:[...new Set(value.missed)], week:value.week ?? 1};
}
export function validateState(value) {
  if (!plain(value) || ![1,2].includes(value.schemaVersion) || !plain(value.lessons) || !Array.isArray(value.bookmarks) || !Array.isArray(value.attempts) || !plain(value.goals)) fail();
  const enrollments = value.schemaVersion === 1 ? {} : value.enrollments;
  if (!plain(enrollments) || !Object.entries(enrollments).every(([key,val]) => id(key) && date(val))) fail();
  if (!Object.entries(value.lessons).every(([key,val]) => id(key) && date(val)) || !value.bookmarks.every(id) || !integer(value.goals.daily,1,200) || !integer(value.goals.weekly,1,1400)) fail();
  const attempts = value.attempts.map(item => {
    if (!plain(item) || !id(item.id) || !id(item.courseId) || !date(item.date) || !['practice','diagnostic','timed','assessment','review','chapter'].includes(item.mode) || !Array.isArray(item.details) || !item.details.length || item.details.length > 540 || (item.mode === 'chapter' && !id(item.chapterId)) || (item.contentRevision !== undefined && !integer(item.contentRevision,1,1000000))) fail();
    const details = item.details.map(detail => {
      if (!plain(detail) || !id(detail.id) || typeof detail.correct !== 'boolean' || !(detail.chosen === null || integer(detail.chosen,0,3))) fail();
      return {id:detail.id,chosen:detail.chosen,correct:detail.correct};
    });
    if (new Set(details.map(detail => detail.id)).size !== details.length) fail();
    return {id:item.id,courseId:item.courseId,date:item.date,mode:item.mode,details,...(item.chapterId ? {chapterId:item.chapterId} : {}),...(item.contentRevision ? {contentRevision:item.contentRevision} : {})};
  });
  if (new Set(attempts.map(attempt => attempt.id)).size !== attempts.length) fail();
  let active = null;
  if (value.active != null) {
    const a = value.active;
    if (!plain(a) || !id(a.courseId) || !['practice','diagnostic','timed','assessment','review','chapter'].includes(a.mode) || !Array.isArray(a.ids) || !a.ids.length || !a.ids.every(id) || new Set(a.ids).size !== a.ids.length || !Array.isArray(a.answers) || a.answers.length !== a.ids.length || !a.answers.every(x => x === null || integer(x,0,3)) || !integer(a.index,0,a.ids.length-1) || !(a.deadline === null || Number.isFinite(a.deadline)) || (a.mode === 'chapter' && !id(a.chapterId)) || (a.contentRevision !== undefined && !integer(a.contentRevision,1,1000000))) fail();
    active = {courseId:a.courseId,mode:a.mode,ids:[...a.ids],answers:[...a.answers],index:a.index,deadline:a.deadline,...(a.chapterId ? {chapterId:a.chapterId} : {}),...(a.contentRevision ? {contentRevision:a.contentRevision} : {})};
  }
  return {schemaVersion:2,lessons:{...value.lessons},bookmarks:[...new Set(value.bookmarks)],enrollments:{...enrollments},attempts,goals:{daily:value.goals.daily,weekly:value.goals.weekly},legacy:value.legacy == null ? null : validateLegacy(value.legacy),active};
}
export function parseBackup(text) {
  if (typeof text !== 'string' || text.length > 10_000_000) throw new Error('Backup must be a JSON file under 10 MB.');
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('This file is not valid JSON. Your progress has not changed.'); }
  if (!plain(parsed)) throw new Error('Backup must contain a progress object. Your progress has not changed.');
  if (parsed && [1,2].includes(parsed.schemaVersion)) return validateState(parsed);
  if (parsed.version === 3 || (plain(parsed) && Array.isArray(parsed.history) && Array.isArray(parsed.missed))) {
    const state = emptyState(); state.legacy = validateLegacy(parsed); return state;
  }
  throw new Error('Unsupported backup version. Your progress has not changed.');
}
export function mergeState(current, incoming) {
  const merged = validateState(current), addition = validateState(incoming);
  for (const [key,date] of Object.entries(addition.lessons)) if (!merged.lessons[key] || Date.parse(date) > Date.parse(merged.lessons[key])) merged.lessons[key] = date;
  for (const [key,date] of Object.entries(addition.enrollments)) if (!merged.enrollments[key] || Date.parse(date) < Date.parse(merged.enrollments[key])) merged.enrollments[key] = date;
  merged.bookmarks = [...new Set([...merged.bookmarks,...addition.bookmarks])];
  const attempts = new Map(merged.attempts.map(item => [item.id,item]));
  for (const attempt of addition.attempts) {
    const old = attempts.get(attempt.id);
    if (old && JSON.stringify(old) !== JSON.stringify(attempt)) throw new Error('Conflicting attempt IDs in backup. Current progress has not been replaced.');
    attempts.set(attempt.id,attempt);
  }
  merged.attempts = [...attempts.values()].sort((a,b) => Date.parse(a.date)-Date.parse(b.date));
  if (addition.legacy) {
    const old = merged.legacy || {history:[],missed:[],week:1};
    merged.legacy = {week:old.week, missed:[...new Set([...old.missed,...addition.legacy.missed])], history:[...new Map([...old.history,...addition.legacy.history].map(item => [JSON.stringify(item),item])).values()]};
  }
  return validateState(merged);
}
export function loadState(storage) {
  let state = emptyState(), warning = '';
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw !== null) state = validateState(JSON.parse(raw));
    const legacyRaw = storage.getItem(LEGACY_KEY);
    if (legacyRaw !== null) {
      try { state = mergeState(state, {...emptyState(),legacy:validateLegacy(JSON.parse(legacyRaw))}); }
      catch { warning = 'Existing ASVAB data could not be read safely. Its original storage is unchanged; export it from the ASVAB app before making changes.'; }
    }
  } catch { return {state:null,warning:'Saved progress is unavailable or unreadable. Download a recovery copy or resolve browser storage access before continuing.'}; }
  return {state,warning};
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(validateState(state))); return true; } catch { return false; }
}
export function localDay(timestamp = Date.now()) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function activity(state, now = Date.now()) {
  const today = localDay(now), weekStart = new Date(now); weekStart.setHours(0,0,0,0); weekStart.setDate(weekStart.getDate()-6);
  let daily = 0, weekly = 0;
  const days = new Set();
  for (const item of state.attempts) {
    const answered = item.details.filter(detail => detail.chosen !== null).length;
    if (answered) days.add(localDay(item.date));
    if (localDay(item.date) === today) daily += answered;
    if (Date.parse(item.date) >= +weekStart && Date.parse(item.date) <= now) weekly += answered;
  }
  const cursor = new Date(now); let streak = 0;
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate()-1);
  while (days.has(localDay(cursor))) { streak++; cursor.setDate(cursor.getDate()-1); }
  return {daily,weekly,streak};
}
