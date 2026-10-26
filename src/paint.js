// Spherical paint map for the cloud brushes and the soft eraser.
// Channels: R = cumulus, G = cirrus, B = 128 neutral (>128 cirrocumulus, <128 erased), A = darkening/density.

import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  RGBAFormat,
  RepeatWrapping,
  UnsignedByteType
} from 'three';
import { state, markEnvDirty } from './state.js';

export const PAINT_W = 512;
export const PAINT_H = 256;

const paintFloat = new Float32Array(PAINT_W * PAINT_H * 4);
const paintData = new Uint8Array(PAINT_W * PAINT_H * 4);

export const paintTex = new DataTexture(paintData, PAINT_W, PAINT_H, RGBAFormat, UnsignedByteType);
paintTex.wrapS = RepeatWrapping;
paintTex.wrapT = ClampToEdgeWrapping;
paintTex.minFilter = LinearFilter;
paintTex.magFilter = LinearFilter;
paintTex.flipY = false;
paintTex.generateMipmaps = false;

function resetPaintData() {
  state.hasPaint = false;
  for (let i = 0; i < PAINT_W * PAINT_H; i++) {
    paintFloat[i * 4 + 0] = 0.0;
    paintFloat[i * 4 + 1] = 0.0;
    paintFloat[i * 4 + 2] = 128.0;
    paintFloat[i * 4 + 3] = 0.0;
    paintData[i * 4 + 0] = 0;
    paintData[i * 4 + 1] = 0;
    paintData[i * 4 + 2] = 128;
    paintData[i * 4 + 3] = 0;
  }
}

resetPaintData();
paintTex.needsUpdate = true;

export function clearPaintMask() {
  resetPaintData();
  state.hasPaint = true;
  paintTex.needsUpdate = true;
  markEnvDirty();
}

