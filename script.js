// ====== НАСТРОЙКИ ======
const DAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"];

const bells = {
  MT: [
    ["13:10", "13:30"],
    ["13:35", "14:15"],
    ["14:20", "15:00"],
    ["15:05", "15:45"],
    ["16:00", "16:40"],
    ["16:45", "17:25"],
    ["17:30", "18:10"]
  ],
  TWF: [
    ["13:30", "14:10"],
    ["14:15", "14:55"],
    ["15:00", "15:40"],
    ["15:50", "16:30"],
    ["16:35", "17:15"],
    ["17:20", "18:00"],
    ["18:05", "18:45"]
  ]
};

const lessons = {
  "Понедельник": [
    ["Музыка", "310"],
    ["Биология", "206"],
    ["Русский язык", "205"],
    ["Математика", "208"],
    ["Химия", "105"],
    ["Математика", "208"]
  ],
  "Вторник": [
    ["Теория вероятности", "208"],
    ["Физкультура", "спортзал"],
    ["Русский язык", "205"],
    ["Физика", "306"],
    ["Английский язык", "308/309"],
    ["Химия", "105"],
    ["История", "204"]
  ],
  "Среда": [
    ["Английский язык", "308/309"],
    ["Русский язык", "205"],
    ["Математика", "208"],
    ["Черчение", "А-204"],
    ["География", "Б-202"],
    ["Биология", "Б-206"],
    ["Труд/технология", "А-101"]
  ],
  "Четверг": [
    ["Физика", "Б-306"],
    ["Русский язык", "205"],
    ["Геометрия", "208"],
    ["История", "Б-305"],
    ["Физра", "спортзал"],
    ["Информатика", "А-304/305"]
  ],
  "Пятница": [
    ["Русский язык", "205"],
    ["Математика", "208"],
    ["Английский язык", "308/309"],
    ["История", "Б-305"],
    ["География", "Б-202"],
    ["ОБЖ", "103"]
  ]
};

// ====== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, "0");

function parseTime(t) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function diffMins(a, b) {
  return Math.floor((b - a) / 60000);
}

function today() {
  const map = { 1: "Понедельник", 2: "Вторник", 3: "Среда", 4: "Четверг", 5: "Пятница" };
  return map[new Date().getDay()] || "Понедельник";
}

function bellset(day) {
  return (day === "Понедельник" || day === "Четверг") ? bells.MT : bells.TWF;
}

// ====== DOM ЭЛЕМЕНТЫ ======
const tbody = $("#tbody");
const progress = $("#progress");
const timeDisplay = $("#timeDisplay");
const status = $("#status");
const dayText = $("#dayText");
const endMessage = $("#endMessage");

// ====== РЕНДЕР ТАБЛИЦЫ ======
function renderTable() {
  const d = today();
  const arr = bellset(d);
  const sub = lessons[d];
  dayText.textContent = `${d}, II смена`;
  tbody.innerHTML = "";

  arr.forEach(([a, b], i) => {
    const mins = diffMins(parseTime(a), parseTime(b));
    const s = sub[i];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${a}–${b}<div style="font-size:12px;color:#9aa4b2">${mins} мин</div></td>
      <td>${s ? s[0] : ""}</td>
      <td>${s ? s[1] : ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ====== СОСТОЯНИЕ ======
function getState() {
  const d = today();
  const arr = bellset(d).map(([a, b]) => [parseTime(a), parseTime(b)]);
  const now = new Date();

  if (now < arr[0][0]) return ["before", -1, arr[0][0], arr[0][1]];
  if (now > arr[arr.length - 1][1]) return ["after", -1, now, now];

  for (let i = 0; i < arr.length; i++) {
    const [start, end] = arr[i];
    if (now >= start && now <= end) return ["lesson", i, start, end];
    if (arr[i + 1] && now > end && now < arr[i + 1][0]) return ["break", i, end, arr[i + 1][0]];
  }

  return ["none", -1, now, now];
}

// ====== ТАЙМЕР ======
let lastTime = "00:00";

function animateDigits(text) {
  timeDisplay.style.animation = "none";
  timeDisplay.offsetHeight;
  timeDisplay.textContent = text;
  timeDisplay.style.animation = "dropIn 0.6s ease";
}

function tick() {
  const [type, index, start, end] = getState();
  const now = new Date();
  const total = (end - start) / 1000;
  const remaining = Math.max(0, Math.floor((end - now) / 1000));
  const ratio = total ? (1 - remaining / total) : 1;

  progress.style.strokeDashoffset = 377 * (1 - ratio);

  const str = `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`;
  if (str !== lastTime) {
    animateDigits(str);
    lastTime = str;
  }

  if (type === "lesson") {
    status.textContent = "идёт урок";
    status.className = "status go";
  } else if (type === "break") {
    status.textContent = "перемена";
    status.className = "status soon";
  } else if (type === "before") {
    status.textContent = "уроки ещё не начались";
    status.className = "status soon";
  } else if (type === "after") {
    status.textContent = "уроки закончились";
    status.className = "status stop";
    showEndMessage();
  } else {
    status.textContent = "—";
    status.className = "status stop";
  }

  document.querySelectorAll("tr").forEach((tr, i) => {
    tr.classList.toggle("now", type === "lesson" && i === index);
  });

  requestAnimationFrame(tick);
}

// ====== ПОЗДРАВЛЕНИЕ С КОНФЕТТИ ======
function showEndMessage() {
  if (!endMessage.classList.contains("shown")) {
    endMessage.classList.add("shown");
    endMessage.classList.remove("hidden");
    showConfetti();
  }
}

function showConfetti() {
  const duration = 4000;
  const end = Date.now() + duration;
  (function frame() {
    confetti({
      particleCount: 6,
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      origin: { x: Math.random(), y: Math.random() - 0.2 }
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// ====== НЕ ГАСИТЬ ЭКРАН ======
let wakeLock = null;
async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch (err) {
    console.warn("Wake Lock не поддерживается:", err);
  }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && wakeLock === null) requestWakeLock();
});

// ====== СТАРТ ======
renderTable();
tick();
requestWakeLock();
