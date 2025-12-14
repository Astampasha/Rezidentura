/* Rezidantura Quiz */

const quizParts = {};

const state = {
    selectedParts: new Set(),
    limit: 0,
    questions: [],
    currentIndex: 0,
    userAnswers: {}
};

const els = {
    homeWindow: document.getElementById('homeWindow'),
    testWindow: document.getElementById('testWindow'),
    resultsWindow: document.getElementById('resultsWindow'),
    reviewWindow: document.getElementById('reviewWindow'),
    partsGrid: document.getElementById('partsGrid'),
    selectAllBtn: document.getElementById('selectAllBtn'),
    startBtn: document.getElementById('startBtn'),
    limit100Toggle: document.getElementById('limit100Toggle'),
    limit200Toggle: document.getElementById('limit200Toggle'),
    limit500Toggle: document.getElementById('limit500Toggle'),
    increaseLimitBtn: document.getElementById('increaseLimitBtn'),
    decreaseLimitBtn: document.getElementById('decreaseLimitBtn'),
    selectionInfo: document.getElementById('selectionInfo'),
    darkModeBtn: document.getElementById('darkModeBtn'),
    darkModeBtnTest: document.getElementById('darkModeBtnTest'),
    questionNumber: document.getElementById('questionNumber'),
    questionText: document.getElementById('questionText'),
    answersContainer: document.getElementById('answersContainer'),
    nextBtn: document.getElementById('nextBtn'),
    correctCount: document.getElementById('correctCount'),
    incorrectCount: document.getElementById('incorrectCount'),
    totalCount: document.getElementById('totalCount'),
    resultsTitle: document.getElementById('resultsTitle'),
    reviewBtn: document.getElementById('reviewBtn'),
    restartBtn: document.getElementById('restartBtn'),
    reviewList: document.getElementById('reviewList'),
    backToResultsBtn: document.getElementById('backToResultsBtn')
};

// Load data
async function loadQuizData() {
    const promises = [];
    for (let i = 1; i <= 11; i++) {
        promises.push(
            fetch(`part${i}.js`)
                .then(r => r.text())
                .then(text => { quizParts[i] = JSON.parse(text); })
                .catch(() => { quizParts[i] = []; })
        );
    }
    await Promise.all(promises);
    renderPartsGrid();
}

function renderPartsGrid() {
    els.partsGrid.innerHTML = '';
    for (let i = 1; i <= 11; i++) {
        const count = quizParts[i]?.length || 0;
        const btn = document.createElement('button');
        btn.className = 'part-btn';
        btn.dataset.part = i;
        btn.innerHTML = `<span class="part-name">Part ${i}</span><span class="part-questions">${count} Sual</span>`;
        btn.onclick = () => togglePart(i);
        els.partsGrid.appendChild(btn);
    }
}

function togglePart(num) {
    state.selectedParts.has(num) ? state.selectedParts.delete(num) : state.selectedParts.add(num);
    updateUI();
}

function toggleSelectAll() {
    if (state.selectedParts.size === 11) {
        state.selectedParts.clear();
    } else {
        for (let i = 1; i <= 11; i++) state.selectedParts.add(i);
    }
    updateUI();
}

function updateUI() {
    document.querySelectorAll('.part-btn').forEach(btn => {
        btn.classList.toggle('selected', state.selectedParts.has(parseInt(btn.dataset.part)));
    });
    els.selectAllBtn.textContent = state.selectedParts.size === 11 ? 'Ləğv et' : 'Hamısını seç';

    let qCount = 0;
    state.selectedParts.forEach(num => qCount += quizParts[num]?.length || 0);
    const displayCount = state.limit > 0 && qCount > state.limit ? state.limit : qCount;
    els.selectionInfo.innerHTML = `seçilmiş: <strong>${state.selectedParts.size}</strong> part, <strong>${displayCount}</strong> sual`;
    els.startBtn.disabled = state.selectedParts.size === 0;
}

function showWindow(name) {
    els.homeWindow.classList.remove('active');
    els.testWindow.classList.remove('active');
    els.resultsWindow.classList.remove('active');
    els.reviewWindow.classList.remove('active');
    document.getElementById(name + 'Window').classList.add('active');
    window.scrollTo(0, 0);
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function startQuiz() {
    state.questions = [];
    state.selectedParts.forEach(num => {
        (quizParts[num] || []).forEach(q => state.questions.push({ ...q }));
    });
    shuffle(state.questions);
    shuffle(state.questions);
    if (state.limit > 0 && state.questions.length > state.limit) {
        state.questions = state.questions.slice(0, state.limit);
    }
    state.currentIndex = 0;
    state.userAnswers = {};
    showWindow('test');
    renderQuestion();
}

function getAnsweredCount() {
    return Object.keys(state.userAnswers).length;
}

function renderQuestion() {
    const q = state.questions[state.currentIndex];
    const total = state.questions.length;
    const answered = getAnsweredCount();

    els.questionNumber.textContent = `Question ${state.currentIndex + 1} of ${total}`;
    els.questionText.textContent = q.question;

    els.answersContainer.innerHTML = '';
    const isAnswered = state.userAnswers[state.currentIndex] !== undefined;

    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = opt;

        if (isAnswered) {
            btn.classList.add('answered');
            if (opt === q.correct_answer) {
                btn.classList.add('correct');
            } else if (idx === state.userAnswers[state.currentIndex]) {
                btn.classList.add('incorrect');
            }
        } else {
            btn.onclick = () => selectAnswer(idx, opt, q.correct_answer);
        }

        els.answersContainer.appendChild(btn);
    });

    els.nextBtn.textContent = answered === total ? 'Tamamla' : 'Növbeti';
}