/** Convert a screen point to a world-space view ray (same camera model as the shader). */
export function screenToRayDir(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const u = (clientX - rect.left) / Math.max(1, rect.width);
  const v = 1.0 - (clientY - rect.top) / Math.max(1, rect.height);

  if (state.equirectMode) {
    const az = (u - 0.5) * 2.0 * Math.PI + state.camYaw;
    const el = -0.06 + v * (0.5 * Math.PI + 0.06);
    return [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
  }

  const scrX = (u - 0.5) * (rect.width / Math.max(1, rect.height));
  const scrY = (v - 0.5);
  const focal = 1.0 / Math.tan((state.camFov * Math.PI / 180.0) * 0.5);

  const fw = [
    Math.sin(state.camYaw) * Math.cos(state.camPitch),
    Math.sin(state.camPitch),
    Math.cos(state.camYaw) * Math.cos(state.camPitch)
  ];
  let rtX = -fw[2], rtY = 0.0, rtZ = fw[0];
  const rtLen = Math.hypot(rtX, rtZ) || 1.0;
  rtX /= rtLen; rtZ /= rtLen;

  const upX = rtY * fw[2] - rtZ * fw[1];
  const upY = rtZ * fw[0] - rtX * fw[2];
  const upZ = rtX * fw[1] - rtY * fw[0];

  const rx = scrX * rtX + scrY * upX + focal * fw[0];
  const ry = scrX * rtY + scrY * upY + focal * fw[1];
  const rz = scrX * rtZ + scrY * upZ + focal * fw[2];
  const norm = Math.hypot(rx, ry, rz) || 1.0;
  return [rx / norm, ry / norm, rz / norm];
}

export function isPaintTool(tool) {
  return tool === 'paint_cu' || tool === 'paint_ci' || tool === 'paint_cc' || tool === 'erase';
}

/** Spray (or erase) clouds at a screen point for dtSeconds of brush time. */
export function spraySkyAtPoint(canvas, clientX, clientY, toolMode, dtSeconds) {
  const rd = screenToRayDir(canvas, clientX, clientY);
  if (rd[1] < 0.0) return;
  state.hasPaint = true;

  const el = Math.asin(Math.max(0.0, Math.min(1.0, rd[1])));
  const sphU = ((Math.atan2(rd[0], rd[2]) / (2.0 * Math.PI) + 0.5 - state.brushWindU) % 1.0 + 1.0) % 1.0;
  const sphV = Math.max(0.0, Math.min(1.0, el / (0.5 * Math.PI)));

  const cosEl = Math.max(0.22, Math.cos(el));
  const radX = Math.max(5, Math.min(100, Math.round((state.brushRadius * PAINT_W * 0.30) / cosEl)));
  const radY = Math.max(5, Math.round(state.brushRadius * PAINT_H * 0.54));
  const cxPx = Math.round(sphU * PAINT_W);
  const cyPx = Math.round(sphV * PAINT_H);

  const stepAmount = 260.0 * state.brushFlow * dtSeconds;

  for (let dy = -radY; dy <= radY; dy++) {
    const py = cyPx + dy;
    if (py < 0 || py >= PAINT_H) continue;
    for (let dx = -radX; dx <= radX; dx++) {
      const px = (cxPx + dx + PAINT_W) % PAINT_W;
      const d2 = (dx / radX) * (dx / radX) + (dy / radY) * (dy / radY);
      if (d2 >= 1.0) continue;

      const falloff = Math.exp(-d2 * 2.8) * (1.0 - d2) * (1.0 - d2);
      const delta = falloff * stepAmount;
      if (delta < 0.01) continue;

      const idx = (py * PAINT_W + px) * 4;

      if (toolMode === 'erase') {
        if (paintFloat[idx + 3] > 0.0) {
          paintFloat[idx + 3] = Math.max(0.0, paintFloat[idx + 3] - delta * 1.4);
        }
        paintFloat[idx + 0] = Math.max(0.0, paintFloat[idx + 0] - delta * 0.72);
        paintFloat[idx + 1] = Math.max(0.0, paintFloat[idx + 1] - delta * 0.72);
        if (paintFloat[idx + 0] < 25.0 && paintFloat[idx + 1] < 25.0) {
          paintFloat[idx + 2] = Math.max(8.0, paintFloat[idx + 2] - delta * 0.45);
        } else if (paintFloat[idx + 2] > 128.0) {
          paintFloat[idx + 2] = Math.max(128.0, paintFloat[idx + 2] - delta * 0.72);
        }
      } else {
        if (paintFloat[idx + 2] < 128.0 && toolMode !== 'paint_cc') {
          paintFloat[idx + 2] = Math.min(128.0, paintFloat[idx + 2] + delta * 0.9);
        }

        if (toolMode === 'paint_cu') {
          paintFloat[idx + 0] = Math.min(255.0, paintFloat[idx + 0] + delta);
        } else if (toolMode === 'paint_ci') {
          paintFloat[idx + 1] = Math.min(255.0, paintFloat[idx + 1] + delta * 0.85);
        } else if (toolMode === 'paint_cc') {
          paintFloat[idx + 2] = Math.min(255.0, Math.max(128.0, paintFloat[idx + 2]) + delta * 0.48);
        }

        if (state.brushMode === 'light') {
          paintFloat[idx + 3] = Math.max(0.0, paintFloat[idx + 3] - delta * 1.2);
        } else if (state.brushMode === 'soft3d') {
          const targetA = 85.0;
          if (paintFloat[idx + 3] < targetA) {
            paintFloat[idx + 3] = Math.min(targetA, paintFloat[idx + 3] + delta * 0.65);
          } else {
            paintFloat[idx + 3] = Math.max(targetA, paintFloat[idx + 3] - delta * 0.65);
          }
        } else if (state.brushMode === 'dense') {
          paintFloat[idx + 3] = Math.min(245.0, paintFloat[idx + 3] + delta * 0.78);
        }
      }

      paintData[idx + 0] = Math.round(paintFloat[idx + 0]);
      paintData[idx + 1] = Math.round(paintFloat[idx + 1]);
      paintData[idx + 2] = Math.round(paintFloat[idx + 2]);
      paintData[idx + 3] = Math.round(paintFloat[idx + 3]);
    }
  }
  paintTex.needsUpdate = true;
  markEnvDirty();
}
