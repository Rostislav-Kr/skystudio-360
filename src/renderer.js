// WebGL rendering: three ShaderMaterials sharing one uniform set.
//  - bakeDomeMat:   renders the 360° cloud dome into a 2048×1024 texture
//  - fastScreenMat: per-frame pass that reads the baked dome (default)
//
// Dome baking:
//  - when the user changes the clouds, the dome is re-baked at once (full frame);
//  - while "evolution" is on, snapshots are baked a few rows per frame into a spare
//    target and the screen pass cross-fades between the two latest snapshots, so the
//    clouds morph continuously instead of jumping, and no single frame pays for a full bake.
//  - liveScreenMat: per-frame pass that evaluates every noise octave (baking off)

import {
  CanvasTexture,
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer
} from 'three';
import { VS_SRC, FS_SRC, buildDerivedShaders } from './shaders/sky.js';
import { state, getSunDir3D, getMoonDir3D } from './state.js';
import { paintTex } from './paint.js';
import { createMoonCanvas } from './moon.js';

const DOME_BAKE_W = 2048;
const DOME_BAKE_H = 1024;
const EVO_PERIOD = 2.0;   // seconds between evolution snapshots (= cross-fade length)
const BAKE_STRIPS = 16;   // an evolution snapshot is baked over this many frames

let renderer, scene, camera, screenQuad;
let bakeDomeMat, fastScreenMat, liveScreenMat;
let dummyTex, moonTex;
let uniforms;

// Three dome targets: the previous snapshot, the current one, and one being baked.
const domes = [];
let iPrev = 0, iCur = 0, iNext = 1;
let blendStart = 0;       // seconds
let strip = -1;           // next strip to bake into domes[iNext]; -1 = idle
let bakeSnap = null;      // evolution state frozen for the strip bake
let bakeStartSec = 0;
let fadePeriod = EVO_PERIOD; // stretched on slow GPUs so the morph never stalls between snapshots

export function getCanvas() { return renderer.domElement; }

export function initRenderer(canvas) {
  renderer = new WebGLRenderer({
    canvas,
    preserveDrawingBuffer: true,   // needed for PNG export
    antialias: false,
    powerPreference: 'high-performance'
  });
  renderer.autoClear = false;
  renderer.setPixelRatio(1);

  // 1×1 placeholder bound while baking, so the bake pass never samples its own target.
  dummyTex = new DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1, RGBAFormat, UnsignedByteType);
  dummyTex.minFilter = NearestFilter;
  dummyTex.magFilter = NearestFilter;
  dummyTex.needsUpdate = true;

  moonTex = new CanvasTexture(createMoonCanvas(512));
  moonTex.wrapS = ClampToEdgeWrapping;
  moonTex.wrapT = ClampToEdgeWrapping;
  moonTex.minFilter = LinearFilter;
  moonTex.magFilter = LinearFilter;
  moonTex.flipY = false;
  moonTex.generateMipmaps = false;
  moonTex.needsUpdate = true;

  for (let i = 0; i < 3; i++) {
    const target = new WebGLRenderTarget(DOME_BAKE_W, DOME_BAKE_H, {
      wrapS: RepeatWrapping,
      wrapT: ClampToEdgeWrapping,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false
    });
    domes.push({ target, windOffset: [0, 0], brushWindU: 0 });
  }

  uniforms = {
    uPaintTex:        { value: paintTex },
    uMoonTex:         { value: moonTex },
    uBakedTex:        { value: dummyTex },
    uSkyRayLutTex:    { value: domes[0].target.texture },
    uSkyRayLutTexPrev:{ value: domes[0].target.texture },
    uUseBaking:       { value: 1.0 },
    uDomeWindShift:   { value: 0.0 },
    uBakedWindOffset: { value: new Vector2() },
    uDomeWindShiftPrev:   { value: 0.0 },
    uBakedWindOffsetPrev: { value: new Vector2() },
    uDomeBlend:       { value: 1.0 },
    uResolution:      { value: new Vector2(1280, 720) },
    uTime:            { value: 0.0 },
    uEvoTime:         { value: 0.0 },
    uThermals:        { value: 0.0 },
    uWindShear:       { value: 0.0 },
    uWindOffset:      { value: new Vector2() },
    uWindVec:         { value: new Vector2() },
    uBrushWindU:      { value: 0.0 },
    uHasPaint:        { value: 0.0 },
    uSeedMacro:       { value: new Vector2() },
    uSeedBillow:      { value: new Vector2() },
    uSeedFine:        { value: new Vector2() },
    uPatternRot:      { value: 0.0 },
    uPatternVariant:  { value: 0.0 },
    uCamYaw:          { value: 0.0 },
    uCamPitch:        { value: 0.0 },
    uCamFov:          { value: 68.0 },
    uEquirectMode:    { value: 0.0 },
    uShowPlane:       { value: 1.0 },
    uTrailSpread:     { value: 1.5 },
    uTrailLife:       { value: 1.85 },
    uShowMoon:        { value: 0.0 },
    uMoonDir:         { value: new Vector3(0, 1, 0) },
    uMoonPhase:       { value: 1.0 },
    uMoonBrightness:  { value: 1.5 },
    uCelestialScale:  { value: 1.0 },
    uLunarEclipse:    { value: 0.0 },
    uModeId:          { value: 0.0 },
    uCloudToneMode:   { value: 1.0 },
    uCloudDarkness:   { value: 0.5 },
    uCoverage:        { value: 0.5 },
    uScale:           { value: 1.0 },
    uDetail:          { value: 0.9 },
    uContrast:        { value: 0.85 },
    uSunDir:          { value: new Vector3(0, 1, 0) },
    uSunBrightness:   { value: 1.35 },
    uShowSunRays:     { value: 0.0 }
  };
  for (let i = 0; i < 3; i++) {
    uniforms[`uF${i}Active`] = { value: 0.0 };
    uniforms[`uF${i}Start`]  = { value: new Vector2() };
    uniforms[`uF${i}Dir`]    = { value: new Vector2(1, 0) };
    uniforms[`uF${i}Dist`]   = { value: 0.0 };
    uniforms[`uF${i}Type`]   = { value: 0.0 };
    uniforms[`uF${i}Alt`]    = { value: 0.0 };
  }

  const { BAKE_DOME_FS, FAST_SCREEN_FS } = buildDerivedShaders(FS_SRC);
  const makeMat = fs => new ShaderMaterial({
    vertexShader: VS_SRC, fragmentShader: fs, uniforms, depthWrite: false, depthTest: false
  });
  bakeDomeMat = makeMat(BAKE_DOME_FS);
  fastScreenMat = makeMat(FAST_SCREEN_FS);
  liveScreenMat = makeMat(FS_SRC);

  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  screenQuad = new Mesh(new PlaneGeometry(2, 2), fastScreenMat);
  screenQuad.frustumCulled = false;
  scene.add(screenQuad);

  window.addEventListener('resize', resize);
  resize();
  return renderer;
}