function selectAnswer(idx, selectedAnswer, correctAnswer) {
    if (state.userAnswers[state.currentIndex] !== undefined) return;
    state.userAnswers[state.currentIndex] = idx;

    const buttons = els.answersContainer.querySelectorAll('.answer-btn');
    buttons.forEach((btn, i) => {
        btn.classList.add('answered');
        const optText = state.questions[state.currentIndex].options[i];
        if (optText === correctAnswer) {
            btn.classList.add('correct');
        } else if (i === idx && selectedAnswer !== correctAnswer) {
            btn.classList.add('incorrect');
        }
    });

    // Update button text
    const answered = getAnsweredCount();
    els.nextBtn.textContent = answered === state.questions.length ? 'Tamamla' : 'Növbeti';
}

function nextQuestion() {
    const total = state.questions.length;
    const answered = getAnsweredCount();

    // If all questions answered, finish
    if (answered === total) {
        finishQuiz();
        return;
    }

    // Find next unanswered question
    let nextIdx = state.currentIndex;
    for (let i = 0; i < total; i++) {
        nextIdx = (nextIdx + 1) % total;
        if (state.userAnswers[nextIdx] === undefined) {
            state.currentIndex = nextIdx;
            renderQuestion();
            return;
        }
    }
}

function finishQuiz() {
    let correct = 0, incorrect = 0, skipped = 0;
    state.questions.forEach((q, idx) => {
        const userIdx = state.userAnswers[idx];
        if (userIdx === undefined) {
            skipped++;
        } else if (q.options[userIdx] === q.correct_answer) {
            correct++;
        } else {
            incorrect++;
        }
    });

    els.correctCount.textContent = correct;
    els.incorrectCount.textContent = incorrect + skipped;
    els.totalCount.textContent = state.questions.length;











    showWindow('results');
}

function showReview() {
    els.reviewList.innerHTML = '';
    state.questions.forEach((q, idx) => {
        const userIdx = state.userAnswers[idx];
        const userAnswer = userIdx !== undefined ? q.options[userIdx] : null;
        const isCorrect = userAnswer === q.correct_answer;
        const isSkipped = userIdx === undefined;

        const item = document.createElement('div');
        item.className = `review-item ${isSkipped ? 'incorrect' : isCorrect ? 'correct' : 'incorrect'}`;

        let answersHTML = '';
        if (isSkipped) {
            answersHTML = `<div class="review-answer correct-answer"><span class="review-answer-label">doğru:</span>${q.correct_answer}</div>`;
        } else if (isCorrect) {
            answersHTML = `<div class="review-answer user-correct"><span class="review-answer-label">✓ doğru:</span>${userAnswer}</div>`;
        } else {
            answersHTML = `<div class="review-answer user-answer"><span class="review-answer-label">✗ yanlış:</span>${userAnswer}</div>
                          <div class="review-answer correct-answer"><span class="review-answer-label">✓ doğru:</span>${q.correct_answer}</div>`;
        }

        item.innerHTML = `<div class="review-question-num">${idx + 1}</div>
                         <div class="review-question-text">${q.question}</div>
                         <div class="review-answers">${answersHTML}</div>`;
        els.reviewList.appendChild(item);
    });
    showWindow('review');
}

function restart() {
    state.selectedParts.clear();
    setLimit(0);
    updateUI();
    showWindow('home');
}

function setLimit(val) {
    state.limit = val;
    els.limit100Toggle.checked = val === 100;
    els.limit200Toggle.checked = val === 200;
    els.limit500Toggle.checked = val === 500;
    updateUI();
}

function adjustLimit(delta) {
    let qCount = 0;
    state.selectedParts.forEach(num => qCount += quizParts[num]?.length || 0);

    const currentLimit = state.limit === 0 ? qCount : state.limit;
    let newLimit = currentLimit + delta;

    if (newLimit <= 0) {
        newLimit = 0; // Represents "All"
    } else if (newLimit >= qCount) {
        newLimit = qCount;
    }

    setLimit(newLimit);
}

function toggleDarkMode() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? '' : 'dark');
    const icon = isDark ? '🌙' : '☀️';
    els.darkModeBtn.textContent = icon;
    if (els.darkModeBtnTest) els.darkModeBtnTest.textContent = icon;
}

function setupEvents() {
    els.selectAllBtn.onclick = toggleSelectAll;
    els.startBtn.onclick = startQuiz;

    els.limit100Toggle.onchange = (e) => setLimit(e.target.checked ? 100 : 0);
    els.limit200Toggle.onchange = (e) => setLimit(e.target.checked ? 200 : 0);
    els.limit500Toggle.onchange = (e) => setLimit(e.target.checked ? 500 : 0);

    els.increaseLimitBtn.onclick = () => adjustLimit(50);
    els.decreaseLimitBtn.onclick = () => adjustLimit(-50);

    els.darkModeBtn.onclick = toggleDarkMode;
    if (els.darkModeBtnTest) els.darkModeBtnTest.onclick = toggleDarkMode;
    els.nextBtn.onclick = nextQuestion;
    els.reviewBtn.onclick = showReview;
    els.restartBtn.onclick = restart;
    els.backToResultsBtn.onclick = () => showWindow('results');
}

async function init() {
    els.partsGrid.innerHTML = '<div style="text-align:center;padding:40px;opacity:0.6;">yüklenir</div>';
    await loadQuizData();
    setupEvents();
    updateUI();
}

document.addEventListener('DOMContentLoaded', init);
