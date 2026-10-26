// Procedural near-side Moon albedo map (grayscale).
// Generated at startup instead of shipping a photograph, so the repository has no
// third-party image licensing to worry about. Maria are placed roughly where they are
// on the real near side (north up), plus a power-law crater field and the ray systems
// of Tycho and Copernicus.
//
// To use a real map instead, replace createMoonCanvas() with an <img> of a
// public-domain lunar texture (e.g. from NASA) and pass it to THREE.Texture.

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(seed) {
  const rnd = mulberry32(seed);
  const N = 256;
  const perm = new Uint8Array(N * 2);
  const vals = new Float32Array(N);
  for (let i = 0; i < N; i++) { perm[i] = i; vals[i] = rnd(); }
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp;
  }
  for (let i = 0; i < N; i++) perm[N + i] = perm[i];

  const lattice = (ix, iy) => vals[perm[(perm[ix & 255] + iy) & 255]];
  const fade = t => t * t * (3 - 2 * t);

  function noise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const u = fade(fx), v = fade(fy);
    const a = lattice(ix, iy), b = lattice(ix + 1, iy);
    const c = lattice(ix, iy + 1), d = lattice(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  return function fbm(x, y, octaves = 4) {
    let sum = 0, amp = 0.5, norm = 0, f = 1;
    for (let o = 0; o < octaves; o++) {
      sum += amp * noise(x * f + o * 17.3, y * f + o * 31.7);
      norm += amp; amp *= 0.5; f *= 2.03;
    }
    return sum / norm;
  };
}

// Approximate near-side maria: centre (x, y) in disk units (−1..1, north up), radii, darkness.
const MARIA = [
  { x: -0.30, y:  0.36, rx: 0.30, ry: 0.27, k: 1.00 }, // Imbrium
  { x:  0.16, y:  0.38, rx: 0.17, ry: 0.16, k: 0.95 }, // Serenitatis
  { x:  0.32, y:  0.10, rx: 0.22, ry: 0.18, k: 0.95 }, // Tranquillitatis
  { x:  0.70, y:  0.30, rx: 0.12, ry: 0.10, k: 1.00 }, // Crisium
  { x:  0.56, y: -0.16, rx: 0.14, ry: 0.18, k: 0.85 }, // Fecunditatis
  { x:  0.34, y: -0.30, rx: 0.10, ry: 0.10, k: 0.80 }, // Nectaris
  { x: -0.58, y:  0.02, rx: 0.30, ry: 0.50, k: 0.90 }, // Oceanus Procellarum
  { x: -0.20, y: -0.36, rx: 0.20, ry: 0.15, k: 0.80 }, // Nubium
  { x: -0.50, y: -0.40, rx: 0.11, ry: 0.11, k: 0.90 }, // Humorum
  { x:  0.02, y:  0.70, rx: 0.52, ry: 0.08, k: 0.70 }, // Frigoris
  { x:  0.04, y:  0.22, rx: 0.11, ry: 0.08, k: 0.85 }, // Vaporum
  { x: -0.08, y:  0.02, rx: 0.10, ry: 0.07, k: 0.65 }, // Sinus Medii
  { x: -0.06, y: -0.12, rx: 0.12, ry: 0.10, k: 0.45 }  // Cognitum / central plains
];

