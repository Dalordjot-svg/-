import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- ИНИЦИАЛИЗАЦИЯ ТЕЛЕГРАМ ---
const tg = window.Telegram.WebApp;
tg.expand(); 
tg.ready(); 
tg.setHeaderColor('#000000'); 
tg.setBackgroundColor('#000000');

// --- ИНИЦИАЛИЗАЦИЯ FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyBa3MKrLHcRPauIyzxgxfNpLUphmehJAkg",
    authDomain: "moon-logistik.firebaseapp.com",
    databaseURL: "https://moon-logistik-default-rtdb.firebaseio.com",
    projectId: "moon-logistik",
    storageBucket: "moon-logistik.firebasestorage.app",
    messagingSenderId: "335239459996",
    appId: "1:335239459996:web:98a3cd3508767cfde6a959"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, 'school_os_data_v1');

// --- СТАНДАРТНОЕ РАСПИСАНИЕ (II смена) ---
const defaultSchedule = {
    1: [{i:"🇷🇺", n:"Разговоры о важном", s:"13:10", e:"13:30", r:"?"}, {i:"🧪", n:"Химия", s:"13:35", e:"14:15", r:"?"}, {i:"🧬", n:"Биология", s:"14:20", e:"15:00", r:"?"}, {i:"🇷🇺", n:"Русский язык", s:"15:05", e:"15:45", r:"?"}, {i:"📐", n:"Алгебра", s:"16:00", e:"16:40", r:"?"}, {i:"📐", n:"Алгебра", s:"16:45", e:"17:25", r:"?"}, {i:"🎵", n:"Музыка", s:"17:30", e:"18:10", r:"?"}],
    2: [{i:"🎲", n:"Вероятность и стат.", s:"13:30", e:"14:10", r:"?"}, {i:"⚽", n:"Физкультура", s:"14:15", e:"14:55", r:"Спортзал"}, {i:"📚", n:"Литература", s:"15:00", e:"15:40", r:"?"}, {i:"⚡", n:"Физика", s:"15:50", e:"16:30", r:"?"}, {i:"✏️", n:"Черчение", s:"16:35", e:"17:15", r:"?"}, {i:"🇬🇧", n:"Английский язык", s:"17:20", e:"18:00", r:"?"}, {i:"📜", n:"История", s:"18:05", e:"18:45", r:"?"}],
    3: [{i:"🇬🇧", n:"Английский язык", s:"13:30", e:"14:10", r:"?"}, {i:"🇷🇺", n:"Русский язык", s:"14:15", e:"14:55", r:"?"}, {i:"🧪", n:"Химия", s:"15:00", e:"15:40", r:"?"}, {i:"📐", n:"Геометрия", s:"15:50", e:"16:30", r:"?"}, {i:"🌍", n:"География", s:"16:35", e:"17:15", r:"?"}, {i:"🇷🇺", n:"Русский язык", s:"17:20", e:"18:00", r:"?"}, {i:"🔨", n:"Технология", s:"18:05", e:"18:45", r:"?"}],
    4: [{i:"🔢", n:"РМГ", s:"13:10", e:"13:30", r:"?"}, {i:"⚡", n:"Физика", s:"13:35", e:"14:15", r:"?"}, {i:"📚", n:"Литература", s:"14:20", e:"15:00", r:"?"}, {i:"📜", n:"История", s:"15:05", e:"15:45", r:"?"}, {i:"📐", n:"Геометрия", s:"16:00", e:"16:40", r:"?"}, {i:"💻", n:"Информатика", s:"16:45", e:"17:25", r:"?"}, {i:"⚽", n:"Физкультура", s:"17:30", e:"18:10", r:"Спортзал"}],
    5: [{i:"🇬🇧", n:"Английский язык", s:"13:30", e:"14:10", r:"?"}, {i:"📐", n:"Алгебра", s:"14:15", e:"14:55", r:"?"}, {i:"🌍", n:"География", s:"15:00", e:"15:40", r:"?"}, {i:"🌍", n:"География Т", s:"15:50", e:"16:30", r:"?"}, {i:"🧬", n:"Биология", s:"16:35", e:"17:15", r:"?"}, {i:"🛡️", n:"ОБЗР", s:"17:20", e:"18:00", r:"?"}, {i:"⚖️", n:"Обществознание", s:"18:05", e:"18:45", r:"?"}]
};

// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
window.schedule = {};
window.notes = "";
window.settings = { theme: '#FFD60A', showEmoji: true, animations: true };
window.selectedDay = 1; 
window.editingIndex = -1; 
window.quickHWTarget = null;
window.currentSubject = null; 
window.selectedManualDay = 1; 
window.currentTimeTarget = null; 
window.pendingImage = null; 
window.currentImageTarget = null;
let saveTimeout;

