// UI: panels, buttons, sliders, preset library, physics card and pointer input.

import { state, PLANE_MODES, markEnvDirty, launchNewFlight, isSolarEclipseActive } from './state.js';
import { SPECIES } from './data/species.js';
import { READY_THEMES } from './data/themes.js';
import { t, L, getLang, setLang, applyDomTranslations } from './i18n.js';
import { clearPaintMask, spraySkyAtPoint, screenToRayDir, isPaintTool } from './paint.js';
import { exportPanoramaPNG } from './renderer.js';

const $ = id => document.getElementById(id);
let canvas = null;

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------
let toastTimer = null;
export function showToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 3100);
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
function formatCloudDarknessLabel(d) {
  const darkPct = Math.round(d * 100);
  if (darkPct <= 5) return t('fmt.dark.light');
  if (darkPct >= 95) return t('fmt.dark.dark');
  return t('fmt.dark.mixed', { l: 100 - darkPct, d: darkPct });
}

function formatMoonPhaseName(p) {
  const pct = Math.round(p * 100);
  if (p < 0.04) return t('fmt.moon.new', { p: pct });
  if (p < 0.25) return t('fmt.moon.crescent', { p: pct });
  if (p < 0.60) return t('fmt.moon.quarter', { p: pct });
  if (p < 0.88) return t('fmt.moon.gibbous', { p: pct });
  return t('fmt.moon.full', { p: pct });
}

function i18nParams() {
  return { themes: READY_THEMES.length, species: SPECIES.length };
}

function evoStatusName(mode) {
  return t('evo.status.' + mode, i18nParams());
}

// ---------------------------------------------------------------------------
// State setters
// ---------------------------------------------------------------------------
export function setCloudTone(tone, customDarkness = null) {
  state.cloudTone = tone;
  if (tone === 'light') {
    state.cloudToneId = 0.0;
    state.cloudDarkness = customDarkness ?? 0.00;
  } else if (tone === 'mixed') {
    state.cloudToneId = 1.0;
    state.cloudDarkness = customDarkness ?? 0.50;
  } else {
    state.cloudToneId = 2.0;
    state.cloudDarkness = customDarkness ?? 1.00;
  }
  document.querySelectorAll('[data-ctone]').forEach(btn => {
    btn.classList.toggle('active-ctone', btn.dataset.ctone === state.cloudTone);
  });
  markEnvDirty();
  syncUI();
}

function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll('[data-tool]').forEach(b => {
    b.classList.toggle('active-tool', b.dataset.tool === tool);
  });
  canvas.className = `mode-${tool}`;
}

function setEditMode(enabled) {
  state.editMode = enabled;
  document.body.classList.toggle('edit-mode-active', enabled);
  $('btnToggleEdit').classList.toggle('active-edit', enabled);
  if (!enabled) setTool('cam');
  else if (state.tool === 'cam') setTool('paint_ci');
  refreshDynamicLabels();
}

function setPlanesVisible(on) {
  state.showPlane = on;
  $('btnPlaneToggle').classList.toggle('active-auto', on);
  $('btnRespawnPlane').style.display = on ? 'inline-flex' : 'none';
  $('btnPlaneType').style.display = on ? 'inline-flex' : 'none';
}

// ---------------------------------------------------------------------------
// Titles, labels and badges
// ---------------------------------------------------------------------------
function renderTitle() {
  const th = state.activeTheme && READY_THEMES.find(x => x.id === state.activeTheme);
  if (th) {
    $('cloudTitleText').textContent = L(th.title);
    $('cloudPhysHint').textContent = `${L(th.tag)} — ${L(th.desc)}`;
  } else {
    const sp = SPECIES.find(s => s.id === state.activeSpecies) || SPECIES[0];
    $('cloudTitleText').textContent = L(sp.fullName);
    $('cloudPhysHint').textContent = L(sp.hint);
  }
}

