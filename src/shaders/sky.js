// SkyStudio 360° — GLSL sources.
// FS_SRC is the full "live" shader (all noise octaves computed per pixel).
// BAKE_DOME_FS and FAST_SCREEN_FS are derived from it by slicing at stable
// anchor comments/lines, so the shader lives in exactly one place.

export const VS_SRC = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;

export const FS_SRC = `
      varying vec2 vUv;

      uniform sampler2D uPaintTex;
      uniform sampler2D uMoonTex;
      uniform sampler2D uBakedTex;
      uniform sampler2D uSkyRayLutTex;
      uniform float uUseBaking;
      uniform vec2 uResolution;
      uniform float uTime;
      uniform float uEvoTime;
      uniform float uThermals;
      uniform float uWindShear;
      uniform vec2 uWindOffset;
      uniform vec2 uWindVec;
      uniform float uBrushWindU;
      uniform float uHasPaint;

      uniform vec2 uSeedMacro;
      uniform vec2 uSeedBillow;
      uniform vec2 uSeedFine;
      uniform float uPatternRot;
      uniform float uPatternVariant;

      uniform float uCamYaw;
      uniform float uCamPitch;
      uniform float uCamFov;
      uniform float uEquirectMode;

      uniform float uShowPlane;
      uniform float uTrailSpread;
      uniform float uTrailLife;

      uniform float uF0Active;
      uniform vec2 uF0Start;
      uniform vec2 uF0Dir;
      uniform float uF0Dist;
      uniform float uF0Type;
      uniform float uF0Alt;

      uniform float uF1Active;
      uniform vec2 uF1Start;
      uniform vec2 uF1Dir;
      uniform float uF1Dist;
      uniform float uF1Type;
      uniform float uF1Alt;

      uniform float uF2Active;
      uniform vec2 uF2Start;
      uniform vec2 uF2Dir;
      uniform float uF2Dist;
      uniform float uF2Type;
      uniform float uF2Alt;

      uniform float uShowMoon;
      uniform vec3 uMoonDir;
      uniform float uMoonPhase;
      uniform float uMoonBrightness;
      uniform float uCelestialScale;
      uniform float uLunarEclipse;

      uniform float uModeId;
      uniform float uCloudToneMode;
      uniform float uCloudDarkness;
      uniform float uCoverage;
      uniform float uScale;
      uniform float uDetail;
      uniform float uContrast;
      uniform vec3 uSunDir;
      uniform float uSunBrightness;
      uniform float uShowSunRays;

      const float PI = 3.14159265359;

      float hash21(vec2 p) {
        p = mod(p, 289.0);
        vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return a + (b - a)*u.x + (c - a)*u.y + (a - b - c + d)*u.x*u.y;
      }

      const mat2 rotM = mat2(0.80, 0.60, -0.60, 0.80);

      // 100% CRISP ANALYTICAL PROCEDURAL FBM & C2-REGULARIZED COTTON BILLOWS (Zero Voronoi polygons, zero contour rings!)
      float fbm6(vec2 p, float gain) {
        float v = 0.0;
        float amp = 0.50;
        float norm = 0.0;
        vec2 evo = vec2(sin(uEvoTime * 0.14), cos(uEvoTime * 0.12)) * (0.06 * uThermals);
        for (int i = 0; i < 6; i++) {
          v += amp * noise(p);
          norm += amp;
          p = rotM * p * 2.02 + vec2(17.3, 31.7) + evo * float(i);
          amp *= gain;
        }
        return v / norm;
      }

      float fbm3(vec2 p, float gain) {
        float v = 0.0;
        float amp = 0.52;
        float norm = 0.0;
        vec2 evo = vec2(cos(uEvoTime * 0.15), sin(uEvoTime * 0.13)) * (0.05 * uThermals);
        for (int i = 0; i < 3; i++) {
          v += amp * noise(p);
          norm += amp;
          p = rotM * p * 2.03 + vec2(13.1, 29.3) + evo * float(i);
          amp *= gain;
        }
        return v / norm;
      }

      // C2-smooth regularized billow FBM: soft cotton-wool domes with zero polygonal Voronoi seams!
      float fbmBillow5(vec2 p, float gain) {
        float v = 0.0;
        float amp = 0.50;
        float norm = 0.0;
        vec2 evo = vec2(sin(uEvoTime * 0.18), cos(uEvoTime * 0.16)) * (0.07 * uThermals);
        for (int i = 0; i < 5; i++) {
          float n = noise(p) * 2.0 - 1.0;
          float b = 1.0 - sqrt(n * n + 0.022);
          b = clamp(b, 0.0, 1.0);
          v += amp * b;
          norm += amp;
          p = rotM * p * 2.03 + vec2(11.7, 23.1) + evo * float(i);
          amp *= gain;
        }
        return v / norm;
      }

      float fbmBillow3(vec2 p, float gain) {
        float v = 0.0;
        float amp = 0.52;
        float norm = 0.0;
        vec2 evo = vec2(cos(uEvoTime * 0.16), sin(uEvoTime * 0.14)) * (0.06 * uThermals);
        for (int i = 0; i < 3; i++) {
          float n = noise(p) * 2.0 - 1.0;
          float b = 1.0 - sqrt(n * n + 0.022);
          v += amp * clamp(b, 0.0, 1.0);
          norm += amp;
          p = rotM * p * 2.04 + vec2(11.7, 23.1) + evo * float(i);
          amp *= gain;
        }
        return v / norm;
      }

      vec4 sampleSmoothPaint(vec2 uv) {
        vec2 t1 = vec2(1.0 / 512.0, 1.0 / 256.0) * 1.5;
        vec4 c = texture2D(uPaintTex, uv) * 0.52;
        c += texture2D(uPaintTex, vec2(fract(uv.x + t1.x), clamp(uv.y + t1.y, 0.0, 1.0))) * 0.24;
        c += texture2D(uPaintTex, vec2(fract(uv.x - t1.x), clamp(uv.y - t1.y, 0.0, 1.0))) * 0.24;
        return c;
      }

      // Mode 0: Feathered, softly curved Cirrus fibratus wisps & locks (Natural cloud tufts — zero ruler-straight rain stripes!)
      void evalClassicSilkyCirrus(vec2 q, vec2 qB, vec2 qF, out float outStreak, out float outVeil) {
        float ang = 0.58 + uPatternVariant * 0.85;
        float ca = cos(ang), sa = sin(ang);
        vec2 u = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca);

        // Organic 2D streamline curl so wisps fan out and curve naturally instead of forming parallel rain lines
        vec2 curl = vec2(
          fbm3(u * 0.75 + vec2(1.7, 3.2), 0.52) - 0.5,
          fbm3(u * 0.75 + vec2(6.4, 1.9), 0.52) - 0.5
        ) * 0.18;
        vec2 uw = u + curl;

        float stretch = 3.6 + 1.6 * uWindShear;
        vec2 pWisp1 = vec2(uw.x * 0.95, (uw.y + sin(uw.x * 1.35) * 0.08) * stretch);
        vec2 pWisp2 = vec2(uw.x * 1.55 + 3.7, (uw.y * 0.90 - cos(uw.x * 1.75) * 0.07) * (stretch * 1.25)) + uSeedFine * 0.05;

        float s1 = fbm6(pWisp1, 0.55);
        float s2 = fbmBillow5(pWisp2 * 0.68, 0.54);
        float tuftCluster = smoothstep(0.30, 0.68, fbmBillow5(vec2(uw.x * 0.82 + 1.4, uw.y * 1.35 + 2.3), 0.52));

        outStreak = (s1 * 0.56 + s2 * 0.44) * tuftCluster;
        outVeil   = fbmBillow3(vec2(uw.x * 0.72, uw.y * 1.85), 0.51) * tuftCluster;
      }

      // Mode 1: Cirrus uncinus ("Mare's tails" — feathered ice plumes with comma-shaped tufts and gentle hooks)
      void evalUncinusPlumes(vec2 q, vec2 qB, vec2 qF, out float outFibers, out float outHookCore) {
        float ang = 0.64 + uPatternVariant * 1.1;
        float ca = cos(ang), sa = sin(ang);
        vec2 u = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca);

        vec2 curl = vec2(
          fbm3(u * 0.70 + vec2(1.3, 2.7), 0.52) - 0.5,
          fbm3(u * 0.70 + vec2(5.1, 4.3), 0.52) - 0.5
        ) * 0.16;
        vec2 uw = u + curl;
        float hookBend = sin(uw.x * 1.45 + 0.8) * (0.065 + 0.045 * uWindShear);
        float stretch = 3.8 + 1.8 * uWindShear;

        vec2 pPlume1 = vec2(uw.x * 1.05, (uw.y + hookBend) * stretch);
        vec2 pPlume2 = vec2(uw.x * 1.65 + 4.1, (uw.y - hookBend * 0.75) * (stretch * 1.25)) + uSeedFine * 0.07;

        float f1 = fbm6(pPlume1, 0.55);
        float f2 = fbmBillow5(pPlume2 * 0.65, 0.54);
        float tuft = fbmBillow5(vec2(uw.x * 1.25 + 2.1, uw.y * 2.1 + 0.9), 0.53);
        float patchMask = smoothstep(0.32, 0.68, fbm3(vec2(uw.x * 0.85 + 3.7, uw.y * 1.25 + 1.2), 0.51));

        outFibers   = (f1 * 0.55 + f2 * 0.45) * patchMask;
        outHookCore = smoothstep(0.34, 0.76, tuft) * patchMask;
      }

      // Mode 2: Cirrus vertebratus & intortus (Sweeping jet-stream spine + feathered herring-bone ribs)
      void evalVertebratusCirrus(vec2 q, vec2 qB, vec2 qF, out float outRibs, out float outSpine) {
        float ang = 0.42 + uPatternVariant * 1.0;
        float ca = cos(ang), sa = sin(ang);
        vec2 u = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca);

        float bend = (fbm3(u * 0.68 + vec2(1.9, 3.1), 0.51) - 0.5) * 0.16;
        float uy = u.y + bend;

        float spineWave = fbmBillow5(vec2(u.x * 1.65 + 0.7, uy * 0.82 + 1.5), 0.53);
        float ribWave   = fbmBillow3(vec2(u.x * 4.20 + sin(uy * 2.8) * 0.42, uy * 2.8), 0.54);
        float fineFib   = fbm6(vec2(u.x * (4.5 + 1.8 * uWindShear), (uy + sin(u.x * 2.8) * 0.07) * 1.9), 0.55);

        float bandMask = smoothstep(0.26, 0.68, fbm3(vec2(u.x * 1.05 + 2.4, uy * 0.65 + 0.8), 0.50));
        outSpine = spineWave * bandMask;
        outRibs  = (fineFib * 0.55 + ribWave * 0.45) * smoothstep(0.18, 0.72, spineWave + 0.14) * bandMask;
      }

      vec3 evalStarLayerSpherical(vec3 rd, float scale, float thresh, float bright, float sy) {
        float lat = asin(clamp(rd.y, -1.0, 1.0));
        float lon = atan(rd.x, rd.z);
        float vCell = lat * scale;
        float iy = floor(vCell);
        float cosLat = max(0.14, cos((iy + 0.5) / scale));
        float uCell = lon * scale * cosLat;
        float ix = floor(uCell);

        vec2 f = vec2(uCell - ix, vCell - iy) - 0.5;
        vec2 id = vec2(ix + scale * 1.7, iy + scale * 3.1);

        float h1 = hash21(id);
        if (h1 <= thresh) return vec3(0.0);

        float h2 = hash21(id + vec2(19.3, 47.7));
        float h3 = hash21(id + vec2(73.1, 11.9));

        vec2 offset = (vec2(h2, h3) - 0.5) * 0.42;
        float d = length(f - offset);

        float mag = pow(clamp((h1 - thresh) / (1.0 - thresh), 0.0, 1.0), 2.5);
        float cellSafe = 1.0 - smoothstep(0.20, 0.47, d);
        float horizonScint = 1.0 - (1.0 - smoothstep(0.02, 0.28, sy)) * 0.14 * sin(uTime * 3.0 + h1 * 80.0);
        float pt = (exp(-(d * 10.5) * (d * 10.5)) * mag + exp(-d * 4.8) * pow(mag, 2.2) * 0.32 * cellSafe) * horizonScint;

        vec3 cBlue   = vec3(0.68, 0.83, 1.00);
        vec3 cWhite  = vec3(0.98, 0.99, 1.00);
        vec3 cYellow = vec3(1.00, 0.92, 0.76);
        vec3 cOrange = vec3(1.00, 0.72, 0.48);
        vec3 sCol = (h2 < 0.34) ? mix(cBlue, cWhite, h2 / 0.34)
                  : (h2 < 0.74) ? mix(cWhite, cYellow, (h2 - 0.34) / 0.40)
                                : mix(cYellow, cOrange, (h2 - 0.74) / 0.26);

        return sCol * pt * bright;
      }

      vec3 renderRealStarfield360(vec3 rd, float starVis, float sy, float horFade) {
        if (starVis <= 0.01 || rd.y <= 0.0) return vec3(0.0);

        float galLat = rd.x * 0.60 + rd.y * 0.50 - rd.z * 0.62;
        float galLon = -rd.x * 0.68 + rd.y * 0.72 + rd.z * 0.14;
        float mwWarp = fbm3(vec2(galLon * 3.2 + 1.2, galLat * 3.2 + 2.8), 0.54);
        float mwBand = exp(-pow((galLat + (mwWarp - 0.5) * 0.18) * 4.0, 2.0));
        float mwRift = smoothstep(0.38, 0.68, fbm3(vec2(galLon * 7.5 + 4.1, galLat * 13.5 + 0.7), 0.55));
        float mwGlow = mwBand * (0.45 + 0.55 * mwWarp) * (1.0 - 0.64 * mwRift * exp(-pow(galLat * 8.5, 2.0)));

        vec3 milkyWayCol = (vec3(0.11, 0.17, 0.30) * mwGlow * 0.52 +
                            vec3(0.24, 0.19, 0.28) * (mwGlow * mwBand) * 0.28);

        vec3 s1 = evalStarLayerSpherical(rd, 52.0,  0.945, 2.35, sy);
        vec3 s2 = evalStarLayerSpherical(rd, 110.0, 0.912 - 0.04 * mwBand, 1.25, sy);
        vec3 s3 = evalStarLayerSpherical(rd, 210.0, 0.855 - 0.12 * mwBand, 0.58, sy);

        return (milkyWayCol + s1 + s2 + s3) * starVis * horFade;
      }

      // ============================================================================
      // NATURAL HDR SOLAR GLARE & REAL TELESCOPIC MOON
      // Continuous Lorentzian/Mie solar bloom (zero clipped circle edge!) + cloud transillumination!
      // ============================================================================
      vec3 renderSunAndRealMoon(
        vec3 baseSky, vec3 rd, vec3 sunDir, vec3 moonDir,
        float dayFactor, float sunsetFactor, float nightFactor, float eclipseTotality,
        float cloudTransOverSun, float cloudForwardScatter,
        out float outSunGlow, out float outMoonGlow
      ) {
        outSunGlow = 0.0;
        outMoonGlow = 0.0;
        float aboveHorMask = smoothstep(-0.03, 0.01, rd.y);

        vec3 col = baseSky;
        vec3 sDir = normalize(sunDir);
        vec3 mDir = normalize(moonDir);

        float rSun  = 0.038 * uCelestialScale;
        float rMoon = 0.043 * uCelestialScale;

        float sDot = clamp(dot(rd, sDir), -1.0, 1.0);
        float mDot = clamp(dot(rd, mDir), -1.0, 1.0);
        float sAng = acos(sDot);
        float mAng = acos(mDot);

        vec3 mUp = normalize(vec3(0.0, 1.0, 0.0) - mDir * mDir.y + vec3(0.0001));
        vec3 mRt = normalize(cross(mUp, mDir));
        vec2 mLocal = vec2(dot(rd - mDir, mRt), dot(rd - mDir, mUp)) / rMoon;
        float mr2 = dot(mLocal, mLocal);
        float mr  = sqrt(mr2);
        float moonDiskMask = (uShowMoon > 0.5) ? (1.0 - smoothstep(0.955, 1.005, mr)) * smoothstep(-0.01, 0.03, rd.y) : 0.0;

        if (sDir.y > -0.05) {
          float sunVis = smoothstep(-0.05, 0.03, sDir.y);
          float sBright = clamp(uSunBrightness, 0.25, 3.20);
          float sPower  = pow(sBright, 1.32);
          vec3 sunOuterTint = mix(vec3(1.00, 0.44, 0.14), vec3(1.00, 0.90, 0.68), smoothstep(0.0, 0.30, sDir.y));
          vec3 sunMidTint   = mix(vec3(1.00, 0.72, 0.36), vec3(1.00, 0.97, 0.88), smoothstep(0.0, 0.25, sDir.y));
          vec3 sunCoreTint  = mix(vec3(1.00, 0.95, 0.80), vec3(1.00, 1.00, 1.00), smoothstep(0.0, 0.18, sDir.y));

          // Powerful 4-stage HDR Lorentzian + Mie solar corona & blinding core that scales dynamically with sBright (up to 300%)
          float rSunEff    = rSun * (0.92 + 0.30 * sqrt(sBright));
          float u          = sAng / rSunEff;
          float mieWide    = exp(-u * 0.24) * 0.34 * sPower;
          float mieMid     = exp(-u * 0.56) * 0.92 * sPower;
          float glareInner = (1.0 / (1.0 + pow(u * 0.70, 2.30))) * 2.55 * sPower;
          float coreBlaze  = (1.0 / (1.0 + pow(u * 0.86, 3.60))) * 6.80 * sPower * (1.0 - moonDiskMask * eclipseTotality);

          float bloomOcc = (1.0 - eclipseTotality * 0.90) * sunVis;
          // Direct solar glare punches through thin/medium clouds, while wide Mie corona illuminates the sky around the Sun
          float directTrans = mix(0.28, 1.0, cloudTransOverSun);
          vec3 hdrSunDirect = (
            sunOuterTint * (mieWide * (0.45 + 0.55 * cloudTransOverSun) + mieMid * directTrans) +
            sunMidTint   * (glareInner * directTrans) +
            sunCoreTint  * (coreBlaze * cloudTransOverSun)
          ) * bloomOcc;

          vec3 hdrCloudScatter = mix(sunMidTint, sunCoreTint, 0.45) * (cloudForwardScatter * bloomOcc * sPower);
          col = 1.0 - (1.0 - col) * exp(-(hdrSunDirect + hdrCloudScatter));

          if (eclipseTotality > 0.02 && uShowMoon > 0.5) {
            vec3 sUp = normalize(vec3(0.0, 1.0, 0.0) - sDir * sDir.y + vec3(0.0001));
            vec3 sRt = normalize(cross(sUp, sDir));
            vec2 sLocal = vec2(dot(rd - sDir, sRt), dot(rd - sDir, sUp)) / rSun;
            float sTheta = atan(sLocal.y, sLocal.x);
            float sr = length(sLocal);
            float coronaGlow = exp(-max(0.0, sr - 0.95) * 2.4) * 0.90 +
                               exp(-max(0.0, sr - 0.95) * 10.5) * 1.40;
            col += vec3(0.82, 0.91, 1.00) * coronaGlow * eclipseTotality * (1.0 - moonDiskMask) * cloudTransOverSun;

            float promWave = max(0.0, sin(sTheta * 7.0 + 0.8) * cos(sTheta * 5.0 - 1.3));
            float promGlow = exp(-abs(mr - 0.995) * 52.0) * promWave * eclipseTotality * 1.5;
            col += vec3(1.0, 0.16, 0.28) * promGlow * (1.0 - moonDiskMask * 0.7) * cloudTransOverSun;

            float sunCrescent = (1.0 - smoothstep(0.95, 1.02, u)) * (1.0 - moonDiskMask);
            col += vec3(1.0, 0.98, 0.92) * sunCrescent * 2.2 * eclipseTotality * sunVis * cloudTransOverSun;
          }

          outSunGlow = (mieMid * 0.80 + glareInner * 0.70) * bloomOcc;
        }

        if (uShowMoon > 0.5) {
          float isBlood = clamp(uLunarEclipse * (1.0 - dayFactor), 0.0, 1.0);
          float effPhase = (eclipseTotality > 0.05) ? clamp(1.0 - eclipseTotality * 1.2, 0.0, 1.0) * 0.12 : uMoonPhase;
          float mBright = clamp(uMoonBrightness, 0.25, 3.0);

          float phaseAng = (1.0 - effPhase) * PI;
          vec2 sunProj = vec2(dot(sDir - mDir, mRt), dot(sDir - mDir, mUp));
          vec2 phaseDir2D = (length(sunProj) > 0.02 && sDir.y > 0.0)
            ? normalize(sunProj)
            : normalize(vec2(0.92, 0.24));
          vec3 lightVec = normalize(vec3(phaseDir2D * sin(phaseAng), cos(phaseAng)));

          vec2 mUv = clamp(vec2(0.5 + mLocal.x * 0.485, 0.5 - mLocal.y * 0.485), 0.0, 1.0);
          float texC = texture2D(uMoonTex, mUv).r * 0.44 +
                       texture2D(uMoonTex, mUv + vec2(0.0032, 0.0)).r * 0.14 +
                       texture2D(uMoonTex, mUv - vec2(0.0032, 0.0)).r * 0.14 +
                       texture2D(uMoonTex, mUv + vec2(0.0, 0.0032)).r * 0.14 +
                       texture2D(uMoonTex, mUv - vec2(0.0, 0.0032)).r * 0.14;

          // Directional lunar atmospheric glow: biased strictly toward the LIT side of the Moon
          float dirBias = clamp(0.55 + 0.45 * dot(mLocal / (mr + 0.28), phaseDir2D) * sin(phaseAng) + 0.42 * cos(phaseAng), 0.10, 1.0) * smoothstep(-0.02, 0.02, rd.y);
          if (nightFactor > 0.02 || isBlood > 0.1) {
            vec3 outerGlow = mix(vec3(0.42, 0.48, 0.62), vec3(0.74, 0.20, 0.28), isBlood);
            vec3 midGlow   = mix(vec3(0.86, 0.80, 0.68), vec3(0.92, 0.34, 0.30), isBlood);
            vec3 innerLimb = mix(vec3(1.00, 0.98, 0.92), vec3(1.00, 0.48, 0.38), isBlood);
            float haloVis = max(nightFactor, isBlood * 0.75) * (0.25 + 0.75 * effPhase) * dirBias * (0.60 + 0.35 * mBright) * (0.28 + 0.72 * cloudTransOverSun);
            float limbDist = max(0.0, mAng - rMoon * 0.92);
            col += outerGlow * exp(-mAng / (rMoon * 4.5)) * 0.22 * haloVis;
            col += midGlow   * exp(-mAng / (rMoon * 1.9)) * 0.38 * haloVis;
            col += innerLimb * exp(-limbDist / (rMoon * 0.42)) * 0.52 * haloVis * (1.0 - moonDiskMask * 0.65);
          }

          outMoonGlow = (exp(-mAng / (rMoon * 3.8)) * 0.75 + exp(-mAng / (rMoon * 1.4)) * 0.85) * (0.25 + 0.75 * effPhase) * dirBias * max(nightFactor * 1.15, max(isBlood * 0.80, dayFactor * 0.15)) * (0.65 + 0.35 * mBright);

          if (mr2 < 1.03 && rd.y > -0.02) {
            float mz = sqrt(max(0.001, 1.0 - min(1.0, mr2)));

            vec3 nSphere = normalize(vec3(mLocal.x, mLocal.y, mz));
            float ndotlSmooth = dot(nSphere, lightVec);
            float microRelief = (texC - 0.42) * 0.08 * (1.0 - smoothstep(0.92, 1.0, effPhase));

            // Astronomical Lommel-Seeliger + Seeliger opposition surge reflectance (Full Moon is uniformly radiant right to the limb, like real night photos!)
            float termMask = smoothstep(-0.06, 0.10, ndotlSmooth + microRelief);
            float posNl    = max(0.0, ndotlSmooth);
            float lommel   = posNl / (posNl + 0.22 * mz + 0.03);
            float oppSurge = smoothstep(0.82, 1.00, effPhase);
            float flatFull = 0.92 + 0.08 * pow(mz, 0.15);
            float sphereShade = mix(lommel, flatFull, oppSurge * 0.82) * termMask;

            // Authentic lunar surface contrast: luminous pearl-white highlands & soft silver-grey basaltic maria
            float mariaNorm   = smoothstep(0.08, 0.72, texC);
            float lunarAlbedo = mix(0.62, 1.00, pow(mariaNorm, 0.88));

            if (eclipseTotality > 0.05) {
              vec3 eclipseMoonBody = vec3(0.012, 0.020, 0.045) + vec3(0.030, 0.045, 0.080) * lunarAlbedo;
              col = mix(col, eclipseMoonBody, moonDiskMask * cloudTransOverSun);
            } else if (isBlood > 0.1) {
              float umbraGrad = clamp(0.58 + 0.38 * (mLocal.x * 0.65 + mLocal.y * 0.75), 0.18, 1.05);
              float tBlood = clamp((0.25 + 0.75 * mariaNorm) * umbraGrad, 0.0, 1.0);
              vec3 cMariaPlum = vec3(0.34, 0.10, 0.22);
              vec3 cMidRose   = vec3(0.82, 0.24, 0.30);
              vec3 cHighCoral = vec3(1.00, 0.54, 0.38);
              vec3 bloodMoonCol = ((tBlood < 0.48)
                ? mix(cMariaPlum, cMidRose, tBlood / 0.48)
                : mix(cMidRose, cHighCoral, (tBlood - 0.48) / 0.52)) * clamp(0.65 + 0.35 * mBright, 0.4, 1.5);
              col = mix(col, clamp(bloodMoonCol, 0.0, 1.0), moonDiskMask * cloudTransOverSun);
            } else {
              // 1) DAYTIME MOON: Purely additive / screen-blended over the foreground blue daytime sky!
              float dayRad = lunarAlbedo * sphereShade * 0.85 * clamp(0.60 + 0.32 * mBright, 0.35, 1.45);
              vec3 dayTint = mix(vec3(0.95, 0.97, 1.00), vec3(1.00, 0.90, 0.76), sunsetFactor * 0.65);
              vec3 dayMoonFinal = 1.0 - (1.0 - col) * exp(-dayTint * (dayRad * moonDiskMask * cloudTransOverSun));

              // 2) NIGHTTIME MOON: Radiant pearl-white highlands & delicate silver maria (matches reference photos 40c381, 40c39f, 40c3df!)
              float nightBoost = clamp(0.85 + 0.35 * mBright, 0.65, 1.85);
              vec3 mareSilver    = vec3(0.66, 0.70, 0.76);
              vec3 highlandPearl = vec3(1.00, 0.99, 0.95);
              vec3 baseMoonCol   = mix(mareSilver, highlandPearl, pow(mariaNorm, 0.85));
              vec3 litNightMoon  = clamp(baseMoonCol * sphereShade * nightBoost, 0.0, 1.0);

              // When thin clouds cross in front of the Moon at night, the Moon shines through with a soft pearl bloom
              float thinCloudVeil = (1.0 - cloudTransOverSun) * smoothstep(0.05, 0.65, cloudTransOverSun);
              litNightMoon = mix(litNightMoon, vec3(1.00, 0.98, 0.92), thinCloudVeil * 0.55 * sphereShade);

              // Unlit side at night: virtually invisible, blending seamlessly into the night sky
              float earthshineAmt = 0.008 * (1.0 - effPhase) * lunarAlbedo * pow(mz, 0.5);
              vec3 unlitNightMoon = col + vec3(0.38, 0.48, 0.68) * earthshineAmt;
              vec3 nightMoonDisk  = mix(unlitNightMoon, max(unlitNightMoon, litNightMoon), termMask);
              float nightDiskVis  = clamp(pow(cloudTransOverSun, 0.58) * 1.12, 0.0, 1.0);
              vec3 nightMoonFinal = mix(col, nightMoonDisk, moonDiskMask * nightDiskVis);

              col = mix(nightMoonFinal, dayMoonFinal, clamp(dayFactor + sunsetFactor * 0.5, 0.0, 1.0));
            }
          }
        }

        return col;
      }

      // ============================================================================
      // 3. CONTINUOUS BERNSTEIN-BEER-LAMBERT VOLUMETRIC CLOUD COLOR ENGINE
      // C-infinity smooth color transition (ZERO piecewise smoothstep plateaus or contour rings!)
      // ============================================================================
      vec3 computeUnifiedCloudColor(
        vec3 skyBg, float slopeLit, float detailBump, float tau, float shadowWeight,
        float sunDot, float sunBeamHit, float moonProx, float moonDist, float sy,
        float dayFactor, float sunsetFactor, float nightFactor, float isBlood
      ) {
        float effTau = tau * (0.45 + 1.12 * shadowWeight);
        float beerTrans = exp(-effTau * 0.78);
        float powderEffect = 1.0 - exp(-effTau * 2.40);

        float sBright = clamp(uSunBrightness, 0.25, 3.20);
        float sPower  = pow(sBright, 1.25);
        float sunForward = (pow(max(0.0, sunDot), 3.2) * 0.46 + pow(max(0.0, sunDot), 12.0) * 0.82 + pow(max(0.0, sunDot), 36.0) * 0.95) * sPower;
        float verticalBaseShade = mix(0.82, 1.04, smoothstep(0.02, 0.40, sy));

        float rawLit = (slopeLit * (0.46 + 0.54 * beerTrans) + (detailBump - 0.48) * 0.20 + powderEffect * 0.12 + sunBeamHit * 0.28 + sunForward * 0.26) * verticalBaseShade;
        float tL = clamp(mix(0.38 + 0.62 * rawLit, rawLit, clamp(shadowWeight * 1.10, 0.0, 1.0)), 0.0, 1.0);
        float oneMinusT = 1.0 - tL;

        vec3 dayLightShadow = vec3(0.74, 0.83, 0.94);
        vec3 daySoftShadow  = vec3(0.45, 0.55, 0.71);
        vec3 dayStormShadow = vec3(0.12, 0.19, 0.31);

        vec3 cDayShadow = (shadowWeight < 0.42)
          ? mix(dayLightShadow, daySoftShadow, shadowWeight / 0.42)
          : mix(daySoftShadow, dayStormShadow, clamp((shadowWeight - 0.42) / 0.58, 0.0, 1.0));

        vec3 cDayMid = mix(vec3(0.93, 0.96, 1.00), vec3(0.38, 0.48, 0.62), clamp(shadowWeight * 0.85, 0.0, 1.0));
        vec3 cDayTop = mix(vec3(1.00, 1.00, 1.00), vec3(0.96, 0.97, 0.98), clamp(shadowWeight * 0.30, 0.0, 0.30));
        cDayTop = mix(cDayTop, vec3(1.00, 0.98, 0.92), clamp(sunForward * 0.45, 0.0, 0.80));

        vec3 colDay = (oneMinusT * oneMinusT) * cDayShadow + (2.0 * oneMinusT * tL) * cDayMid + (tL * tL) * cDayTop;

        vec3 cSunShadow = mix(vec3(0.38, 0.42, 0.62), vec3(0.12, 0.17, 0.30), clamp(shadowWeight * 0.90, 0.0, 1.0));
        vec3 cSunMid    = vec3(0.98, 0.46, 0.18);
        vec3 cSunTop    = vec3(1.00, 0.88, 0.48);
        float tS = clamp(tL * 0.84 + sunForward * 0.28 + (1.0 - sy) * 0.12, 0.0, 1.0);
        float oms = 1.0 - tS;
        vec3 colSunset = (oms * oms) * cSunShadow + (2.0 * oms * tS) * cSunMid + (tS * tS) * cSunTop;

        // Strictly gated by uShowMoon so moonless night has ZERO phantom light spots!
        float moonActiveMask  = uShowMoon * (0.20 + 0.80 * uMoonPhase) * clamp(0.65 + 0.35 * uMoonBrightness, 0.3, 1.8);
        float lunarCoronaRim  = exp(-moonDist * 5.2) * moonActiveMask;
        float lunarCoronaMid  = exp(-moonDist * 2.2) * moonActiveMask;
        float lunarCoronaWide = exp(-moonDist * 0.90) * moonActiveMask;

        // Thin cloud edges transmit moonlight (silver/warm golden rim), while thick cloud centers block moonlight in dark silhouette!
        float edgeTrans  = exp(-effTau * 1.15);
        float rimScatter = edgeTrans * (1.0 - exp(-effTau * 2.5)) * 1.55 + edgeTrans * 0.35;

        // Moonless / far-from-moon night cloud silhouette: deep midnight slate (never glowing white in the dark!)
        vec3 nightDarkCore    = mix(vec3(0.018, 0.028, 0.048), vec3(0.007, 0.011, 0.022), clamp(shadowWeight * 0.90, 0.0, 1.0));
        vec3 nightStarlitEdge = mix(vec3(0.036, 0.052, 0.086), vec3(0.018, 0.026, 0.044), clamp(shadowWeight * 0.85, 0.0, 1.0));
        vec3 baseNightCloud   = mix(nightDarkCore, nightStarlitEdge, clamp(tL * 0.50 + edgeTrans * 0.50, 0.0, 1.0));

        // Warm golden-amber aureole & bright pearl-silver rim around the Moon (matches reference photos 40c381 & 40c3df!)
        vec3 warmAureoleCol = vec3(0.78, 0.64, 0.48);
        vec3 pearlRimCol    = vec3(0.98, 0.96, 0.90);
        float aureoleAmt    = clamp((lunarCoronaMid * 0.88 + lunarCoronaWide * 0.24) * (rimScatter * 0.72 + tL * 0.28), 0.0, 1.0);
        float brightRimAmt  = clamp((lunarCoronaRim * 1.55 + lunarCoronaMid * 0.45) * (edgeTrans * 0.80 + tL * 0.20), 0.0, 1.0);

        vec3 colNight = mix(baseNightCloud, warmAureoleCol, aureoleAmt * 0.78);
        colNight = mix(colNight, pearlRimCol, brightRimAmt);

        if (isBlood > 0.1) {
          vec3 bloodDark = mix(vec3(0.18, 0.11, 0.18), vec3(0.05, 0.04, 0.10), shadowWeight);
          vec3 bloodMid  = vec3(0.72, 0.26, 0.22);
          vec3 bloodRim  = vec3(0.98, 0.54, 0.34);
          float bLit = clamp(tL * 0.75 + 0.25, 0.0, 1.0);
          float omb = 1.0 - bLit;
          colNight = (omb * omb) * bloodDark + (2.0 * omb * bLit) * bloodMid + (bLit * bLit) * bloodRim;
        }

        vec3 dayOrSunset = mix(colDay, colSunset, sunsetFactor);
        vec3 finalCloud = mix(colNight, dayOrSunset, clamp(dayFactor + sunsetFactor * 0.88, 0.0, 1.0));

        float horizonAerial = (1.0 - smoothstep(0.02, 0.24, sy)) * 0.32;
        return mix(finalCloud, skyBg * 0.92 + vec3(0.08) * dayFactor, horizonAerial);
      }

      // ============================================================================
      // 4. REALISTIC COMPACT AIRCRAFT & 3 DISTINCT CONTRAIL REGIMES:
      // - pAlt = 0.0 (11.2 km): Persistent spreading Cirrus homogenitus plume with lacunosus gaps
      // - pAlt = 1.0 (7.8 km):  Twin-vortex Crow-instability ribbons pinching into periodic puffs
      // - pAlt = 2.0 (4.2 km):  Short evaporating condensation tail (sublimates behind the engines!)
      // - Nocturnal/Eclipse aircraft body is a subtle dark silhouette with crisp navigation strobes!
      // ============================================================================
      vec3 evalSingleFlight(
        vec3 baseCol, vec2 qSky, vec2 qCloud, vec2 windVel, float horFade, float sy,
        vec2 pStart, vec2 pDir, float pDist, float pType, float pAlt, float seed,
        float dayFactor, float sunsetFactor, float nightFactor, float isBlood,
        float sunDot, float moonProx, float drawJet
      ) {
        vec3 col = baseCol;
        vec2 f = normalize(pDir);
        vec2 r = vec2(-f.y, f.x);

        vec2 dRaw = qSky - pStart;
        float xSkyRaw = dot(dRaw, f);

        float isJumbo = (pType > 0.5 && pType < 1.5) ? 1.0 : 0.0;
        float isSuper = (pType > 1.5) ? 1.0 : 0.0;

        float altScale = (pAlt < 0.5) ? 0.78 : ((pAlt < 1.5) ? 0.98 : 1.22);
        float perspJet = mix(0.62, 1.0, smoothstep(0.04, 0.45, sy));
        float baseL    = (isJumbo > 0.5) ? 0.029 : ((isSuper > 0.5) ? 0.025 : 0.022);
        float L        = baseL * altScale * perspJet;

        // 3 ORGANIC CONTRAIL REGIMES:
        // pAlt < 0.5 (11.2 km): Persistent wind-sheared Cirrus homogenitus plume with leeward fall-streaks
        // 0.5 <= pAlt < 1.5 (7.8 km): Fluffy rolled-up vortex cord with irregular turbulent knots (zero periodic sine sausages, zero centerline crack!)
        // pAlt >= 1.5 (4.2 km): Short rapidly sublimating condensation tail behind the engines
        float maxAge = (pAlt < 0.5) ? (2.35 * uTrailLife)
                     : ((pAlt < 1.5) ? (1.45 * uTrailLife) : (0.48 * uTrailLife));

        float xExhaust = pDist - ((isSuper > 0.5) ? 0.92 * L : 0.52 * L);
        float age = max(0.0, xExhaust - xSkyRaw);

        vec2 windCarry = windVel * (age * 13.5);
        vec2 dAdv = (qSky - windCarry) - pStart;
        float xSky = dot(dAdv, f);
        float wSky = dot(dAdv, r);
        float aw = abs(wSky);

        float typeSpreadMult = (isJumbo > 0.5) ? 1.25 : ((isSuper > 0.5) ? 0.95 : 1.00);
        float maxHalfW = 0.26 * uTrailSpread * typeSpreadMult;

        vec3 cShadowDay = mix(vec3(0.75, 0.85, 0.97), vec3(0.32, 0.42, 0.58), uCloudDarkness * 0.65);
        vec3 cLitDay    = mix(vec3(1.00, 1.00, 1.00), vec3(0.90, 0.94, 0.99), uCloudDarkness * 0.40);

        vec3 cShadowSun = vec3(0.34, 0.26, 0.46);
        vec3 cLitSun    = mix(vec3(0.98, 0.54, 0.24), vec3(1.00, 0.82, 0.44), pow(max(0.0, sunDot), 2.0));

        float lunarLit  = clamp(uShowMoon * moonProx * 1.15, 0.0, 1.0);
        vec3 cShadowNgt = vec3(0.015, 0.025, 0.048) + vec3(0.18, 0.22, 0.32) * lunarLit;
        vec3 cLitNgt    = vec3(0.030, 0.045, 0.080) + vec3(0.78, 0.82, 0.90) * lunarLit;

        if (isBlood > 0.1) {
          cShadowNgt = mix(cShadowNgt, vec3(0.16, 0.08, 0.15), isBlood);
          cLitNgt    = mix(cLitNgt,    vec3(0.84, 0.36, 0.28), isBlood);
        }

        vec3 cShadow = mix(mix(cShadowNgt, cShadowDay, dayFactor), cShadowSun, sunsetFactor);
        vec3 cLit    = mix(mix(cLitNgt,    cLitDay,    dayFactor), cLitSun,    sunsetFactor);
        float nightTrailOpac = 0.08 + 0.72 * clamp(uShowMoon * (0.25 + 0.75 * lunarLit), 0.0, 1.0);
        float opac   = mix(mix(nightTrailOpac, 0.86, dayFactor), 0.84, sunsetFactor);

        if (xSky > 0.0 && age > 0.0 && age < maxAge && aw < maxHalfW) {
          float normAge = clamp(age / maxAge, 0.0, 1.0);
          // Realistic thermal condensation gap right behind the hot jet exhaust nozzles
          float coolingGap = smoothstep(0.0004, 0.0045, age);
          float horizonOnset = smoothstep(0.0, 0.18, xSky) * coolingGap;

          // Straight aerodynamic flight path! Only very gentle macro wind drift at the far old tail (normAge > 0.35)
          float farDrift = (fbm3(vec2(xSky * 3.2 + seed, seed * 1.7), 0.50) - 0.5) * 0.010 * pow(normAge, 1.65) * uTrailSpread;
          float wCentered = wSky + farDrift;

          // Multi-scale cotton-billow & feathery ice-crystal turbulence (modulates width & internal fluffiness, NOT centerline wiggle!)
          float puffMacro = fbmBillow3(vec2(xSky * 18.0 + seed * 1.3, wCentered * 26.0 + seed * 2.1), 0.54);
          float puffFine  = fbmBillow3(vec2(xSky * 42.0 + seed * 3.7, wCentered * 52.0 - seed * 1.9), 0.54);
          float wispEdge  = fbm3(vec2(xSky * 28.0 - seed * 2.3, wCentered * 68.0 + seed * 4.1), 0.55);
          float puffs     = puffMacro * 0.52 + puffFine * 0.30 + wispEdge * 0.18;

          // Twin-engine wake separation right behind the wings (smoothly merges into a single cylindrical vortex plume)
          float engineSpan = (isJumbo > 0.5) ? (0.24 * L) : ((isSuper > 0.5) ? (0.07 * L) : (0.18 * L));
          float wakeSplit  = engineSpan * exp(-normAge * 16.0);
          float dStream    = abs(abs(wCentered) - wakeSplit);

          // Progressive turbulent width expansion (width breathes organically with puffMacro)
          float baseSpread = (pAlt >= 1.5) ? (0.0014 + 0.0045 * pow(normAge, 0.70))
                           : ((pAlt >= 0.5) ? (0.0016 + 0.0135 * pow(normAge, 0.78) * uTrailSpread)
                                            : (0.0018 + 0.0195 * pow(normAge, 0.82) * uTrailSpread));
          float sigma = baseSpread * typeSpreadMult * (0.72 + 0.56 * puffMacro);

          // Asymmetric wind-shear fall-streaks on high-altitude Cirrus homogenitus trails (pAlt < 0.5)
          float sigmaSide = (pAlt < 0.5 && wCentered < 0.0)
            ? sigma * (1.0 + 0.85 * pow(normAge, 0.75) * (0.5 + 0.5 * wispEdge))
            : sigma;

          // Soft cylindrical Gaussian core + feathery outer ice-crystal halo (ZERO hard cutout edges!)
          float uDist   = dStream / max(0.0005, sigmaSide);
          float coreEnv = exp(-pow(uDist, 1.70));
          float haloEnv = exp(-pow(uDist * 0.52, 1.35)) * 0.42 * (0.45 + 0.55 * wispEdge);
          float radialProfile = clamp(coreEnv * (0.62 + 0.52 * puffs) + haloEnv * puffs, 0.0, 1.15);

          // Natural gradual evaporation & broken puff clusters towards the tail end
          float tailFade  = 1.0 - smoothstep(0.18, 1.00, normAge);
          float tailBreak = mix(1.0, smoothstep(0.28, 0.72, puffMacro * 0.65 + wispEdge * 0.35), smoothstep(0.25, 0.92, normAge));
          float rawAlpha  = clamp(radialProfile * tailFade * tailBreak * horizonOnset, 0.0, 1.0) * horFade;

          // 3D cylindrical self-shadowing across the contrail tube + billow highlights
          float cylNormal = clamp((wCentered / max(0.0015, sigmaSide * 1.4)) * 0.28, -0.35, 0.35);
          float shade     = clamp(0.62 + cylNormal + (puffs - 0.48) * 0.38, 0.0, 1.0);
          vec3 trailCol   = mix(cShadow, cLit, smoothstep(0.10, 0.90, shade));
          col = mix(col, trailCol, rawAlpha * opac);
        }

        if (drawJet > 0.5) {
          float wP = dot(dRaw, r);
          float awP = abs(wP);
          float sPlane = pDist - xSkyRaw;

          if (sPlane > -0.08 * L && sPlane < 1.15 * L && awP < 0.70 * L) {
            float dPlane = 1.0;
            float wingSpan = 0.48 * L;

            if (isJumbo > 0.5) {
              wingSpan = 0.55 * L;
              float noseTaper = smoothstep(0.0, 0.18 * L, sPlane);
              float tailTaper = 1.0 - 0.72 * smoothstep(0.72 * L, 1.0 * L, sPlane);
              float humpBoost = 1.0 + 0.22 * exp(-pow((sPlane - 0.22 * L) / (0.12 * L), 2.0));
              float rFuse = 0.082 * L * noseTaper * tailTaper * humpBoost;
              float dFuse = max(awP - rFuse, max(-sPlane, sPlane - L));

              float wClamp = clamp(awP, 0.0, wingSpan);
              float sLe = 0.25 * L + 0.64 * wClamp;
              float chord = mix(0.21 * L, 0.048 * L, wClamp / wingSpan);
              float dWing = max(max(sLe - sPlane, sPlane - (sLe + chord)), awP - wingSpan);

              float tailSpan = 0.21 * L;
              float wtClamp = clamp(awP, 0.0, tailSpan);
              float stLe = 0.80 * L + 0.58 * wtClamp;
              float tChord = mix(0.10 * L, 0.035 * L, wtClamp / tailSpan);
              float dTail = max(max(stLe - sPlane, sPlane - (stLe + tChord)), awP - tailSpan);

              float dEng1 = max(abs(awP - 0.16 * L) - 0.026 * L, abs(sPlane - 0.36 * L) - 0.055 * L);
              float dEng2 = max(abs(awP - 0.35 * L) - 0.024 * L, abs(sPlane - 0.48 * L) - 0.050 * L);
              dPlane = min(min(dFuse, dWing), min(dTail, min(dEng1, dEng2)));

            } else if (isSuper > 0.5) {
              wingSpan = 0.40 * L;
              float noseCone = smoothstep(0.0, 0.32 * L, sPlane);
              float tailCone = 1.0 - 0.65 * smoothstep(0.82 * L, 1.02 * L, sPlane);
              float rFuse = 0.052 * L * noseCone * tailCone;
              float dFuse = max(awP - rFuse, max(-sPlane, sPlane - 1.02 * L));

              float wClamp = clamp(awP, 0.0, wingSpan);
              float sDeltaLe = 0.24 * L + 1.42 * wClamp;
              float sDeltaTe = 0.88 * L + 0.12 * wClamp;
              float dWing = max(max(sDeltaLe - sPlane, sPlane - sDeltaTe), awP - wingSpan);

              float canSpan = 0.14 * L;
              float wcClamp = clamp(awP, 0.0, canSpan);
              float dCanard = max(max((0.16 * L + 0.8 * wcClamp) - sPlane, sPlane - (0.24 * L + 0.4 * wcClamp)), awP - canSpan);
              dPlane = min(dFuse, min(dWing, dCanard));

              float dNoz = length(vec2(sPlane - 0.98 * L, awP - 0.04 * L)) / L;
              float abGlow = exp(-dNoz * 18.0) * smoothstep(0.0, 0.18, pDist) * horFade;
              col += vec3(1.0, 0.62, 0.24) * abGlow * 0.85;

            } else {
              wingSpan = 0.48 * L;
              float noseTaper = smoothstep(0.0, 0.20 * L, sPlane);
              float tailTaper = 1.0 - 0.70 * smoothstep(0.70 * L, 1.0 * L, sPlane);
              float rFuse = 0.072 * L * noseTaper * tailTaper;
              float dFuse = max(awP - rFuse, max(-sPlane, sPlane - L));

              float wClamp = clamp(awP, 0.0, wingSpan);
              float sLe = 0.28 * L + 0.62 * wClamp;
              float chord = mix(0.18 * L, 0.04 * L, wClamp / wingSpan);
              float dWing = max(max(sLe - sPlane, sPlane - (sLe + chord)), awP - wingSpan);

              float tailSpan = 0.18 * L;
              float wtClamp = clamp(awP, 0.0, tailSpan);
              float stLe = 0.80 * L + 0.58 * wtClamp;
              float tChord = mix(0.09 * L, 0.03 * L, wtClamp / tailSpan);
              float dTail = max(max(stLe - sPlane, sPlane - (stLe + tChord)), awP - tailSpan);

              float dEng = max(abs(awP - 0.19 * L) - 0.025 * L, abs(sPlane - 0.40 * L) - 0.05 * L);
              dPlane = min(min(dFuse, dWing), min(dTail, dEng));
            }

            float planeMask = (1.0 - smoothstep(-0.00045, 0.00045, dPlane)) * horFade * smoothstep(0.0, 0.18, pDist);
            float planeShade = clamp(0.72 - (wP / (0.15 * L)) * 0.24, 0.0, 1.0);

            vec3 pDay    = mix(vec3(0.74, 0.84, 0.95), vec3(0.98, 0.99, 1.00), planeShade);
            vec3 pSunset = mix(vec3(0.14, 0.13, 0.22), vec3(0.92, 0.52, 0.26), pow(planeShade, 2.2) * 0.65);
            vec3 pNight  = mix(col * 0.88, vec3(0.04, 0.05, 0.09) + vec3(0.22, 0.26, 0.34) * lunarLit, 0.45);
            vec3 planeCol = mix(mix(pNight, pDay, dayFactor), pSunset, sunsetFactor);
            float bodyVis = mix(mix(0.35 + 0.25 * lunarLit, 0.88, dayFactor), 0.78, sunsetFactor);
            col = mix(col, planeCol, planeMask * bodyVis);

            float navVis = clamp(nightFactor + sunsetFactor * 0.75 + isBlood * 0.85, 0.0, 1.0) * horFade * smoothstep(0.0, 0.18, pDist);
            if (navVis > 0.05) {
              float tipX = (isSuper > 0.5) ? 0.82 * L : 0.58 * L;
              vec2 portTip = vec2(tipX, -wingSpan * 0.95);
              vec2 stbdTip = vec2(tipX,  wingSpan * 0.95);
              vec2 tailTip = vec2(0.96 * L,  0.0);
              vec2 fuseMid = vec2(0.44 * L,  0.0);
              vec2 pLocal  = vec2(sPlane, wP);

              float dPort  = length(pLocal - portTip) / L;
              float dStbd  = length(pLocal - stbdTip) / L;
              float dTailL = length(pLocal - tailTip) / L;
              float dBeac  = length(pLocal - fuseMid) / L;

              float strobePulse = pow(max(0.0, sin(uTime * 18.0 + seed)), 16.0);
              float beaconPulse = pow(max(0.0, sin(uTime * 9.5 + seed * 2.0)), 10.0);

              vec3 navGlow = vec3(0.0);
              navGlow += vec3(1.0, 0.16, 0.10) * exp(-dPort * 28.0) * 1.1;
              navGlow += vec3(0.10, 1.0, 0.36) * exp(-dStbd * 28.0) * 1.1;
              navGlow += vec3(1.0, 0.98, 0.90) * exp(-dTailL * 32.0) * 0.9;
              navGlow += vec3(1.0, 1.0, 1.0)   * (exp(-dPort * 20.0) + exp(-dStbd * 20.0)) * strobePulse * 1.8;
              navGlow += vec3(1.0, 0.12, 0.08) * exp(-dBeac * 22.0) * beaconPulse * 1.5;

              col += navGlow * navVis;
            }
          }
        }

        return col;
      }

      // Samples both procedural cloud optical depth AND live brush/eraser map uPaintTex at dome point pDome!
      float sampleFastCloudGap(vec2 pDome, float cRot, float sRot, float baseCovShift, float isStorm) {
        float localErase = 0.0;
        float localPaint = 0.0;
        if (uHasPaint > 0.5) {
          vec2 qSkyPt = pDome * uScale + uWindOffset;
          float r2 = dot(qSkyPt, qSkyPt);
          float syEst = clamp(1.0 / (1.0 + r2 * 0.42), 0.02, 1.0);
          float sphU = fract(atan(qSkyPt.x, qSkyPt.y) / (2.0 * PI) + 0.5 - uBrushWindU);
          float sphV = clamp(asin(syEst) / (0.5 * PI), 0.0, 1.0);
          vec4 ps = texture2D(uPaintTex, vec2(sphU, sphV));
          localErase = max(0.0, (0.5 - ps.b) * 2.0);
          localPaint = max(ps.r, max(ps.g, max(0.0, (ps.b - 0.5) * 2.0)));
        }
        mat2 patMat = mat2(cRot, sRot, -sRot, cRot);
        vec2 qP = patMat * pDome + uSeedMacro;
        float n1 = fbm3(qP * 1.15 + vec2(1.7, 2.9), 0.52);
        float n2 = fbmBillow3(qP * 2.55 + vec2(2.3, 4.1), 0.53);
        float n3 = fbmBillow3(qP * 6.80 + vec2(1.3, 3.7), 0.54);
        float fld = n1 * 0.44 + n2 * 0.38 + n3 * 0.18 + localPaint * 0.48 - localErase * (0.50 + 0.35 * (1.0 - n2));
        float thr = mix(0.47, 0.41, isStorm) - baseCovShift * 0.60;
        return clamp((fld - thr) / 0.15, 0.0, 2.0) * (1.0 - localErase * 0.88);
      }

      void main() {
        vec2 scr = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
        vec3 rd;
        if (uEquirectMode > 0.5) {
          float az = (vUv.x - 0.5) * 2.0 * PI + uCamYaw;
          float el = mix(-0.08, 0.5 * PI, vUv.y);
          rd = normalize(vec3(sin(az) * cos(el), sin(el), cos(az) * cos(el)));
        } else {
          float focal = 1.0 / tan(radians(uCamFov) * 0.5);
          vec3 fw = vec3(
            sin(uCamYaw) * cos(uCamPitch),
            sin(uCamPitch),
            cos(uCamYaw) * cos(uCamPitch)
          );
          vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
          vec3 up = cross(rt, fw);
          rd = normalize(scr.x * rt + scr.y * up + focal * fw);
        }

        float sy = clamp(rd.y, 0.0, 1.0);
        float horFade = smoothstep(-0.015, 0.09, rd.y);

        float denom = (pow(max(0.025, sy), 0.68) + 0.36) * 0.95;
        vec2 qSky = rd.xz / denom;
        vec2 qCloud = (qSky - uWindOffset) / uScale;

        float perspScale = mix(1.42, 0.92, smoothstep(0.03, 0.48, sy));
        vec2 qCloudPersp = qCloud * perspScale;

        float cRot = cos(uPatternRot), sRot = sin(uPatternRot);
        mat2 patMat = mat2(cRot, sRot, -sRot, cRot);
        vec2 q       = patMat * qCloud      + uSeedMacro;
        vec2 qB      = patMat * qCloud      + uSeedBillow;
        vec2 qF      = patMat * qCloud      + uSeedFine;
        vec2 qPersp  = patMat * qCloudPersp + uSeedMacro;
        vec2 qBPersp = patMat * qCloudPersp + uSeedBillow;
        vec2 qFPersp = patMat * qCloudPersp + uSeedFine;

        float brushCumulus    = 0.0;
        float brushCirrus     = 0.0;
        float brushMackerel   = 0.0;
        float brushErase      = 0.0;
        float brushDarkWeight = 0.0;
        if (uHasPaint > 0.5) {
          float sphU = fract(atan(rd.x, rd.z) / (2.0 * PI) + 0.5 - uBrushWindU);
          float sphV = clamp(asin(clamp(rd.y, 0.0, 1.0)) / (0.5 * PI), 0.0, 1.0);
          vec4 paintSample = sampleSmoothPaint(vec2(sphU, sphV));
          brushCumulus    = paintSample.r;
          brushCirrus     = paintSample.g;
          brushMackerel   = max(0.0, (paintSample.b - 0.5) * 2.0);
          brushErase      = max(0.0, (0.5 - paintSample.b) * 2.0);
          brushDarkWeight = paintSample.a;
        }

        float wx = (fbm3(qPersp * 2.2 + vec2(1.9, 3.4), 0.52) - 0.5) * 0.082 * uDetail;
        float wy = (fbm3(qPersp * 2.2 + vec2(5.2, 8.1), 0.52) - 0.5) * 0.082 * uDetail;

        vec3 sunDir = normalize(uSunDir);
        vec3 moonDir = normalize(uMoonDir);
        float sunDot = clamp(dot(rd, sunDir), 0.0, 1.0);
        float moonDot = clamp(dot(rd, moonDir), -1.0, 1.0);
        float moonDist = acos(moonDot);
        float sAngHere = acos(clamp(dot(rd, sunDir), -1.0, 1.0));

        float rSun = 0.038 * uCelestialScale;
        float rMoon = 0.043 * uCelestialScale;
        float sunMoonAng = acos(clamp(dot(sunDir, moonDir), -1.0, 1.0));
        float eclipseTotality = (uShowMoon > 0.5 && sunDir.y > -0.04)
          ? (1.0 - smoothstep(abs(rMoon - rSun) + 0.006, rSun + rMoon * 0.85, sunMoonAng))
          : 0.0;

        float sunY = sunDir.y;
        float isBlood = clamp(uLunarEclipse * (1.0 - smoothstep(-0.02, 0.18, sunY)), 0.0, 1.0);
        float isStorm = (uModeId > 9.5 && uModeId < 10.5) ? 1.0 : 0.0;
        float stormAtmosphere = clamp(max(isStorm * 0.72, (uCloudDarkness - 0.62) * 1.35), 0.0, 0.80);

        float dayFactor    = smoothstep(-0.02, 0.22, sunY) * (1.0 - eclipseTotality * 0.88);
        float sunsetFactor = smoothstep(-0.10, 0.04, sunY) * (1.0 - smoothstep(0.05, 0.26, sunY));
        float nightFactor  = max(eclipseTotality * 0.85, 1.0 - smoothstep(-0.10, 0.02, sunY));

        float moonProx = (exp(-moonDist * 2.6) * 0.95 + exp(-moonDist * 0.9) * 0.18) * uShowMoon * (0.25 + 0.75 * uMoonPhase) * clamp(0.65 + 0.35 * uMoonBrightness, 0.3, 1.8);

        vec2 toSun2D  = normalize(sunDir.xz - rd.xz * 0.35 + vec2(0.0001)) * 0.055;
        vec2 toMoon2D = normalize(moonDir.xz - rd.xz * 0.35 + vec2(0.0001)) * 0.055;
        vec2 lightStep2D = mix(toMoon2D, toSun2D, clamp(dayFactor + sunsetFactor, 0.0, 1.0));

        float fineErode = (brushErase > 0.005) ? fbm3(qFPersp * 6.5, 0.53) : 0.5;
        float erodeSpray = clamp(brushErase * (1.18 - 0.42 * fineErode), 0.0, 1.0);
        float thermalWave = (sin(uEvoTime * 0.35 + q.x * 1.6) * cos(uEvoTime * 0.30 + q.y * 1.6)) * 0.025 * uThermals;
        float highCovBoost = pow(clamp((uCoverage - 0.55) / 0.45, 0.0, 1.0), 1.35) * 0.26;
        float baseCovShift = (uCoverage - 0.50) * 0.52 + highCovBoost + thermalWave;
        float covShift     = baseCovShift - erodeSpray * 0.16;

        float sunDenom = (pow(max(0.025, sunDir.y), 0.68) + 0.36) * 0.95;
        vec2 qSunDome = (sunDir.xz / sunDenom - uWindOffset) / uScale;
        float moonDenom = (pow(max(0.025, moonDir.y), 0.68) + 0.36) * 0.95;
        vec2 qMoonDome = (moonDir.xz / moonDenom - uWindOffset) / uScale;

        float sunCenterTau = sampleFastCloudGap(qSunDome, cRot, sRot, baseCovShift, isStorm);
        float sunWindowOpen = clamp(exp(-sunCenterTau * 1.2), 0.15, 1.0);

        float sBright = clamp(uSunBrightness, 0.25, 3.20);
        float sPower  = pow(sBright, 1.25);
        float sunZoneClear = (pow(sunDot, 2.5) * 0.65 + pow(sunDot, 7.0) * 0.35) * sunWindowOpen * clamp(sBright, 0.4, 2.20);
        float localStormDim = stormAtmosphere * (1.0 - 0.82 * sunZoneClear * dayFactor);

        vec3 skyDayTop = mix(vec3(0.03, 0.28, 0.76), vec3(0.09, 0.16, 0.29), localStormDim);
        vec3 skyDayHor = mix(vec3(0.46, 0.75, 0.97), vec3(0.28, 0.38, 0.50), localStormDim);

        vec3 skySunTop = vec3(0.12, 0.18, 0.44);
        vec3 skySunHor = vec3(0.98, 0.50, 0.18);
        vec3 skyNgtTop = mix(vec3(0.006, 0.012, 0.032), vec3(0.08, 0.12, 0.20), isBlood);
        vec3 skyNgtHor = mix(vec3(0.025, 0.052, 0.115), vec3(0.18, 0.14, 0.22), isBlood);

        vec3 baseTop = mix(skyNgtTop, mix(skyDayTop, skySunTop, sunsetFactor), clamp(dayFactor + sunsetFactor * 0.75, 0.0, 1.0));
        vec3 baseHor = mix(skyNgtHor, mix(skyDayHor, skySunHor, sunsetFactor), clamp(dayFactor + sunsetFactor * 0.90, 0.0, 1.0));
        if (eclipseTotality > 0.05) {
          vec3 eclHor = mix(vec3(0.85, 0.42, 0.18), vec3(0.10, 0.16, 0.34), smoothstep(0.0, 0.25, sy));
          baseTop = mix(baseTop, vec3(0.015, 0.035, 0.11), eclipseTotality);
          baseHor = mix(baseHor, eclHor, eclipseTotality);
        }
        vec3 sky = mix(baseHor, baseTop, pow(sy, 0.56));
        // Responsive atmospheric Rayleigh-Mie solar aureole around the Sun
        vec3 sunWindowMie = mix(vec3(1.00, 0.62, 0.28), vec3(0.92, 0.97, 1.00), smoothstep(0.0, 0.28, sunY));
        sky += sunWindowMie * (pow(sunDot, 3.8) * 0.20 + pow(sunDot, 12.0) * 0.36) * sPower * (0.38 + 0.62 * sunWindowOpen) * clamp(dayFactor + sunsetFactor, 0.0, 1.0) * (1.0 - eclipseTotality);

        float crepuscularBeam = 0.0;
        float crepuscularShadow = 0.0;
        float sunBeamHitCloud = pow(max(0.0, sunDot), 2.8) * 0.52 * (0.35 + 0.65 * sunWindowOpen) * sPower * clamp(dayFactor + sunsetFactor, 0.0, 1.0);

        // ============================================================================
        // FIXED-SHELL OUTWARD SOLAR CREPUSCULAR RAYS (Strictly Solar ONLY — ZERO Lunar Rays!)
        // Every cloud shell at fixed distance R_m from the Sun casts outward shadow lanes & shafts
        // ONLY onto pixels behind that shell (distFromSun > R_m) and ONLY where clouds actually exist!
        // ============================================================================
        if (uShowSunRays > 0.5 && sunDir.y > -0.04 && (dayFactor > 0.01 || sunsetFactor > 0.01) && (uCoverage > 0.01 || uHasPaint > 0.5)) {
          vec2 dFromSun = qCloud - qSunDome;
          float distFromSun = length(dFromSun) + 0.0001;
          vec2 dirFromSun = dFromSun / distFromSun;
          vec2 perpDir = vec2(-dirFromSun.y, dirFromSun.x);

          float transBehind = 0.0;
          float occBehind   = 0.0;
          float activeW     = 0.0001;

          for (int m = 0; m < 7; m++) {
            float fm = float(m);
            float R_m = 0.038 + fm * 0.042;
            float w_m = 0.22 - fm * 0.022;
            float behind = smoothstep(R_m - 0.01, R_m + 0.035, distFromSun);
            vec2 pShell = qSunDome + dirFromSun * R_m;

            float tau_m = sampleFastCloudGap(pShell, cRot, sRot, baseCovShift, isStorm);
            float tau_s1 = sampleFastCloudGap(pShell + perpDir * (R_m * 0.24), cRot, sRot, baseCovShift, isStorm);
            float tau_s2 = sampleFastCloudGap(pShell - perpDir * (R_m * 0.24), cRot, sRot, baseCovShift, isStorm);
            float nearCloudM = smoothstep(0.04, 0.42, max(tau_m, max(tau_s1, tau_s2)));

            float tr_m = exp(-tau_m * 2.5);
            float oc_m = 1.0 - tr_m;

            float effW = w_m * behind;
            transBehind += (tr_m * nearCloudM) * effW;
            occBehind   += oc_m * effW;
            activeW     += effW;
          }

          float normTrans = transBehind / activeW;
          float normOcc   = occBehind / activeW;

          float coreFade = smoothstep(rSun * 0.60, rSun * 1.55, sAngHere);
          float radialDecay = pow(max(0.0, sunDot), 1.45) * exp(-sAngHere * 1.45) * coreFade * horFade;

          crepuscularBeam   = clamp(pow(clamp(normTrans * 1.38, 0.0, 1.0), 1.35) * radialDecay * clamp(sPower, 0.4, 2.40) * (1.0 - eclipseTotality), 0.0, 1.0);
          crepuscularShadow = clamp(pow(clamp(normOcc * 1.25, 0.0, 1.0), 1.20)   * radialDecay * (1.0 - eclipseTotality), 0.0, 0.48);
          sunBeamHitCloud   = clamp(sunBeamHitCloud + crepuscularBeam * 0.62, 0.0, 1.0);
        }

        // Darken background sky inside outward cloud shadow lanes so sunlit shafts stand out with natural 3D depth!
        sky *= (1.0 - crepuscularShadow * 0.30);

        // ============================================================================
        // SMOOTH SYNOPTIC LIGHT <-> DARK WAVE (Zero sharp ridges, zero contour rings!)
        // ============================================================================
        float effDarkRatio = (isStorm > 0.5)
          ? mix(0.45, 0.96, uCloudDarkness)
          : uCloudDarkness;
        float synWave1 = fbm3(q * 0.38 + vec2(4.3, 7.1), 0.50);
        float synWave2 = fbm3(q * 0.82 + vec2(1.9, 3.4), 0.51);
        float synopticRank = clamp((synWave1 * 0.65 + synWave2 * 0.35 - 0.22) / 0.56, 0.0, 1.0);
        float synCutoff = mix(1.22, -0.22, effDarkRatio);
        // Wide +/- 0.32 transition so light & dark cloud masses grade smoothly without cutting any cloud in half!
        float darkMassMask = smoothstep(synCutoff - 0.32, synCutoff + 0.32, synopticRank);

        // ============================================================================
        // EVALUATE ALL 16 CLOUD VARIETIES (Modes 0..15)
        // ============================================================================
        float cloudDens    = 0.0;
        float cloudTau     = 0.0;
        float shadowWeight = 0.0;
        float slopeLit     = 0.65;
        float detailBump   = 0.60;
        float edgeSoftness = 0.75;

        // Upper Cirrus Veil layer for 2-layer modes (Mode 4 "Облако в дымке", Mode 12, Mode 14)
        float upperVeilDens = 0.0;
        float upperVeilTau  = 0.0;
        float upperVeilBump = 0.50;

        vec2 warp1 = vec2(
          fbm3(qPersp * 1.85 + vec2(1.3, 4.7), 0.52) - 0.5,
          fbm3(qPersp * 1.85 + vec2(8.2, 2.9), 0.52) - 0.5
        ) * (0.095 * uDetail);
        vec2 qW  = qPersp + warp1 + vec2(wx, wy);
        vec2 qBW = qBPersp + warp1 * 1.15 + vec2(wx, wy);

        float fieldVal = 0.0;
        float threshVal = 0.40;
        float spanVal = 0.22;

        if (uModeId < 0.5) {
          float streak, veil;
          evalClassicSilkyCirrus(q, qB, qF, streak, veil);
          float streakS, veilS;
          evalClassicSilkyCirrus(q + lightStep2D * 0.55, qB + lightStep2D * 0.55, qF, streakS, veilS);
          fieldVal     = streak * 0.74 + veil * 0.26;
          threshVal    = 0.34 - covShift * 0.54;
          spanVal      = 0.28;
          shadowWeight = 0.06;
          slopeLit     = clamp((streak - streakS) * 2.8 + 0.64, 0.0, 1.0);
          detailBump   = streak;
          edgeSoftness = 0.36;

        } else if (uModeId < 1.5) {
          float fibers, hookCore;
          evalUncinusPlumes(q, qB, qF, fibers, hookCore);
          float fibS, hookS;
          evalUncinusPlumes(q + lightStep2D * 0.55, qB + lightStep2D * 0.55, qF, fibS, hookS);
          fieldVal     = fibers * 0.72 + hookCore * 0.28;
          threshVal    = 0.33 - covShift * 0.52;
          spanVal      = 0.26;
          shadowWeight = 0.08;
          slopeLit     = clamp((fibers - fibS) * 2.8 + 0.62, 0.0, 1.0);
          detailBump   = fibers * 0.70 + hookCore * 0.30;
          edgeSoftness = 0.38;

        } else if (uModeId < 2.5) {
          float ribs, spine;
          evalVertebratusCirrus(q, qB, qF, ribs, spine);
          float ribsS, spineS;
          evalVertebratusCirrus(q + lightStep2D * 0.55, qB + lightStep2D * 0.55, qF, ribsS, spineS);
          fieldVal     = ribs * 0.64 + spine * 0.36;
          threshVal    = 0.30 - covShift * 0.54;
          spanVal      = 0.25;
          shadowWeight = 0.12 + 0.22 * spine;
          slopeLit     = clamp(((spine - spineS) * 0.60 + (ribs - ribsS) * 0.40) * 3.0 + 0.60, 0.0, 1.0);
          detailBump   = ribs;
          edgeSoftness = 0.45;

        } else if (uModeId < 3.5) {
          float scaleVar = 1.15 + 0.15 * sin(uPatternVariant * 6.28);
          float macro  = fbm6(qPersp * scaleVar * 0.90 + vec2(1.8, 0.7), 0.51);
          float domes  = fbmBillow5(qW * scaleVar * 1.95 + vec2(3.1, 1.9), 0.53);
          float puffs  = fbmBillow5(qBW * scaleVar * 4.10 + vec2(1.4, 5.2), 0.54);
          float fringe = fbm6((qFPersp + warp1 * 1.5) * 8.80 + vec2(2.2, 3.7), 0.53);

          fieldVal     = macro * 0.40 + domes * 0.32 + puffs * 0.18 + fringe * 0.10;
          threshVal    = 0.46 - covShift * 0.64;
          spanVal      = 0.19;
          shadowWeight = 0.30;

          float macroS = fbm3((qPersp + lightStep2D * 0.85) * scaleVar * 0.90 + vec2(1.8, 0.7), 0.51);
          float domesS = fbmBillow3((qW + lightStep2D * 0.60) * scaleVar * 1.95 + vec2(3.1, 1.9), 0.53);
          slopeLit     = clamp(((macro - macroS) * 0.65 + (domes - domesS) * 0.35) * 3.2 * uContrast + 0.56, 0.0, 1.0);
          detailBump   = domes * 0.60 + puffs * 0.40;
          edgeSoftness = 0.76;

        } else if (uModeId < 4.5) {
          // 5. 🌤️ Облако в дымке: True 2-layer physical compositing (Lower Cumulus OVER Upper Cirrus Veil — zero contour rings!)
          float streak, veil;
          evalClassicSilkyCirrus(q * 0.92, qB * 0.92, qF * 0.92, streak, veil);
          float ciField = streak * 0.74 + veil * 0.26 - erodeSpray * (0.36 + 0.38 * (1.0 - streak));
          upperVeilTau  = clamp((ciField - (0.34 - covShift * 0.45)) / 0.28, 0.0, 1.1);
          upperVeilDens = smoothstep(0.0, 0.68, upperVeilTau) * (1.0 - exp(-upperVeilTau * 2.0)) * 0.78 * horFade;
          upperVeilBump = streak;

          float cuMac   = fbm6(qPersp * 0.88 + vec2(2.4, 1.1), 0.51);
          float cuDom   = fbmBillow5(qW * 2.10 + vec2(1.7, 3.3), 0.53);
          float cuPuf   = fbmBillow5(qBW * 4.40 + vec2(3.1, 1.9), 0.54);
          fieldVal      = cuMac * 0.42 + cuDom * 0.34 + cuPuf * 0.24;
          threshVal     = 0.47 - covShift * 0.60;
          spanVal       = 0.19;
          shadowWeight  = 0.30;

          float cuMacS  = fbm3((qPersp + lightStep2D * 0.85) * 0.88 + vec2(2.4, 1.1), 0.51);
          slopeLit      = clamp((cuMac - cuMacS) * 3.2 + 0.56 + (cuDom - 0.5) * 0.20, 0.0, 1.0);
          detailBump    = cuDom * 0.60 + cuPuf * 0.40;
          edgeSoftness  = 0.76;

        } else if (uModeId < 5.5) {
          float ripple = 0.5 + 0.5 * cos((qW.x * 21.0 - qW.y * 14.0) + (fbm3(qPersp * 2.4, 0.51) - 0.5) * 3.4);
          float puffs1 = fbmBillow5(qW * 8.2 + vec2(1.4, 2.7), 0.54);
          float puffs2 = fbmBillow5(qBW * 15.0 + vec2(3.1, 1.9), 0.55);
          float wisps  = fbm6((qFPersp + warp1) * 18.5 + vec2(2.2, 4.3), 0.54);
          float sheet  = smoothstep(0.20 - covShift * 0.60, 0.68, fbm6(q * 0.75 + vec2(0.5, 0.9), 0.50) + 0.15);

          fieldVal     = (puffs1 * 0.42 + puffs2 * 0.28 + wisps * 0.18 + ripple * 0.12) * sheet;
          threshVal    = 0.35 - covShift * 0.50;
          spanVal      = 0.24;
          shadowWeight = 0.16;

          float p1S    = fbmBillow3((qW + lightStep2D * 0.45) * 8.2 + vec2(1.4, 2.7), 0.54);
          slopeLit     = clamp((puffs1 - p1S) * 2.2 + 0.62 + (puffs2 - 0.5) * 0.18, 0.0, 1.0);
          detailBump   = puffs1 * 0.60 + puffs2 * 0.40;
          edgeSoftness = 0.62;

        } else if (uModeId < 6.5) {
          float floc1 = fbmBillow5(qW * 4.4 + vec2(1.2, 2.7), 0.54);
          float floc2 = fbmBillow5(qBW * 8.6 + vec2(3.4, 1.1), 0.54);
          float virga = fbm6(vec2(qW.x * 9.5 + 1.7, qW.y * 4.5 + 2.9), 0.55);
          float sheet = smoothstep(0.20 - covShift * 0.60, 0.68, fbm6(q * 0.78 + vec2(2.1, 0.7), 0.50) + 0.16);

          fieldVal     = (floc1 * 0.46 + floc2 * 0.32 + virga * 0.22) * sheet;
          threshVal    = 0.36 - covShift * 0.52;
          spanVal      = 0.24;
          shadowWeight = 0.24;

          float fl1S   = fbmBillow3((qW + lightStep2D * 0.55) * 4.4 + vec2(1.2, 2.7), 0.54);
          slopeLit     = clamp((floc1 - fl1S) * 2.5 + 0.58 + (floc2 - 0.5) * 0.20, 0.0, 1.0);
          detailBump   = floc1 * 0.65 + floc2 * 0.35;
          edgeSoftness = 0.68;

        } else if (uModeId < 7.5) {
          float streetAng = 0.48 + uPatternVariant * 1.4;
          float cs = cos(streetAng), ss = sin(streetAng);
          vec2 uSt = vec2(qW.x * cs - qW.y * ss, qW.x * ss + qW.y * cs);

          float waveWarp  = (fbm3(uSt * vec2(1.1, 1.7), 0.52) - 0.5) * 2.4;
          float wavePhase = uSt.y * 8.2 + waveWarp;
          float rollCrest = 0.5 + 0.5 * cos(wavePhase);
          float rollSlope = -sin(wavePhase);

          float b1    = fbmBillow5(qW * 4.6 + vec2(1.5, 2.9), 0.54);
          float b2    = fbmBillow5(qBW * 9.2 + vec2(3.1, 1.4), 0.54);
          float macro = fbm3(q * 1.4 + vec2(1.7, 0.8), 0.51);

          fieldVal     = rollCrest * 0.38 + b1 * 0.32 + b2 * 0.18 + macro * 0.12;
          threshVal    = 0.42 - covShift * 0.58;
          spanVal      = 0.23;
          shadowWeight = 0.34;

          float b1S    = fbmBillow3((qW + lightStep2D * 0.60) * 4.6 + vec2(1.5, 2.9), 0.54);
          slopeLit     = clamp(0.54 + rollSlope * 0.22 * uContrast + (b1 - b1S) * 2.2 + (b2 - 0.5) * 0.16, 0.0, 1.0);
          detailBump   = b1 * 0.60 + b2 * 0.40;
          edgeSoftness = 0.72;

        } else if (uModeId < 8.5) {
          float domCluster = fbmBillow5(qPersp * 0.82 + vec2(1.1, 2.3), 0.52);
          float domBillow  = fbmBillow5(qW * 2.25 + vec2(2.7, 1.5), 0.54);
          float domPuffs   = fbmBillow5(qBW * 5.20 + vec2(1.3, 3.8), 0.54);
          float domFine    = fbm6(qFPersp * 9.0, 0.53);

          fieldVal     = domCluster * 0.42 + domBillow * 0.32 + domPuffs * 0.16 + domFine * 0.10;
          threshVal    = 0.45 - covShift * 0.64;
          spanVal      = 0.17;
          shadowWeight = 0.48;

          float domClusterS = fbmBillow3((qPersp + lightStep2D * 0.85) * 0.82 + vec2(1.1, 2.3), 0.52);
          float domBillowS  = fbmBillow3((qW + lightStep2D * 0.55) * 2.25 + vec2(2.7, 1.5), 0.54);
          slopeLit     = clamp(((domCluster - domClusterS) * 0.62 + (domBillow - domBillowS) * 0.38) * 3.6 * uContrast + 0.54, 0.0, 1.0);
          detailBump   = domBillow * 0.60 + domPuffs * 0.40;
          edgeSoftness = 0.84;

        } else if (uModeId < 9.5) {
          float streak, veil;
          evalClassicSilkyCirrus(q, qB, qF, streak, veil);
          fieldVal     = streak * 0.74 + veil * 0.26;
          threshVal    = 0.36 - covShift * 0.52;
          spanVal      = 0.28;
          shadowWeight = 0.08;
          slopeLit     = 0.68;
          detailBump   = streak;
          edgeSoftness = 0.38;

        } else if (uModeId < 10.5) {
          float sMacro  = fbm6(qW * 1.15 + vec2(1.7, 2.9), 0.52);
          float sTurret = fbmBillow5(qBW * 2.65 + vec2(2.3, 4.1), 0.54);
          float sFloc   = fbmBillow5((qFPersp + warp1) * 6.50 + vec2(1.3, 3.7), 0.54);

          float rawField = sMacro * 0.44 + sTurret * 0.36 + sFloc * 0.20;
          float overcastBlend = smoothstep(0.60, 0.96, uCoverage) * (1.0 - erodeSpray);
          fieldVal     = mix(rawField, max(rawField, sMacro * 0.76 + 0.22), overcastBlend * 0.75);
          threshVal    = 0.39 - covShift * 0.68;
          spanVal      = 0.20;
          shadowWeight = 0.82;

          float sMacroS  = fbm3((qW + lightStep2D * 0.95) * 1.15 + vec2(1.7, 2.9), 0.52);
          float sTurretS = fbmBillow3((qBW + lightStep2D * 0.60) * 2.65 + vec2(2.3, 4.1), 0.54);
          slopeLit     = clamp(((sMacro - sMacroS) * 0.58 + (sTurret - sTurretS) * 0.42) * 3.8 * uContrast + 0.52, 0.0, 1.0);
          detailBump   = sTurret * 0.65 + sFloc * 0.35;
          edgeSoftness = 0.82;

        } else if (uModeId < 11.5) {
          float finePuffs = fbmBillow5(qW * 7.6 + vec2(1.9, 3.4), 0.55);
          float microPuff = fbmBillow5(qBW * 14.2 + vec2(4.2, 1.7), 0.54);
          float downdraftHoles = smoothstep(0.58, 0.82, fbmBillow3(qPersp * 3.1 + vec2(uEvoTime * 0.06, -uEvoTime * 0.05), 0.54));
          float wispyFringe = fbm6(vec2(qW.x * 7.5, qW.y * 2.8), 0.55);

          fieldVal     = (finePuffs * 0.50 + microPuff * 0.30 + wispyFringe * 0.20) * (1.0 - downdraftHoles * 0.62);
          threshVal    = 0.34 - covShift * 0.50;
          spanVal      = 0.24;
          shadowWeight = 0.18;

          float pS     = fbmBillow3((qW + lightStep2D * 0.45) * 7.6 + vec2(1.9, 3.4), 0.55);
          slopeLit     = clamp((finePuffs - pS) * 2.4 + 0.60 + (microPuff - 0.5) * 0.18, 0.0, 1.0);
          detailBump   = finePuffs * 0.65 + microPuff * 0.35;
          edgeSoftness = 0.64;

        } else if (uModeId < 12.5) {
          float streak, veil;
          evalClassicSilkyCirrus(q * 0.85, qB * 0.85, qF * 0.85, streak, veil);
          float anvilSynoptic = smoothstep(0.22, 0.68, fbm6(q * 0.68 + vec2(4.2, 1.5), 0.51));
          float silkySheet = (veil * 0.58 + streak * 0.42) * anvilSynoptic - erodeSpray * 0.45;
          upperVeilTau  = clamp((silkySheet - (0.35 - covShift * 0.48)) / 0.24, 0.0, 1.1);
          upperVeilDens = smoothstep(0.0, 0.65, upperVeilTau) * (1.0 - exp(-upperVeilTau * 2.0)) * 0.82 * horFade;
          upperVeilBump = streak;

          float turrets = fbmBillow5(qW * 5.2 + vec2(2.1, 1.3), 0.55) * 0.60 + fbmBillow5(qBW * 10.5, 0.54) * 0.40;
          float turretCluster = smoothstep(0.24, 0.68, fbm6(q * 0.95 + vec2(0.8, 1.9), 0.52));
          fieldVal     = turrets * turretCluster;
          threshVal    = 0.35 - covShift * 0.54;
          spanVal      = 0.24;
          shadowWeight = 0.26;
          float turS   = fbmBillow3((qW + lightStep2D * 0.50) * 5.2 + vec2(2.1, 1.3), 0.55);
          slopeLit     = clamp(0.58 + (turrets - turS) * 2.4, 0.0, 1.0);
          detailBump   = turrets;
          edgeSoftness = 0.70;

        } else if (uModeId < 13.5) {
          float frontWave = fbm6(q * 0.65 + vec2(1.4, 3.1), 0.53) + (q.x * 0.28 - q.y * 0.16);
          float rightMassMask  = smoothstep(0.22, 0.68, frontWave);
          float leftCirrusMask = 1.0 - smoothstep(0.18, 0.72, frontWave);

          float streak, veil;
          evalClassicSilkyCirrus(q * 1.05, qB * 1.05, qF * 1.05, streak, veil);
          float leftCirrus = (streak * 0.74 + veil * 0.26) * leftCirrusMask - erodeSpray * 0.45;
          upperVeilTau  = clamp((leftCirrus - (0.35 - covShift * 0.48)) / 0.24, 0.0, 1.1);
          upperVeilDens = smoothstep(0.0, 0.65, upperVeilTau) * (1.0 - exp(-upperVeilTau * 2.0)) * 0.85 * horFade;
          upperVeilBump = streak;

          float rightPuffs = (fbmBillow5(qW * 5.8 + vec2(1.5, 2.9), 0.55) * 0.58 + fbmBillow5(qBW * 11.4, 0.54) * 0.42) * rightMassMask;
          fieldVal     = rightPuffs;
          threshVal    = 0.35 - covShift * 0.54;
          spanVal      = 0.24;
          shadowWeight = 0.26;
          float rPuffS = fbmBillow3((qW + lightStep2D * 0.50) * 5.8 + vec2(1.5, 2.9), 0.55);
          slopeLit     = clamp(0.58 + (rightPuffs - rPuffS * rightMassMask) * 2.4, 0.0, 1.0);
          detailBump   = rightPuffs;
          edgeSoftness = 0.68;

        } else if (uModeId < 14.5) {
          float streak, veil;
          evalClassicSilkyCirrus(q * 0.95, qB * 0.95, qF * 0.95, streak, veil);
          float upperWeb = (streak * 0.70 + veil * 0.30) * 0.78 - erodeSpray * 0.45;
          upperVeilTau  = clamp((upperWeb - (0.36 - covShift * 0.48)) / 0.24, 0.0, 1.0);
          upperVeilDens = smoothstep(0.0, 0.68, upperVeilTau) * (1.0 - exp(-upperVeilTau * 2.0)) * 0.78 * horFade;
          upperVeilBump = streak;

          float chainWave  = fbm6(q * 0.85 + vec2(1.2, 2.8), 0.52);
          float chainPuffs = (fbmBillow5(qW * 4.2 + vec2(3.1, 1.4), 0.54) * 0.58 + fbmBillow5(qBW * 8.4, 0.54) * 0.42) * smoothstep(0.22, 0.72, chainWave);
          fieldVal     = chainPuffs;
          threshVal    = 0.36 - covShift * 0.54;
          spanVal      = 0.23;
          shadowWeight = 0.30;
          slopeLit     = clamp(0.60 + (chainPuffs - 0.45) * 0.42, 0.0, 1.0);
          detailBump   = chainPuffs;
          edgeSoftness = 0.74;

        } else {
          float nightPuffs1 = fbmBillow5(qW * 5.2 + vec2(2.2, 3.8), 0.55);
          float nightPuffs2 = fbmBillow5(qBW * 10.4 + vec2(1.3, 4.1), 0.54);
          float dMoonDome   = length(qCloud - qMoonDome + warp1 * 1.2);
          float moonWindow  = (1.0 - smoothstep(0.04, 0.42, dMoonDome)) * (0.18 + 0.12 * fbm3(q * 3.5, 0.53));

          fieldVal     = (nightPuffs1 * 0.58 + nightPuffs2 * 0.42) - moonWindow;
          threshVal    = 0.34 - covShift * 0.52;
          spanVal      = 0.22;
          shadowWeight = 0.62;

          float nS     = fbmBillow3((qW + lightStep2D * 0.48) * 5.2 + vec2(2.2, 3.8), 0.55);
          slopeLit     = clamp((nightPuffs1 - nS) * 2.8 + 0.56, 0.0, 1.0);
          detailBump   = nightPuffs1 * 0.65 + nightPuffs2 * 0.35;
          edgeSoftness = 0.70;
        }

        // Natural billow-modulated Eraser subtraction BEFORE thresholding
        float erodeSubtract = erodeSpray * (0.36 + 0.40 * (1.0 - detailBump) + 0.22 * (1.0 - fineErode));
        float modField = fieldVal - erodeSubtract;
        cloudTau  = clamp((modField - threshVal) / spanVal, 0.0, 2.25);
        cloudDens = smoothstep(0.0, mix(0.76, 0.42, edgeSoftness), cloudTau) * (1.0 - exp(-cloudTau * (1.8 + 1.2 * edgeSoftness))) * 0.96 * horFade;

        if (uCoverage > 0.72 && erodeSpray < 0.5) {
          float overAmt = smoothstep(0.72, 0.98, uCoverage) * (1.0 - erodeSpray);
          float canopyField = fbmBillow3(q * 0.85 + vec2(2.9, 1.4), 0.52) * 0.65 + detailBump * 0.35 - erodeSpray * 0.55;
          float canopyThresh = mix(0.42, 0.06, overAmt);
          float canopyDens = smoothstep(canopyThresh, canopyThresh + 0.18, canopyField) * horFade * overAmt;
          cloudDens = max(cloudDens, canopyDens * 0.96);
          cloudTau  = max(cloudTau, canopyDens * (0.85 + 1.15 * uCloudDarkness));
        }

        if (cloudDens > 0.001) {
          float lightSw = clamp(shadowWeight * 0.38, 0.03, 0.18);
          float darkSw  = clamp(0.58 + 0.30 * effDarkRatio, 0.46, 0.88);
          shadowWeight  = mix(lightSw, darkSw, darkMassMask);
          cloudTau     *= mix(0.88, 1.35 + 0.60 * effDarkRatio, darkMassMask);
        }

        // ============================================================================
        // UNIFIED SPRAY BRUSHES
        // ============================================================================
        if (uHasPaint > 0.5 && horFade > 0.01) {
          if (brushCumulus > 0.004) {
            float bMacro  = fbm3(qW * 1.75 + vec2(3.1, 4.7), 0.51);
            float bBillow = fbmBillow5(qBW * 3.9, 0.53);
            float bFine   = fbm3(qFPersp * 8.8, 0.51);
            float bShape  = bMacro * 0.44 + bBillow * 0.42 + bFine * 0.14;

            float sprayAmt = clamp(brushCumulus * (1.0 - erodeSpray * 0.85), 0.0, 1.0);
            float bThresh  = mix(0.62, 0.24, pow(sprayAmt, 0.80));
            float cuTau    = clamp((bShape - bThresh) / 0.22, 0.0, 1.45) * (0.45 + 1.65 * pow(sprayAmt, 1.15) * max(0.20, brushDarkWeight));
            float cuDens   = smoothstep(0.0, 0.55, cuTau) * (1.0 - exp(-cuTau * 2.5)) * smoothstep(0.0, 0.18, sprayAmt) * horFade;

            float bMacroS  = fbm3((qW + lightStep2D) * 1.75 + vec2(3.1, 4.7), 0.51);
            float bSlope   = clamp((bMacro - bMacroS) * 3.2 * uContrast + 0.56, 0.0, 1.0);

            float wBlend = clamp(cuDens / max(0.001, max(cloudDens, cuDens)), 0.0, 1.0);
            slopeLit     = mix(slopeLit, bSlope, wBlend);
            detailBump   = mix(detailBump, bBillow, wBlend);
            shadowWeight = mix(shadowWeight, max(0.18, brushDarkWeight), wBlend);
            cloudDens    = max(cloudDens, cuDens);
            cloudTau     = max(cloudTau, cuTau);
          }

          if (brushCirrus > 0.004) {
            float bStreak, bVeil;
            evalClassicSilkyCirrus(q * 1.05 + vec2(1.3, 2.7), qB * 1.05, qF * 1.05, bStreak, bVeil);
            float bField   = bStreak * 0.74 + bVeil * 0.26;
            float ciSpray  = clamp(brushCirrus * (1.0 - erodeSpray * 0.85), 0.0, 1.0);
            float ciThresh = mix(0.60, 0.22, pow(ciSpray, 0.82));
            float ciTau    = clamp((bField - ciThresh) / 0.26, 0.0, 1.15) * (0.35 + 1.35 * pow(ciSpray, 1.2) * max(0.10, brushDarkWeight));
            float ciDens   = smoothstep(0.0, 0.70, ciTau) * (1.0 - exp(-ciTau * 2.0)) * smoothstep(0.0, 0.18, ciSpray) * horFade;

            float wBlend = clamp(ciDens / max(0.001, max(cloudDens, ciDens)), 0.0, 1.0);
            slopeLit     = mix(slopeLit, 0.70, wBlend);
            detailBump   = mix(detailBump, bStreak, wBlend);
            shadowWeight = mix(shadowWeight, max(0.08, brushDarkWeight * 0.45), wBlend);
            cloudDens    = max(cloudDens, ciDens);
            cloudTau     = max(cloudTau, ciTau);
          }

          if (brushMackerel > 0.004) {
            float mBillow1 = fbmBillow5(qW * 8.5 + vec2(1.7, 3.1), 0.54);
            float mBillow2 = fbmBillow3(qBW * 15.0 + vec2(2.3, 1.4), 0.54);
            float mField   = mBillow1 * 0.60 + mBillow2 * 0.40;

            float mSpray  = clamp(brushMackerel * (1.0 - erodeSpray * 0.85), 0.0, 1.0);
            float mThresh = mix(0.62, 0.24, pow(mSpray, 0.82));
            float mTau    = clamp((mField - mThresh) / 0.24, 0.0, 1.25) * (0.40 + 1.50 * pow(mSpray, 1.15) * max(0.16, brushDarkWeight));
            float mDens   = smoothstep(0.0, 0.62, mTau) * (1.0 - exp(-mTau * 2.2)) * smoothstep(0.0, 0.18, mSpray) * horFade;

            float mB1S    = fbmBillow3((qW + lightStep2D * 0.45) * 8.5 + vec2(1.7, 3.1), 0.54);
            float mSlope  = clamp((mBillow1 - mB1S) * 2.4 + 0.60, 0.0, 1.0);

            float wBlend = clamp(mDens / max(0.001, max(cloudDens, mDens)), 0.0, 1.0);
            slopeLit     = mix(slopeLit, mSlope, wBlend);
            detailBump   = mix(detailBump, mBillow1, wBlend);
            shadowWeight = mix(shadowWeight, max(0.16, brushDarkWeight * 0.65), wBlend);
            cloudDens    = max(cloudDens, mDens);
            cloudTau     = max(cloudTau, mTau);
          }
        }

        // Compute upper Cirrus veil color (for 2-layer modes 4, 12, 13, 14) and main cloud layer color
        vec3 upperVeilCol = vec3(1.0);
        if (upperVeilDens > 0.001) {
          float veilSw = mix(0.04, 0.36, darkMassMask * uCloudDarkness);
          upperVeilCol = computeUnifiedCloudColor(
            sky, 0.68, upperVeilBump, upperVeilTau, veilSw,
            sunDot, sunBeamHitCloud, moonProx, moonDist, sy,
            dayFactor, sunsetFactor, nightFactor, isBlood
          );
        }

        vec3 cloudCol = computeUnifiedCloudColor(
          sky, slopeLit, detailBump, cloudTau, shadowWeight,
          sunDot, sunBeamHitCloud, moonProx, moonDist, sy,
          dayFactor, sunsetFactor, nightFactor, isBlood
        );

        if (isStorm > 0.5 && uCloudDarkness > 0.55) {
          float flashWave = pow(max(0.0, sin(uTime * 1.9 + floor(uTime * 0.5) * 4.7)), 22.0);
          if (flashWave > 0.01) {
            vec2 cellCenter = vec2(sin(floor(uTime * 0.5) * 3.1) * 0.6, 1.1 + 0.3 * cos(floor(uTime * 0.5) * 2.3));
            float dCell = length(qSky - cellCenter);
            float internalBolt = exp(-dCell * 4.5) * exp(-abs(cloudTau - 0.85) * 2.8) * flashWave * 0.85;
            cloudCol += vec3(0.65, 0.82, 1.00) * internalBolt;
          }
        }

        // Background Starfield 360 (occluded by clouds in front!)
        float starVis = clamp(nightFactor * (1.0 - dayFactor * 2.5), 0.0, 1.0);
        vec3 skyWithStars = sky + renderRealStarfield360(rd, starVis, sy, horFade);

        // High-altitude Flights (pAlt < 0.5, 11.2 km) rendered above the cloud layers
        vec3 skyAndHighFlights = skyWithStars;
        if (uModeId > 8.5 && uModeId < 9.5 && horFade > 0.01) {
          skyAndHighFlights = evalSingleFlight(skyAndHighFlights, qSky, qCloud, uWindVec, horFade, sy, vec2(-2.2, 1.5), normalize(vec2(0.82, -0.57)), 4.6, 1.0, 0.0, 11.3, dayFactor, sunsetFactor, nightFactor, isBlood, sunDot, moonProx, 0.0);
          skyAndHighFlights = evalSingleFlight(skyAndHighFlights, qSky, qCloud, uWindVec, horFade, sy, vec2(2.1, 1.8), normalize(vec2(-0.76, -0.65)), 4.9, 0.0, 1.0, 23.7, dayFactor, sunsetFactor, nightFactor, isBlood, sunDot, moonProx, 0.0);
          skyAndHighFlights = evalSingleFlight(skyAndHighFlights, qSky, qCloud, uWindVec, horFade, sy, vec2(-1.8, -1.9), normalize(vec2(0.68, 0.73)), 4.4, 2.0, 2.0, 41.2, dayFactor, sunsetFactor, nightFactor, isBlood, sunDot, moonProx, 0.0);
        }
        if (uShowPlane > 0.5 && isStorm < 0.5 && horFade > 0.01) {
          if (uF2Active > 0.5 && uF2Alt < 0.5) {
            skyAndHighFlights = evalSingleFlight(skyAndHighFlights, qSky, qCloud, uWindVec, horFade, sy, uF2Start, uF2Dir, uF2Dist, uF2Type, uF2Alt, 31.4, dayFactor, sunsetFactor, nightFactor, isBlood, sunDot, moonProx, 1.0);
          }
          if (uF1Active > 0.5 && uF1Alt < 0.5) {
            skyAndHighFlights = evalSingleFlight(skyAndHighFlights, qSky, qCloud, uWindVec, horFade, sy, uF1Start, uF1Dir, uF1Dist, uF1Type, uF1Alt, 19.7, dayFactor, sunsetFactor, nightFactor, isBlood, sunDot, moonProx, 1.0);
          }
          if (uF0Active > 0.5 && uF0Alt < 0.5) {
            skyAndHighFlights = evalSingleFlight(skyAndHighFlights, qSky, qCloud, uWindVec, horFade, sy, uF0Start, uF0Dir, uF0Dist, uF0Type, uF0Alt, 5.3, dayFactor, sunsetFactor, nightFactor, isBlood, sunDot, moonProx, 1.0);
          }
        }

        // Composite Upper Cirrus Veil (if active in 2-layer modes), then Mid-Altitude Flights, then Main Cloud Layer!
        vec3 col = mix(skyAndHighFlights, upperVeilCol, clamp(upperVeilDens, 0.0, 0.96));

        if (uShowPlane > 0.5 && isStorm < 0.5 && horFade > 0.01) {
          if (uF2Active > 0.5 && uF2Alt >= 0.5 && uF2Alt < 1.5) {
            col = evalSingleFlight(col, qSky, qCloud, uWindVec, horFade, sy, uF2Start, uF2Dir, uF2Dist, uF2Type, uF2Alt, 31.4, dayFactor, sunsetFactor, nightFactor, isBlood, sunDot, moonProx, 1.0);
          }
          if (uF1Active > 0.5 && uF1Alt >= 0.5 && uF1Alt < 1.5) {
            col = evalSingleFlight(col, qSky, qCloud, uWindVec, horFade, sy, uF1Start, uF1Dir, uF1Dist, uF1Type, uF1Alt, 19.7, dayFactor, sunsetFactor, nightFactor, isBlood, sunDot, moonProx, 1.0);
          }
          if (uF0Active > 0.5 && uF0Alt >= 0.5 && uF0Alt < 1.5) {
            col = evalSingleFlight(col, qSky, qCloud, uWindVec, horFade, sy, uF0Start, uF0Dir, uF0Dist, uF0Type, uF0Alt, 5.3, dayFactor, sunsetFactor, nightFactor, isBlood, sunDot, moonProx, 1.0);
          }
        }

        float finalCloudAlpha = clamp(cloudDens, 0.0, 0.992);
        col = mix(col, cloudCol, finalCloudAlpha);
        float totalCloudAlpha = 1.0 - (1.0 - clamp(upperVeilDens, 0.0, 0.96)) * (1.0 - finalCloudAlpha);

        // Low-altitude flights (pAlt >= 1.5, 4.2 km): fly underneath upper & mid clouds, veiled only by dense storm bases!
        if (uShowPlane > 0.5 && isStorm < 0.5 && horFade > 0.01) {
          float lowCloudOcc = smoothstep(0.75, 1.55, cloudTau * shadowWeight) * finalCloudAlpha;
          vec3 colLow = col;
          if (uF2Active > 0.5 && uF2Alt >= 1.5) {
            colLow = evalSingleFlight(colLow, qSky, qCloud, uWindVec, horFade, sy, uF2Start, uF2Dir, uF2Dist, uF2Type, uF2Alt, 31.4, dayFactor, sunsetFactor, nightFactor, isBlood, sunDot, moonProx, 1.0);
          }
          if (uF1Active > 0.5 && uF1Alt >= 1.5) {
            colLow = evalSingleFlight(colLow, qSky, qCloud, uWindVec, horFade, sy, uF1Start, uF1Dir, uF1Dist, uF1Type, uF1Alt, 19.7, dayFactor, sunsetFactor, nightFactor, isBlood, sunDot, moonProx, 1.0);
          }
          if (uF0Active > 0.5 && uF0Alt >= 1.5) {
            colLow = evalSingleFlight(colLow, qSky, qCloud, uWindVec, horFade, sy, uF0Start, uF0Dir, uF0Dist, uF0Type, uF0Alt, 5.3, dayFactor, sunsetFactor, nightFactor, isBlood, sunDot, moonProx, 1.0);
          }
          col = mix(colLow, cloudCol, lowCloudOcc);
        }

        // ============================================================================
        // PHYSICAL HDR SUN & MOON TRANSILLUMINATION THROUGH CLOUDS (Zero clipped edges!)
        // When clear sky: full blinding HDR solar bloom & corona.
        // When thin/medium clouds cross the Sun: the HDR solar glare shines THROUGH and transilluminates the cloud fibers!
        // When thick dark cloud cores cross the Sun: they genuinely block the solar disk & glow with a Silver Lining!
        // ============================================================================
        float totalTauHere = cloudTau * finalCloudAlpha + upperVeilTau * upperVeilDens * 0.55;
        float effSwHere    = max(0.08, shadowWeight);
        float cloudTransOverSun = exp(-totalTauHere * (0.18 + 1.35 * pow(effSwHere, 1.45)));
        float cloudForwardScatter = exp(-totalTauHere * (0.36 + 0.92 * effSwHere)) * smoothstep(0.01, 0.30, totalCloudAlpha) *
          (exp(-sAngHere / (rSun * 7.5)) * 0.72 + exp(-sAngHere / (rSun * 3.2)) * 1.60 + exp(-sAngHere / (rSun * 1.4)) * 2.35);

        float sunGlow = 0.0, moonGlow = 0.0;
        col = renderSunAndRealMoon(
          col, rd, sunDir, moonDir,
          dayFactor, sunsetFactor, nightFactor, eclipseTotality,
          cloudTransOverSun, cloudForwardScatter,
          sunGlow, moonGlow
        );

        // Lunar Silver Lining on cloud edges near the Moon
        if (uShowMoon > 0.5 && moonGlow > 0.005) {
          float moonRimTrans = exp(-totalTauHere * (0.75 + 1.10 * effSwHere)) * smoothstep(0.01, 0.35, totalCloudAlpha);
          vec3 moonLiningCol = mix(vec3(0.95, 0.94, 0.88), vec3(0.98, 0.45, 0.38), isBlood);
          col = 1.0 - (1.0 - col) * exp(-moonLiningCol * (moonGlow * moonRimTrans * 0.90));
        }

        // ============================================================================
        // REALISTIC UNROTATED ANISOTROPIC RAIN SHAFTS (Strictly ONLY on #11 Rain Clouds!)
        // ============================================================================
        float rainIntensity = isStorm * (0.48 + 0.52 * uCloudDarkness) * smoothstep(0.15, 0.40, uCoverage);
        if (rainIntensity > 0.02 && sy < 0.44 && rd.y > -0.05) {
          float uHor = rd.x / max(0.25, length(rd.xz));
          float slant = (0.38 - sy) * (0.18 + 0.14 * uWindShear);
          float uR = uHor + slant - uTime * 0.08;

          float rainCellEnv = smoothstep(0.26, 0.76,
            noise(vec2(uR * 2.2 + 1.3, sy * 0.35 + uTime * 0.6)) * 0.60 +
            noise(vec2(uR * 4.8 + 7.1, sy * 0.55 + uTime * 0.9)) * 0.40
          );

          float rSheet1 = noise(vec2(uR * 6.5 + 2.3, sy * 0.35 + uTime * 1.6));
          float rSheet2 = noise(vec2(uR * 14.0 + 5.7, sy * 0.55 + uTime * 2.4));
          float silkyRain = rSheet1 * 0.62 + rSheet2 * 0.38;

          float rainVertMask = smoothstep(-0.05, 0.04, rd.y) * (1.0 - smoothstep(0.14, 0.38, sy));
          float underStormBase = clamp(0.45 + 0.55 * shadowWeight * cloudDens, 0.0, 1.0) * (1.0 - erodeSpray * 0.80);
          float rainOpticalDepth = rainCellEnv * smoothstep(0.28, 0.78, silkyRain) * rainVertMask * rainIntensity * underStormBase;

          float nightRainVis = 0.06 + 0.94 * clamp(uShowMoon * moonProx, 0.0, 1.0);
          vec3 nightRainDark = vec3(0.012, 0.018, 0.032);
          vec3 nightRainLit  = vec3(0.025, 0.038, 0.065) + vec3(0.18, 0.22, 0.30) * nightRainVis;
          vec3 darkRainMist = mix(nightRainDark, mix(vec3(0.15, 0.22, 0.32), vec3(0.36, 0.24, 0.28), sunsetFactor), clamp(dayFactor + sunsetFactor * 0.7, 0.0, 1.0));
          vec3 litRainMist  = mix(nightRainLit,  mix(vec3(0.54, 0.64, 0.76), vec3(0.92, 0.66, 0.42), sunsetFactor), clamp(dayFactor + sunsetFactor * 0.7, 0.0, 1.0));
          float rainLight   = clamp(silkyRain * 0.65 + (1.0 - sy * 2.2) * 0.25 + crepuscularBeam * 0.65, 0.0, 1.0);
          vec3 rainCol      = mix(darkRainMist, litRainMist, rainLight);
          col = mix(col, rainCol, clamp(rainOpticalDepth * 0.55, 0.0, 0.55));
        }

        // Composite Volumetric Solar Crepuscular Rays (distinct turret-shadowed shafts!)
        if (uShowSunRays > 0.5 && crepuscularBeam > 0.005 && rd.y > -0.03) {
          vec3 beamTint = mix(vec3(1.00, 0.93, 0.75), vec3(1.00, 0.62, 0.26), sunsetFactor);
          float localBeamBlock = exp(-totalTauHere * effSwHere * 0.55);
          float beamTransmission = (0.42 + 0.58 * localBeamBlock) * smoothstep(-0.03, 0.06, rd.y);
          vec3 beamAdd = beamTint * (crepuscularBeam * beamTransmission * 0.82);
          col = 1.0 - (1.0 - col) * exp(-beamAdd);
        }



        if (rd.y < 0.0) {
          float gDepth = clamp(-rd.y / 0.28, 0.0, 1.0);
          vec3 darkHorizonGround = mix(vec3(0.02, 0.04, 0.08), mix(vec3(0.12, 0.19, 0.28), vec3(0.24, 0.16, 0.18), sunsetFactor), clamp(dayFactor + sunsetFactor * 0.6, 0.0, 1.0));
          if (uShowSunRays > 0.5 && uCoverage > 0.15) {
            float sunAzAlign = max(0.0, dot(normalize(rd.xz + vec2(0.0001)), normalize(sunDir.xz + vec2(0.0001))));
            vec3 sunlitEarth = mix(vec3(0.32, 0.44, 0.26), vec3(0.72, 0.58, 0.32), sunsetFactor * 0.65);
            darkHorizonGround = mix(darkHorizonGround, sunlitEarth, pow(sunAzAlign, 3.0) * crepuscularBeam * 0.75);
          }
          col = mix(col, darkHorizonGround, (1.0 - smoothstep(-0.06, 0.0, rd.y)) * (0.45 + 0.55 * gDepth));
        }

        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      }`;

