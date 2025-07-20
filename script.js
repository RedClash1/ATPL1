function checkPassword() {
  const correctPassword = "salmari";
  const input = document.getElementById("accessInput").value;
  const error = document.getElementById("errorMsg");

  if (input === correctPassword) {
    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("quizApp").style.display = "block";
  } else {
    error.textContent = "Incorrect password. Try again.";
  }
}

let data = {};
let currentIndex = 0;
let currentSubject = "";
let currentQuestions = [];
let answeredStatus = {};
let flaggedQuestions = {};
let startTime = Date.now();

const subjectSelect = document.getElementById("subjectSelect");
const questionIndex = document.getElementById("questionIndex");
const questionText = document.getElementById("questionText");
const optionsList = document.getElementById("optionsList");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const finishBtn = document.getElementById("finishBtn");
const finishBtnSide = document.getElementById("finishBtnSide");
const flagBtnNav = document.getElementById("flagBtnNav");
const pagination = document.getElementById("pagination");
const resultScreen = document.getElementById("resultScreen");
const scoreText = document.getElementById("scoreText");
const restartBtn = document.getElementById("restartBtn");
const retryWrongBtn = document.getElementById("retryWrongBtn");
const reviewFlaggedBtn = document.getElementById("reviewFlaggedBtn");
const backToFullQuizBtn = document.getElementById("backToFullQuizBtn");
const shuffleToggle = document.getElementById("shuffleToggle");

fetch("questions.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    for (let subject in data) {
      let opt = document.createElement("option");
      opt.value = subject;
      opt.textContent = subject;
      subjectSelect.appendChild(opt);
    }

    const saved = JSON.parse(localStorage.getItem("quizState"));
    if (saved && data[saved.currentSubject]) {
      currentSubject = saved.currentSubject;
      currentQuestions = data[currentSubject];
      currentIndex = saved.currentIndex;
      answeredStatus = saved.answeredStatus || {};
      flaggedQuestions = saved.flaggedQuestions || {};
      subjectSelect.value = currentSubject;
      renderPagination();
      displayQuestion();
    }
  });

subjectSelect.addEventListener("change", () => {
  currentSubject = subjectSelect.value;
  currentQuestions = [...data[currentSubject]];
  if (shuffleToggle.checked) shuffle(currentQuestions);
  currentIndex = 0;
  answeredStatus = {};
  flaggedQuestions = {};
  resultScreen.classList.add("hidden");
  startTime = Date.now();
  renderPagination();
  displayQuestion();
});

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function saveProgress() {
  localStorage.setItem("quizState", JSON.stringify({
    currentSubject,
    currentIndex,
    answeredStatus,
    flaggedQuestions
  }));
}

function displayQuestion() {
  const q = currentQuestions[currentIndex];
  questionIndex.textContent = `${currentIndex + 1} / ${currentQuestions.length}`;
  questionText.textContent = q.question;
  optionsList.innerHTML = "";

  q.choices.forEach((choice, index) => {
    const li = document.createElement("li");
    li.textContent = choice;
    li.dataset.index = index;

    if (answeredStatus[currentIndex]) {
      const selected = answeredStatus[currentIndex].selected;
      const isCorrect = answeredStatus[currentIndex].isCorrect;
      if (choice === q.answer) li.classList.add("correct");
      if (choice === selected && !isCorrect) li.classList.add("wrong");
      li.style.pointerEvents = "none";
    }

    li.onclick = () => {
      if (answeredStatus[currentIndex]) return;

      const isCorrect = choice === q.answer;
      answeredStatus[currentIndex] = { selected: choice, isCorrect };
      saveProgress();

      if (isCorrect) {
        li.classList.add("correct");
        updatePaginationColors();
        setTimeout(() => {
          if (currentIndex < currentQuestions.length - 1) {
            currentIndex++;
            displayQuestion();
          }
        }, 600);
      } else {
        li.classList.add("wrong");
        [...optionsList.children].forEach(c => {
          if (c.textContent === q.answer) c.classList.add("correct");
        });
        updatePaginationColors();
      }
    };

    optionsList.appendChild(li);
  });

  updatePaginationColors();
}