export function createMoonCanvas(size = 512, seed = 1969) {
  const fbm = makeNoise(seed);
  const rnd = mulberry32(seed + 7);
  const val = new Float32Array(size * size);
  const toDisk = p => (p / size - 0.5) / 0.485;

  // Ray systems: a set of random directions for Tycho and Copernicus.
  const rays = [
    { x: -0.12, y: -0.70, n: 18, len: 2.0, amp: 0.10, dirs: [] }, // Tycho
    { x: -0.26, y:  0.17, n: 12, len: 4.0, amp: 0.06, dirs: [] }  // Copernicus
  ];
  for (const r of rays) for (let i = 0; i < r.n; i++) r.dirs.push(rnd() * Math.PI * 2);

  // 1) Highlands, maria and ray systems.
  for (let py = 0; py < size; py++) {
    const y = -toDisk(py);
    for (let px = 0; px < size; px++) {
      const x = toDisk(px);
      const highland = 0.80 + (fbm(x * 4, y * 4) - 0.5) * 0.22 + (fbm(x * 18, y * 18, 3) - 0.5) * 0.12
        + (fbm(x * 60, y * 60, 2) - 0.5) * 0.06;

      // Irregular coastlines: warp the sample point with low-frequency noise.
      const wx = (fbm(x * 2.6 + 4.2, y * 2.6) - 0.5) * 0.30;
      const wy = (fbm(x * 2.6, y * 2.6 + 9.7) - 0.5) * 0.30;
      let keep = 1;
      for (const m of MARIA) {
        const dx = (x + wx - m.x) / m.rx, dy = (y + wy - m.y) / m.ry;
        const d = Math.sqrt(dx * dx + dy * dy);
        const w = (1 - Math.min(1, Math.max(0, (d - 0.55) / 0.60))) * m.k;
        keep *= 1 - w;                               // soft union, so neighbouring maria merge
      }
      const maria = 1 - keep;
      const mareTone = 0.38 + (fbm(x * 7 + 2.0, y * 7, 3) - 0.5) * 0.14 + (fbm(x * 30, y * 30, 2) - 0.5) * 0.05;
      let v = highland + (mareTone - highland) * maria;

      for (const r of rays) {
        const dx = x - r.x, dy = y - r.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.04) continue;
        const ang = Math.atan2(dy, dx);
        let s = 0;
        for (const a of r.dirs) {
          let da = Math.abs(ang - a);
          if (da > Math.PI) da = 2 * Math.PI - da;
          s += Math.exp(-Math.pow(da * dist * 38, 2));
        }
        v += r.amp * Math.min(1, s) * Math.exp(-dist * r.len);
      }
      val[py * size + px] = v;
    }
  }

  // 2) Crater field (power-law sizes) + named craters.
  const craters = [
    { x: -0.12, y: -0.70, r: 0.035, depth: 0.10, bright: 0.20 }, // Tycho
    { x: -0.26, y:  0.17, r: 0.040, depth: 0.10, bright: 0.16 }, // Copernicus
    { x: -0.48, y:  0.14, r: 0.020, depth: 0.08, bright: 0.12 }, // Kepler
    { x: -0.62, y:  0.40, r: 0.016, depth: 0.04, bright: 0.25 }, // Aristarchus
    { x: -0.10, y:  0.80, r: 0.045, depth: 0.12, bright: 0.05 }  // Plato
  ];
  for (let i = 0; i < 260; i++) {
    const r = 0.006 * Math.pow(1 - rnd(), -0.55);
    if (r > 0.06) continue;
    // Small craters read as soft pits; only the larger ones get a visible bright rim.
    const rim = r > 0.02 ? 0.02 + rnd() * 0.03 : rnd() * 0.012;
    craters.push({ x: rnd() * 2.2 - 1.1, y: rnd() * 2.2 - 1.1, r, depth: 0.03 + rnd() * 0.04, bright: rim });
  }
  const scale = 0.485 * size;
  for (const c of craters) {
    const cx = (c.x * 0.485 + 0.5) * size, cy = (0.5 - c.y * 0.485) * size;
    const rp = c.r * scale;
    const x0 = Math.max(0, Math.floor(cx - rp * 1.4)), x1 = Math.min(size - 1, Math.ceil(cx + rp * 1.4));
    const y0 = Math.max(0, Math.floor(cy - rp * 1.4)), y1 = Math.min(size - 1, Math.ceil(cy + rp * 1.4));
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const dx = (px - cx) / rp, dy = (py - cy) / rp;
        const q = Math.sqrt(dx * dx + dy * dy);
        let dv = 0;
        if (q < 1.0) {
          // Bowl lit from the upper left: the upper-left inner wall falls into shadow.
          dv -= c.depth * (1 - q * q) * (0.6 - 0.4 * (dx * 0.7 + dy * 0.7));
        }
        if (q > 0.75 && q < 1.45) {
          dv += c.bright * Math.exp(-Math.pow((q - 1.0) / 0.22, 2));
        }
        val[py * size + px] += dv;
      }
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const g = Math.max(0, Math.min(255, Math.round(val[i] * 255)));
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = g;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