function cut(src, anchor) {
  const i = src.indexOf(anchor);
  if (i < 0) throw new Error('SkyStudio shader anchor not found: ' + anchor.trim().slice(0, 60));
  return i;
}

export function buildDerivedShaders(src) {
  const idxStar      = cut(src, '      vec3 evalStarLayerSpherical(');
  const idxSampleGap = cut(src, '      // Samples both procedural cloud optical depth');
  const idxMain      = cut(src, '      void main() {');
  const idxDenom     = cut(src, '        float denom = (pow(max(0.025, sy), 0.68) + 0.36) * 0.95;');
  const idxBrushCu   = cut(src, '        float brushCumulus    = 0.0;');
  const idxSunDir    = cut(src, '        vec3 sunDir = normalize(uSunDir);');
  const idxFineErode = cut(src, '        float fineErode = (brushErase > 0.005)');
  const idxThermal   = cut(src, '        float thermalWave = (sin(uEvoTime * 0.35 + q.x * 1.6)');
  const idxSunTau    = cut(src, '        float sunCenterTau = sampleFastCloudGap(');
  const idxEffDark   = cut(src, '        float effDarkRatio = (isStorm > 0.5)');
  const idxCompVeil  = cut(src, '        // Compute upper Cirrus veil color');

  // Bake pass: renders the 360° cloud dome (alpha, slope, detail, shadow) into an equirect texture.
  const BAKE_DOME_FS =
    src.slice(0, idxStar) +
    `      void main() {
        float az = (vUv.x - 0.5) * 2.0 * PI;
        // Rows are spaced by elevation (denser near the horizon, finite near the zenith),
        // so the polar cap of the equirect texture stays tiny and shows no radial streaks.
        float elBake = 0.5 * PI * pow(clamp(vUv.y, 0.0, 1.0), 1.4285714);
        float syBake = sin(elBake);
        float cosEl = cos(elBake);
        vec3 rd = vec3(sin(az) * cosEl, syBake, cos(az) * cosEl);
        float sy = clamp(rd.y, 0.0, 1.0);
        float horFade = smoothstep(-0.015, 0.09, rd.y);
` +
    src.slice(idxDenom, idxSunTau) +
    src.slice(idxEffDark, idxCompVeil) +
    `        float veilA = clamp(upperVeilDens, 0.0, 0.96);
        float mainA = clamp(cloudDens, 0.0, 0.992);
        float bakedTotalAlpha = 1.0 - (1.0 - veilA) * (1.0 - mainA);
        float wMain = mainA / max(0.0001, veilA * (1.0 - mainA) + mainA);
        float veilSw = mix(0.04, 0.36, darkMassMask * uCloudDarkness);
        float combSlope = mix(0.68, slopeLit, wMain);
        float combBump  = mix(upperVeilBump, detailBump, wMain);
        float combSw    = mix(veilSw, shadowWeight, wMain);
        gl_FragColor = vec4(
          clamp(bakedTotalAlpha, 0.0, 1.0),
          clamp(combSlope, 0.0, 1.0),
          clamp(combBump, 0.0, 1.0),
          clamp(combSw, 0.0, 1.0)
        );
      }`;

  // Screen pass: reads the baked dome and only does lighting, Sun/Moon, stars, aircraft and rain per frame.
  const FAST_SCREEN_FS =
    src.slice(0, idxSampleGap) +
    `      uniform float uDomeWindShift;
      uniform vec2  uBakedWindOffset;

      float sampleFastCloudGap(vec2 pDome, float cRot, float sRot, float baseCovShift, float isStorm) {
        vec2 qSkyPt = pDome * uScale + uBakedWindOffset;
        float r2 = dot(qSkyPt, qSkyPt);
        float syEst = clamp(1.0 / (1.0 + r2 * 0.42), 0.0, 1.0);
        float uDome = atan(qSkyPt.x, qSkyPt.y) / (2.0 * PI) + 0.5 - uDomeWindShift;
        float vDome = pow(asin(syEst) / (0.5 * PI), 0.7);
        return texture2D(uSkyRayLutTex, vec2(uDome, vDome)).r * 1.65;
      }
` +
    src.slice(idxMain, idxBrushCu) +
    `        float erodeSpray = 0.0;
` +
    src.slice(idxSunDir, idxFineErode) +
    src.slice(idxThermal, idxEffDark) +
    `        float uDome = atan(rd.x, rd.z) / (2.0 * PI) + 0.5 - uDomeWindShift;
        float vDome = pow(asin(clamp(rd.y, 0.0, 1.0)) / (0.5 * PI), 0.7);
        vec4 bCloud = texture2D(uSkyRayLutTex, vec2(uDome, vDome));
        float subHorFade = smoothstep(-0.015, 0.005, rd.y);
        float micro = (noise(qFPersp * 14.0) - 0.5);
        float cloudDens    = bCloud.r * subHorFade;
        float slopeLit     = bCloud.g;
        float detailBump   = bCloud.b;
        float shadowWeight = bCloud.a;
        float hasCloudMask = step(0.002, cloudDens);
        float edgeFactor   = cloudDens * (1.0 - cloudDens);
        cloudDens    = clamp(cloudDens + micro * 0.075 * edgeFactor * uDetail, 0.0, 0.992);
        detailBump   = clamp(detailBump + micro * 0.13 * uDetail * hasCloudMask, 0.0, 1.0);
        slopeLit     = clamp(slopeLit + micro * 0.08 * uDetail * hasCloudMask, 0.0, 1.0);
        float cloudTau     = cloudDens * (1.25 + 1.15 * shadowWeight);
        float upperVeilDens = 0.0;
        float upperVeilTau  = 0.0;
        float upperVeilBump = 0.50;
        float darkMassMask  = shadowWeight;
` +
    src.slice(idxCompVeil);

  return { BAKE_DOME_FS, FAST_SCREEN_FS };
}