// --- АНИМАЦИИ (ВЕСНА) ---
function createSpringMagic() {
    const container = document.getElementById('springParticles'); if (!container) return; const count = 35; 
    for (let i = 0; i < count; i++) {
        const petal = document.createElement('div'); petal.className = 'petal';
        const size = Math.random() * 8 + 6; petal.style.width = size + 'px'; petal.style.height = size + 'px'; petal.style.left = Math.random() * 100 + 'vw';
        const fallDuration = Math.random() * 8 + 6; const swayDuration = Math.random() * 3 + 2; 
        petal.style.animationDuration = `${fallDuration}s, ${swayDuration}s`;
        petal.style.animationDelay = `${-(Math.random() * fallDuration)}s, ${-(Math.random() * swayDuration)}s`;
        container.appendChild(petal);
    }
}

// --- СИСТЕМА ФОТОГРАФИЙ ---
window.triggerImageUpload = function(target) { 
    window.currentImageTarget = target; 
    document.getElementById('imageUploader').click(); 
}

window.handleImageUpload = function(event) {
    const file = event.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 800; let width = img.width; let height = img.height;
            if(width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH)/width); width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
            const compressedData = canvas.toDataURL('image/jpeg', 0.6); window.pendingImage = compressedData;
            
            if(window.currentImageTarget === 'quick') document.getElementById('quickImgStatus').innerText = "✔ Прикреплено";
            if(window.currentImageTarget === 'manual') document.getElementById('manualImgStatus').innerText = "✔ Прикреплено";
            if(window.currentImageTarget === 'edit') {
                document.getElementById('editImgPreview').src = compressedData; 
                document.getElementById('editImgPreview').style.display = 'block'; 
                document.getElementById('removeImgBtn').style.display = 'block';
            }
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
}

window.removePendingImage = function() { 
    window.pendingImage = null; 
    document.getElementById('editImgPreview').style.display = 'none'; 
    document.getElementById('editImgPreview').src = ''; 
    document.getElementById('removeImgBtn').style.display = 'none'; 
}

// --- МОДАЛЬНЫЕ ОКНА И АЛЕРТЫ ---
window.showAlert = function(title, text) { document.getElementById('alertTitle').innerText = title; document.getElementById('alertText').innerText = text; document.getElementById('alertBtns').innerHTML = `<button class="pin-btn" onclick="closeCustomAlert()">ОК</button>`; document.getElementById('customAlertOverlay').classList.add('open'); }
window.showConfirm = function(title, text, onYes) { document.getElementById('alertTitle').innerText = title; document.getElementById('alertText').innerText = text; document.getElementById('alertBtns').innerHTML = `<button class="pin-btn" onclick="closeCustomAlert()" style="background:rgba(255,255,255,0.1); color:white;">Отмена</button><button class="pin-btn" id="confirmYesBtn">Да</button>`; document.getElementById('confirmYesBtn').onclick = function() { onYes(); closeCustomAlert(); }; document.getElementById('customAlertOverlay').classList.add('open'); }
window.closeCustomAlert = function() { document.getElementById('customAlertOverlay').classList.remove('open'); }
window.closeModal = function() { document.getElementById('editModal').classList.remove('open'); document.getElementById('aiModal').classList.remove('open'); }
window.closeSheet = function() { document.getElementById('sheetOverlay').classList.remove('open'); document.getElementById('sheetContainer').classList.remove('open'); }

// --- ШТОРКИ ВЫБОРА ---
window.openSubjectSheet = function() {
    const sheet = document.getElementById('sheetContent'); sheet.innerHTML = ''; document.getElementById('sheetTitle').innerText = 'ВЫБЕРИ ПРЕДМЕТ';
    const subjects = new Set(); for(let d=1; d<=5; d++) { if(window.schedule[d]) window.schedule[d].forEach(l => subjects.add(l.n)); }
    Array.from(subjects).sort().forEach(s => { const div = document.createElement('div'); div.className = 'sheet-item'; div.innerText = s; div.onclick = () => { window.currentSubject = s; document.getElementById('selectedSubjectText').innerText = s; document.getElementById('selectedSubjectText').style.color = 'var(--primary)'; closeSheet(); window.findNextLessonDate(); }; sheet.appendChild(div); });
    document.getElementById('sheetOverlay').classList.add('open'); document.getElementById('sheetContainer').classList.add('open');
}

