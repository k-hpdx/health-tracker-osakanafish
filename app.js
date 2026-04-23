/* ===== 健康記録アプリ ===== */
'use strict';

/* ---------- 定数 ---------- */
const STORAGE_KEY = 'health-tracker-v1';

const DEFAULT_TEAS = [
  'ハブ茶', '白湯', '番茶', '麦茶', 'トウモロコシ茶',
  '雑穀茶', 'グリーンルイボス', '黒豆茶', 'はとむぎ茶', 'ハーブティー'
];

const DEFAULT_CAFFEINE = ['紅茶', 'コーヒー', '緑茶', 'ほうじ茶'];

const DEFAULT_SYMPTOMS = [
  '頭痛', '倦怠感', 'むくみ', '肌荒れ', '便秘', '下痢',
  'お腹の張り', '眠気', '集中力低下', '気分の落ち込み', '冷え', 'めまい'
];

const WEATHER_OPTIONS = [
  { value: 'sunny',    emoji: '☀️', label: '晴れ' },
  { value: 'cloudy',   emoji: '⛅',  label: '曇り' },
  { value: 'rainy',    emoji: '🌧️', label: '雨' },
  { value: 'stormy',   emoji: '⛈️', label: '雷雨' },
  { value: 'snowy',    emoji: '🌨️', label: '雪' }
];

const YESNO_ITEMS = [
  { key: 'whiteSugar', label: '🍬 白砂糖' },
  { key: 'wheat',      label: '🌾 小麦' },
  { key: 'period',     label: '🌸 生理' },
  { key: 'yoga',       label: '🧘 ヨガ' }
];

const SCALE_LABELS = [
  { value: 1, emoji: '😫', label: 'とても悪い' },
  { value: 2, emoji: '😕', label: '悪い' },
  { value: 3, emoji: '😐', label: '普通' },
  { value: 4, emoji: '🙂', label: '良い' },
  { value: 5, emoji: '😄', label: 'とても良い' }
];

const WEEKDAYS_JP = ['日', '月', '火', '水', '木', '金', '土'];

/* ---------- 状態 ---------- */
let state = {
  currentDate: todayKey(),
  editingDate: todayKey(),
  calendarMonth: monthKey(new Date()),
  selectedCalDate: null,
  data: loadData()
};

