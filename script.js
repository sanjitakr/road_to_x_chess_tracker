const userInput = document.getElementById("user");
const refreshBtn = document.getElementById("refresh");
const chartModeSelect = document.getElementById("chartMode");
const canvas = document.getElementById("chart");
let chart;
const GOALS_KEY = "goals";
const HISTORY_KEY = "history";
const WORK_KEY = "worklog";

const goals = JSON.parse(localStorage.getItem(GOALS_KEY)) || {
  bullet: 2000,
  blitz: 2000,
  rapid: 2000,
  puzzle: 2400
};
const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || {
  bullet: [],
  blitz: [],
  rapid: [],
  puzzle: []
};
const worklog = JSON.parse(localStorage.getItem(WORK_KEY)) || [];
async function fetchRatings(user) {
  const r = await fetch(`https://lichess.org/api/user/${user}`);
  if (!r.ok) return null;
  const d = await r.json();
  return {
    bullet: d.perfs.bullet.rating,
    blitz: d.perfs.blitz.rating,
    rapid: d.perfs.rapid.rating,
    puzzle: d.perfs.puzzle.rating
  };
}

function saveHistory(mode, rating) {
  const arr = history[mode];
  if (!arr.length || arr[arr.length - 1] !== rating) {
    arr.push(rating);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
}

function updateCard(mode, rating) {
  const card = document.querySelector(`[data-mode="${mode}"]`);
  const arr = history[mode];

  card.querySelector(".current").textContent = rating;
  card.querySelector(".goal").textContent = `/ ${goals[mode]}`;

  const deltaEl = card.querySelector(".delta");
  deltaEl.textContent = "";

  if (arr.length > 1) {
    const diff = arr[arr.length - 1] - arr[arr.length - 2];
    if (diff !== 0) {
      deltaEl.textContent = diff > 0 ? `+${diff}` : diff;
      deltaEl.className = `delta ${diff > 0 ? "up" : "down"}`;
    }
  }

  card.querySelector(".fill").style.width =
    Math.min(100, Math.round((rating / goals[mode]) * 100)) + "%";
}

function drawChart(mode) {
  if (chart) chart.destroy();
  chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: history[mode].map((_, i) => i + 1),
      datasets: [{
        label: mode,
        data: history[mode],
        borderColor: "#3b82f6",
        tension: 0.3
      }]
    }
  });
}

refreshBtn.onclick = async () => {
  const user = userInput.value.trim();
  if (!user) return;

  localStorage.setItem("lichessUser", user);
  const ratings = await fetchRatings(user);
  if (!ratings) return;

  Object.entries(ratings).forEach(([mode, rating]) => {
    saveHistory(mode, rating);
    updateCard(mode, rating);
  });

  drawChart(chartModeSelect.value);
};

const modal = document.getElementById("goalModal");
const goalInput = document.getElementById("goalInput");
let activeMode = null;

document.querySelectorAll(".edit").forEach(btn => {
  btn.onclick = () => {
    activeMode = btn.closest(".rating-card").dataset.mode;
    goalInput.value = goals[activeMode];
    modal.classList.remove("hidden");
  };
});

document.getElementById("saveGoal").onclick = () => {
  goals[activeMode] = Number(goalInput.value);
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  modal.classList.add("hidden");
};

document.getElementById("cancelGoal").onclick = () =>
  modal.classList.add("hidden");

const workForm = document.getElementById("workForm");
const workList = document.getElementById("workList");

workForm.onsubmit = e => {
  e.preventDefault();
  const f = workForm.elements;

  const entry = {
    date: f[0].value,
    mode: f[1].value.toLowerCase(),
    activity: f[2].value,
    minutes: f[3].value,
    notes: f[4].value
  };

  worklog.push(entry);
  localStorage.setItem(WORK_KEY, JSON.stringify(worklog));
  renderWorklog();
  workForm.reset();
};

function renderWorklog() {
  workList.innerHTML = "";
  worklog.forEach(w => {
    const div = document.createElement("div");
    div.textContent =
      `${w.date} • ${w.mode} • ${w.activity} • ${w.minutes} min`;
    workList.appendChild(div);
  });
}

userInput.value = localStorage.getItem("lichessUser") || "";
renderWorklog();
chartModeSelect.onchange = () => drawChart(chartModeSelect.value);