/** Texts that depend on state (ON/OFF etc.) as well as on language. */
function refreshDynamicLabels() {
  const p = i18nParams();
  $('btnThemeLibrary').textContent = t('btn.library', p);
  $('btnMoonToggle').textContent = state.showMoon ? t('btn.moon.on') : t('btn.moon.off');
  $('btnMoonToggle').classList.toggle('active-ctone', state.showMoon);
  $('btnSunRaysToggle').textContent = state.showSunRays ? t('btn.rays.on') : t('btn.rays');
  $('btnBakeToggle').textContent = state.useBaking ? t('btn.bake.on') : t('btn.bake.off');
  $('btnAutoEvolveToggle').textContent = state.autoEvolve ? t('btn.evo.on') : t('btn.evo.off');
  $('btnToggleEdit').textContent = state.editMode ? t('btn.edit.on') : t('btn.edit');
  $('btnEquirectMode').textContent = state.equirectMode ? t('btn.equirect.on') : t('btn.equirect');
  $('btnPlaneType').textContent = t(PLANE_MODES[state.planeModeIdx].labelKey);
  $('btnLang').textContent = t('lang.button');
  $('btnLang').title = t('lang.button.title');
  if (state.evoMode !== 'atlas' || !state.autoEvolve) $('evoStatusText').textContent = evoStatusName(state.evoMode);
}

function updateCompassAndTimeBadges() {
  const el = $('compassBadge');
  if (state.equirectMode) {
    el.textContent = t('hud.equirect');
  } else {
    const deg = ((Math.round(state.camYaw * 180 / Math.PI) % 360) + 360) % 360;
    const dirs = t('hud.dirs').split(',');
    const pitchDeg = Math.round(state.camPitch * 180 / Math.PI);
    el.textContent = t('hud.compass', { dir: dirs[Math.round(deg / 45) % 8], deg, pitch: pitchDeg });
  }

  const solarEc = isSolarEclipseActive();
  const lunarEc = state.lunarEclipse > 0.5 && state.sunElDeg < 4;
  $('btnSolarEclipse').classList.toggle('active-eclipse', solarEc);
  $('btnLunarEclipse').classList.toggle('active-eclipse', lunarEc);

  $('btnTodDay').classList.toggle('active-tod', state.sunElDeg > 12 && !solarEc);
  $('btnTodSunset').classList.toggle('active-tod', state.sunElDeg > -5 && state.sunElDeg <= 12 && !solarEc);
  $('btnTodNight').classList.toggle('active-tod', state.sunElDeg <= -5 && !lunarEc);

  $('btnMoonToggle').classList.toggle('active-ctone', state.showMoon);
  $('btnMoonToggle').textContent = state.showMoon ? t('btn.moon.on') : t('btn.moon.off');
}

export function syncUI() {
  const set = (id, vId, val, fmt) => {
    const el = $(id), vEl = $(vId);
    if (el) el.value = val;
    if (vEl) vEl.textContent = fmt(val);
  };
  set('sliderCoverage', 'valCoverage', state.coverage, v => Math.round(v * 100) + '%');
  set('sliderCloudDark', 'valCloudDark', state.cloudDarkness, formatCloudDarknessLabel);
  set('sliderSunEl', 'valSunEl', state.sunElDeg, v => (v >= 0 ? '+' : '') + Math.round(v) + '°');
  set('sliderSunBright', 'valSunBright', state.sunBrightness, v => Math.round(v * 100) + '%');
  set('sliderMoonPhase', 'valMoonPhase', state.moonPhase, formatMoonPhaseName);
  set('sliderMoonBright', 'valMoonBright', state.moonBrightness, v => Math.round(v * 100) + '%');
  set('sliderBrushFlow', 'valBrushFlow', state.brushFlow, v => Math.round(v * 100) + '%');
  set('sliderBrush', 'valBrush', state.brushRadius, v => Math.round(v * 100) + '%');
  set('sliderScale', 'valScale', state.scale, v => Number(v).toFixed(2) + 'x');
  set('sliderTrailSpread', 'valTrailSpread', state.trailSpread, v => Number(v).toFixed(2) + 'x');
  set('sliderWind', 'valWind', state.windSpeed, v => Number(v).toFixed(2) + 'x');
  set('sliderFov', 'valFov', state.camFov, v => Math.round(v) + '°');
  set('sliderThermals', 'valThermals', state.thermals, v => Math.round(v * 100) + '%');
  set('sliderShear', 'valShear', state.windShear, v => Number(v).toFixed(2));
  updateCompassAndTimeBadges();
  updatePhysicsTelemetryAndDiagram();
}