/* ---------- ユーティリティ ---------- */
function todayKey() {
  const d = new Date();
  return dateKey(d);
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateJP(key) {
  const d = parseDateKey(key);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS_JP[d.getDay()]})`;
}

/* ---------- データ永続化 ---------- */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    if (!parsed.records) parsed.records = {};
    if (!parsed.customTeas) parsed.customTeas = [...DEFAULT_TEAS];
    if (!parsed.customCaffeine) parsed.customCaffeine = [...DEFAULT_CAFFEINE];
    if (!parsed.customSymptoms) parsed.customSymptoms = [...DEFAULT_SYMPTOMS];
    return parsed;
  } catch (e) {
    console.error('データ読込失敗', e);
    return defaultData();
  }
}

function defaultData() {
  return {
    records: {},
    customTeas: [...DEFAULT_TEAS],
    customCaffeine: [...DEFAULT_CAFFEINE],
    customSymptoms: [...DEFAULT_SYMPTOMS]
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function getRecord(dateKey) {
  return state.data.records[dateKey] || emptyRecord();
}

function emptyRecord() {
  return {
    weather: null,
    teas: [],
    caffeine: [],
    whiteSugar: null,
    wheat: null,
    period: null,
    yoga: null,
    conditionScale: null,
    symptoms: [],
    notes: ''
  };
}

/* ---------- 記録画面：描画 ---------- */
function renderRecordView() {
  const key = state.editingDate;
  const record = getRecord(key);

  document.getElementById('record-date').textContent = formatDateJP(key);
  document.getElementById('record-subtitle').textContent =
    key === todayKey() ? '今日の記録' : '過去の記録を編集中';

  renderWeatherSelect(record);

  renderChipList('teas-list', state.data.customTeas, record.teas, (selected) => {
    updateRecord(key, { teas: selected });
  });

  renderChipList('caffeine-list', state.data.customCaffeine, record.caffeine, (selected) => {
    updateRecord(key, { caffeine: selected });
  });

  renderYesNoList(record);
  renderConditionScale(record);
  renderChipList('symptoms-list', state.data.customSymptoms, record.symptoms, (selected) => {
    updateRecord(key, { symptoms: selected });
  });

  const notesInput = document.getElementById('notes-input');
  notesInput.value = record.notes || '';
  notesInput.oninput = (e) => updateRecord(key, { notes: e.target.value });
}

function renderChipList(containerId, options, selectedValues, onChange) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const selected = new Set(selectedValues);

  options.forEach(opt => {
    const chip = document.createElement('label');
    chip.className = 'chip' + (selected.has(opt) ? ' selected' : '');
    chip.innerHTML = `<input type="checkbox" ${selected.has(opt) ? 'checked' : ''}>${opt}`;
    chip.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) selected.add(opt);
      else selected.delete(opt);
      chip.classList.toggle('selected', e.target.checked);
      onChange([...selected]);
    });
    container.appendChild(chip);
  });
}

function renderYesNoList(record) {
  const container = document.getElementById('yesno-list');
  container.innerHTML = '';

  YESNO_ITEMS.forEach(item => {
    const row = document.createElement('div');
    row.className = 'yesno-row';
    row.innerHTML = `
      <span class="yesno-label">${item.label}</span>
      <div class="yesno-buttons">
        <button data-val="true"  class="${record[item.key] === true ? 'active-yes' : ''}">有</button>
        <button data-val="false" class="${record[item.key] === false ? 'active-no' : ''}">無</button>
      </div>
    `;
    row.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.val === 'true';
        const current = record[item.key];
        const newVal = current === val ? null : val;
        const update = {};
        update[item.key] = newVal;
        updateRecord(state.editingDate, update);
        renderRecordView();
      });
    });
    container.appendChild(row);
  });
}

function renderWeatherSelect(record) {
  const container = document.getElementById('weather-list');
  if (!container) return;
  container.innerHTML = '';

  WEATHER_OPTIONS.forEach(opt => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'weather-btn' + (record.weather === opt.value ? ' selected' : '');
    btn.innerHTML = `<span class="weather-emoji">${opt.emoji}</span><span class="weather-label">${opt.label}</span>`;
    btn.addEventListener('click', () => {
      const newVal = record.weather === opt.value ? null : opt.value;
      updateRecord(state.editingDate, { weather: newVal });
      renderRecordView();
    });
    container.appendChild(btn);
  });
}

function renderConditionScale(record) {
  const container = document.getElementById('condition-scale');
  container.innerHTML = '';

  SCALE_LABELS.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'scale-btn' + (record.conditionScale === s.value ? ' selected' : '');
    btn.innerHTML = `${s.emoji}<span class="scale-label">${s.label}</span>`;
    btn.addEventListener('click', () => {
      const newVal = record.conditionScale === s.value ? null : s.value;
      updateRecord(state.editingDate, { conditionScale: newVal });
      renderRecordView();
    });
    container.appendChild(btn);
  });
}

/* ---------- 記録更新 ---------- */
function updateRecord(key, partial) {
  const existing = state.data.records[key] || emptyRecord();
  state.data.records[key] = Object.assign({}, existing, partial);
  // 空の記録（全部null/空配列）は自動削除
  if (isEmptyRecord(state.data.records[key])) {
    delete state.data.records[key];
  }
}

function isEmptyRecord(r) {
  return !r.weather
      && (!r.teas || r.teas.length === 0)
      && (!r.caffeine || r.caffeine.length === 0)
      && r.whiteSugar === null
      && r.wheat === null
      && r.period === null
      && r.yoga === null
      && r.conditionScale === null
      && (!r.symptoms || r.symptoms.length === 0)
      && (!r.notes || r.notes.trim() === '');
}

/* ---------- 保存ボタン ---------- */
function onSave() {
  saveData();
  const status = document.getElementById('save-status');
  status.textContent = `✓ ${formatDateJP(state.editingDate)} の記録を保存しました`;
  setTimeout(() => { status.textContent = ''; }, 3000);
}

/* ---------- カレンダー画面 ---------- */
function renderCalendar() {
  const [yearStr, monthStr] = state.calendarMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;

  document.getElementById('cal-title').textContent = `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  // 空セル
  for (let i = 0; i < startWeekday; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell empty';
    grid.appendChild(cell);
  }

  // 日付セル
  const today = todayKey();
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    if (state.data.records[key]) cell.classList.add('has-record');
    if (key === today) cell.classList.add('today');
    if (key === state.selectedCalDate) cell.classList.add('selected');
    cell.textContent = day;
    cell.addEventListener('click', () => {
      state.selectedCalDate = key;
      renderCalendar();
      renderCalendarDetail();
    });
    grid.appendChild(cell);
  }

  renderCalendarDetail();
  renderMonthlyStats();
  renderConditionChart();
  renderSymptomRanking();
}

function getMonthRecords() {
  const prefix = state.calendarMonth + '-';
  const entries = [];
  Object.keys(state.data.records).forEach(key => {
    if (key.startsWith(prefix)) {
      entries.push({ key, record: state.data.records[key] });
    }
  });
  return entries;
}

