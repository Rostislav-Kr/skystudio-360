// Global application state and small sky-geometry helpers.

export const PLANE_MODES = [
  { id: 'all',   labelKey: 'plane.all',   nameKey: 'plane.all.name' },
  { id: 'twin',  labelKey: 'plane.twin',  nameKey: 'plane.twin.name' },
  { id: 'jumbo', labelKey: 'plane.jumbo', nameKey: 'plane.jumbo.name' },
  { id: 'super', labelKey: 'plane.super', nameKey: 'plane.super.name' }
];

export const state = {
  activeSpecies: 'cirrus_classic',
  activeTheme: null,          // id of the preset currently shown in the title, or null
  modeId: 0.0,

  // Cloud tone: 'light' | 'mixed' | 'dark' + continuous darkness ratio 0..1
  cloudTone: 'mixed',
  cloudToneId: 1.0,
  cloudDarkness: 0.52,

  editMode: false,
  tool: 'cam',                // 'cam' | 'paint_ci' | 'paint_cu' | 'paint_cc' | 'erase' | 'wind' | 'sun' | 'moon'
  brushMode: 'light',         // 'light' | 'soft3d' | 'dense'
  brushFlow: 0.30,
  equirectMode: false,

  showPlane: true,
  planeModeIdx: 0,            // 0 = all three, 1 = twin, 2 = jumbo, 3 = supersonic
  nextPlaneTypeCycle: 0,
  planeSpeed: 0.032,
  trailSpread: 1.50,
  trailLife: 1.85,

  nextPlaneAltCycle: 0,
  flights: [
    { active: 1.0, startPos: [2.36, 1.66],  dir: [-0.84, -0.54], dist: 2.95, totalChord: 5.50, pType: 0.0, alt: 2.0 },
    { active: 1.0, startPos: [-2.30, 1.72], dir: [0.81, -0.58],  dist: 3.45, totalChord: 5.50, pType: 1.0, alt: 0.0 },
    { active: 1.0, startPos: [2.10, 1.98],  dir: [-0.72, -0.69], dist: 2.25, totalChord: 5.50, pType: 2.0, alt: 1.0 }
  ],

  showMoon: false,
  moonAz: 0.85,
  moonEl: 0.42,
  moonPhase: 1.00,
  moonBrightness: 1.50,
  celestialScale: 1.00,
  lunarEclipse: 0.0,

  brushRadius: 0.13,
  time: 0.0,
  evoTime: 0.0,
  thermals: 0.65,
  windShear: 0.45,
  autoEvolve: true,
  evoMode: 'boil',            // 'boil' | 'atlas' | 'diurnal' | 'front'
  evoClock: 0.0,

  windSpeed: 0.50,
  windAngle: 0.42,
  windOffset: [0.0, 0.0],
  brushWindU: 0.0,

  seedMacro: [0.0, 0.0],
  seedBillow: [0.0, 0.0],
  seedFine: [0.0, 0.0],
  patternRot: 0.0,
  patternVariant: 0.35,

  camYaw: 0.0,
  camPitch: 0.36,
  camFov: 68.0,

  coverage: 0.54,
  scale: 1.00,
  detail: 0.92,
  contrast: 0.84,

  sunAz: -0.28,
  sunElDeg: 34.0,
  sunBrightness: 1.35,
  showSunRays: false,
  useBaking: true,
  hasPaint: false,
  renderScale: 1.00,

  // Set whenever cloud shape changes so the 360° dome is re-baked on the next frame.
  domeDirty: true
};

export function markEnvDirty() {
  state.domeDirty = true;
}

export function getSunDir3D() {
  const elRad = state.sunElDeg * Math.PI / 180.0;
  const ce = Math.cos(elRad);
  return [Math.sin(state.sunAz) * ce, Math.sin(elRad), Math.cos(state.sunAz) * ce];
}

