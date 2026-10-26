// SkyStudio 360° — entry point: WebGL init, UI init and the animation loop.

import { state, launchNewFlight, getFlightTypeSpeedMult } from './state.js';
import { SPECIES } from './data/species.js';
import { L, t } from './i18n.js';
import { initRenderer, drawScene, getCanvas } from './renderer.js';
import { initUI, selectSpecies, syncUI, tickBrush, setEvoStatusText } from './ui.js';

const FRONT_SEQUENCE = [
  'cirrus_classic', 'cirrus_uncinus', 'cirrus_vertebratus', 'cirrocumulus_fine',
  'altocumulus_floccus', 'cumulus_congestus', 'storm_cb'
];

function updateEvolution(dt) {
  state.evoTime += dt * (0.45 + 0.85 * state.thermals);
  state.evoClock += dt;

  if (state.evoMode === 'atlas') {
    // Cycle through all cloud types, 9 s each.
    const idx = Math.floor(state.evoClock / 9.0) % SPECIES.length;
    if (SPECIES[idx].id !== state.activeSpecies) selectSpecies(SPECIES[idx].id);
    const pct = Math.round(((state.evoClock % 9.0) / 9.0) * 100);
    setEvoStatusText(`${L(SPECIES[idx].name)} (${pct}%)`);
  } else if (state.evoMode === 'diurnal') {
    // A full day in 36 s.
    const phase = (state.evoClock % 36.0) / 36.0;
    state.sunElDeg = Math.round(24.0 + 38.0 * Math.sin(phase * Math.PI * 2.0));
    state.showMoon = state.sunElDeg < 4.0;
    if (state.showMoon) {
      state.moonAz = state.camYaw + 0.15;
      state.moonEl = 0.38;
      state.moonPhase = 0.96;
    }
    syncUI();
  } else if (state.evoMode === 'front') {
    // Approaching front: cirrus → cirrocumulus → towering cumulus → thunderstorm, 8 s each.
    const fIdx = Math.floor(state.evoClock / 8.0) % FRONT_SEQUENCE.length;
    if (FRONT_SEQUENCE[fIdx] !== state.activeSpecies) selectSpecies(FRONT_SEQUENCE[fIdx]);
  }
}

function updateFlights(dt) {
  if (!state.showPlane) return;
  const step = dt * state.planeSpeed * (0.65 + 0.70 * state.windSpeed);
  const f = state.flights;

  if (f[0].active > 0.5) {
    f[0].dist += step * getFlightTypeSpeedMult(f[0].pType);
    if (f[0].dist > f[0].totalChord + 0.35) launchNewFlight(false);
  }
  for (let i = 1; i <= 2; i++) {
    if (f[i].active > 0.5) {
      f[i].dist += step * getFlightTypeSpeedMult(f[i].pType);
      // Keep older flights alive until their contrail has fully dissipated.
      if (f[i].dist > f[i].totalChord + 3.4 * state.trailLife) f[i].active = 0.0;
    }
  }
}

function start() {
  const canvas = document.getElementById('glCanvas');
  try {
    initRenderer(canvas);
  } catch (err) {
    console.error(err);
    const toast = document.getElementById('toast');
    toast.textContent = t('toast.webgl');
    toast.style.opacity = '1';
    return;
  }

  launchNewFlight(true, 1.0);
  state.flights[0].dist += 0.55;
  launchNewFlight(true, 0.0);

  initUI(getCanvas());
  selectSpecies('cirrus_classic');

  let lastTime = performance.now();
  let frames = 0, fpsLast = lastTime;
  const fpsBadge = document.getElementById('fpsBadge');

  function animate(now) {
    const dt = Math.min(0.1, (now - lastTime) * 0.001);
    lastTime = now;

    const dtWind = dt * state.windSpeed;
    state.time += dtWind;
    state.windOffset[0] += Math.cos(state.windAngle) * 0.0035 * dtWind;
    state.windOffset[1] += Math.sin(state.windAngle) * 0.0035 * dtWind;
    state.brushWindU = (state.brushWindU + Math.cos(state.windAngle) * 0.00045 * dtWind + 1.0) % 1.0;

    if (state.autoEvolve) updateEvolution(dt);
    tickBrush(dt);
    updateFlights(dt);
    drawScene(now);

    frames++;
    if (now - fpsLast >= 500) {
      fpsBadge.textContent = Math.round((frames * 1000) / (now - fpsLast)) + ' FPS';
      frames = 0;
      fpsLast = now;
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

start();