window.openDaySheet = function() {
    const sheet = document.getElementById('sheetContent'); sheet.innerHTML = ''; document.getElementById('sheetTitle').innerText = 'ВЫБЕРИ ДЕНЬ НЕДЕЛИ'; const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
    days.forEach((d, i) => { const div = document.createElement('div'); div.className = 'sheet-item'; div.innerText = d; div.onclick = () => { document.getElementById('manualDayText').innerText = d; window.selectedManualDay = i + 1; closeSheet(); }; sheet.appendChild(div); });
    document.getElementById('sheetOverlay').classList.add('open'); document.getElementById('sheetContainer').classList.add('open');
}

window.openTimePicker = function(targetId) {
    window.currentTimeTarget = targetId; const currentVal = document.getElementById(targetId).innerText || "13:30"; let [h, m] = currentVal.split(':');
    const hr = document.getElementById('hourRoller'); hr.innerHTML = '<div style="height: 50px;"></div>'; for(let i=0; i<24; i++) hr.innerHTML += `<div class="time-item">${i<10?'0'+i:i}</div>`; hr.innerHTML += '<div style="height: 50px;"></div>';
    const mr = document.getElementById('minuteRoller'); mr.innerHTML = '<div style="height: 50px;"></div>'; for(let i=0; i<60; i++) mr.innerHTML += `<div class="time-item">${i<10?'0'+i:i}</div>`; mr.innerHTML += '<div style="height: 50px;"></div>';
    document.getElementById('timeSheetOverlay').classList.add('open'); document.getElementById('timeSheetContainer').classList.add('open');
    setTimeout(() => { hr.scrollTop = parseInt(h) * 50; mr.scrollTop = parseInt(m) * 50; }, 50);
}

window.saveTimePicker = function() {
    const hr = document.getElementById('hourRoller'); const mr = document.getElementById('minuteRoller');
    const hIndex = Math.round(hr.scrollTop / 50); const mIndex = Math.round(mr.scrollTop / 50);
    const h = hIndex < 10 ? '0'+hIndex : hIndex; const m = mIndex < 10 ? '0'+mIndex : mIndex;
    document.getElementById(window.currentTimeTarget).innerText = `${h}:${m}`;
    document.getElementById('timeSheetOverlay').classList.remove('open'); document.getElementById('timeSheetContainer').classList.remove('open');
}
window.closeTimePicker = function() { document.getElementById('timeSheetOverlay').classList.remove('open'); document.getElementById('timeSheetContainer').classList.remove('open'); }

// --- ПРАЗДНИКИ И СОКРАЩЕННЫЕ ДНИ ---
window.toggleModAction = function() {
    const action = document.getElementById('modAction').value;
    document.getElementById('modShortenParams').style.display = action === 'shorten' ? 'block' : 'none';
    document.getElementById('modHolidayParams').style.display = action === 'holiday' ? 'block' : 'none';
}

window.applyDayModification = function() {
    const day = parseInt(document.getElementById('modDay').value); const action = document.getElementById('modAction').value;
    if(!window.schedule[day] || window.schedule[day].length === 0) { window.showAlert("Ошибка", "В этот день и так нет уроков."); return; }
    if(action === 'shorten') {
        const count = parseInt(document.getElementById('modLessonCount').value);
        if(isNaN(count) || count < 1) { window.showAlert("Ошибка", "Введите корректное число уроков!"); return; }
        if(count >= window.schedule[day].length) { window.showAlert("Внимание", "Количество уроков больше или равно текущему."); return; }
        window.showConfirm("Внимание", `Оставить только первые ${count} уроков? Остальные будут удалены!`, () => {
            window.schedule[day] = window.schedule[day].slice(0, count); window.pushToCloud(); window.renderScheduleList(); window.initAdmin(); window.updateTimer(); window.showAlert("Готово", "День успешно сокращен!");
        });
    } else if (action === 'holiday') {
        const hName = document.getElementById('modHolidayName').value.trim() || "Праздник";
        window.showConfirm("Внимание", `Сделать день выходным (${hName})? Все уроки будут удалены!`, () => {
            window.schedule[day] = []; window.pushToCloud(); window.renderScheduleList(); window.initAdmin(); window.updateTimer(); window.showAlert("Готово", `Установлен выходной: ${hName}!`);
        });
    }
}

// --- БАЗОВАЯ ЛОГИКА (СИНХРОНИЗАЦИЯ, НАСТРОЙКИ) ---
window.pushToCloud = function() { set(dbRef, { schedule: window.schedule, settings: window.settings, notes: window.notes }); }