export function resize() {
  const canvas = renderer.domElement;
  const rawW = Math.max(320, window.innerWidth);
  const rawH = Math.max(200, window.innerHeight);
  const maxDim = 1280;
  const autoScale = Math.min(state.renderScale, maxDim / Math.max(rawW, rawH));
  const w = Math.max(320, Math.floor(rawW * autoScale));
  const h = Math.max(200, Math.floor(rawH * autoScale));
  if (canvas.width !== w || canvas.height !== h) renderer.setSize(w, h, false);
}

function takeSnapshot() {
  return { evoTime: state.evoTime, windOffset: [state.windOffset[0], state.windOffset[1]], brushWindU: state.brushWindU };
}

/** snap: frozen evolution state when baking a dome, or null for the screen pass. */
function syncUniforms(w, h, snap, blend = 1.0) {
  const u = uniforms;
  if (snap) {
    u.uSkyRayLutTex.value = dummyTex;
    u.uSkyRayLutTexPrev.value = dummyTex;
  } else {
    const cur = domes[iCur], prev = domes[iPrev];
    u.uSkyRayLutTex.value = cur.target.texture;
    u.uSkyRayLutTexPrev.value = prev.target.texture;
    u.uDomeWindShift.value = state.brushWindU - cur.brushWindU;
    u.uBakedWindOffset.value.set(cur.windOffset[0], cur.windOffset[1]);
    u.uDomeWindShiftPrev.value = state.brushWindU - prev.brushWindU;
    u.uBakedWindOffsetPrev.value.set(prev.windOffset[0], prev.windOffset[1]);
    u.uDomeBlend.value = blend;
  }
  u.uUseBaking.value = state.useBaking ? 1.0 : 0.0;

  const evo = snap || state;
  u.uResolution.value.set(w, h);
  u.uTime.value = state.time;
  u.uEvoTime.value = evo.evoTime;
  u.uThermals.value = state.thermals;
  u.uWindShear.value = state.windShear;
  u.uWindOffset.value.set(evo.windOffset[0], evo.windOffset[1]);
  u.uWindVec.value.set(Math.cos(state.windAngle) * 0.0035, Math.sin(state.windAngle) * 0.0035);
  u.uBrushWindU.value = evo.brushWindU;

  u.uSeedMacro.value.set(state.seedMacro[0], state.seedMacro[1]);
  u.uSeedBillow.value.set(state.seedBillow[0], state.seedBillow[1]);
  u.uSeedFine.value.set(state.seedFine[0], state.seedFine[1]);
  u.uPatternRot.value = state.patternRot;
  u.uPatternVariant.value = state.patternVariant;

  u.uCamYaw.value = state.camYaw;
  u.uCamPitch.value = state.camPitch;
  u.uCamFov.value = state.camFov;
  u.uEquirectMode.value = state.equirectMode ? 1.0 : 0.0;

  u.uShowPlane.value = state.showPlane ? 1.0 : 0.0;
  u.uTrailSpread.value = state.trailSpread;
  u.uTrailLife.value = state.trailLife;
  const defaultAlt = [0.0, 1.0, 2.0];
  state.flights.forEach((f, i) => {
    u[`uF${i}Active`].value = f.active;
    u[`uF${i}Start`].value.set(f.startPos[0], f.startPos[1]);
    u[`uF${i}Dir`].value.set(f.dir[0], f.dir[1]);
    u[`uF${i}Dist`].value = f.dist;
    u[`uF${i}Type`].value = f.pType;
    u[`uF${i}Alt`].value = f.alt ?? defaultAlt[i];
  });

  u.uShowMoon.value = state.showMoon ? 1.0 : 0.0;
  const m = getMoonDir3D();
  u.uMoonDir.value.set(m[0], m[1], m[2]);
  u.uMoonPhase.value = state.moonPhase;
  u.uMoonBrightness.value = state.moonBrightness;
  u.uCelestialScale.value = state.celestialScale;
  u.uLunarEclipse.value = state.lunarEclipse;

  u.uModeId.value = state.modeId;
  u.uCloudToneMode.value = state.cloudToneId;
  u.uCloudDarkness.value = state.cloudDarkness;
  u.uCoverage.value = state.coverage;
  u.uScale.value = state.scale;
  u.uDetail.value = state.detail;
  u.uContrast.value = state.contrast;
  u.uHasPaint.value = state.hasPaint ? 1.0 : 0.0;

  const s = getSunDir3D();
  u.uSunDir.value.set(s[0], s[1], s[2]);
  u.uSunBrightness.value = state.sunBrightness;
  u.uShowSunRays.value = state.showSunRays ? 1.0 : 0.0;
}