function updatePhysicsTelemetryAndDiagram() {
  const sp = SPECIES.find(s => s.id === state.activeSpecies) || SPECIES[0];
  const ph = sp.phys;

  const lcl = Math.max(0.4, ph.lcl - (state.coverage - 0.5) * 0.8);
  const el = Math.max(lcl + 0.8, ph.el + (state.cloudDarkness - 0.5) * 1.4);
  const cape = Math.round(ph.cape * (0.6 + 0.8 * state.thermals) * (0.7 + 0.6 * state.cloudDarkness));

  const km = t('phys.km');
  $('physValLCL').textContent = lcl.toFixed(1) + ' ' + km;
  $('physValEL').textContent = el.toFixed(1) + ' ' + km;
  $('physValCAPE').textContent = cape + ' ' + t('phys.capeUnit');
  $('physValShear').textContent = state.windShear > 0.7 ? t('phys.shear.jet')
    : (state.windShear > 0.35 ? t('phys.shear.mod') : t('phys.shear.weak'));
  $('physPhaseBadge').textContent = L(ph.phase);
  $('physMechTitle').textContent = L(ph.mech);
  $('physMechDesc').textContent = L(ph.desc);

  // Compact aerological sounding: environment T(z), dew point and parcel curve.
  const c = $('soundingCanvas');
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);

  const maxZ = 11.5;
  const zToY = z => H - 8 - (Math.min(maxZ, Math.max(0, z)) / maxZ) * (H - 14);

  ctx.strokeStyle = 'rgba(51, 65, 85, 0.55)';
  ctx.lineWidth = 1;
  for (let z = 2; z <= 10; z += 4) {
    const y = zToY(z);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const yLCL = zToY(lcl), yEL = zToY(el);
  const grad = ctx.createLinearGradient(0, yEL, 0, yLCL);
  grad.addColorStop(0, 'rgba(56, 189, 248, 0.34)');
  grad.addColorStop(1, 'rgba(167, 139, 250, 0.18)');
  ctx.fillStyle = grad;
  ctx.fillRect(18, yEL, W - 22, Math.max(3, yLCL - yEL));

  ctx.font = '8px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('LCL', 2, Math.min(H - 4, yLCL + 3));
  ctx.fillStyle = '#a78bfa';
  ctx.fillText('EL', 2, Math.max(9, yEL + 3));

  const drawLine = (col, xBot, xLcl, xTop) => {
    ctx.strokeStyle = col; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(xBot, zToY(0));
    ctx.lineTo(xLcl, yLCL);
    ctx.lineTo(xTop, zToY(11));
    ctx.stroke();
  };
  drawLine('#38bdf8', 72, 62, 26);                                  // dew point
  drawLine('#fb7185', 98, 66, 32);                                  // environment
  drawLine('#fbbf24', 98, 62, 42 + Math.min(18, cape * 0.008));     // lifted parcel
}

// ---------------------------------------------------------------------------
// Species strip and preset library
// ---------------------------------------------------------------------------
function buildSpeciesStrip() {
  const strip = $('speciesStrip');
  strip.innerHTML = '';
  SPECIES.forEach(sp => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.species = sp.id;
    btn.className = `species-chip ${sp.isRainSpecies ? 'rain-chip' : ''} ${sp.id === state.activeSpecies ? 'active' : ''}`;
    btn.title = L(sp.fullName);
    const name = document.createElement('span');
    name.className = 'species-name';
    name.textContent = L(sp.name);
    const sub = document.createElement('span');
    sub.className = 'species-sub mono';
    sub.textContent = L(sp.sub);
    btn.append(name, sub);
    btn.addEventListener('click', () => {
      selectSpecies(sp.id);
      showToast(L(sp.fullName));
    });
    strip.appendChild(btn);
  });
}

