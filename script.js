// ======== НАСТРОЙКИ ========

// Дни недели
const DAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница"];

// Время звонков для II смены
const bells = {
  // Понедельник, четверг
  MT: [
    ["13:10", "13:30"], // 0 (разговор о важном)
    ["13:35", "14:15"], // 1
    ["14:20", "15:00"], // 2
    ["15:05", "15:45"], // 3
    ["16:00", "16:40"], // 4
    ["16:45", "17:25"], // 5
    ["17:30", "18:10"]  // 6
  ],
  // Вторник, среда, пятница
  TWF: [
    ["13:30", "14:10"], // 1
    ["14:15", "14:55"], // 2
    ["15:00", "15:40"], // 3
    ["15:50", "16:30"], // 4
    ["16:35", "17:15"], // 5
    ["17:20", "18:00"], // 6
    ["18:05", "18:45"]  // 7
  ]
};

// Расписание 8В
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
    ["теорию вероятности", "208"],
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
    ["Труд/технология", "А-101/"]
  ],
  "Четверг": [
    ["Профориентация", "А-302"],
    ["Физика", "Б-306"],
    ["Русский язык", "205"],
    ["Геометрия", "208"],
    ["История", "Б-305"],
    ["Физра", "спортзал"],
    ["Информатика", "А-304/305"]
  ],
  "Пятница": [
    ["Русский язык", "205"],
    ["Матемитика", "208"],
    ["Англиский язык", "308/309"],
    ["история", "Б-305"],
    ["география", "Б-202"],
    ["ОБЗР", "103"]
  ]
};

// ======== ВСПОМОГАТЕЛЬНЫЕ ========

const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, "0");

function parse(t) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function diff(a, b) {
  return Math.floor((b - a) / 60000);
}

function today() {
  const map = { 1: "Понедельник", 2: "Вторник", 3: "Среда", 4: "Четверг", 5: "Пятница" };
  return map[new Date().getDay()] || "Понедельник";
}

function bellset(day) {
  return (day === "Понедельник" || day === "Четверг") ? bells.MT : bells.TWF;
}

// ======== ОТОБРАЖЕНИЕ ========

const tbody = $("#tbody"),
      progress = $("#progress"),
      timeDisplay = $("#timeDisplay"),
      status = $("#status"),
      dayText = $("#dayText");

function renderTable() {
  const d = today(),
        arr = bellset(d),
        sub = lessons[d];
  dayText.textContent = `${d}, II смена`;
  tbody.innerHTML = "";
  arr.forEach(([a, b], i) => {
    const mins = diff(parse(a), parse(b));
    const s = sub[i];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${a}–${b}<div style="font-size:12px;color:#9aa4b2">${mins} мин</div></td>
      <td>${s ? s[0] : ""}</td>
      <td>${s ? s[1] : ""}</td>`;
    tbody.appendChild(tr);
  });
}

// ======== ЛОГИКА ПОДСВЕТКИ И ТАЙМЕРА ========

function state() {
  const day = today();
  const arr = bellset(day).map(([a, b]) => [parse(a), parse(b)]);
  const now = new Date();

  // После последнего урока
  if (now > arr[arr.length - 1][1]) return ["none", -1, now, now];

  // До начала первого
  if (now < arr[0][0]) return ["before", -1, arr[0][0], arr[0][1]];

  for (let i = 0; i < arr.length; i++) {
    const [start, end] = arr[i];

    if (now >= start && now <= end) return ["lesson", i, start, end];

    if (arr[i + 1] && now > end && now < arr[i + 1][0])
      return ["break", i, end, arr[i + 1][0]];
  }

  return ["none", -1, now, now];
}

let lastTime = "00:00";

function animateDigits(text) {
  timeDisplay.style.animation = "none";
  timeDisplay.offsetHeight;
  timeDisplay.textContent = text;
  timeDisplay.style.animation = "dropIn 0.6s ease";
}

function tick() {
  const [type, index, start, end] = state();
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

  // Изменение статуса
  if (type === "lesson") {
    status.textContent = "идёт урок";
    status.className = "status go";
  } else if (type === "break") {
    status.textContent = "перемена";
    status.className = "status soon";
  } else if (type === "before") {
    status.textContent = "уроки ещё не начались";
    status.className = "status soon";
  } else {
    status.textContent = "уроки закончились";
    status.className = "status stop";
  }

  // Подсветка строк
  const rows = document.querySelectorAll("tbody tr");
  rows.forEach((tr, i) => {
    tr.classList.remove("now");
    if ((type === "lesson" && i === index) || (type === "break" && i === index))
      tr.classList.add("now");
  });

  requestAnimationFrame(tick);
}

// ======== ЗАПУСК ========

renderTable();
tick();
// ======== ЗАПРЕТ ГАСНУТЬ ЭКРАНУ ========

// Проверка поддержки Wake Lock API
let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    console.log("🟢 Экран не будет гаснуть");

    // Если экран блокируется или вкладка теряет фокус — пересоздаём блокировку
    wakeLock.addEventListener("release", () => {
      console.log("🔴 Экран снова может гаснуть");
    });
  } catch (err) {
    console.warn("Wake Lock не поддерживается:", err);
  }
}

// Повторно активировать при возврате на вкладку
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && wakeLock === null) {
    requestWakeLock();
  }
});

// Вызвать при загрузке страницы
requestWakeLock();