function renderMonthlyStats() {
  const entries = getMonthRecords();
  const total = entries.length;

  const conditionScores = entries
    .map(e => e.record.conditionScale)
    .filter(s => typeof s === 'number');
  const avgCondition = conditionScores.length
    ? (conditionScores.reduce((a, b) => a + b, 0) / conditionScores.length).toFixed(1)
    : '—';

  const countWhere = (pred) => entries.filter(e => pred(e.record)).length;
  const yogaDays      = countWhere(r => r.yoga === true);
  const caffeineDays  = countWhere(r => r.caffeine && r.caffeine.length > 0);
  const whiteSugarDays= countWhere(r => r.whiteSugar === true);
  const wheatDays     = countWhere(r => r.wheat === true);
  const periodDays    = countWhere(r => r.period === true);

  const tiles = [
    { label: '記録日数',    value: total,           unit: '日' },
    { label: '体調の平均',  value: avgCondition,    unit: '/ 5' },
    { label: '🧘 ヨガ',    value: yogaDays,        unit: '日' },
    { label: '☕ カフェイン', value: caffeineDays,   unit: '日' },
    { label: '🍬 白砂糖',   value: whiteSugarDays,  unit: '日' },
    { label: '🌾 小麦',    value: wheatDays,       unit: '日' },
    { label: '🌸 生理',    value: periodDays,      unit: '日' }
  ];

  const container = document.getElementById('monthly-stats');
  if (total === 0) {
    container.innerHTML = '<p class="empty-note" style="grid-column:1/-1">この月の記録はまだありません</p>';
    return;
  }
  container.innerHTML = tiles.map(t => `
    <div class="stat-tile">
      <div class="stat-label">${t.label}</div>
      <div class="stat-value">${t.value}<span class="stat-unit">${t.unit}</span></div>
    </div>
  `).join('');
}

function renderConditionChart() {
  const [yearStr, monthStr] = state.calendarMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const container = document.getElementById('condition-chart');
  const bars = [];
  let hasAnyValue = false;

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = state.data.records[key];
    const score = record ? record.conditionScale : null;
    if (score) hasAnyValue = true;
    const height = score ? (score / 5) * 100 : 4;
    const cls = score ? `condition-bar has-value s${score}` : 'condition-bar';
    bars.push(`<div class="${cls}" style="height:${height}%" title="${day}日: ${score ?? '未記録'}"></div>`);
  }

  if (!hasAnyValue) {
    container.innerHTML = '<p class="empty-note" style="width:100%">体調の記録がありません</p>';
    container.style.height = '';
  } else {
    container.style.height = '80px';
    container.innerHTML = bars.join('');
  }
}

function renderSymptomRanking() {
  const entries = getMonthRecords();
  const counts = {};
  entries.forEach(e => {
    (e.record.symptoms || []).forEach(s => {
      counts[s] = (counts[s] || 0) + 1;
    });
  });

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.getElementById('symptom-ranking');
  if (sorted.length === 0) {
    container.innerHTML = '<p class="empty-note">この月の症状記録はありません</p>';
    return;
  }
  const max = sorted[0][1];
  container.innerHTML = sorted.map(([sym, count]) => `
    <div class="rank-row">
      <span class="rank-label">${escapeHtml(sym)}</span>
      <div class="rank-bar-wrap">
        <div class="rank-bar" style="width:${(count / max) * 100}%"></div>
      </div>
      <span class="rank-count">${count}日</span>
    </div>
  `).join('');
}

function renderCalendarDetail() {
  const detail = document.getElementById('cal-detail');
  const key = state.selectedCalDate;
  if (!key) {
    detail.classList.add('hidden');
    return;
  }
  detail.classList.remove('hidden');
  document.getElementById('cal-detail-title').textContent = formatDateJP(key);

  const record = state.data.records[key];
  const body = document.getElementById('cal-detail-body');

  if (!record) {
    body.innerHTML = '<p class="hint">この日の記録はありません</p>';
  } else {
    body.innerHTML = buildDetailHtml(record);
  }

  document.getElementById('cal-detail-edit').onclick = () => {
    state.editingDate = key;
    switchView('record');
  };
}