window.autoSaveNotes = function() { 
    window.notes = document.getElementById('notesInput').value; document.getElementById('notesStatus').innerText = "Сохранение..."; 
    clearTimeout(saveTimeout); 
    saveTimeout = setTimeout(() => { window.pushToCloud(); document.getElementById('notesStatus').innerText = "Сохранено ✔"; setTimeout(() => { document.getElementById('notesStatus').innerText = ""; }, 2000); }, 1000); 
}

// НОВАЯ КНОПКА: Очистить только ДЗ
window.clearAllHomeworks = function() {
    window.showConfirm("Очистка заданий", "Вы уверены, что хотите удалить ВСЕ тексты ДЗ и фотографии на этой неделе? Сами уроки останутся.", () => {
        for(let d=1; d<=5; d++) {
            if(window.schedule[d]) {
                window.schedule[d].forEach(l => {
                    delete l.h;
                    delete l.img;
                });
            }
        }
        window.pushToCloud();
        window.renderScheduleList();
        if (document.getElementById('adminInterface').style.display === 'block') window.initAdmin();
        window.showAlert("Готово", "Все домашние задания удалены!");
    });
}

// КНОПКА: Полный сброс
window.resetToFactory = function() { 
    window.showConfirm("Полный сброс", "Удалить все изменения, стереть ДЗ и вернуть заводское расписание?", () => { 
        window.schedule = JSON.parse(JSON.stringify(defaultSchedule)); 
        window.settings = { theme: '#FFD60A', showEmoji: true, animations: true }; 
        window.notes = ""; 
        window.pushToCloud(); 
        location.reload(); 
    }); 
}

