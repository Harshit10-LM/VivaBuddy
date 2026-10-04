const $ = (id) => document.getElementById(id);
const session = { subject: '', topics: [], difficulty: 'medium', totalQuestions: 5, index: 0, questions: [], results: [] };

function setLoading(show, text = 'Working…') { $('loading').classList.toggle('hidden', !show); $('loading-text').textContent = text; }
function showError(id, text = '') { $(id).textContent = text; }
function api(path, body) { return fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => { const json = await r.json(); if (!r.ok) throw new Error(json.error || 'Something went wrong.'); return json; }); }
function switchView(view) { ['setup-view', 'viva-view', 'results-view'].forEach(id => $(id).classList.toggle('hidden', id !== view)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function titleCase(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

function renderQuestion(question) {
  session.current = question; $('answer').value = ''; $('answer').disabled = false; $('submit-button').disabled = false; $('skip-button').disabled = false; $('feedback-card').classList.add('hidden'); $('answer-error').textContent = '';
  const number = session.index + 1; $('session-subject').textContent = session.subject; $('session-topic').textContent = `${titleCase(session.difficulty)} difficulty`;
  $('question-count').textContent = `Question ${number} of ${session.totalQuestions}`; $('question-label').textContent = `QUESTION ${number}`; $('question-text').textContent = question.question; $('question-topic').textContent = question.topic;
  $('progress-fill').style.width = `${(number / session.totalQuestions) * 100}%`;
}

$('setup-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const subject = $('subject').value.trim(), topics = $('topics').value.trim(); let valid = true;
  showError('subject-error', subject ? '' : "Tell VivaBuddy what subject you're studying."); showError('topics-error', topics ? '' : 'Add at least one topic to practice.'); valid = Boolean(subject && topics);
  if (!valid) return;
  session.subject = subject; session.topics = topics.split(',').map(t => t.trim()).filter(Boolean); session.difficulty = document.querySelector('input[name="difficulty"]:checked').value; session.totalQuestions = Number(document.querySelector('input[name="total"]:checked').value); session.index = 0; session.questions = []; session.results = [];
  $('start-button').disabled = true; setLoading(true, 'Creating your first question…');
  try { const data = await api('/api/start-viva', { subject, topics, difficulty: session.difficulty, total_questions: session.totalQuestions }); session.current = data.question; session.questions.push(data.question); switchView('viva-view'); renderQuestion(data.question); } catch (err) { showError('form-error', err.message); } finally { $('start-button').disabled = false; setLoading(false); }
});

$('submit-button').addEventListener('click', async () => {
  const answer = $('answer').value.trim(); showError('answer-error', answer ? '' : 'Please write an answer before submitting.'); if (!answer) return;
  $('submit-button').disabled = true; $('skip-button').disabled = true; setLoading(true, 'Checking your answer…');
  try { const feedback = await api('/api/evaluate', { subject: session.subject, question: session.current.question, topic: session.current.topic, answer }); session.results.push({ question: session.current, answer, feedback, skipped: false }); renderFeedback(feedback); } catch (err) { showError('answer-error', err.message); $('submit-button').disabled = false; $('skip-button').disabled = false; } finally { setLoading(false); }
});

function renderFeedback(f) { $('verdict').textContent = `${titleCase(f.verdict)} answer`; $('score').firstChild.textContent = f.score; $('right-text').textContent = f.what_was_right; $('improve-text').textContent = f.what_to_improve; $('better-text').textContent = f.better_answer; $('explanation-box').classList.add('hidden'); $('feedback-card').classList.remove('hidden'); $('feedback-card').scrollIntoView({ behavior: 'smooth', block: 'start' }); }

$('explain-button').addEventListener('click', async () => { const result = session.results.at(-1); $('explain-button').disabled = true; setLoading(true, 'Simplifying the concept…'); try { const data = await api('/api/explain', { subject: session.subject, question: session.current.question, feedback: result.feedback.what_to_improve }); $('explanation-text').textContent = data.explanation; $('explanation-box').classList.remove('hidden'); } catch (err) { showError('answer-error', err.message); } finally { $('explain-button').disabled = false; setLoading(false); } });

async function advance(skipped = false) {
  const nextIndex = session.index + 1;
  $('next-button').disabled = true; $('skip-button').disabled = true;
  if (nextIndex >= session.totalQuestions) {
    if (skipped) session.results.push({ question: session.current, skipped: true });
    session.index = nextIndex; renderResults(); return;
  }
  setLoading(true, 'Creating your next question…');
  try {
    const data = await api('/api/next-question', { subject: session.subject, topics: session.topics, difficulty: session.difficulty, total_questions: session.totalQuestions, previous_questions: session.questions.map(q => q.question), previous_scores: session.results.filter(r => !r.skipped).map(r => r.feedback.score) });
    if (skipped) session.results.push({ question: session.current, skipped: true });
    session.index = nextIndex; session.current = data; session.questions.push(data); renderQuestion(data); window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    showError('answer-error', err.message); $('next-button').disabled = false; $('skip-button').disabled = false;
  } finally { setLoading(false); }
}
$('next-button').addEventListener('click', () => advance(false));
$('skip-button').addEventListener('click', () => { $('skip-button').disabled = true; advance(true); });

function renderResults() {
  const scored = session.results.filter(r => !r.skipped), total = scored.reduce((sum, r) => sum + r.feedback.score, 0), possible = session.totalQuestions * 10;
  $('total-score').textContent = total; $('total-possible').textContent = `/ ${possible}`; $('result-bar').style.width = `${possible ? (total / possible) * 100 : 0}%`;
  $('results-message').textContent = total / possible >= .75 ? 'Nice work. You have a solid understanding of the basics.' : total / possible >= .45 ? 'You’re building the right foundation. Review the focus areas and try again.' : 'Every practice session makes the next one easier. Start with the basics and keep going.';
  const topics = {}; scored.forEach(r => { const topic = r.feedback.topic || r.question.topic; (topics[topic] ||= []).push(r.feedback.score); }); const ranked = Object.entries(topics).map(([topic, scores]) => ({ topic, score: scores.reduce((a,b)=>a+b,0)/scores.length })).sort((a,b)=>b.score-a.score);
  const list = (id, items, fallback) => { $(id).innerHTML = ''; (items.length ? items : [{ topic: fallback }]).forEach(x => { const li = document.createElement('li'); li.textContent = x.topic; $(id).append(li); }); }; list('strong-areas', ranked.filter(x => x.score >= 7).slice(0,3), 'Keep practicing to reveal strengths'); list('practice-areas', ranked.filter(x => x.score < 7).slice(0,3), 'No areas need special attention yet');
  $('breakdown-list').innerHTML = ''; session.results.forEach((r, i) => { const row = document.createElement('div'); row.className = 'breakdown-row'; row.innerHTML = `<span>Question ${i + 1}</span><span>${r.skipped ? 'Skipped' : `${r.feedback.score}/10`}</span>`; $('breakdown-list').append(row); }); const skipped = session.results.filter(r => r.skipped).length; $('skipped-count').textContent = skipped ? `${skipped} question${skipped > 1 ? 's' : ''} skipped` : ''; switchView('results-view');
}
$('practice-again').addEventListener('click', () => { session.index = 0; session.questions = []; session.results = []; $('setup-form').dispatchEvent(new Event('submit', { cancelable: true })); });
$('new-viva').addEventListener('click', () => switchView('setup-view'));