function buildDetailHtml(r) {
  const rows = [];
  if (r.weather) {
    const w = WEATHER_OPTIONS.find(o => o.value === r.weather);
    if (w) rows.push(row('🌤 天気', `${w.emoji} ${w.label}`));
  }
  if (r.teas && r.teas.length) rows.push(row('🍵 お茶', r.teas.join('・')));
  if (r.caffeine && r.caffeine.length) rows.push(row('☕ カフェイン', r.caffeine.join('・')));

  const yesnoParts = [];
  YESNO_ITEMS.forEach(item => {
    if (r[item.key] !== null && r[item.key] !== undefined) {
      yesnoParts.push(`${item.label.replace(/^\S+\s/, '')}: ${r[item.key] ? '有' : '無'}`);
    }
  });
  if (yesnoParts.length) rows.push(row('📋 有無', yesnoParts.join(' / ')));

  if (r.conditionScale) {
    const s = SCALE_LABELS.find(x => x.value === r.conditionScale);
    rows.push(row('😊 体調', `${s.emoji} ${s.label}`));
  }
  if (r.symptoms && r.symptoms.length) rows.push(row('🩺 症状', r.symptoms.join('・')));
  if (r.notes && r.notes.trim()) rows.push(row('📝 メモ', escapeHtml(r.notes)));

  return rows.join('') || '<p class="hint">記録なし</p>';
}

function row(label, value) {
  return `<div class="detail-row"><span class="detail-label">${label}</span>${value}</div>`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

/* ---------- 設定画面：カスタムリスト編集 ---------- */
function renderEditList(listElId, dataKey) {
  const list = document.getElementById(listElId);
  list.innerHTML = '';
  state.data[dataKey].forEach((item, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${escapeHtml(item)}</span>
      <button aria-label="削除">✕</button>
    `;
    li.querySelector('button').addEventListener('click', () => {
      if (confirm(`「${item}」を削除しますか？`)) {
        state.data[dataKey].splice(idx, 1);
        saveData();
        renderSettings();
      }
    });
    list.appendChild(li);
  });
}

function renderSettings() {
  renderEditList('teas-edit-list', 'customTeas');
  renderEditList('caffeine-edit-list', 'customCaffeine');
  renderEditList('symptoms-edit-list', 'customSymptoms');
}

/* ---------- エクスポート / インポート ---------- */
function exportData() {
  const json = JSON.stringify(state.data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `health-tracker-${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.records || typeof parsed.records !== 'object') {
        throw new Error('形式が正しくありません');
      }
      if (!confirm('現在のデータを上書きしてインポートしますか？')) return;
      state.data = {
        records: parsed.records,
        customTeas: parsed.customTeas || [...DEFAULT_TEAS],
        customCaffeine: parsed.customCaffeine || [...DEFAULT_CAFFEINE],
        customSymptoms: parsed.customSymptoms || [...DEFAULT_SYMPTOMS]
      };
      saveData();
      alert('インポート完了しました');
      renderAll();
    } catch (err) {
      alert('インポート失敗: ' + err.message);
    }
  };
  reader.readAsText(file);
}

/* ---------- 画面切り替え ---------- */
function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewName);
  });
  window.scrollTo(0, 0);

  if (viewName === 'record') renderRecordView();
  if (viewName === 'calendar') renderCalendar();
  if (viewName === 'settings') renderSettings();
}

/* ---------- 全体再描画 ---------- */
function renderAll() {
  renderRecordView();
  renderCalendar();
  renderSettings();
}

/* ---------- イベント ---------- */
function bindEvents() {
  // ナビ
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // 保存
  document.getElementById('save-btn').addEventListener('click', onSave);

  // カレンダー前後
  document.getElementById('cal-prev').addEventListener('click', () => {
    const [y, m] = state.calendarMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    state.calendarMonth = monthKey(d);
    state.selectedCalDate = null;
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    const [y, m] = state.calendarMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    state.calendarMonth = monthKey(d);
    state.selectedCalDate = null;
    renderCalendar();
  });

  // エクスポート / インポート
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });

  // カスタム項目追加（お茶・カフェイン・症状の共通ハンドラ）
  const addHandlers = [
    { btn: 'add-tea-btn',      input: 'new-tea-input',      key: 'customTeas',      label: 'お茶' },
    { btn: 'add-caffeine-btn', input: 'new-caffeine-input', key: 'customCaffeine',  label: 'カフェイン' },
    { btn: 'add-symptom-btn',  input: 'new-symptom-input',  key: 'customSymptoms',  label: '症状' }
  ];
  addHandlers.forEach(h => {
    document.getElementById(h.btn).addEventListener('click', () => {
      const input = document.getElementById(h.input);
      const value = input.value.trim();
      if (!value) return;
      if (state.data[h.key].includes(value)) {
        alert(`同じ${h.label}がすでに登録されています`);
        return;
      }
      state.data[h.key].push(value);
      saveData();
      input.value = '';
      renderSettings();
    });
  });

  // リセット
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('すべての記録を完全に削除します。本当によろしいですか？')) return;
    if (!confirm('本当に削除しますか？この操作は取り消せません。')) return;
    state.data = defaultData();
    saveData();
    alert('すべてのデータを削除しました');
    renderAll();
    switchView('record');
  });
}

/* ---------- 起動 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  renderAll();
  switchView('record');
});