function buildThemeLibrary() {
  const grid = $('themeGrid');
  grid.innerHTML = '';
  READY_THEMES.forEach((th, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.dataset.theme = th.id;
    card.className = `theme-card ${th.id === state.activeTheme ? 'active' : ''}`;
    const title = document.createElement('div');
    title.className = 'theme-title';
    title.textContent = `${i + 1}. ${L(th.title)}`;
    const tag = document.createElement('div');
    tag.className = 'theme-tag mono';
    tag.textContent = L(th.tag);
    const desc = document.createElement('div');
    desc.className = 'theme-desc';
    desc.textContent = L(th.desc);
    card.append(title, tag, desc);
    card.addEventListener('click', () => {
      applyReadyTheme(th.id);
      $('themeLibraryModal').classList.remove('open');
    });
    grid.appendChild(card);
  });
}

function applyReadyTheme(themeId) {
  const th = READY_THEMES.find(x => x.id === themeId);
  if (!th) return;
  selectSpecies(th.species, true);
  state.activeTheme = th.id;
  if (th.customModeId !== undefined) state.modeId = th.customModeId;
  if (th.tone) setCloudTone(th.tone, th.dark ?? null);
  state.coverage = th.cov;
  state.sunElDeg = th.sunEl;
  state.sunAz = state.camYaw + th.sunAz;
  state.showMoon = th.showMoon ?? (th.sunEl <= 0 || th.lunarEc > 0.5);
  state.moonEl = th.moonEl;
  state.moonAz = state.camYaw + th.moonAz;
  state.moonPhase = th.moonPhase;
  state.lunarEclipse = th.lunarEc;
  setPlanesVisible(th.showPlane);
  renderTitle();
  document.querySelectorAll('.theme-card').forEach(c => c.classList.toggle('active', c.dataset.theme === th.id));
  markEnvDirty();
  syncUI();
  showToast(t('toast.theme', { title: L(th.title) }));
}

/** Switch cloud morphology only — never touches time of day or the Moon. */
export function selectSpecies(id, fromTheme = false) {
  const sp = SPECIES.find(s => s.id === id);
  if (!sp) return;
  clearPaintMask();
  state.activeSpecies = sp.id;
  state.activeTheme = null;
  state.modeId = sp.modeId;
  state.coverage = sp.params.coverage;
  state.scale = sp.params.scale;
  state.detail = sp.params.detail;
  state.contrast = sp.params.contrast;
  if (sp.params.shear !== undefined) state.windShear = sp.params.shear;

  if (!fromTheme) {
    if (sp.isRainSpecies) {
      setPlanesVisible(false);
      setCloudTone('mixed', 0.58);
    } else {
      if (!state.showPlane) setPlanesVisible(true);
      if (state.cloudTone === 'dark') setCloudTone('mixed', 0.45);
    }
  }

  renderTitle();
  document.querySelectorAll('.species-chip').forEach(b => b.classList.toggle('active', b.dataset.species === sp.id));
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
  markEnvDirty();
  syncUI();
}

export function setEvoStatusText(text) {
  $('evoStatusText').textContent = text;
}

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------
export function applyLanguage() {
  applyDomTranslations(document, i18nParams());
  buildSpeciesStrip();
  buildThemeLibrary();
  renderTitle();
  refreshDynamicLabels();
  syncUI();
}

// ---------------------------------------------------------------------------
// Pointer input on the sky canvas
// ---------------------------------------------------------------------------
const pointer = { down: false, x: 0, y: 0 };

/** Called every frame: keeps spraying while a brush is held still. */
export function tickBrush(dt) {
  if (pointer.down && isPaintTool(state.tool)) spraySkyAtPoint(canvas, pointer.x, pointer.y, state.tool, dt);
}