/** Bake the whole dome, or one horizontal strip of it, into dome `d` using snapshot `snap`. */
function bakeDome(d, snap, stripIdx = null) {
  d.windOffset = [snap.windOffset[0], snap.windOffset[1]];
  d.brushWindU = snap.brushWindU;
  syncUniforms(DOME_BAKE_W, DOME_BAKE_H, snap);
  screenQuad.material = bakeDomeMat;
  const target = d.target;
  if (stripIdx !== null) {
    const h = DOME_BAKE_H / BAKE_STRIPS;
    target.scissor.set(0, stripIdx * h, DOME_BAKE_W, h);
    target.scissorTest = true;
  }
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
  target.scissorTest = false;
  renderer.setRenderTarget(null);
}

function thirdIndex(a, b) {
  for (let i = 0; i < 3; i++) if (i !== a && i !== b) return i;
  return 0;
}

/** Keeps the baked domes up to date; returns the cross-fade weight of the current dome. */
function updateDomes(nowSec) {
  if (state.domeDirty) {
    // The user changed the clouds: show the new shape immediately.
    state.domeDirty = false;
    bakeDome(domes[iCur], takeSnapshot());
    iPrev = iCur;
    iNext = thirdIndex(iCur, -1);
    strip = -1;
    blendStart = nowSec;
    return 1.0;
  }

  if (state.autoEvolve) {
    if (strip === -1) {
      bakeSnap = takeSnapshot();
      bakeStartSec = nowSec;
      strip = 0;
    }
    if (strip >= 0 && strip < BAKE_STRIPS) {
      bakeDome(domes[iNext], bakeSnap, strip);
      strip++;
      if (strip === BAKE_STRIPS) fadePeriod = Math.max(EVO_PERIOD, (nowSec - bakeStartSec) * 1.1);
    }
    const t = (nowSec - blendStart) / fadePeriod;
    if (strip === BAKE_STRIPS && (t >= 1.0 || iPrev === iCur)) {
      const newPrev = iCur;
      iCur = iNext;
      iPrev = newPrev;
      iNext = thirdIndex(iPrev, iCur);
      strip = -1;
      blendStart = nowSec;
    }
  }

  if (iPrev === iCur) return 1.0;
  const t = Math.min(1.0, Math.max(0.0, (nowSec - blendStart) / fadePeriod));
  return t * t * (3.0 - 2.0 * t);
}

export function drawScene(nowMs = performance.now()) {
  const canvas = renderer.domElement;
  const blend = state.useBaking ? updateDomes(nowMs / 1000) : 1.0;
  syncUniforms(canvas.width, canvas.height, null, blend);
  screenQuad.material = state.useBaking ? fastScreenMat : liveScreenMat;
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
}

/** Render a 2560×1280 equirectangular panorama and download it as PNG. */
export function exportPanoramaPNG(filename) {
  const canvas = renderer.domElement;
  const prevW = canvas.width, prevH = canvas.height;
  const prevEq = state.equirectMode;

  renderer.setSize(2560, 1280, false);
  state.equirectMode = true;
  drawScene();

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();

  state.equirectMode = prevEq;
  renderer.setSize(prevW, prevH, false);
  drawScene();
}