window.setTheme = function(color, el) { window.settings.theme = color; applyTheme(color); window.pushToCloud(); document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active')); if(el) el.classList.add('active'); }
function applyTheme(color) { const root = document.documentElement; root.style.setProperty('--primary', color); root.style.setProperty('--primary-dim', color + '26'); }
window.toggleEmojis = function(val) { window.settings.showEmoji = val; window.pushToCloud(); }
window.toggleAnimations = function(val) { window.settings.animations = val; window.pushToCloud(); applyAnimations(val); }
function applyAnimations(isEnabled) { if(isEnabled) { document.getElementById('bodyRoot').classList.remove('no-anim'); document.getElementById('springParticles').style.display = 'block'; } else { document.getElementById('bodyRoot').classList.add('no-anim'); document.getElementById('springParticles').style.display = 'none'; } document.getElementById('toggleAnim').checked = isEnabled; }
function getMin(t) { if(!t) return 0; const [h,m] = t.split(':').map(Number); return h*60+m; }

// --- ТАЙМЕР ---
window.updateTimer = function() {
    const now = new Date(); const d = now.getDay(); const curMin = now.getHours()*60 + now.getMinutes();
    document.getElementById('headerTime').innerText = now.toLocaleTimeString().slice(0,5); document.getElementById('headerDate').innerText = now.toLocaleDateString('ru-RU', {weekday:'short', day:'numeric'}).toUpperCase();
    const today = window.schedule[d];
    if(!today || today.length === 0) { setCard('chill', '😴', 'ВЫХОДНОЙ', 'Отдыхай!', 0, 100, 'Завтра'); return; }

    let active = false;
    for(let i=0; i<today.length; i++) {
        const l = today[i]; const s = getMin(l.s); const e = getMin(l.e);
        if(curMin >= s && curMin < e) { const total = (e-s)*60; const passed = (curMin-s)*60 + now.getSeconds(); setCard('lesson', l.i, l.n, l.r, total-passed, (passed/total)*100, (i+1 < today.length) ? today[i+1].n : "Домой"); active = true; break; }
        if(i+1 < today.length) {
            const nextL = today[i+1]; const nextS = getMin(nextL.s);
            if(curMin >= e && curMin < nextS) { const total = (nextS-e)*60; const passed = (curMin-e)*60 + now.getSeconds(); setCard('break', '☕', 'ПЕРЕМЕНА', `След: ${nextL.n}`, total-passed, (passed/total)*100, `Каб: ${nextL.r}`); active = true; break; }
        }
    }
    if(!active) {
        const first = getMin(today[0].s);
        if(curMin < first) { setCard('wait', '🎒', 'ОЖИДАНИЕ', 'Скоро уроки', (first*60) - (curMin*60+now.getSeconds()), 0, today[0].n); }
        else { setCard('chill', '🏠', 'ВСЕ УРОКИ', 'Домой!', 0, 100, 'Завтра'); }
    }
}

function setCard(mode, icon, title, sub, sec, pct, next) {
    const badge = document.getElementById('statusBadge'); const bar = document.getElementById('progressBar'); const iconEl = document.getElementById('mainIcon');
    let showIcon = window.settings.showEmoji; if(mode !== 'lesson') showIcon = true; iconEl.innerText = showIcon ? (icon || '📚') : '';
    if(mode==='lesson') { badge.style.background = 'var(--primary)'; badge.innerText = 'ИДЕТ УРОК'; bar.style.background = 'var(--primary)'; } else if(mode==='break') { badge.style.background = 'var(--success)'; badge.innerText = 'ПЕРЕМЕНА'; bar.style.background = 'var(--success)'; } else { badge.style.background = 'var(--text-sec)'; badge.innerText = mode==='wait'?'СКОРО':'ОТДЫХ'; bar.style.background = '#555'; }
    document.getElementById('mainSubject').innerText = title; document.getElementById('roomSubject').innerText = sub; document.getElementById('nextSubject').innerText = next;
    if(sec > 0) { const m = Math.floor(sec/60); const s = Math.floor(sec%60); document.getElementById('countdown').innerText = `${m}:${s<10?'0':''}${s}`; bar.style.width = `${pct}%`; } else { document.getElementById('countdown').innerText = mode==='chill' ? '✔' : '--:--'; bar.style.width = pct + '%'; }
}

// --- РАСКРЫТИЕ ДЗ В РАСПИСАНИИ ---
window.toggleHw = function(id, btnEl) {
    const el = document.getElementById(id);
    if(el.style.display === 'none') {
        el.style.display = 'block';
        if(btnEl) btnEl.innerText = 'Скрыть 🔼';
    } else {
        el.style.display = 'none';
        if(btnEl) btnEl.innerText = 'Подробнее 🔽';
    }
}

window.renderScheduleList = function() {
    const container = document.getElementById('fullScheduleList'); const hwContainer = document.getElementById('homeworkSummaryList');
    if(!container) return; container.innerHTML = ''; if(hwContainer) hwContainer.innerHTML = '';
    const todayIdx = new Date().getDay(); const days = ['Вс','Понедельник','Вторник','Среда','Четверг','Пятница','Сб'];
    let hasHomework = false;

    for(let d=1; d<=5; d++) {
        if(!window.schedule[d]) continue;
        container.innerHTML += `<div style="padding:15px; font-weight:700; color:${d===todayIdx?'var(--primary)':'#666'}">${days[d]}</div>`;
        window.schedule[d].forEach((l, idx) => {
            const iconHtml = window.settings.showEmoji ? `<span class="lesson-icon">${l.i||'📚'}</span>` : ''; let homeworkHtml = '';
            
            if(l.h || l.img) { 
                const hwId = `hw_det_${d}_${idx}`;
                const shortText = l.h ? (l.h.length > 25 ? l.h.substring(0, 25) + '...' : l.h) : 'Только фото-задание';
                const fullText = l.h ? `<div style="color: white; font-size: 14px; margin-bottom: 10px; line-height: 1.4; white-space: pre-wrap;">${l.h}</div>` : '';
                const imgHtml = l.img ? `<img src="${l.img}" style="width:100%; max-height: 200px; object-fit:cover; border-radius:8px; cursor:pointer;" onclick="window.open('${l.img}', '_blank')">` : `<div style="font-size:12px; color:var(--text-sec); font-style:italic;">У ДЗ нет прикреплённых фото</div>`;
                
                homeworkHtml = `
                <div class="homework-badge">
                    <div style="display:flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div style="display:flex; align-items:center; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; flex:1; margin-right: 10px;">
                            <span>📝</span><span style="margin-left:5px; font-weight:600;">${shortText}</span>
                        </div>
                        <div onclick="toggleHw('${hwId}', this)" style="background: var(--primary); color: black; padding: 4px 10px; border-radius: 8px; font-size: 11px; cursor: pointer; font-weight: 800; white-space: nowrap;">Подробнее 🔽</div>
                    </div>
                    <div id="${hwId}" style="display:none; width: 100%; margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(255,214,10,0.3);">
                        ${fullText}
                        ${imgHtml}
                    </div>
                </div>`; 
                hasHomework = true;

                if(hwContainer) {
                    hwContainer.innerHTML += `<div class="hw-summary-item">
                        <span style="font-size:20px; margin-right:12px;">${l.i||'•'}</span>
                        <div style="flex:1;">
                            <div style="font-weight:600; font-size:14px; color:#fff;">${l.n}</div>
                            <div style="color:var(--primary); font-size:13px;">${shortText}</div>
                            <div style="color:#666; font-size:10px;">${days[d]}</div>
                        </div>
                    </div>`;
                }
            }
            container.innerHTML += `<div class="glass-item ${d===todayIdx?'active-day-row':''}"><div style="display:flex; justify-content: space-between; align-items: flex-start; width: 100%;"><div style="display:flex; align-items:center;">${iconHtml}<div><div style="font-weight:600; font-size:16px;">${l.n}</div><div style="font-size:12px; color:var(--text-sec);">Каб: ${l.r}</div></div></div><div style="text-align:right; font-size:13px; font-family:monospace; min-width: 40px;">${l.s}<br>${l.e}</div></div>${homeworkHtml}</div>`;
        });
    }
    if(!hasHomework && hwContainer) hwContainer.innerHTML = `<div style="text-align:center; color:#555; font-size:12px; padding:10px;">Заданий пока нет. Отдыхай! 😴</div>`;
}

// --- НАВИГАЦИЯ И АДМИН ПАНЕЛЬ ---
window.checkPin = function() { if(document.getElementById('pinInput').value === "202020") { document.getElementById('loginScreen').style.display = 'none'; document.getElementById('adminInterface').style.display = 'block'; window.initAdmin(); } else { window.showAlert("Ошибка", "Неверный пароль!"); } }
window.switchTab = function(id, btn) { document.querySelectorAll('.view-section').forEach(e=>e.classList.remove('active')); document.getElementById(id).classList.add('active'); document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
window.switchAdminTab = function(tabId, btn) { document.querySelectorAll('.admin-subview').forEach(el => el.classList.remove('active')); document.getElementById(tabId).classList.add('active'); document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
window.toggleHwMode = function() { if(document.getElementById('hwModeSwitch').checked) { document.getElementById('modeLabel').innerText = "РУЧНОЙ"; document.getElementById('modeLabel').style.color = "var(--text-main)"; document.getElementById('hwAutoMode').style.display = 'none'; document.getElementById('hwManualMode').style.display = 'block'; } else { document.getElementById('modeLabel').innerText = "АВТО"; document.getElementById('modeLabel').style.color = "var(--primary)"; document.getElementById('hwAutoMode').style.display = 'block'; document.getElementById('hwManualMode').style.display = 'none'; } }

window.findNextLessonDate = function() {
    const subject = window.currentSubject; const label = document.getElementById('hwTargetLabel'); const todayDay = new Date().getDay(); const daysName = ['Вс','Понедельник','Вторник','Среда','Четверг','Пятница','Сб'];
    window.quickHWTarget = null; if(!subject) { label.innerText = "Сначала выбери предмет"; label.style.color = "var(--primary)"; return; }
    let foundDay = -1; let foundIdx = -1;
    for(let offset=1; offset<=7; offset++) {
         let checkDay = (todayDay + offset); while(checkDay > 7) checkDay -= 7; 
         if(checkDay > 5) continue; 
         if(window.schedule[checkDay]) { const idx = window.schedule[checkDay].findIndex(l => l.n === subject); if(idx !== -1) { foundDay = checkDay; foundIdx = idx; break; } }
    }
    if(foundDay !== -1) { window.quickHWTarget = { day: foundDay, idx: foundIdx }; label.innerHTML = `Следующий урок: <span style="color:white;">${daysName[foundDay]}</span>`; label.style.color = "var(--text-sec)"; }
    else { label.innerText = "Урок не найден в расписании!"; label.style.color = "var(--danger)"; }
}

window.saveQuickHW = function() {
    const text = document.getElementById('hwTextQuick').value; const target = window.quickHWTarget;
    if(!target) { window.showAlert("Ошибка", "Сначала выбери предмет!"); return; } 
    if(!text && !window.pendingImage) { window.showAlert("Ошибка", "Напиши задание или добавь фото!"); return; }
    window.schedule[target.day][target.idx].h = text; if(window.pendingImage) window.schedule[target.day][target.idx].img = window.pendingImage;
    window.pushToCloud(); window.showAlert("Успешно", "ДЗ сохранено!"); document.getElementById('hwTextQuick').value = ''; window.pendingImage = null; document.getElementById('quickImgStatus').innerText = ""; window.renderScheduleList(); 
}

window.saveManualHW = function() {
    const day = window.selectedManualDay; const idx = parseInt(document.getElementById('manualLessonIdx').value) - 1; const text = document.getElementById('hwTextManual').value;
    if(!window.schedule[day] || !window.schedule[day][idx]) { window.showAlert("Ошибка", "Такого урока нет!"); return; }
    if(!text && !window.pendingImage) { window.showAlert("Ошибка", "Напиши задание или добавь фото!"); return; }
    window.schedule[day][idx].h = text; if(window.pendingImage) window.schedule[day][idx].img = window.pendingImage;
    window.pushToCloud(); window.showAlert("Успешно", "ДЗ добавлено!"); document.getElementById('hwTextManual').value = ''; window.pendingImage = null; document.getElementById('manualImgStatus').innerText = ""; window.renderScheduleList();
}

window.initAdmin = function() {
    const selector = document.getElementById('daySelector'); selector.innerHTML = ''; const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'];
    days.forEach((d, i) => { const btn = document.createElement('div'); btn.style.padding = "8px 16px"; btn.style.borderRadius = "20px"; btn.style.cursor = "pointer"; btn.style.background = ((i+1)===window.selectedDay) ? 'var(--primary)' : 'rgba(255,255,255,0.1)'; btn.style.color = ((i+1)===window.selectedDay) ? 'black' : 'white'; btn.style.fontWeight = "bold"; btn.innerText = d; btn.onclick = () => { window.selectedDay = i+1; window.initAdmin(); }; selector.appendChild(btn); }); window.renderAdminList();
}

window.renderAdminList = function() {
    const list = document.getElementById('editorList'); if (!list) return; list.innerHTML = '';
    (window.schedule[window.selectedDay] || []).forEach((l, idx) => { const hwMarker = (l.h || l.img) ? '<span style="color:var(--primary); margin-left:5px;">📝</span>' : ''; list.innerHTML += `<div class="glass-item" onclick="openEdit(${idx})"><div style="display:flex; align-items:center;"><span style="margin-right:10px; font-size:20px;">${l.i||'📚'}</span><b>${l.n}</b>${hwMarker}</div><span>✎</span></div>`; });
}

window.openEdit = function(idx) {
    window.editingIndex = idx; const l = window.schedule[window.selectedDay][idx];
    document.getElementById('editIcon').value = l.i || "📚"; document.getElementById('editName').value = l.n; document.getElementById('editRoom').value = l.r; document.getElementById('editStartText').innerText = l.s; document.getElementById('editEndText').innerText = l.e; document.getElementById('editHomework').value = l.h || "";
    window.pendingImage = l.img || null;
    if(l.img) { document.getElementById('editImgPreview').src = l.img; document.getElementById('editImgPreview').style.display = 'block'; document.getElementById('removeImgBtn').style.display = 'block'; } else { document.getElementById('editImgPreview').style.display = 'none'; document.getElementById('removeImgBtn').style.display = 'none'; }
    document.getElementById('editModal').classList.add('open');
}

window.addNewLesson = function() { window.editingIndex = -1; window.pendingImage = null; document.getElementById('editStartText').innerText = "13:30"; document.getElementById('editEndText').innerText = "14:10"; document.getElementById('editImgPreview').style.display = 'none'; document.getElementById('removeImgBtn').style.display = 'none'; document.getElementById('editModal').classList.add('open'); }

window.saveLesson = function() {
    const newL = { i: document.getElementById('editIcon').value, n: document.getElementById('editName').value, r: document.getElementById('editRoom').value, s: document.getElementById('editStartText').innerText, e: document.getElementById('editEndText').innerText, h: document.getElementById('editHomework').value };
    if(!newL.n || !newL.s || !newL.e) { window.showAlert("Ошибка", "Заполните название и время!"); return; }
    if(newL.h === "") delete newL.h;
    if(window.pendingImage) newL.img = window.pendingImage; else delete newL.img;
    if(!window.schedule[window.selectedDay]) window.schedule[window.selectedDay] = [];
    if(window.editingIndex === -1) window.schedule[window.selectedDay].push(newL); else window.schedule[window.selectedDay][window.editingIndex] = newL;
    window.schedule[window.selectedDay].sort((a,b) => getMin(a.s) - getMin(b.s)); window.pushToCloud(); window.closeModal(); window.renderAdminList();
}
window.deleteLesson = function() { if(window.editingIndex > -1) { window.schedule[window.selectedDay].splice(window.editingIndex, 1); window.pushToCloud(); window.closeModal(); window.renderAdminList(); } }

window.openAiModal = function() { const request = document.getElementById('aiRequest').value.trim(); if(!request) { window.showAlert("Внимание", "Сначала напишите запрос!"); return; } document.getElementById('promptOutput').value = `Ты - редактор расписания JSON. ВОТ ТЕКУЩЕЕ РАСПИСАНИЕ: ${JSON.stringify(window.schedule)}. ЗАДАЧА: "${request}". В ответ только JSON код обернутый в \`\`\`json.`; document.getElementById('jsonInput').value = ""; document.getElementById('aiModal').classList.add('open'); }
window.copyPrompt = function() { const t = document.getElementById("promptOutput"); t.select(); t.setSelectionRange(0, 99999); navigator.clipboard.writeText(t.value).then(() => { window.showAlert("Готово", "Скопировано!"); }); }
window.applyAiResult = function() { try { const r = JSON.parse(document.getElementById('jsonInput').value.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim()); if(r.new_schedule || r["1"]) { window.schedule = r.new_schedule || r; window.pushToCloud(); window.closeModal(); window.showAlert("Успешно", "Расписание обновлено!"); } } catch(e) { window.showAlert("Ошибка", "Ошибка чтения JSON!"); } }

// --- СТАРТ И ОБНОВЛЕНИЯ ДАННЫХ ИЗ FIREBASE ---
onValue(dbRef, (snapshot) => {
    const data = snapshot.val(); document.getElementById('cloudIndicator').classList.add('online');
    if (data) { 
        window.schedule = data.schedule || defaultSchedule; 
        window.settings = data.settings || { theme: '#FFD60A', showEmoji: true, animations: true }; 
        window.notes = data.notes || ""; 
    } else { 
        window.schedule = JSON.parse(JSON.stringify(defaultSchedule)); 
        window.pushToCloud(); 
    }
    
    document.getElementById('notesInput').value = window.notes;
    applyTheme(window.settings.theme); 
    applyAnimations(window.settings.animations !== false); 
    document.getElementById('toggleEmoji').checked = window.settings.showEmoji;
    
    window.renderScheduleList(); 
    if(document.getElementById('adminInterface').style.display === 'block') window.initAdmin();
    
    // Запускаем анимацию один раз при получении данных
    if(document.getElementById('springParticles').childElementCount === 0) {
        createSpringMagic();
    }
});

setInterval(window.updateTimer, 1000); 
window.updateTimer();

// --- ТУТОРИАЛ (ОБУЧЕНИЕ) ---
const steps = [
    { target: 'tutHero', title: "Умный Таймер", text: "Здесь показывается, сколько осталось до звонка, какой сейчас урок и что будет дальше.", view: 'view-timer', btnId: 'btnTimer' },
    { target: 'tutNavBar', title: "Остров Навигации", text: "Плавающее меню снизу помогает перемещаться между вкладками.", view: 'view-timer', btnId: null },
    { target: 'tutHwBlock', title: "Домашние Задания", text: "Смотри актуальные задания. Если есть ДЗ или фото, оно появится прямо в расписании.", view: 'view-schedule', btnId: 'btnSched' }
];
let stepIndex = 0;

window.startTutorial = function(force = false) {
    if (!force && localStorage.getItem('tutorialSeen') === 'true') return;
    stepIndex = 0;
    document.getElementById('tutorialOverlay').classList.add('active');
    showStep();
}

window.nextTutorialStep = function() {
    stepIndex++;
    if (stepIndex >= steps.length) { endTutorial(); } else { showStep(); }
}

function showStep() {
    const s = steps[stepIndex];
    if (s.view) {
        document.querySelectorAll('.view-section').forEach(e => e.classList.remove('active'));
        document.getElementById(s.view).classList.add('active');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        if(s.btnId) document.getElementById(s.btnId).classList.add('active');
    }
    setTimeout(() => {
        const el = document.getElementById(s.target);
        const frame = document.getElementById('tutorialFrame');
        const box = document.getElementById('tutorialBox');
        if (el) {
            const rect = el.getBoundingClientRect();
            frame.style.width = rect.width + 'px'; frame.style.height = rect.height + 'px';
            frame.style.top = rect.top + 'px'; frame.style.left = rect.left + 'px'; frame.style.opacity = '1';
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow > 200) { box.style.top = (rect.bottom + 20) + 'px'; box.style.bottom = 'auto'; } 
            else { box.style.bottom = (window.innerHeight - rect.top + 20) + 'px'; box.style.top = 'auto'; }
            box.style.left = '50%'; box.style.transform = 'translateX(-50%)';
            document.getElementById('tutTitle').innerText = s.title; document.getElementById('tutText').innerText = s.text;
        }
    }, 300);
}

function endTutorial() {
    document.getElementById('tutorialOverlay').classList.remove('active');
    localStorage.setItem('tutorialSeen', 'true');
    window.switchTab('view-timer', document.getElementById('btnTimer'));
}

// Запускаем туториал через секунду после загрузки (если он еще не был показан)
setTimeout(() => window.startTutorial(), 1000);