function handlePointerMove(clientX, clientY, dx, dy) {
  if (state.tool === 'cam') {
    state.camYaw -= dx * 0.0055;
    state.camPitch = Math.max(0.03, Math.min(1.52, state.camPitch + dy * 0.0055));
    updateCompassAndTimeBadges();
  } else if (isPaintTool(state.tool)) {
    const dist = Math.hypot(dx, dy);
    if (dist > 6.0) {
      const steps = Math.min(6, Math.ceil(dist / 14.0));
      for (let s = 1; s <= steps; s++) {
        const k = s / steps;
        spraySkyAtPoint(canvas, clientX - dx * (1.0 - k), clientY - dy * (1.0 - k), state.tool, 0.014 / steps);
      }
    }
  } else if (state.tool === 'wind') {
    if (Math.hypot(dx, dy) > 1.5) {
      state.windAngle = state.camYaw + Math.atan2(dx, -dy);
      const swipeSpeed = Math.min(2.5, Math.max(0.20, Math.hypot(dx, dy) * 0.065));
      state.windSpeed = Math.round((state.windSpeed * 0.65 + swipeSpeed * 0.35) * 20) / 20;
      state.windOffset[0] += Math.cos(state.windAngle) * 0.006;
      state.windOffset[1] += Math.sin(state.windAngle) * 0.006;
      state.brushWindU = (state.brushWindU + dx * 0.00025 + 1.0) % 1.0;
      syncUI();
    }
  } else if (state.tool === 'sun') {
    const rd = screenToRayDir(canvas, clientX, clientY);
    state.sunAz = Math.atan2(rd[0], rd[2]);
    const elRad = Math.asin(Math.max(-1.0, Math.min(1.0, rd[1])));
    state.sunElDeg = Math.max(-25, Math.min(75, elRad * 180 / Math.PI));
    syncUI();
  } else if (state.tool === 'moon') {
    state.showMoon = true;
    const rd = screenToRayDir(canvas, clientX, clientY);
    state.moonAz = Math.atan2(rd[0], rd[2]);
    state.moonEl = Math.max(0.02, Math.min(1.48, Math.asin(Math.max(-1.0, Math.min(1.0, rd[1])))));
    syncUI();
  }
}

function pointerStart(x, y) {
  pointer.down = true;
  pointer.x = x; pointer.y = y;
  if (isPaintTool(state.tool)) spraySkyAtPoint(canvas, x, y, state.tool, 0.025);
  else if (state.tool !== 'cam') handlePointerMove(x, y, 0, 0);
}

function pointerMove(x, y) {
  if (!pointer.down) return;
  const dx = x - pointer.x, dy = y - pointer.y;
  pointer.x = x; pointer.y = y;
  handlePointerMove(x, y, dx, dy);
}

function bindPointer() {
  canvas.addEventListener('mousedown', e => pointerStart(e.clientX, e.clientY));
  window.addEventListener('mouseup', () => { pointer.down = false; });
  window.addEventListener('mousemove', e => pointerMove(e.clientX, e.clientY));

  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) pointerStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchend', () => { pointer.down = false; });
  window.addEventListener('touchmove', e => {
    if (e.touches.length === 1) pointerMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.shiftKey) {
      // Shift + wheel adjusts the light/dark cloud ratio straight from the sky.
      const slider = $('sliderCloudDark');
      slider.value = Math.max(0.0, Math.min(1.0, state.cloudDarkness + (e.deltaY < 0 ? 0.04 : -0.04)));
      slider.dispatchEvent(new Event('input'));
    } else {
      state.camFov = Math.max(35, Math.min(100, state.camFov + e.deltaY * 0.04));
      syncUI();
    }
  }, { passive: false });
}

// ---------------------------------------------------------------------------
// Buttons and sliders
// ---------------------------------------------------------------------------
const CLOUD_SHAPE_KEYS = new Set(['coverage', 'scale', 'thermals', 'windShear']);

function bindSlider(id, key) {
  const el = $(id);
  if (!el) return;
  el.addEventListener('input', e => {
    state[key] = parseFloat(e.target.value);
    if (CLOUD_SHAPE_KEYS.has(key)) markEnvDirty();
    syncUI();
  });
}