export function getMoonDir3D() {
  const ce = Math.cos(state.moonEl);
  return [Math.sin(state.moonAz) * ce, Math.sin(state.moonEl), Math.cos(state.moonAz) * ce];
}

export function isSolarEclipseActive() {
  const s = getSunDir3D(), m = getMoonDir3D();
  const dot = Math.max(-1, Math.min(1, s[0] * m[0] + s[1] * m[1] + s[2] * m[2]));
  return state.showMoon && Math.acos(dot) < 0.095 * state.celestialScale && state.sunElDeg > -3;
}

function getViewCenterDomeCoords() {
  const sy = Math.max(0.12, Math.sin(state.camPitch));
  const rx = Math.sin(state.camYaw) * Math.cos(state.camPitch);
  const rz = Math.cos(state.camYaw) * Math.cos(state.camPitch);
  const denom = (Math.pow(sy, 0.68) + 0.36) * 0.95;
  return [rx / denom, rz / denom];
}

function computeHorizonFlightChord(passPoint, flightAngle) {
  const R_hor = 2.88;
  const fx = Math.cos(flightAngle);
  const fy = Math.sin(flightAngle);
  const b = passPoint[0] * fx + passPoint[1] * fy;
  const c = (passPoint[0] * passPoint[0] + passPoint[1] * passPoint[1]) - R_hor * R_hor;
  const disc = Math.sqrt(Math.max(0.05, b * b - c));
  const sBack = b + disc;
  const sFwd = -b + disc;
  return {
    startPos: [passPoint[0] - fx * sBack, passPoint[1] - fy * sBack],
    dir: [fx, fy],
    sCenter: sBack,
    totalChord: sBack + sFwd
  };
}

function pickNextAircraftType() {
  if (state.planeModeIdx === 1) return 0.0;
  if (state.planeModeIdx === 2) return 1.0;
  if (state.planeModeIdx === 3) return 2.0;
  const t = state.nextPlaneTypeCycle % 3;
  state.nextPlaneTypeCycle++;
  return t * 1.0;
}

/** Shift existing flights down the queue (0 → 1 → 2) and launch a new one across the current view. */
export function launchNewFlight(startNearCenter = false, forcedType = null) {
  const f = state.flights;
  if (f[1].active > 0.5) {
    Object.assign(f[2], {
      active: 1.0, startPos: [...f[1].startPos], dir: [...f[1].dir],
      dist: f[1].dist, totalChord: f[1].totalChord, pType: f[1].pType, alt: f[1].alt ?? 0.0
    });
  }
  if (f[0].active > 0.5 && f[0].dist > 0.25) {
    Object.assign(f[1], {
      active: 1.0, startPos: [...f[0].startPos], dir: [...f[0].dir],
      dist: f[0].dist, totalChord: f[0].totalChord, pType: f[0].pType, alt: f[0].alt ?? 1.0
    });
  }

  const center = getViewCenterDomeCoords();
  const ang = state.camYaw + 2.35 + (Math.random() - 0.5) * 1.45;
  const rx = -Math.sin(ang), ry = Math.cos(ang);
  const lateralOffset = (Math.random() - 0.5) * 0.36;
  const passPt = [center[0] + rx * lateralOffset, center[1] + ry * lateralOffset];

  const chord = computeHorizonFlightChord(passPt, ang);
  f[0].active = 1.0;
  f[0].startPos = chord.startPos;
  f[0].dir = chord.dir;
  f[0].totalChord = chord.totalChord;
  f[0].dist = startNearCenter ? (chord.sCenter + 0.25) : 0.22;
  f[0].pType = (forcedType !== null) ? forcedType : pickNextAircraftType();
  f[0].alt = (state.nextPlaneAltCycle % 3) * 1.0;
  state.nextPlaneAltCycle++;
}

export function getFlightTypeSpeedMult(pType) {
  if (pType > 1.5) return 1.50;
  if (pType > 0.5) return 0.88;
  return 1.00;
}