prevBtn.onclick = () => {
  if (currentIndex > 0) {
    currentIndex--;
    displayQuestion();
  }
};

nextBtn.onclick = () => {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    displayQuestion();
  }
};

finishBtn.onclick = finishBtnSide.onclick = () => {
  const answered = Object.keys(answeredStatus).length;
  const correct = Object.values(answeredStatus).filter(a => a.isCorrect).length;
  const total = currentQuestions.length;
  const percentage = ((correct / total) * 100).toFixed(1);
  const flaggedCount = Object.keys(flaggedQuestions).length;
  const timeSpent = Math.round((Date.now() - startTime) / 1000);
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;

  scoreText.innerHTML = `
    You answered <strong>${answered}</strong> of <strong>${total}</strong> questions.<br/>
    Correct answers: <strong>${correct}</strong><br/>
    Score: <strong>${percentage}%</strong><br/>
    Flagged questions: <strong>${flaggedCount}</strong><br/>
    Time spent: <strong>${minutes}m ${seconds}s</strong>
  `;
  resultScreen.classList.remove("hidden");
};

restartBtn.onclick = () => {
  subjectSelect.value = "Choose a subject";
  resultScreen.classList.add("hidden");
  questionText.textContent = "Loading...";
  optionsList.innerHTML = "";
  localStorage.removeItem("quizState");
};

retryWrongBtn.onclick = () => {
  currentQuestions = currentQuestions.filter((_, i) => answeredStatus[i] && !answeredStatus[i].isCorrect);
  currentIndex = 0;
  answeredStatus = {};
  flaggedQuestions = {};
  renderPagination();
  displayQuestion();
  resultScreen.classList.add("hidden");
};

reviewFlaggedBtn.onclick = () => {
  const originalQuestions = data[currentSubject];
  currentQuestions = originalQuestions.filter((_, i) => flaggedQuestions[i]);
  currentIndex = 0;
  resultScreen.classList.add("hidden");
  renderPagination();
  displayQuestion();
};

backToFullQuizBtn.onclick = () => {
  currentQuestions = [...data[currentSubject]];
  if (shuffleToggle.checked) shuffle(currentQuestions);
  currentIndex = 0;
  resultScreen.classList.add("hidden");
  renderPagination();
  displayQuestion();
};

function renderPagination() {
  pagination.innerHTML = "";
  currentQuestions.forEach((_, i) => {
    let btn = document.createElement("button");
    btn.textContent = i + 1;
    btn.onclick = () => {
      currentIndex = i;
      displayQuestion();
      updatePaginationColors();
    };
    pagination.appendChild(btn);
  });
  updatePaginationColors();
}

function updatePaginationColors() {
  const buttons = pagination.querySelectorAll("button");
  buttons.forEach((btn, i) => {
    btn.classList.remove("correct", "wrong", "flagged");
    if (answeredStatus[i]?.isCorrect) btn.classList.add("correct");
    if (answeredStatus[i] && !answeredStatus[i].isCorrect) btn.classList.add("wrong");
    if (flaggedQuestions[i]) btn.classList.add("flagged");
  });
}

flagBtnNav.onclick = () => {
  if (flaggedQuestions[currentIndex]) {
    delete flaggedQuestions[currentIndex];
  } else {
    flaggedQuestions[currentIndex] = true;
  }
  saveProgress();
  updatePaginationColors();
};

document.getElementById("themeToggle").addEventListener("change", (e) => {
  document.body.classList.toggle("dark", e.target.checked);
});

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  const options = document.querySelectorAll("#optionsList li");
  const hasAnswered = answeredStatus[currentIndex];

  if (!hasAnswered && ["a", "b", "c", "d"].includes(key)) {
    const index = { a: 0, b: 1, c: 2, d: 3 }[key];
    if (options[index]) options[index].click();
  }

  if (key === "arrowright") nextBtn.click();
  if (key === "arrowleft") prevBtn.click();
});