function bindControls() {
  $('btnLang').addEventListener('click', () => {
    setLang(getLang() === 'ru' ? 'en' : 'ru');
    applyLanguage();
    showToast(t('toast.lang'));
  });

  // Cloud tone buttons (+ mouse wheel over them adjusts the ratio)
  document.querySelectorAll('[data-ctone]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tone = btn.dataset.ctone;
      setCloudTone(tone);
      const isRain = state.activeSpecies === 'storm_cb';
      const key = tone === 'light' ? (isRain ? 'toast.tone.lightRain' : 'toast.tone.light') : 'toast.tone.' + tone;
      showToast(t(key));
    });
    btn.addEventListener('wheel', e => {
      e.preventDefault();
      e.stopPropagation();
      const slider = $('sliderCloudDark');
      slider.value = Math.max(0.0, Math.min(1.0, state.cloudDarkness + (e.deltaY < 0 ? 0.05 : -0.05)));
      slider.dispatchEvent(new Event('input'));
    }, { passive: false });
  });

  $('sliderCloudDark').addEventListener('input', e => {
    const val = parseFloat(e.target.value);
    state.cloudDarkness = val;
    if (val <= 0.15) { state.cloudTone = 'light'; state.cloudToneId = 0.0; }
    else if (val >= 0.85) { state.cloudTone = 'dark'; state.cloudToneId = 2.0; }
    else { state.cloudTone = 'mixed'; state.cloudToneId = 1.0; }
    document.querySelectorAll('[data-ctone]').forEach(b => b.classList.toggle('active-ctone', b.dataset.ctone === state.cloudTone));
    markEnvDirty();
    syncUI();
  });

  $('btnToggleEdit').addEventListener('click', () => {
    setEditMode(!state.editMode);
    showToast(state.editMode ? t('toast.edit.on') : t('toast.edit.off'));
  });

  $('btnPlaneType').addEventListener('click', () => {
    state.planeModeIdx = (state.planeModeIdx + 1) % PLANE_MODES.length;
    setPlanesVisible(true);
    if (state.planeModeIdx === 0) {
      state.flights[0].pType = 0.0;
      state.flights[1].pType = 1.0;
      state.flights[2].pType = 2.0;
    } else {
      const forced = (state.planeModeIdx - 1) * 1.0;
      state.flights[0].pType = forced;
      launchNewFlight(true, forced);
    }
    refreshDynamicLabels();
    showToast(t('toast.plane.mode', { name: t(PLANE_MODES[state.planeModeIdx].nameKey) }));
  });

  $('btnThemeLibrary').addEventListener('click', () => $('themeLibraryModal').classList.toggle('open'));
  $('btnCloseLibrary').addEventListener('click', () => $('themeLibraryModal').classList.remove('open'));

  document.querySelectorAll('[data-bmode]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.brushMode = btn.dataset.bmode;
      document.querySelectorAll('[data-bmode]').forEach(b => b.classList.toggle('active-bmode', b.dataset.bmode === state.brushMode));
      if (!isPaintTool(state.tool)) setTool('paint_ci');
      showToast(t('toast.bmode.' + state.brushMode));
    });
  });

  $('btnTodDay').addEventListener('click', () => {
    state.lunarEclipse = 0.0;
    state.showMoon = false;
    state.sunElDeg = 34.0;
    state.sunAz = state.camYaw - 0.25;
    syncUI();
    showToast(t('toast.day'));
  });

  $('btnTodSunset').addEventListener('click', () => {
    state.lunarEclipse = 0.0;
    state.showMoon = false;
    state.sunElDeg = 3.0;
    state.sunAz = state.camYaw - 0.15;
    syncUI();
    showToast(t('toast.sunset'));
  });

  $('btnTodNight').addEventListener('click', () => {
    const alreadyNight = state.sunElDeg <= -5 && state.lunarEclipse < 0.5;
    state.lunarEclipse = 0.0;
    state.sunElDeg = -20.0;
    state.showMoon = alreadyNight ? !state.showMoon : true;
    if (state.showMoon) {
      state.moonAz = state.camYaw;
      state.moonEl = 0.38;
      if (state.moonPhase < 0.25) state.moonPhase = 1.00;
    }
    syncUI();
    showToast(state.showMoon ? t('toast.night.moon') : t('toast.night.nomoon'));
  });

  $('btnMoonToggle').addEventListener('click', () => {
    state.showMoon = !state.showMoon;
    if (state.showMoon) {
      state.moonAz = state.camYaw + 0.12;
      state.moonEl = Math.max(0.28, Math.min(0.65, state.camPitch + 0.04));
      if (state.moonPhase < 0.10) state.moonPhase = 1.00;
    } else {
      state.lunarEclipse = 0.0;
    }
    syncUI();
    showToast(state.showMoon ? t('toast.moon.on') : t('toast.moon.off'));
  });

  document.querySelectorAll('[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      setTool(btn.dataset.tool);
      showToast(t('toast.tool.' + state.tool));
    });
  });

  bindSlider('sliderCoverage', 'coverage');
  bindSlider('sliderSunEl', 'sunElDeg');
  bindSlider('sliderSunBright', 'sunBrightness');
  bindSlider('sliderThermals', 'thermals');
  bindSlider('sliderShear', 'windShear');
  bindSlider('sliderMoonPhase', 'moonPhase');
  bindSlider('sliderMoonBright', 'moonBrightness');
  bindSlider('sliderBrushFlow', 'brushFlow');
  bindSlider('sliderBrush', 'brushRadius');
  bindSlider('sliderScale', 'scale');
  bindSlider('sliderTrailSpread', 'trailSpread');
  bindSlider('sliderWind', 'windSpeed');
  bindSlider('sliderFov', 'camFov');

  $('btnSunRaysToggle').addEventListener('click', () => {
    state.showSunRays = !state.showSunRays;
    $('btnSunRaysToggle').classList.toggle('active-auto', state.showSunRays);
    refreshDynamicLabels();
    showToast(state.showSunRays ? t('toast.rays.on') : t('toast.rays.off'));
  });

  $('btnBakeToggle').addEventListener('click', () => {
    state.useBaking = !state.useBaking;
    $('btnBakeToggle').classList.toggle('active-auto', state.useBaking);
    if (state.useBaking) markEnvDirty();
    refreshDynamicLabels();
    showToast(state.useBaking ? t('toast.bake.on') : t('toast.bake.off'));
  });

  let physCardVisible = false;
  const togglePhysPanel = (force = null) => {
    physCardVisible = force ?? !physCardVisible;
    $('physicsHudCard').classList.toggle('hidden-phys', !physCardVisible);
    $('btnPhysPanelToggle').classList.toggle('active-ctone', physCardVisible);
  };
  $('btnPhysPanelToggle').addEventListener('click', () => togglePhysPanel());
  $('btnMinimizePhys').addEventListener('click', () => togglePhysPanel(false));

  $('btnAutoEvolveToggle').addEventListener('click', () => {
    state.autoEvolve = !state.autoEvolve;
    $('btnAutoEvolveToggle').classList.toggle('active-auto', state.autoEvolve);
    refreshDynamicLabels();
    showToast(state.autoEvolve ? t('toast.evo.on') : t('toast.evo.off'));
  });

  document.querySelectorAll('[data-evomode]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.evoMode = btn.dataset.evomode;
      state.evoClock = 0.0;
      state.autoEvolve = true;
      $('btnAutoEvolveToggle').classList.add('active-auto');
      document.querySelectorAll('[data-evomode]').forEach(b => b.classList.toggle('active', b.dataset.evomode === state.evoMode));
      refreshDynamicLabels();
      $('evoStatusText').textContent = evoStatusName(state.evoMode);
      showToast(t('toast.evo.mode', { name: btn.textContent.trim() }));
    });
  });

  // Mouse wheel over any slider box nudges that slider.
  document.querySelectorAll('.ctrl-box').forEach(box => {
    const input = box.querySelector('input[type="range"]');
    if (!input) return;
    box.addEventListener('wheel', e => {
      e.preventDefault();
      e.stopPropagation();
      const step = parseFloat(input.step) || 0.02;
      const min = parseFloat(input.min) || 0.0;
      const max = parseFloat(input.max) || 1.0;
      const dir = e.deltaY < 0 ? 1 : -1;
      input.value = Math.max(min, Math.min(max, parseFloat(input.value) + dir * step * 2.0));
      input.dispatchEvent(new Event('input'));
    }, { passive: false });
  });

  $('btnSolarEclipse').addEventListener('click', () => {
    if (isSolarEclipseActive()) {
      state.moonAz = state.sunAz + 0.52;
      state.moonEl = 0.44;
      state.moonPhase = 0.52;
      syncUI();
      showToast(t('toast.solar.end'));
    } else {
      state.showMoon = true;
      state.lunarEclipse = 0.0;
      if (state.sunElDeg < 14) state.sunElDeg = 26;
      state.sunAz = state.camYaw;
      const sunElRad = state.sunElDeg * Math.PI / 180.0;
      state.moonAz = state.sunAz + 0.003;
      state.moonEl = sunElRad + 0.0002;
      state.moonPhase = 0.0;
      state.camPitch = Math.max(0.20, sunElRad - 0.03);
      syncUI();
      showToast(t('toast.solar.start'));
    }
  });

  $('btnLunarEclipse').addEventListener('click', () => {
    if (state.lunarEclipse > 0.5) {
      state.lunarEclipse = 0.0;
      state.sunElDeg = -20.0;
      state.moonPhase = 1.0;
      syncUI();
      showToast(t('toast.lunar.end'));
    } else {
      state.lunarEclipse = 1.0;
      state.showMoon = true;
      state.sunElDeg = -14.0;
      state.moonAz = state.camYaw;
      state.moonEl = 0.40;
      state.moonPhase = 1.0;
      syncUI();
      showToast(t('toast.lunar.start'));
    }
  });

  $('btnPlaneToggle').addEventListener('click', () => {
    setPlanesVisible(!state.showPlane);
    if (state.showPlane && state.flights[0].dist > state.flights[0].totalChord) launchNewFlight(false);
    showToast(state.showPlane ? t('toast.planes.on') : t('toast.planes.off'));
  });

  $('btnRespawnPlane').addEventListener('click', () => {
    setPlanesVisible(true);
    launchNewFlight(false);
    const type = t('plane.type.' + Math.round(state.flights[0].pType));
    const alt = t('plane.alt.' + Math.round(state.flights[0].alt ?? 0));
    showToast(t('toast.planes.launched', { type, alt }));
  });

  $('btnEquirectMode').addEventListener('click', () => {
    state.equirectMode = !state.equirectMode;
    $('btnEquirectMode').classList.toggle('active-auto', state.equirectMode);
    refreshDynamicLabels();
    updateCompassAndTimeBadges();
    showToast(state.equirectMode ? t('toast.equirect.on') : t('toast.equirect.off'));
  });

  $('btnExport2to1').addEventListener('click', () => {
    exportPanoramaPNG(`skystudio360_${state.activeTheme || state.activeSpecies}_2560x1280.png`);
    showToast(t('toast.export'));
  });

  $('btnNewSeed').addEventListener('click', () => {
    clearPaintMask();
    const r = () => 1.5 + Math.random() * 22.0;
    state.seedMacro = [r(), r()];
    state.seedBillow = [r(), r()];
    state.seedFine = [r(), r()];
    state.patternRot = Math.random() * Math.PI * 2.0;
    state.patternVariant = Math.random();
    markEnvDirty();
    showToast(t('toast.seed'));
  });

  $('clean_canvas').addEventListener('click', () => {
    clearPaintMask();
    state.coverage = 0.02;
    syncUI();
    showToast(t('toast.canvas'));
  });

  $('btnClearBrush').addEventListener('click', () => {
    clearPaintMask();
    showToast(t('toast.clearBrush'));
  });

  let dockVisible = true;
  $('btnToggleDock').addEventListener('click', () => {
    dockVisible = !dockVisible;
    $('bottomDock').classList.toggle('hidden-dock', !dockVisible);
  });

  const stepSpecies = delta => {
    const idx = SPECIES.findIndex(s => s.id === state.activeSpecies);
    const next = SPECIES[(idx + delta + SPECIES.length) % SPECIES.length];
    selectSpecies(next.id);
    showToast(L(next.fullName));
  };
  $('btnPrev').addEventListener('click', () => stepSpecies(-1));
  $('btnNext').addEventListener('click', () => stepSpecies(1));
}

export function initUI(skyCanvas) {
  canvas = skyCanvas;
  bindPointer();
  bindControls();
  applyLanguage();
}
