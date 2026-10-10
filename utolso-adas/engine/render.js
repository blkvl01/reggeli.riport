// AZ UTOLSÓ ADÁS – procedurális renderelő.
// 2D vásznon festett, animált helyszínek + WebGL utómunka (szemcse, bloom, CA, VHS, hallucináció).
(function (root) {
  'use strict';
  const W = 1280, H = 720;
  const R = (root.R = {});
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- segédek
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const smooth = (t) => t * t * (3 - 2 * t);

  // Simított zaj: kis véletlen képek felnagyítva, oktávonként összeadva (fbm).
  function noiseCanvas(w, h, base, oct, seed, contrast) {
    const r = rng(seed);
    const c = mk(w, h), x = c.getContext('2d');
    x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
    for (let o = 0; o < oct; o++) {
      const n = Math.max(2, Math.round(base * Math.pow(2, o)));
      const m = Math.max(2, Math.round(n * h / w));
      const t = mk(n, m), tx = t.getContext('2d');
      const id = tx.createImageData(n, m);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = r() * 255;
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
      }
      tx.putImageData(id, 0, 0);
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      x.globalAlpha = 0.55 * Math.pow(0.55, o);
      x.drawImage(t, 0, 0, w, h);
    }
    x.globalAlpha = 1;
    if (contrast) {
      const d = x.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = clamp((d.data[i] - 128) * contrast + 128, 0, 255);
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      }
      x.putImageData(d, 0, 0);
    }
    return c;
  }

  // Szürke zajból színezett, alfás réteg (felhő, köd, füst).
  function alphaFromNoise(src, rgb, lo, hi, maxA, fadeEdges) {
    const c = mk(src.width, src.height), x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height);
    const w4 = c.width * 4;
    for (let i = 0; i < d.data.length; i += 4) {
      const v = d.data[i] / 255;
      const yy = Math.floor(i / w4) / c.height;
      const edge = fadeEdges ? Math.sin(Math.PI * yy) ** 1.5 : 1;
      const a = smooth(clamp((v - lo) / (hi - lo), 0, 1)) * maxA * edge;
      d.data[i] = rgb[0]; d.data[i + 1] = rgb[1]; d.data[i + 2] = rgb[2]; d.data[i + 3] = a * 255;
    }
    x.putImageData(d, 0, 0);
    return c;
  }

  // ---------------------------------------------------------------- textúrák (egyszer generálva)
  const TX = {};
  function textures() {
    if (TX.ready) return;
    TX.n1 = noiseCanvas(512, 512, 4, 6, 11, 1.4);
    TX.n2 = noiseCanvas(512, 512, 8, 5, 23, 1.8);
    TX.fine = noiseCanvas(256, 256, 32, 3, 5, 2.2);
    TX.cloud = alphaFromNoise(noiseCanvas(1024, 384, 3, 7, 77, 1.6), [255, 255, 255], 0.42, 0.85, 1, true);
    TX.fog = alphaFromNoise(noiseCanvas(1024, 256, 2, 6, 91, 1.2), [255, 255, 255], 0.3, 0.9, 1, true);
    TX.smoke = alphaFromNoise(noiseCanvas(512, 512, 3, 6, 131, 1.5), [255, 255, 255], 0.35, 0.95, 1, true);
    // beton: zaj + foltok + lefolyások
    const c = mk(512, 512), x = c.getContext('2d');
    x.drawImage(TX.n1, 0, 0);
    x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.6; x.drawImage(TX.fine, 0, 0, 512, 512); x.globalAlpha = 1;
    x.globalCompositeOperation = 'multiply';
    const r = rng(3);
    for (let i = 0; i < 40; i++) {
      const px = r() * 512, len = 40 + r() * 220, w = 2 + r() * 10;
      const g = x.createLinearGradient(px, 0, px, len);
      g.addColorStop(0, 'rgba(90,70,50,0.35)'); g.addColorStop(1, 'rgba(90,70,50,0)');
      x.fillStyle = g; x.fillRect(px, r() * 200, w, len);
    }
    for (let i = 0; i < 18; i++) {
      const g = x.createRadialGradient(r() * 512, r() * 512, 0, 0, 0, 0);
      const cx = r() * 512, cy = r() * 512, rr = 20 + r() * 70;
      const gg = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
      gg.addColorStop(0, 'rgba(60,55,45,0.35)'); gg.addColorStop(1, 'rgba(60,55,45,0)');
      x.fillStyle = gg; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
      void g;
    }
    x.globalCompositeOperation = 'source-over';
    TX.concrete = c;
    TX.ready = true;
  }

  function pattern(ctx, img, scale, ox, oy) {
    const p = ctx.createPattern(img, 'repeat');
    if (p && p.setTransform && root.DOMMatrix) p.setTransform(new DOMMatrix().translate(ox || 0, oy || 0).scale(scale || 1));
    return p;
  }

  // Egy textúrát egy alakzatba „ráfest” megadott keveréssel.
  function texFill(ctx, pathFn, img, alpha, mode, scale, ox, oy) {
    ctx.save(); pathFn(ctx); ctx.clip();
    ctx.globalAlpha = alpha; ctx.globalCompositeOperation = mode || 'overlay';
    ctx.fillStyle = pattern(ctx, img, scale || 1, ox, oy);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function glow(ctx, x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace('A', a)); g.addColorStop(0.35, color.replace('A', a * 0.35)); g.addColorStop(1, color.replace('A', 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function quad(ctx, p) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]); ctx.closePath(); }

  // ---------------------------------------------------------------- KÜLSŐ ELEMEK
  function sky(ctx, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function clouds(ctx, t, y, h, speed, alpha, tint) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const img = TX.cloud, sw = 1600, off = ((t * speed) % sw + sw) % sw;
    if (tint) {
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.filter = tint || 'none';
    ctx.drawImage(img, -off, y, sw, h); ctx.drawImage(img, sw - off, y, sw, h);
    ctx.filter = 'none';
    ctx.restore();
  }

  function fogBand(ctx, t, y, h, speed, alpha, color) {
    ctx.save(); ctx.globalAlpha = alpha;
    const sw = 1800, off = ((t * speed) % sw + sw) % sw;
    const tmp = TX.fogTint && TX.fogTint[color];
    let img = tmp;
    if (!img) {
      img = mk(TX.fog.width, TX.fog.height); const x = img.getContext('2d');
      x.drawImage(TX.fog, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, img.width, img.height);
      (TX.fogTint = TX.fogTint || {})[color] = img;
    }
    ctx.drawImage(img, -off, y, sw, h); ctx.drawImage(img, sw - off, y, sw, h);
    ctx.restore();
  }

  function ridge(seed, y0, amp, rough) {
    const r = rng(seed), pts = [];
    let v = 0;
    for (let i = 0; i <= 64; i++) {
      v = v * 0.65 + (r() - 0.5) * rough;
      pts.push([(i / 64) * W, y0 + Math.sin(i * 0.21 + seed) * amp * 0.6 + v * amp]);
    }
    return pts;
  }
  function drawRidge(ctx, pts, color) {
    ctx.beginPath(); ctx.moveTo(0, H);
    pts.forEach((p) => ctx.lineTo(p[0], p[1]));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }

  function pine(ctx, x, y, h, w, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    const layers = 7;
    ctx.moveTo(x, y - h);
    for (let i = 1; i <= layers; i++) {
      const yy = y - h + (h * 0.92 * i) / layers, ww = (w * i) / layers;
      ctx.lineTo(x + ww * 0.55, yy - h * 0.02); ctx.lineTo(x + ww * 0.25, yy - h * 0.03);
    }
    ctx.lineTo(x + w * 0.08, y); ctx.lineTo(x - w * 0.08, y);
    for (let i = layers; i >= 1; i--) {
      const yy = y - h + (h * 0.92 * i) / layers, ww = (w * i) / layers;
      ctx.lineTo(x - ww * 0.25, yy - h * 0.03); ctx.lineTo(x - ww * 0.55, yy - h * 0.02);
    }
    ctx.closePath(); ctx.fill();
  }

  function forestBand(seed, y, hMin, hMax, count, color) {
    const c = mk(W, H), x = c.getContext('2d'), r = rng(seed);
    const arr = [];
    for (let i = 0; i < count; i++) arr.push([r() * (W + 100) - 50, y + r() * 30, hMin + r() * (hMax - hMin)]);
    arr.sort((a, b) => a[1] - b[1]);
    arr.forEach(([px, py, h]) => pine(x, px, py, h, h * (0.32 + r() * 0.12), color));
    x.fillStyle = color; x.fillRect(0, y + 25, W, H - y);
    return c;
  }

  // Rácsos antennatorony, feszítőkötelekkel
  function mast(ctx, cx, base, top, wb, color, t, blink) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 1.6;
    const wt = wb * 0.12, n = 22;
    const L = (y) => cx - lerp(wb, wt, (base - y) / (base - top)) / 2;
    const Rr = (y) => cx + lerp(wb, wt, (base - y) / (base - top)) / 2;
    ctx.beginPath(); ctx.moveTo(L(base), base); ctx.lineTo(L(top), top); ctx.moveTo(Rr(base), base); ctx.lineTo(Rr(top), top); ctx.stroke();
    ctx.lineWidth = 0.9;
    for (let i = 0; i < n; i++) {
      const y1 = lerp(base, top, i / n), y2 = lerp(base, top, (i + 1) / n);
      ctx.beginPath(); ctx.moveTo(L(y1), y1); ctx.lineTo(Rr(y2), y2); ctx.moveTo(Rr(y1), y1); ctx.lineTo(L(y2), y2);
      ctx.moveTo(L(y2), y2); ctx.lineTo(Rr(y2), y2); ctx.stroke();
    }
    // feszítőkötelek
    ctx.globalAlpha = 0.55; ctx.lineWidth = 0.7;
    [0.35, 0.65, 0.92].forEach((f) => {
      const y = lerp(base, top, f);
      ctx.beginPath(); ctx.moveTo(cx, y); ctx.quadraticCurveTo(cx - 260 * f, (y + base) / 2 + 20, cx - 420 * f - 60, base + 40);
      ctx.moveTo(cx, y); ctx.quadraticCurveTo(cx + 260 * f, (y + base) / 2 + 20, cx + 420 * f + 60, base + 40); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // piros jelzőfény
    const on = blink ? (Math.sin(t * 3.2) > 0.1 ? 1 : 0.08) : 1;
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, top - 4, 60, 'rgba(255,40,30,A)', 0.55 * on);
    glow(ctx, cx, top - 4, 10, 'rgba(255,180,160,A)', 0.9 * on);
    const y2 = lerp(base, top, 0.5);
    glow(ctx, cx, y2, 30, 'rgba(255,40,30,A)', 0.4 * on);
    ctx.restore();
  }

  // Az állomás főépülete
  function building(ctx, x, y, w, h, lit, t, wall) {
    ctx.save();
    ctx.fillStyle = wall || '#1c1f24';
    ctx.fillRect(x, y, w, h);
    texFill(ctx, (c) => c.rect(x, y, w, h), TX.concrete, 0.5, 'overlay', 0.8);
    // tető, párkány, kémény, parabola
    ctx.fillStyle = '#121418'; ctx.fillRect(x - 6, y - 8, w + 12, 10);
    ctx.fillRect(x + w * 0.72, y - 38, 18, 32);
    ctx.beginPath(); ctx.ellipse(x + w * 0.2, y - 24, 22, 16, -0.5, 0, TAU); ctx.fill();
    ctx.fillRect(x + w * 0.2 - 2, y - 24, 4, 18);
    // ablakok
    const cols = Math.floor(w / 70), r = rng(9);
    for (let row = 0; row < 2; row++)
      for (let i = 0; i < cols; i++) {
        const wx = x + 22 + i * (w - 30) / cols, wy = y + 28 + row * h * 0.42, ww = 34, wh = 26;
        const on = lit && r() > 0.45;
        const fl = on ? 0.85 + 0.15 * Math.sin(t * 40 + i * 7) * (r() > 0.8 ? 1 : 0) : 0;
        ctx.fillStyle = on ? `rgba(255,${190 + 20 * fl | 0},120,${0.85 * fl})` : '#0b0c0e';
        ctx.fillRect(wx, wy, ww, wh);
        ctx.fillStyle = '#0a0b0d'; ctx.fillRect(wx + ww / 2 - 1, wy, 2, wh); ctx.fillRect(wx, wy + wh / 2 - 1, ww, 2);
        if (on) { ctx.globalCompositeOperation = 'lighter'; glow(ctx, wx + ww / 2, wy + wh / 2, 70, 'rgba(255,170,90,A)', 0.18); ctx.globalCompositeOperation = 'source-over'; }
      }
    // ajtó
    ctx.fillStyle = '#090a0c'; ctx.fillRect(x + w * 0.46, y + h - 70, 46, 70);
    ctx.restore();
  }

  function fence(ctx, y, color, gateX) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    for (let x = -10; x < W + 20; x += 46) {
      if (gateX && Math.abs(x - gateX) < 90) continue;
      ctx.beginPath(); ctx.moveTo(x, y + 90); ctx.lineTo(x, y); ctx.stroke();
    }
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0, y + 10 + i * 34); ctx.lineTo(gateX ? gateX - 90 : W, y + 10 + i * 34); if (gateX) { ctx.moveTo(gateX + 90, y + 10 + i * 34); ctx.lineTo(W, y + 10 + i * 34); } ctx.stroke(); }
    // drótháló
    ctx.globalAlpha = 0.25; ctx.lineWidth = 0.6;
    for (let x = 0; x < W; x += 9) { if (gateX && Math.abs(x - gateX) < 90) continue; ctx.beginPath(); ctx.moveTo(x, y + 90); ctx.lineTo(x + 30, y); ctx.moveTo(x + 30, y + 90); ctx.lineTo(x, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // szögesdrót
    ctx.beginPath();
    for (let x = 0; x < W; x += 12) ctx.arc(x, y - 6, 6, 0, TAU);
    ctx.globalAlpha = 0.5; ctx.stroke(); ctx.restore();
  }

  // Eső: előre generált cseppek, gyors, ferde vonalak
  const RAIN = [];
  (function () { const r = rng(42); for (let i = 0; i < 520; i++) RAIN.push([r() * W, r() * H, 0.5 + r() * 0.8, r()]); })();
  function rain(ctx, t, amount, angle, color) {
    ctx.save(); ctx.strokeStyle = color || 'rgba(190,205,225,0.28)'; ctx.lineWidth = 1;
    const n = Math.floor(RAIN.length * amount), dx = angle || -0.25;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const [x0, y0, sp, z] = RAIN[i];
      const y = (y0 + t * 900 * sp) % (H + 60) - 30, x = (x0 + t * 900 * sp * dx) % W;
      const len = 14 + 22 * z;
      ctx.moveTo((x + W) % W, y); ctx.lineTo((x + W) % W + len * dx, y + len);
    }
    ctx.stroke(); ctx.restore();
  }

  // Villám
  function bolt(ctx, x0, seed, alpha) {
    const r = rng(seed);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const draw = (x, y, a, len, depth, wdt) => {
      ctx.beginPath(); ctx.moveTo(x, y);
      let cx = x, cy = y;
      for (let i = 0; i < len; i++) {
        cx += (r() - 0.5) * 38 + a; cy += 18 + r() * 22;
        ctx.lineTo(cx, cy);
        if (depth < 2 && r() < 0.12) { ctx.stroke(); draw(cx, cy, (r() - 0.5) * 30, len / 2 | 0, depth + 1, wdt * 0.5); ctx.beginPath(); ctx.moveTo(cx, cy); }
      }
      ctx.stroke();
    };
    ctx.strokeStyle = `rgba(200,210,255,${alpha * 0.35})`; ctx.lineWidth = 9; ctx.shadowBlur = 30; ctx.shadowColor = 'rgba(150,170,255,1)';
    draw(x0, -10, 0, 22, 0, 9);
    ctx.strokeStyle = `rgba(245,248,255,${alpha})`; ctx.lineWidth = 2; ctx.shadowBlur = 0;
    const r2 = rng(seed); void r2;
    ctx.restore();
  }

  // ---------------------------------------------------------------- BELSŐ ELEMEK (egypontos perspektíva)
  // Doboz-szoba: a hátsó fal téglalapja (bx,by,bw,bh), a kamera a középpontból néz.
  function roomBox(ctx, back, cols) {
    const [bx, by, bw, bh] = back;
    const shade = (c, p) => { ctx.fillStyle = c; quad(ctx, p); ctx.fill(); };
    // padló
    shade(cols.floor, [0, H, W, H, bx + bw, by + bh, bx, by + bh]);
    // plafon
    shade(cols.ceil, [0, 0, W, 0, bx + bw, by, bx, by]);
    // bal, jobb fal
    shade(cols.wallL, [0, 0, bx, by, bx, by + bh, 0, H]);
    shade(cols.wallR, [W, 0, bx + bw, by, bx + bw, by + bh, W, H]);
    // hátsó fal
    ctx.fillStyle = cols.back; ctx.fillRect(bx, by, bw, bh);
    // textúra
    texFill(ctx, (c) => { quad(c, [0, 0, bx, by, bx, by + bh, 0, H]); }, TX.concrete, 0.55, 'overlay', 1.4);
    texFill(ctx, (c) => { quad(c, [W, 0, bx + bw, by, bx + bw, by + bh, W, H]); }, TX.concrete, 0.55, 'overlay', 1.4, 200);
    texFill(ctx, (c) => c.rect(bx, by, bw, bh), TX.concrete, 0.5, 'overlay', 0.9);
    texFill(ctx, (c) => { quad(c, [0, H, W, H, bx + bw, by + bh, bx, by + bh]); }, TX.n2, 0.45, 'overlay', 1.2);
    // mélységi sötétítés a sarkok felé
    const g = ctx.createRadialGradient(bx + bw / 2, by + bh / 2, Math.min(bw, bh) * 0.3, bx + bw / 2, by + bh / 2, W * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // élek
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bx, by); ctx.moveTo(W, 0); ctx.lineTo(bx + bw, by); ctx.moveTo(0, H); ctx.lineTo(bx, by + bh); ctx.moveTo(W, H); ctx.lineTo(bx + bw, by + bh); ctx.stroke();
  }

  // Folyosó: mélységbe nyúló szegmensek, ajtókkal és neonokkal.
  function corridorGeom(vx, vy) {
    // z: 0 (kamera) .. 1 (végtelen); a falak 1/z szerint zsugorodnak
    const P = (xw, yw, z) => [vx + (xw - vx) * (1 - z), vy + (yw - vy) * (1 - z)];
    return P;
  }

  function corridor(ctx, opt) {
    const vx = opt.vx || W / 2, vy = opt.vy || H * 0.47;
    const P = corridorGeom(vx, vy);
    const L = -260, Rr = W + 260, T = -120, B = H + 80;
    const zs = [0, 0.38, 0.6, 0.74, 0.83, 0.89, 0.93, 0.955, 0.972];
    // alapfelületek
    const g1 = ctx.createLinearGradient(0, B, 0, vy);
    g1.addColorStop(0, opt.floor[0]); g1.addColorStop(1, opt.floor[1]);
    ctx.fillStyle = g1; quad(ctx, [L, B, Rr, B, vx + 1, vy, vx - 1, vy]); ctx.fill();
    const g2 = ctx.createLinearGradient(0, T, 0, vy);
    g2.addColorStop(0, opt.ceil[0]); g2.addColorStop(1, opt.ceil[1]);
    ctx.fillStyle = g2; quad(ctx, [L, T, Rr, T, vx + 1, vy, vx - 1, vy]); ctx.fill();
    const g3 = ctx.createLinearGradient(L, 0, vx, 0);
    g3.addColorStop(0, opt.wall[0]); g3.addColorStop(1, opt.wall[1]);
    ctx.fillStyle = g3; quad(ctx, [L, T, vx, vy, vx, vy, L, B]); ctx.fill();
    const g4 = ctx.createLinearGradient(Rr, 0, vx, 0);
    g4.addColorStop(0, opt.wall[0]); g4.addColorStop(1, opt.wall[1]);
    ctx.fillStyle = g4; quad(ctx, [Rr, T, vx, vy, vx, vy, Rr, B]); ctx.fill();
    texFill(ctx, (c) => quad(c, [L, T, vx, vy, L, B]), TX.concrete, 0.5, 'overlay', 1.6);
    texFill(ctx, (c) => quad(c, [Rr, T, vx, vy, Rr, B]), TX.concrete, 0.5, 'overlay', 1.6, 300);
    texFill(ctx, (c) => quad(c, [L, B, Rr, B, vx, vy]), TX.n2, 0.4, 'overlay', 1.4);
    // lábazati csík, kábelcsatorna
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 3;
    const [a1x, a1y] = P(L, H * 0.78, 0), [a2x, a2y] = P(Rr, H * 0.78, 0);
    ctx.beginPath(); ctx.moveTo(a1x, a1y); ctx.lineTo(vx, vy); ctx.moveTo(a2x, a2y); ctx.lineTo(vx, vy); ctx.stroke();
    ctx.strokeStyle = opt.stripe || 'rgba(120,110,60,0.35)'; ctx.lineWidth = 5;
    const [s1x, s1y] = P(L, H * 0.62, 0), [s2x, s2y] = P(Rr, H * 0.62, 0);
    ctx.beginPath(); ctx.moveTo(s1x, s1y); ctx.lineTo(vx, vy); ctx.moveTo(s2x, s2y); ctx.lineTo(vx, vy); ctx.stroke();
    // ajtók a falakon
    const doors = opt.doors || [[0.15, 'L'], [0.45, 'R'], [0.66, 'L'], [0.8, 'R']];
    doors.forEach(([z, side], i) => {
      const z2 = z + (1 - z) * 0.09;
      const xw = side === 'L' ? L : Rr;
      const a = P(xw, H * 0.18, z), b = P(xw, H * 0.18, z2), c = P(xw, B - 10, z2), d = P(xw, B - 10, z);
      ctx.fillStyle = i === opt.openDoor ? '#020203' : '#2a2c2e';
      quad(ctx, [...a, ...b, ...c, ...d]); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 2; ctx.stroke();
      texFill(ctx, (cc) => quad(cc, [...a, ...b, ...c, ...d]), TX.n1, 0.5, 'overlay', 0.6);
      // kilincs
      const hm = P(xw, H * 0.6, z + (z2 - z) * 0.82);
      ctx.fillStyle = 'rgba(160,150,120,0.6)'; ctx.fillRect(hm[0] - 2, hm[1] - 2, 5, 3);
    });
    // a folyosó vége
    const e = P(L, T, zs[zs.length - 1]), f = P(Rr, B, zs[zs.length - 1]);
    ctx.fillStyle = opt.end || '#050506'; ctx.fillRect(e[0], e[1], f[0] - e[0], f[1] - e[1]);
    // neoncsövek a plafonon (pozíciók)
    const tubes = [];
    for (let i = 0; i < 6; i++) {
      const z = [0.12, 0.42, 0.62, 0.76, 0.85, 0.91][i];
      const a = P(W / 2 - 70, T + 40, z), b = P(W / 2 + 70, T + 40, z);
      tubes.push([a, b, z]);
    }
    return { P, tubes, L, Rr, T, B, vx, vy };
  }

  // Neoncső, vibrálással
  function tube(ctx, a, b, on, color) {
    const [ax, ay] = a, [bx, by] = b;
    const th = Math.max(2, (bx - ax) * 0.05);
    ctx.save();
    ctx.fillStyle = on > 0.1 ? `rgba(235,245,255,${0.4 + 0.6 * on})` : '#2b2f33';
    ctx.fillRect(ax, ay - th / 2, bx - ax, th);
    if (on > 0.05) {
      ctx.globalCompositeOperation = 'lighter';
      const cx = (ax + bx) / 2, w = bx - ax;
      const g = ctx.createRadialGradient(cx, ay, 0, cx, ay, w * 1.4);
      g.addColorStop(0, (color || 'rgba(200,225,255,A)').replace('A', 0.35 * on));
      g.addColorStop(1, (color || 'rgba(200,225,255,A)').replace('A', 0));
      ctx.fillStyle = g; ctx.fillRect(cx - w * 1.4, ay - w * 1.4, w * 2.8, w * 2.8);
    }
    ctx.restore();
  }

  // Lámpa-fényfolt a padlón / falon (fénytölcsér)
  function lightCone(ctx, x, y, w, h, color, a) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, color.replace('A', a)); g.addColorStop(1, color.replace('A', 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - w * 0.12, y); ctx.lineTo(x + w * 0.12, y); ctx.lineTo(x + w / 2, y + h); ctx.lineTo(x - w / 2, y + h); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Lebegő por a fényben
  const DUST = [];
  (function () { const r = rng(7); for (let i = 0; i < 140; i++) DUST.push([r() * W, r() * H, r(), r() * TAU]); })();
  function dust(ctx, t, a, region) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [x0, y0, z, ph] of DUST) {
      const x = (x0 + Math.sin(t * 0.3 + ph) * 30 + t * 6 * (z - 0.5)) % W, y = (y0 + Math.cos(t * 0.21 + ph) * 20 - t * 4 * z + H) % H;
      if (region && (x < region[0] || x > region[2] || y < region[1] || y > region[3])) continue;
      ctx.fillStyle = `rgba(255,240,220,${a * (0.3 + 0.7 * z)})`;
      ctx.fillRect(x, y, 1 + z * 1.6, 1 + z * 1.6);
    }
    ctx.restore();
  }

  // Sötétség-maszk zseblámpafénnyel: a fényeket „kivágjuk” a feketéből.
  const MASK = { c: null };
  function darkness(ctx, level, lights) {
    if (!MASK.c) MASK.c = mk(W, H);
    const m = MASK.c.getContext('2d');
    m.globalCompositeOperation = 'source-over';
    m.clearRect(0, 0, W, H);
    m.fillStyle = `rgba(0,0,0,${level})`; m.fillRect(0, 0, W, H);
    m.globalCompositeOperation = 'destination-out';
    for (const L of lights) {
      const g = m.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
      g.addColorStop(0, `rgba(0,0,0,${L.a || 1})`); g.addColorStop(0.55, `rgba(0,0,0,${(L.a || 1) * 0.6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = g;
      if (L.sx) { m.save(); m.translate(L.x, L.y); m.scale(L.sx, L.sy || 1); m.translate(-L.x, -L.y); }
      m.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
      if (L.sx) m.restore();
    }
    ctx.drawImage(MASK.c, 0, 0);
    // meleg fény a kivágott helyekre
    ctx.save(); ctx.globalCompositeOperation = 'soft-light';
    for (const L of lights) if (L.warm) glow(ctx, L.x, L.y, L.r, 'rgba(255,200,140,A)', 0.5);
    ctx.restore();
  }

  // Két kézi zseblámpa (a két szereplő): természetes imbolygás
  function flashlights(t, n, cx, cy, spread) {
    const out = [];
    for (let i = 0; i < (n || 2); i++) {
      const ph = i * 2.3;
      out.push({
        x: (cx || W / 2) + (i - 0.5) * (spread || 260) + Math.sin(t * 0.7 + ph) * 60 + Math.sin(t * 2.3 + ph) * 8,
        y: (cy || H * 0.52) + Math.cos(t * 0.5 + ph) * 40 + Math.sin(t * 3.1 + ph) * 5,
        r: 230 + Math.sin(t * 1.3 + ph) * 15, sx: 1.25, sy: 0.9, warm: true,
      });
    }
    return out;
  }

  // Vibráló fény állapot (neon): többnyire ég, néha kihagy
  function flicker(t, seed, rate) {
    const k = Math.floor(t * (rate || 9) + seed * 13.1);
    const r = rng(k * 7 + seed)();
    if (r < 0.05) return 0.05;
    if (r < 0.12) return 0.55;
    return 0.95 + 0.05 * Math.sin(t * 120);
  }

  // ---------------------------------------------------------------- BERENDEZÉSI TÁRGYAK
  function rack(ctx, x, y, w, h, t, seed) {
    const r = rng(seed);
    ctx.fillStyle = '#23272b'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    let yy = y + 8;
    while (yy < y + h - 20) {
      const uh = 18 + r() * 34;
      ctx.fillStyle = r() > 0.5 ? '#2f343a' : '#3a3f44'; ctx.fillRect(x + 5, yy, w - 10, uh - 4);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 5, yy + uh - 6, w - 10, 2);
      const k = 1 + (r() * 4) | 0;
      for (let i = 0; i < k; i++) {
        const dx = x + 14 + i * (w - 28) / k + 6, dy = yy + uh / 2 - 2;
        if (r() > 0.5) { ctx.fillStyle = '#121416'; ctx.beginPath(); ctx.arc(dx, dy, Math.min(7, uh / 3), 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a8f94'; ctx.lineWidth = 1; ctx.stroke(); }
        else {
          const on = Math.sin(t * (1 + r() * 4) + seed + i) > 0.2;
          const col = r() > 0.7 ? '255,60,40' : r() > 0.5 ? '255,190,60' : '80,255,120';
          ctx.fillStyle = on ? `rgba(${col},1)` : `rgba(${col},0.15)`;
          ctx.fillRect(dx - 2, dy - 2, 4, 4);
          if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, dx, dy, 12, `rgba(${col},A)`, 0.5); ctx.restore(); }
        }
      }
      yy += uh;
    }
  }

  function scope(ctx, x, y, w, h, t, col) {
    ctx.fillStyle = '#0a120c'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(80,255,140,0.12)'; ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x + (w * i) / 6, y); ctx.lineTo(x + (w * i) / 6, y + h); ctx.stroke(); }
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x, y + (h * i) / 4); ctx.lineTo(x + w, y + (h * i) / 4); ctx.stroke(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = col || 'rgba(110,255,160,0.9)'; ctx.lineWidth = 1.6; ctx.shadowBlur = 8; ctx.shadowColor = '#5f8';
    ctx.beginPath();
    for (let i = 0; i <= w; i += 2) {
      const ph = i / w * TAU * 3 + t * 4;
      const v = Math.sin(ph) * 0.5 + Math.sin(ph * 0.33 + t) * 0.3 + Math.sin(ph * 7.1 + t * 9) * 0.06;
      ctx.lineTo(x + i, y + h / 2 + v * h * 0.35);
    }
    ctx.stroke(); ctx.restore();
  }

  function reel(ctx, x, y, r, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t);
    ctx.fillStyle = '#16181a'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3c2a1c'; ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, TAU); ctx.fill();
    ctx.fillStyle = '#9aa0a6';
    for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.arc(r * 0.5, 0, r * 0.18, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function desk(ctx, x, y, w, h, top) {
    ctx.fillStyle = top || '#3a2d22'; ctx.fillRect(x, y, w, 12);
    ctx.fillStyle = '#271d16'; ctx.fillRect(x + 6, y + 12, w * 0.32, h);
    ctx.fillRect(x + w - 16, y + 12, 10, h);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 6, y + 12, w * 0.32, 4);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#7a6a50'; ctx.fillRect(x + 6 + w * 0.14, y + 24 + i * h / 3.2, 14, 3); }
  }

  function lamp(ctx, x, y, t, on) {
    ctx.strokeStyle = '#151515'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18, y - 50); ctx.lineTo(x + 46, y - 66); ctx.stroke();
    ctx.fillStyle = '#2b4a35'; ctx.beginPath(); ctx.moveTo(x + 30, y - 80); ctx.lineTo(x + 70, y - 58); ctx.lineTo(x + 52, y - 46); ctx.closePath(); ctx.fill();
    if (on) lightCone(ctx, x + 60, y - 50, 260, 120, 'rgba(255,200,120,A)', 0.22 * on);
  }

  function shelves(ctx, back, t, seed, burning) {
    // archívum: perspektivikus polcsorok
    const [bx, by, bw, bh] = back, r = rng(seed);
    for (let side = 0; side < 2; side++) {
      for (let k = 0; k < 4; k++) {
        const z0 = k / 4, z1 = z0 + 0.2;
        const xa = side ? lerp(W - 30, bx + bw, z0) : lerp(30, bx, z0), xb = side ? lerp(W - 30, bx + bw, z1) : lerp(30, bx, z1);
        const ya = lerp(40, by, z0), yb = lerp(40, by, z1), ya2 = lerp(H - 20, by + bh, z0), yb2 = lerp(H - 20, by + bh, z1);
        ctx.fillStyle = '#1b1d1f'; quad(ctx, [xa, ya, xb, yb, xb, yb2, xa, ya2]); ctx.fill();
        const rows = 6;
        for (let i = 0; i < rows; i++) {
          const f = (i + 0.5) / rows;
          const y1 = lerp(ya, ya2, f), y2 = lerp(yb, yb2, f);
          ctx.strokeStyle = '#3b3e40'; ctx.lineWidth = 3 * (1 - z0 * 0.7);
          ctx.beginPath(); ctx.moveTo(xa, y1); ctx.lineTo(xb, y2); ctx.stroke();
          // szalagdobozok
          const n = 6;
          for (let j = 0; j < n; j++) {
            const g = j / n, xx = lerp(xa, xb, g), yy = lerp(y1, y2, g), hh = (ya2 - ya) / rows * (1 - g * 0.2) * 0.7 * (1 - z0 * 0.3);
            ctx.fillStyle = r() > 0.6 ? '#6d6a63' : r() > 0.3 ? '#4f4d48' : '#857e70';
            ctx.fillRect(xx, yy - hh, Math.abs(xb - xa) / n * 0.8, hh);
          }
        }
      }
    }
    void burning;
  }

  function flames(ctx, t, x, y, w, h, a) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const ph = i * 1.71, fx = x + (i / 26) * w + Math.sin(t * 3 + ph) * 12;
      const fh = h * (0.4 + 0.6 * Math.abs(Math.sin(t * 2.2 + ph * 1.3)));
      const g = ctx.createRadialGradient(fx, y, 0, fx, y - fh * 0.4, fh);
      g.addColorStop(0, `rgba(255,220,140,${0.5 * a})`); g.addColorStop(0.3, `rgba(255,120,30,${0.35 * a})`); g.addColorStop(1, 'rgba(120,20,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(fx, y - fh * 0.45, fh * 0.28, fh * 0.6, Math.sin(t * 4 + ph) * 0.15, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function embers(ctx, t, a) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) {
      const ph = i * 3.13, x = (i * 97 + Math.sin(t * 0.8 + ph) * 60) % W, y = H - ((t * (40 + (i % 7) * 15) + i * 53) % (H + 40));
      ctx.fillStyle = `rgba(255,${140 + (i % 5) * 20},60,${a * (0.4 + 0.6 * Math.abs(Math.sin(t * 5 + ph)))})`;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  }

  function smoke(ctx, t, a, y) {
    ctx.save(); ctx.globalAlpha = a;
    const off = (t * 25) % 1200;
    ctx.filter = 'brightness(0.25)';
    ctx.drawImage(TX.smoke, -off, y || -80, 1200, 600); ctx.drawImage(TX.smoke, 1200 - off, y || -80, 1200, 600);
    ctx.filter = 'none'; ctx.restore();
  }

  // Emberi sziluett (álló, oldalnézet nélkül), opcionálisan zseblámpával
  function figure(ctx, x, y, h, color, opt) {
    opt = opt || {};
    ctx.save(); ctx.fillStyle = color;
    const s = h / 180;
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath();
    ctx.ellipse(0, -165, 13, 16, opt.tilt || 0, 0, TAU); // fej
    ctx.moveTo(-28, -140); ctx.quadraticCurveTo(-34, -90, -26, -70); ctx.lineTo(-20, 0); ctx.lineTo(-6, 0); ctx.lineTo(0, -60);
    ctx.lineTo(6, 0); ctx.lineTo(20, 0); ctx.lineTo(26, -70); ctx.quadraticCurveTo(34, -90, 28, -140); ctx.quadraticCurveTo(0, -150, -28, -140);
    ctx.fill();
    if (opt.mask) {
      ctx.fillStyle = 'rgba(160,170,160,0.35)';
      ctx.beginPath(); ctx.arc(-5, -167, 4, 0, TAU); ctx.arc(6, -167, 4, 0, TAU); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -152, 7, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // Megnyúlt, eltört nyakú lény (hallucináció)
  function creature(ctx, x, y, h, t, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
    const s = h / 260; ctx.scale(s, s);
    const j = (k) => Math.sin(t * 23 + k) * 1.5;
    ctx.fillStyle = '#030303';
    ctx.beginPath();
    ctx.moveTo(-16 + j(1), 0); ctx.lineTo(-10, -110); ctx.lineTo(-30 + j(2), -150); ctx.lineTo(-44, -40 + j(3)); ctx.lineTo(-50, 20);
    ctx.lineTo(-38, 22); ctx.lineTo(-30, -110); ctx.lineTo(-24, -205); ctx.quadraticCurveTo(0, -220, 24, -205);
    ctx.lineTo(34, -120); ctx.lineTo(52, -20 + j(4)); ctx.lineTo(58, 30); ctx.lineTo(46, 30); ctx.lineTo(40, -60); ctx.lineTo(26, -120);
    ctx.lineTo(14, -110); ctx.lineTo(18 + j(5), 0); ctx.closePath(); ctx.fill();
    // fej, rossz szögben
    ctx.save(); ctx.translate(10, -214); ctx.rotate(1.05 + Math.sin(t * 1.7) * 0.05);
    ctx.beginPath(); ctx.ellipse(0, -26, 17, 30, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#12080a'; ctx.beginPath(); ctx.ellipse(0, -22, 7, 12, 0, 0, TAU); ctx.fill();
    ctx.restore();
    // peremfény
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(140,160,190,0.25)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- HELYSZÍNEK
  const SC = {};

  // --- külső: kapu (alkony / éjjel)
  function gateScene(ctx, t, mode) {
    const night = mode === 'night';
    sky(ctx, night
      ? [[0, '#05070c'], [0.55, '#0d1422'], [1, '#141a24']]
      : [[0, '#0d1220'], [0.45, '#2a2c3f'], [0.68, '#6b4a4a'], [0.8, '#b36a3f'], [1, '#2a2020']]);
    if (!night) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.72, H * 0.72, 380, 'rgba(255,120,60,A)', 0.35); ctx.restore(); }
    else { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.82, H * 0.16, 120, 'rgba(200,215,255,A)', 0.25); ctx.fillStyle = 'rgba(230,235,255,0.9)'; ctx.beginPath(); ctx.arc(W * 0.82, H * 0.16, 18, 0, TAU); ctx.fill(); ctx.restore(); }
    clouds(ctx, t, -40, 380, 8, night ? 0.35 : 0.55, night ? 'brightness(0.25)' : 'brightness(0.55) sepia(0.6) hue-rotate(-20deg)');
    const cache = SC._gate || (SC._gate = { r1: ridge(5, H * 0.58, 40, 1.2), r2: ridge(8, H * 0.64, 28, 1), f: forestBand(12, H * 0.68, 50, 130, 70, '#07080a') });
    drawRidge(ctx, cache.r1, night ? '#0b0f17' : '#2a2430');
    drawRidge(ctx, cache.r2, night ? '#080b11' : '#1b1820');
    fogBand(ctx, t, H * 0.52, 140, 6, night ? 0.25 : 0.35, night ? '#5a6a80' : '#b07a6a');
    mast(ctx, W * 0.6, H * 0.6, H * 0.04, 70, night ? '#05070a' : '#0d0b0e', t, true);
    building(ctx, W * 0.42, H * 0.52, 340, 110, night, t, night ? '#0e1014' : '#17151a');
    ctx.drawImage(cache.f, 0, 0);
    fence(ctx, H * 0.7, night ? '#0a0b0e' : '#100e10', W * 0.5);
    // kapuoszlopok
    ctx.fillStyle = '#0c0c0e'; ctx.fillRect(W * 0.5 - 98, H * 0.66, 18, 140); ctx.fillRect(W * 0.5 + 80, H * 0.66, 18, 140);
    // út
    ctx.fillStyle = night ? '#0a0b0d' : '#141214';
    quad(ctx, [W * 0.5 - 70, H * 0.8, W * 0.5 + 70, H * 0.8, W * 0.8, H, W * 0.2, H]); ctx.fill();
    texFill(ctx, (c) => quad(c, [W * 0.5 - 70, H * 0.8, W * 0.5 + 70, H * 0.8, W * 0.8, H, W * 0.2, H]), TX.n2, 0.4, 'overlay', 0.7);
    fogBand(ctx, t, H * 0.78, 160, 14, 0.3, night ? '#3a4458' : '#6a4a48');
    if (night) rain(ctx, t, 0.5);
  }
  SC.gate_dusk = (ctx, t) => gateScene(ctx, t, 'dusk');
  SC.gate_night = (ctx, t) => gateScene(ctx, t, 'night');

  // --- udvar a toronnyal
  function courtyard(ctx, t, mode) {
    const storm = mode === 'storm', dawn = mode === 'dawn';
    sky(ctx, dawn ? [[0, '#1a2233'], [0.5, '#4a5266'], [0.75, '#a08080'], [1, '#c8a080']]
      : storm ? [[0, '#06080d'], [0.6, '#111824'], [1, '#0a0d12']] : [[0, '#0a0e18'], [0.6, '#1a2030'], [1, '#202838']]);
    clouds(ctx, t, -60, 420, storm ? 40 : 10, storm ? 0.75 : 0.45, dawn ? 'brightness(0.8) sepia(0.4)' : 'brightness(0.22)');
    const cache = SC._court || (SC._court = { r: ridge(31, H * 0.62, 30, 1.1), f: forestBand(44, H * 0.66, 40, 110, 50, '#060708') });
    drawRidge(ctx, cache.r, dawn ? '#3a3a48' : '#090c12');
    mast(ctx, W * 0.33, H * 0.86, -40, 120, dawn ? '#1a1a22' : '#030405', t, !dawn);
    ctx.drawImage(cache.f, 0, 0);
    building(ctx, W * 0.5, H * 0.5, 560, 230, !dawn, t, dawn ? '#3a3a40' : '#121418');
    // udvar betonja
    const g = ctx.createLinearGradient(0, H * 0.82, 0, H);
    g.addColorStop(0, dawn ? '#3a3a3e' : '#0d0e10'); g.addColorStop(1, dawn ? '#2a2a2e' : '#060607');
    ctx.fillStyle = g; ctx.fillRect(0, H * 0.82, W, H * 0.18);
    texFill(ctx, (c) => c.rect(0, H * 0.82, W, H * 0.18), TX.n2, 0.4, 'overlay', 0.8);
    // tócsák tükröződése
    if (!dawn) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.33, H * 0.93, 50, 'rgba(255,40,30,A)', 0.2 * (Math.sin(t * 3.2) > 0.1 ? 1 : 0.1)); ctx.restore(); }
    fogBand(ctx, t, H * 0.7, 200, storm ? 40 : 10, storm ? 0.35 : 0.25, dawn ? '#c0a8a0' : '#2a3448');
    if (storm) rain(ctx, t, 1, -0.35);
  }
  SC.courtyard = (ctx, t) => courtyard(ctx, t, 'normal');
  SC.courtyard_storm = (ctx, t) => courtyard(ctx, t, 'storm');
  SC.courtyard_dawn = (ctx, t) => courtyard(ctx, t, 'dawn');

  // --- torony töve viharban, kábelakna
  SC.tower_storm = (ctx, t) => {
    sky(ctx, [[0, '#04060a'], [1, '#0e141c']]);
    clouds(ctx, t, -80, 460, 60, 0.8, 'brightness(0.2)');
    // óriási tartóláb, alulról nézve
    ctx.save(); ctx.strokeStyle = '#020203'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(W * 0.3, H); ctx.lineTo(W * 0.47, -40); ctx.moveTo(W * 0.78, H); ctx.lineTo(W * 0.55, -40); ctx.stroke();
    ctx.lineWidth = 5;
    for (let i = 0; i < 9; i++) {
      const f = i / 9, f2 = (i + 1) / 9;
      const xl = lerp(W * 0.3, W * 0.47, f), xr = lerp(W * 0.78, W * 0.55, f), y = lerp(H, -40, f);
      const xl2 = lerp(W * 0.3, W * 0.47, f2), xr2 = lerp(W * 0.78, W * 0.55, f2), y2 = lerp(H, -40, f2);
      ctx.beginPath(); ctx.moveTo(xl, y); ctx.lineTo(xr2, y2); ctx.moveTo(xr, y); ctx.lineTo(xl2, y2); ctx.moveTo(xl2, y2); ctx.lineTo(xr2, y2); ctx.stroke();
    }
    ctx.restore();
    // akna rács a földön
    ctx.fillStyle = '#08090a'; ctx.fillRect(0, H * 0.78, W, H * 0.22);
    ctx.fillStyle = '#020202'; quad(ctx, [W * 0.36, H * 0.82, W * 0.66, H * 0.82, W * 0.74, H * 0.98, W * 0.28, H * 0.98]); ctx.fill();
    ctx.strokeStyle = '#3a3c3e'; ctx.lineWidth = 3;
    for (let i = 0; i <= 10; i++) { const f = i / 10; ctx.beginPath(); ctx.moveTo(lerp(W * 0.36, W * 0.66, f), H * 0.82); ctx.lineTo(lerp(W * 0.28, W * 0.74, f), H * 0.98); ctx.stroke(); }
    // zümmögő kábel szikrával
    const hum = 0.5 + 0.5 * Math.sin(t * 60);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.5, H * 0.92, 120, 'rgba(120,150,255,A)', 0.12 + 0.05 * hum); ctx.restore();
    fogBand(ctx, t, H * 0.62, 220, 50, 0.3, '#2a3448');
    rain(ctx, t, 1, -0.4, 'rgba(200,210,230,0.35)');
  };

  // --- kapuház a Volvóval
  SC.gatehouse = (ctx, t) => {
    sky(ctx, [[0, '#05070b'], [1, '#10151d']]);
    clouds(ctx, t, -60, 380, 30, 0.6, 'brightness(0.18)');
    const cache = SC._gh || (SC._gh = { f: forestBand(71, H * 0.55, 80, 220, 60, '#040506') });
    ctx.drawImage(cache.f, 0, 0);
    // kapuház
    ctx.fillStyle = '#16181b'; ctx.fillRect(W * 0.55, H * 0.36, 360, 300);
    texFill(ctx, (c) => c.rect(W * 0.55, H * 0.36, 360, 300), TX.concrete, 0.6, 'overlay', 0.7);
    ctx.fillStyle = '#0c0d0f'; quad(ctx, [W * 0.55 - 20, H * 0.36, W * 0.55 + 380, H * 0.36, W * 0.55 + 340, H * 0.29, W * 0.55 + 20, H * 0.29]); ctx.fill();
    ctx.fillStyle = '#050607'; ctx.fillRect(W * 0.55 + 60, H * 0.45, 110, 80); // ablak (sötét)
    ctx.strokeStyle = '#222'; ctx.lineWidth = 4; ctx.strokeRect(W * 0.55 + 60, H * 0.45, 110, 80);
    // régi Volvo sziluett
    const cx = W * 0.27, cy = H * 0.86;
    ctx.fillStyle = '#0c120e';
    ctx.beginPath(); ctx.moveTo(cx - 220, cy); ctx.lineTo(cx - 220, cy - 60); ctx.lineTo(cx - 130, cy - 70); ctx.lineTo(cx - 90, cy - 130); ctx.lineTo(cx + 110, cy - 130);
    ctx.lineTo(cx + 150, cy - 72); ctx.lineTo(cx + 230, cy - 66); ctx.lineTo(cx + 235, cy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1c2a2e'; quad(ctx, [cx - 80, cy - 122, cx + 100, cy - 122, cx + 135, cy - 74, cx - 115, cy - 74]); ctx.fill();
    ctx.fillStyle = '#020202'; ctx.beginPath(); ctx.arc(cx - 140, cy, 34, 0, TAU); ctx.arc(cx + 150, cy, 34, 0, TAU); ctx.fill();
    // kesztyűtartó fénye (nyitva)
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, cx + 60, cy - 90, 70, 'rgba(255,210,150,A)', 0.25); ctx.restore();
    ctx.fillStyle = '#060707'; ctx.fillRect(0, H * 0.9, W, H * 0.1);
    fogBand(ctx, t, H * 0.68, 200, 30, 0.35, '#26303e');
    rain(ctx, t, 0.9, -0.3);
  };

  // --- erdő viharban / szakadék / hajnali erdő
  function forest(ctx, t, mode) {
    const dawn = mode === 'dawn';
    sky(ctx, dawn ? [[0, '#3a4256'], [1, '#a89890']] : [[0, '#030407'], [1, '#0b0f15']]);
    if (!dawn) clouds(ctx, t, -100, 400, 45, 0.6, 'brightness(0.15)');
    const cache = SC._for || (SC._for = { a: forestBand(101, H * 0.45, 200, 420, 30, '#0a0d10'), b: forestBand(102, H * 0.7, 300, 640, 16, '#030405') });
    fogBand(ctx, t, H * 0.3, 260, 12, dawn ? 0.6 : 0.3, dawn ? '#c8c0c0' : '#202838');
    ctx.save(); if (dawn) ctx.filter = 'brightness(2.6) saturate(0.6)'; ctx.drawImage(cache.a, 0, 0); ctx.restore();
    fogBand(ctx, t, H * 0.55, 240, 20, dawn ? 0.55 : 0.35, dawn ? '#d0c8c4' : '#1a222e');
    ctx.save(); if (dawn) ctx.filter = 'brightness(1.6)'; ctx.drawImage(cache.b, Math.sin(t * 0.3) * 6, 0); ctx.restore();
    if (!dawn) { darkness(ctx, 0.75, flashlights(t, 2, W * 0.5, H * 0.7, 300)); rain(ctx, t, 1, -0.3); }
  }
  SC.forest_storm = (ctx, t) => forest(ctx, t, 'storm');
  SC.dawn_forest = (ctx, t) => forest(ctx, t, 'dawn');
  SC.ravine = (ctx, t) => {
    sky(ctx, [[0, '#020305'], [1, '#090c11']]);
    clouds(ctx, t, -100, 380, 45, 0.5, 'brightness(0.12)');
    // a túlsó part sziklafala
    ctx.fillStyle = '#0a0c0f';
    quad(ctx, [W * 0.55, H * 0.2, W, H * 0.1, W, H, W * 0.62, H]); ctx.fill();
    texFill(ctx, (c) => quad(c, [W * 0.55, H * 0.2, W, H * 0.1, W, H, W * 0.62, H]), TX.n1, 0.6, 'overlay', 0.8);
    // mélység
    const g = ctx.createLinearGradient(0, H * 0.4, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g; ctx.fillRect(W * 0.3, H * 0.4, W * 0.35, H * 0.6);
    fogBand(ctx, t, H * 0.72, 220, 15, 0.4, '#1b2330');
    // innenső perem, sár, gyökerek
    ctx.fillStyle = '#060504';
    ctx.beginPath(); ctx.moveTo(0, H * 0.55); ctx.quadraticCurveTo(W * 0.25, H * 0.58, W * 0.42, H * 0.78); ctx.lineTo(W * 0.38, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0d0a07'; ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(W * 0.3 + i * 12, H * 0.66 + i * 18); ctx.quadraticCurveTo(W * 0.4 + i * 9, H * 0.75 + i * 14, W * 0.43 + i * 5, H * 0.9 + i * 6); ctx.stroke(); }
    darkness(ctx, 0.8, flashlights(t, 2, W * 0.32, H * 0.72, 220));
    rain(ctx, t, 1, -0.35);
  };

  // --- hajnali völgy (befejezések)
  SC.dawn_valley = (ctx, t) => {
    sky(ctx, [[0, '#1d2638'], [0.45, '#5b6178'], [0.7, '#c79a86'], [0.85, '#e8b98e'], [1, '#6a5a5a']]);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.5, H * 0.74, 520, 'rgba(255,170,110,A)', 0.4); ctx.restore();
    clouds(ctx, t, 20, 300, 5, 0.5, 'brightness(0.9) sepia(0.5)');
    const cache = SC._dv || (SC._dv = { r1: ridge(201, H * 0.6, 50, 1.2), r2: ridge(202, H * 0.68, 40, 1.1), r3: ridge(203, H * 0.78, 30, 1) });
    drawRidge(ctx, cache.r1, '#6a6070'); fogBand(ctx, t, H * 0.6, 120, 4, 0.5, '#e8c8b8');
    drawRidge(ctx, cache.r2, '#40384a'); fogBand(ctx, t, H * 0.7, 120, 6, 0.4, '#d8b8a8');
    drawRidge(ctx, cache.r3, '#221d28');
    // a távoli VK-7 tornya
    mast(ctx, W * 0.78, H * 0.62, H * 0.38, 16, '#2a2430', t, false);
  };

  // --- folyosók
  function corridorScene(ctx, t, mode) {
    const red = mode === 'red', dark = mode === 'dark';
    const c = corridor(ctx, {
      floor: red ? ['#2a0c0a', '#0b0303'] : ['#33332f', '#121211'],
      ceil: red ? ['#1d0807', '#080202'] : ['#2a2c2c', '#0e0f0f'],
      wall: red ? ['#3a1410', '#0c0404'] : ['#4a4a42', '#141412'],
      stripe: red ? 'rgba(120,20,10,0.5)' : 'rgba(150,120,40,0.4)',
      openDoor: 2,
    });
    if (!red && !dark) {
      c.tubes.forEach(([a, b, z], i) => {
        const on = i === 2 ? flicker(t, 3, 11) : i === 4 ? flicker(t, 9, 6) : 1;
        tube(ctx, a, b, on);
        if (on > 0.2) lightCone(ctx, (a[0] + b[0]) / 2, a[1], (b[0] - a[0]) * 3.4, (H - a[1]) * (1 - z) * 0.9 + 40, 'rgba(210,230,255,A)', 0.06 * on);
      });
      // tűzoltószekrény a bal falon
      const p1 = c.P(c.L, H * 0.3, 0.5), p2 = c.P(c.L, H * 0.55, 0.56);
      ctx.fillStyle = '#7a1410'; ctx.fillRect(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]);
      dust(ctx, t, 0.35);
      const fl = flicker(t, 3, 11);
      if (fl < 0.6) { ctx.fillStyle = `rgba(0,0,0,${0.35 * (1 - fl)})`; ctx.fillRect(0, 0, W, H); }
    } else if (red) {
      const pulse = 0.6 + 0.4 * Math.sin(t * 2.4);
      c.tubes.forEach(([a, b], i) => { if (i % 2) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, (a[0] + b[0]) / 2, a[1] + 10, (b[0] - a[0]) * 2.2, 'rgba(255,30,20,A)', 0.35 * pulse); ctx.restore(); });
      ctx.fillStyle = `rgba(30,0,0,${0.35 - 0.2 * pulse})`; ctx.fillRect(0, 0, W, H);
    } else {
      darkness(ctx, 0.94, flashlights(t, 2, W * 0.5, H * 0.5, 280));
    }
  }
  SC.corridor_lit = (ctx, t) => corridorScene(ctx, t, 'lit');
  SC.corridor_dark = (ctx, t) => corridorScene(ctx, t, 'dark');
  SC.corridor_red = (ctx, t) => corridorScene(ctx, t, 'red');
  SC.vhs_corridor = (ctx, t) => {
    corridorScene(ctx, t, 'lit');
    // Dani alakja jön fel (a kamera nem hallucinál)
    const z = 0.6 + Math.min(1, t * 0.05) * 0.2;
    figure(ctx, W * 0.5, lerp(H * 0.95, H * 0.5, z), lerp(420, 60, z), '#1a1d22');
  };

  // --- lépcső
  function stairs(ctx, t, red) {
    ctx.fillStyle = red ? '#120403' : '#121315'; ctx.fillRect(0, 0, W, H);
    const vx = W * 0.52, vy = H * 0.86;
    for (let i = 0; i < 14; i++) {
      const f = i / 14, f2 = (i + 1) / 14;
      const y1 = lerp(H * 0.3, vy, Math.pow(f, 0.7)), y2 = lerp(H * 0.3, vy, Math.pow(f2, 0.7));
      const w1 = lerp(W * 0.9, 120, Math.pow(f, 0.7)), w2 = lerp(W * 0.9, 120, Math.pow(f2, 0.7));
      ctx.fillStyle = red ? `rgb(${40 - i * 2},${10},${8})` : `rgb(${58 - i * 3},${58 - i * 3},${56 - i * 3})`;
      quad(ctx, [vx - w1 / 2, y1, vx + w1 / 2, y1, vx + w2 / 2, y2, vx - w2 / 2, y2]); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(vx - w2 / 2, y2 - 3, w2, 3);
    }
    texFill(ctx, (c) => c.rect(0, 0, W, H), TX.concrete, 0.45, 'overlay', 1.2);
    // korlát
    ctx.strokeStyle = red ? '#3a0c08' : '#2a2b2c'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(W * 0.04, H * 0.2); ctx.lineTo(vx - 70, vy - 40); ctx.moveTo(W * 0.96, H * 0.2); ctx.lineTo(vx + 70, vy - 40); ctx.stroke();
    const g = ctx.createRadialGradient(vx, vy, 10, vx, vy, 420);
    g.addColorStop(0, 'rgba(0,0,0,0.95)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (red) { const p = 0.6 + 0.4 * Math.sin(t * 2.4); ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.2, H * 0.1, 300, 'rgba(255,30,20,A)', 0.25 * p); ctx.restore(); }
    else darkness(ctx, 0.9, flashlights(t, 2, W * 0.5, H * 0.6, 240));
  }
  SC.stairs = (ctx, t) => stairs(ctx, t, false);
  SC.stairs_red = (ctx, t) => stairs(ctx, t, true);

  // --- liftakna (lefelé nézve)
  SC.shaft = (ctx, t) => {
    ctx.fillStyle = '#060606'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) {
      const s = Math.pow(0.78, i), w = W * 0.9 * s, h = H * 0.95 * s;
      ctx.strokeStyle = `rgba(${90 - i * 6},${30},${25},${1 - i * 0.07})`; ctx.lineWidth = 6 * s + 1;
      ctx.strokeRect(W / 2 - w / 2, H / 2 - h / 2, w, h);
    }
    ctx.strokeStyle = 'rgba(120,120,110,0.5)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(W * 0.3, 0); ctx.lineTo(W * 0.48, H * 0.5); ctx.moveTo(W * 0.36, 0); ctx.lineTo(W * 0.49, H * 0.5); ctx.stroke();
    const p = 0.6 + 0.4 * Math.sin(t * 2.4);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.5, 0, 500, 'rgba(255,30,20,A)', 0.3 * p); ctx.restore();
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 200); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };

  // --- tűzgátló ajtó / áttörés
  function firedoor(ctx, t, mode) {
    const back = [W * 0.2, H * 0.08, W * 0.6, H * 0.86];
    roomBox(ctx, back, { floor: '#1d0706', ceil: '#100303', wallL: '#2a0b08', wallR: '#2a0b08', back: '#3a1612' });
    // acélajtó
    const dx = W * 0.32, dy = H * 0.14, dw = W * 0.36, dh = H * 0.8;
    ctx.fillStyle = '#4a4440'; ctx.fillRect(dx, dy, dw, dh);
    texFill(ctx, (c) => c.rect(dx, dy, dw, dh), TX.n1, 0.6, 'overlay', 0.5);
    ctx.strokeStyle = '#1a1716'; ctx.lineWidth = 6; ctx.strokeRect(dx, dy, dw, dh);
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(dx, dy + (dh * i) / 4); ctx.lineTo(dx + dw, dy + (dh * i) / 4); ctx.lineWidth = 2; ctx.stroke(); }
    // sárga-fekete csík
    ctx.save(); ctx.beginPath(); ctx.rect(dx, dy + dh - 40, dw, 30); ctx.clip();
    for (let x = dx - 40; x < dx + dw + 40; x += 30) { ctx.fillStyle = '#b8901a'; quad(ctx, [x, dy + dh - 40, x + 15, dy + dh - 40, x - 15, dy + dh - 10, x - 30, dy + dh - 10]); ctx.fill(); }
    ctx.restore();
    if (mode !== 'closed') {
      // a rés, szaggatott fémperemmel
      const hx = dx + dw * 0.5, hy = dy + dh * 0.36, r = rng(17);
      ctx.fillStyle = '#020101';
      ctx.beginPath();
      for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU, rr = 70 + r() * 45; ctx.lineTo(hx + Math.cos(a) * rr * 1.25, hy + Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8a8070'; ctx.lineWidth = 2; ctx.stroke();
    }
    const pulse = 0.6 + 0.4 * Math.sin(t * 2.4);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.5, H * 0.05, 520, 'rgba(255,25,15,A)', 0.32 * pulse); ctx.restore();
    ctx.fillStyle = `rgba(20,0,0,${0.45 - 0.25 * pulse})`; ctx.fillRect(0, 0, W, H);
    if (mode === 'red') { ctx.fillStyle = 'rgba(80,0,0,0.25)'; ctx.fillRect(0, 0, W, H); }
  }
  SC.firedoor = (ctx, t) => firedoor(ctx, t, 'closed');
  SC.firedoor_breach = (ctx, t) => firedoor(ctx, t, 'breach');
  SC.firedoor_red = (ctx, t) => firedoor(ctx, t, 'red');

  // --- -3 ajtó (LEZÁRVA 1989)
  SC.minus3_door = (ctx, t) => {
    const back = [W * 0.18, H * 0.06, W * 0.64, H * 0.9];
    roomBox(ctx, back, { floor: '#141513', ceil: '#0c0d0d', wallL: '#22231f', wallR: '#22231f', back: '#2c2d29' });
    const dx = W * 0.33, dy = H * 0.12, dw = W * 0.3, dh = H * 0.84;
    ctx.fillStyle = '#3b3f3e'; ctx.fillRect(dx, dy, dw, dh);
    texFill(ctx, (c) => c.rect(dx, dy, dw, dh), TX.n1, 0.7, 'overlay', 0.6);
    ctx.strokeStyle = '#121414'; ctx.lineWidth = 8; ctx.strokeRect(dx, dy, dw, dh);
    // szegecsek
    ctx.fillStyle = '#5a5f5e';
    for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc(dx + 14, dy + 20 + i * dh / 10, 3, 0, TAU); ctx.arc(dx + dw - 14, dy + 20 + i * dh / 10, 3, 0, TAU); ctx.fill(); }
    // tábla
    ctx.fillStyle = '#6a5a3a'; ctx.fillRect(dx + dw * 0.2, dy + dh * 0.3, dw * 0.6, 60);
    ctx.fillStyle = '#1a1208'; ctx.font = 'bold 26px "Courier Prime", monospace'; ctx.textAlign = 'center';
    ctx.fillText('LEZÁRVA – 1989', dx + dw / 2, dy + dh * 0.3 + 40);
    // kezelőpanel, világít
    const px = dx + dw + 30, py = H * 0.45;
    ctx.fillStyle = '#18191a'; ctx.fillRect(px, py, 60, 100);
    const blink = Math.sin(t * 4) > 0;
    ctx.fillStyle = blink ? '#ff3a2a' : '#4a0a08'; ctx.fillRect(px + 22, py + 12, 16, 8);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, px + 30, py + 16, 60, 'rgba(255,50,30,A)', blink ? 0.5 : 0.1);
    glow(ctx, px + 30, py + 60, 50, 'rgba(120,255,140,A)', 0.25); ctx.restore();
    ctx.fillStyle = '#0a2a14'; ctx.fillRect(px + 10, py + 40, 40, 40);
    darkness(ctx, 0.82, [...flashlights(t, 2, W * 0.48, H * 0.45, 240), { x: px + 30, y: py + 40, r: 120, a: 0.6 }]);
  };

  // --- széf
  SC.vault = (ctx, t) => {
    const back = [W * 0.12, H * 0.05, W * 0.76, H * 0.9];
    roomBox(ctx, back, { floor: '#151614', ceil: '#0d0d0d', wallL: '#252622', wallR: '#252622', back: '#30312c' });
    const cx = W * 0.5, cy = H * 0.5, r = H * 0.36;
    // keret
    ctx.fillStyle = '#1b1c1c'; ctx.beginPath(); ctx.arc(cx, cy, r + 30, 0, TAU); ctx.fill();
    // ajtó, radiális fémfény
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, 10, cx, cy, r);
    g.addColorStop(0, '#8a8d8c'); g.addColorStop(0.6, '#4b4f50'); g.addColorStop(1, '#2a2d2e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    texFill(ctx, (c) => { c.beginPath(); c.arc(cx, cy, r, 0, TAU); }, TX.n1, 0.5, 'overlay', 0.5);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, r * 0.75, 0, TAU); ctx.stroke();
    // csavarok
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; ctx.fillStyle = '#9a9c9c'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.88, cy + Math.sin(a) * r * 0.88, 6, 0, TAU); ctx.fill(); }
    // kerék
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t * 0.2) * 0.02);
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 12;
    for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.45, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.fill();
    ctx.restore();
    // a két kulcslyuk, 3 méterre
    [[W * 0.18, 'A'], [W * 0.82, 'B']].forEach(([x, k]) => {
      ctx.fillStyle = '#2a2b28'; ctx.fillRect(x - 30, cy - 50, 60, 100);
      ctx.fillStyle = '#c9a43a'; ctx.beginPath(); ctx.arc(x, cy - 10, 12, 0, TAU); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(x - 2, cy - 18, 4, 18);
      ctx.fillStyle = '#c9c9b0'; ctx.font = '18px "Courier Prime", monospace'; ctx.textAlign = 'center'; ctx.fillText(k, x, cy + 35);
    });
    ctx.fillStyle = '#c9b67a'; ctx.font = 'bold 22px "Courier Prime", monospace'; ctx.textAlign = 'center';
    ctx.fillText('ARCHÍVUM · KÉTKULCSOS ELJÁRÁS', cx, H * 0.08);
    dust(ctx, t, 0.3);
    darkness(ctx, 0.7, [...flashlights(t, 2, W * 0.5, H * 0.5, 420), { x: cx, y: 0, r: 500, a: 0.5 }]);
  };

  // --- archívum (nyitott széf belseje), vörös, tűz
  function archive(ctx, t, mode) {
    const back = [W * 0.4, H * 0.3, W * 0.2, H * 0.36];
    roomBox(ctx, back, { floor: '#141411', ceil: '#0b0b0a', wallL: '#1c1c19', wallR: '#1c1c19', back: '#0a0a09' });
    shelves(ctx, back, t, 5);
    if (mode === 'fire') {
      flames(ctx, t, W * 0.02, H * 0.92, W * 0.4, 380, 1);
      flames(ctx, t + 3, W * 0.6, H * 0.88, W * 0.38, 300, 0.9);
      smoke(ctx, t, 0.55, -120);
      embers(ctx, t, 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.3, H * 0.8, 700, 'rgba(255,110,30,A)', 0.25 + 0.05 * Math.sin(t * 9)); ctx.restore();
    } else if (mode === 'red') {
      const p = 0.6 + 0.4 * Math.sin(t * 2.4);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.5, 0, 600, 'rgba(255,25,15,A)', 0.35 * p); ctx.restore();
      ctx.fillStyle = 'rgba(40,0,0,0.3)'; ctx.fillRect(0, 0, W, H);
    } else {
      // egyetlen csupasz izzó + vörös riasztólámpa
      const sway = Math.sin(t * 0.8) * 30;
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2 + sway, H * 0.2); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W / 2 + sway, H * 0.2, 420, 'rgba(255,200,130,A)', 0.35); ctx.restore();
      ctx.fillStyle = '#fff2c0'; ctx.beginPath(); ctx.arc(W / 2 + sway, H * 0.2 + 8, 8, 0, TAU); ctx.fill();
      dust(ctx, t, 0.5, [W * 0.2, 0, W * 0.8, H * 0.8]);
      darkness(ctx, 0.75, [{ x: W / 2 + sway, y: H * 0.35, r: 560, a: 1, sx: 1.2, sy: 1.1 }]);
    }
  }
  SC.archive = (ctx, t) => archive(ctx, t, 'normal');
  SC.archive_red = (ctx, t) => archive(ctx, t, 'red');
  SC.archive_fire = (ctx, t) => archive(ctx, t, 'fire');

  // --- rádióterem
  function radioRoom(ctx, t, mode) {
    const back = [W * 0.16, H * 0.12, W * 0.68, H * 0.62];
    roomBox(ctx, back, { floor: '#1a1a17', ceil: '#101110', wallL: '#2b2c27', wallR: '#2b2c27', back: '#34352f' });
    const [bx, by, bw, bh] = back;
    for (let i = 0; i < 5; i++) rack(ctx, bx + 12 + i * (bw - 24) / 5, by + 14, (bw - 24) / 5 - 10, bh - 26, t, 30 + i);
    scope(ctx, bx + bw * 0.43, by + bh * 0.42, 110, 70, t);
    reel(ctx, bx + bw * 0.12, by + bh * 0.3, 34, t * 1.3); reel(ctx, bx + bw * 0.26, by + bh * 0.3, 34, t * 1.3);
    desk(ctx, W * 0.1, H * 0.74, W * 0.8, 120, '#2c2620');
    // mikrofon
    ctx.fillStyle = '#111'; ctx.fillRect(W * 0.48, H * 0.66, 8, 50); ctx.beginPath(); ctx.ellipse(W * 0.484, H * 0.65, 16, 22, 0, 0, TAU); ctx.fill();
    if (mode === 'dark') {
      // gázlámpa
      const fl = 0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 7);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.3, H * 0.72, 300, 'rgba(255,170,80,A)', 0.4 * fl); ctx.restore();
      darkness(ctx, 0.9, [{ x: W * 0.3, y: H * 0.7, r: 420 * fl, a: 1, warm: true }]);
    } else if (mode === 'red') {
      const p = 0.6 + 0.4 * Math.sin(t * 2.4);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.5, H * 0.05, 600, 'rgba(255,40,20,A)', 0.3 * p);
      glow(ctx, W * 0.5, H * 0.66, 120, 'rgba(255,60,40,A)', 0.4); ctx.restore();
      ctx.fillStyle = 'rgba(40,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
      smoke(ctx, t, 0.3, -200);
    } else {
      const on = flicker(t, 21, 5);
      tube(ctx, [W * 0.36, H * 0.05], [W * 0.64, H * 0.05], on);
      lightCone(ctx, W / 2, H * 0.05, W * 0.9, H * 0.9, 'rgba(200,220,255,A)', 0.07 * on);
      dust(ctx, t, 0.3);
      if (on < 0.6) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, W, H); }
    }
  }
  SC.radio_room = (ctx, t) => radioRoom(ctx, t, 'lit');
  SC.radio_room_dark = (ctx, t) => radioRoom(ctx, t, 'dark');
  SC.radio_room_red = (ctx, t) => radioRoom(ctx, t, 'red');

  // --- Dani szobája (-3): poros rádiószoba, a falnak dőlt alak
  SC.dani_room = (ctx, t) => {
    const back = [W * 0.2, H * 0.14, W * 0.6, H * 0.6];
    roomBox(ctx, back, { floor: '#151513', ceil: '#0c0c0b', wallL: '#22231f', wallR: '#22231f', back: '#2a2b26' });
    const [bx, by, bw, bh] = back;
    rack(ctx, bx + 20, by + 20, bw * 0.3, bh - 40, 0, 77);
    rack(ctx, bx + bw * 0.68, by + 20, bw * 0.3, bh - 40, 0, 78);
    desk(ctx, W * 0.22, H * 0.66, W * 0.56, 120, '#28231d');
    // az ülő alak (Dani)
    ctx.fillStyle = '#0f1012';
    ctx.beginPath(); ctx.moveTo(W * 0.42, H * 0.92); ctx.quadraticCurveTo(W * 0.4, H * 0.7, W * 0.46, H * 0.62); ctx.quadraticCurveTo(W * 0.5, H * 0.58, W * 0.54, H * 0.63);
    ctx.quadraticCurveTo(W * 0.58, H * 0.72, W * 0.6, H * 0.92); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.56, 26, 30, 0.35, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1d14'; ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.53, 30, 14, 0.35, Math.PI, TAU); ctx.fill(); // sapka
    // por a levegőben, egy fénysugár az ajtóból
    lightCone(ctx, W * 0.15, -20, 700, H * 1.1, 'rgba(230,220,200,A)', 0.1);
    dust(ctx, t, 0.6, [0, 0, W * 0.7, H]);
    darkness(ctx, 0.88, [...flashlights(t, 2, W * 0.5, H * 0.62, 200), { x: W * 0.2, y: H * 0.3, r: 380, a: 0.45 }]);
  };

  // --- generátorterem
  SC.generator_room = (ctx, t) => {
    const back = [W * 0.15, H * 0.1, W * 0.7, H * 0.66];
    roomBox(ctx, back, { floor: '#181815', ceil: '#0d0d0c', wallL: '#26261f', wallR: '#26261f', back: '#2e2e27' });
    // csövek
    ctx.strokeStyle = '#3a3a33'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(0, H * 0.22); ctx.lineTo(W, H * 0.22); ctx.moveTo(W * 0.12, 0); ctx.lineTo(W * 0.12, H * 0.8); ctx.stroke();
    ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, H * 0.3); ctx.lineTo(W, H * 0.3); ctx.stroke();
    // a generátor: nagy zöld blokk
    const gx = W * 0.28, gy = H * 0.42, gw = W * 0.46, gh = H * 0.42;
    const run = R.state.genOn ? 1 : 0;
    const sh = run ? Math.sin(t * 90) * 1.2 : 0;
    ctx.save(); ctx.translate(sh, 0);
    ctx.fillStyle = '#2f4a34'; ctx.fillRect(gx, gy, gw, gh);
    texFill(ctx, (c) => c.rect(gx, gy, gw, gh), TX.n1, 0.55, 'overlay', 0.6);
    ctx.fillStyle = '#1e3123'; ctx.fillRect(gx + 20, gy + 20, gw * 0.4, gh * 0.5);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = '#16251a'; ctx.fillRect(gx + gw * 0.55 + i * 16, gy + 24, 8, gh * 0.5); }
    ctx.fillStyle = '#c9b06a'; ctx.font = 'bold 20px "Courier Prime", monospace'; ctx.textAlign = 'left'; ctx.fillText('GANZ · 120 kVA', gx + 30, gy + gh - 24);
    // kipufogó
    ctx.fillStyle = '#222'; ctx.fillRect(gx + gw - 60, gy - 120, 26, 120);
    ctx.restore();
    // üzemanyagcső (fókuszálható)
    ctx.strokeStyle = '#141414'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(gx - 10, gy + gh * 0.7); ctx.bezierCurveTo(gx - 90, gy + gh * 0.7, gx - 80, H * 0.95, gx - 180, H * 0.95); ctx.stroke();
    ctx.fillStyle = '#7a1a10'; ctx.fillRect(gx - 160, H * 0.88, 70, 60); // tartály
    const fl = run ? flicker(t, 41, 4) : 0;
    if (run) {
      tube(ctx, [W * 0.4, H * 0.04], [W * 0.6, H * 0.04], fl);
      lightCone(ctx, W / 2, H * 0.04, W, H * 0.9, 'rgba(210,230,255,A)', 0.06 * fl);
      dust(ctx, t, 0.4);
      if (R.state.genOn && Math.sin(t * 1.3) > 0.97) smoke(ctx, t, 0.15, -100);
    } else {
      darkness(ctx, 0.9, flashlights(t, 2, W * 0.45, H * 0.6, 280));
    }
  };

  // --- gépház (Rezonátor szekrény)
  SC.machine_room = (ctx, t) => {
    const back = [W * 0.2, H * 0.1, W * 0.6, H * 0.7];
    roomBox(ctx, back, { floor: '#151513', ceil: '#0b0b0a', wallL: '#23231e', wallR: '#23231e', back: '#2b2b25' });
    const cx = W * 0.36, cy = H * 0.18, cw = W * 0.28, chh = H * 0.66;
    ctx.fillStyle = R.state.rezKi ? '#2a2c2c' : '#3a3d3c'; ctx.fillRect(cx, cy, cw, chh);
    texFill(ctx, (c) => c.rect(cx, cy, cw, chh), TX.n1, 0.6, 'overlay', 0.5);
    // hegesztési varrat
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 6; ctx.setLineDash([6, 4]); ctx.strokeRect(cx + 6, cy + 6, cw - 12, chh - 12); ctx.setLineDash([]);
    // villám tábla
    ctx.fillStyle = '#e0b020'; quad(ctx, [cx + cw / 2, cy + 50, cx + cw / 2 + 50, cy + 130, cx + cw / 2 - 50, cy + 130]); ctx.fill();
    ctx.fillStyle = '#111'; ctx.font = 'bold 50px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ϟ', cx + cw / 2, cy + 122);
    ctx.fillStyle = '#d0c090'; ctx.font = '18px "Courier Prime", monospace'; ctx.fillText('CSEND · 19 Hz', cx + cw / 2, cy + 170);
    if (!R.state.rezKi) {
      // a levegő remeg: koncentrikus hullámok
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) {
        const rr = ((t * 60 + i * 60) % 360);
        ctx.strokeStyle = `rgba(160,180,255,${0.12 * (1 - rr / 360)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx + cw / 2, cy + chh / 2, rr, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }
    darkness(ctx, 0.85, [...flashlights(t, 2, W * 0.5, H * 0.5, 260)]);
  };

  // --- iroda
  SC.office = (ctx, t) => {
    const back = [W * 0.18, H * 0.1, W * 0.64, H * 0.62];
    roomBox(ctx, back, { floor: '#1b1712', ceil: '#0f0e0c', wallL: '#2c2a22', wallR: '#2c2a22', back: '#36332a' });
    const [bx, by, bw, bh] = back;
    // Szovjetunió-térkép
    ctx.fillStyle = '#8a7a58'; ctx.fillRect(bx + bw * 0.08, by + 30, bw * 0.38, bh * 0.45);
    ctx.fillStyle = '#a0423a'; ctx.beginPath(); ctx.ellipse(bx + bw * 0.3, by + 30 + bh * 0.2, bw * 0.13, bh * 0.1, 0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#4a3a24'; ctx.lineWidth = 3; ctx.strokeRect(bx + bw * 0.08, by + 30, bw * 0.38, bh * 0.45);
    // iratszekrény
    ctx.fillStyle = '#3d4038'; ctx.fillRect(bx + bw * 0.72, by + bh * 0.2, bw * 0.2, bh * 0.8);
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = '#1d1f1a'; ctx.lineWidth = 3; ctx.strokeRect(bx + bw * 0.73, by + bh * 0.22 + i * bh * 0.19, bw * 0.18, bh * 0.17); ctx.fillStyle = '#999'; ctx.fillRect(bx + bw * 0.8, by + bh * 0.28 + i * bh * 0.19, 16, 4); }
    desk(ctx, W * 0.15, H * 0.72, W * 0.7, 140, '#3a2a1e');
    // papírok, hamutál, lemezjátszó
    ctx.fillStyle = '#d8ccb0'; ctx.save(); ctx.translate(W * 0.36, H * 0.71); ctx.rotate(-0.08); ctx.fillRect(0, -6, 90, 8); ctx.restore();
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(W * 0.58, H * 0.68, 120, 34);
    reel(ctx, W * 0.6 + 40, H * 0.68, 26, t * 0.05);
    lamp(ctx, W * 0.24, H * 0.72, t, 1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.29, H * 0.68, 260, 'rgba(255,190,110,A)', 0.3); ctx.restore();
    dust(ctx, t, 0.5, [W * 0.1, H * 0.3, W * 0.6, H]);
    darkness(ctx, 0.86, [{ x: W * 0.3, y: H * 0.72, r: 380, a: 1, warm: true }, ...flashlights(t, 2, W * 0.6, H * 0.45, 260)]);
  };

  // --- őrszoba
  SC.guard_room = (ctx, t) => {
    const back = [W * 0.2, H * 0.12, W * 0.6, H * 0.6];
    roomBox(ctx, back, { floor: '#181815', ceil: '#0e0e0d', wallL: '#2a2b26', wallR: '#2a2b26', back: '#32332d' });
    const [bx, by, bw, bh] = back;
    // fegyverszekrény (üres)
    ctx.fillStyle = '#2f3a2f'; ctx.fillRect(bx + bw * 0.1, by + 20, bw * 0.3, bh - 20);
    ctx.fillStyle = '#0d100d'; ctx.fillRect(bx + bw * 0.12, by + 30, bw * 0.26, bh - 40);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = '#3a3a30'; ctx.fillRect(bx + bw * 0.14 + i * bw * 0.05, by + 50, 6, bh * 0.5); }
    // narancs jelzőpisztoly
    ctx.fillStyle = '#e06a10'; ctx.fillRect(bx + bw * 0.22, by + bh * 0.72, 40, 16); ctx.fillRect(bx + bw * 0.22 + 4, by + bh * 0.72 + 14, 12, 22);
    desk(ctx, W * 0.45, H * 0.72, W * 0.4, 130, '#30281e');
    // kazetta a cetlivel
    ctx.fillStyle = '#111'; ctx.fillRect(W * 0.62, H * 0.69, 56, 34); ctx.fillStyle = '#ddd'; ctx.fillRect(W * 0.625, H * 0.695, 46, 12);
    ctx.fillStyle = '#e8e2c8'; ctx.save(); ctx.translate(W * 0.7, H * 0.7); ctx.rotate(0.12); ctx.fillRect(0, -10, 44, 30); ctx.restore();
    const on = flicker(t, 55, 7);
    tube(ctx, [W * 0.4, H * 0.05], [W * 0.6, H * 0.05], on);
    lightCone(ctx, W / 2, H * 0.05, W * 0.9, H * 0.9, 'rgba(200,220,255,A)', 0.06 * on);
    if (on < 0.6) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H); }
    dust(ctx, t, 0.3);
  };

  // --- hálóterem
  SC.barracks = (ctx, t) => {
    const back = [W * 0.3, H * 0.18, W * 0.4, H * 0.5];
    roomBox(ctx, back, { floor: '#17160f', ceil: '#0d0c0a', wallL: '#272620', wallR: '#272620', back: '#2e2d26' });
    // emeletes ágyak perspektívában
    for (let i = 0; i < 4; i++) {
      for (const side of [0, 1]) {
        const z = i / 4, s = 1 - z * 0.65;
        const x = side ? lerp(W * 0.86, W * 0.7, z) : lerp(W * 0.14, W * 0.3, z), y = lerp(H * 0.92, H * 0.68, z);
        ctx.strokeStyle = '#1a1a18'; ctx.lineWidth = 5 * s;
        ctx.strokeRect(x - 70 * s, y - 220 * s, 140 * s, 220 * s);
        ctx.fillStyle = '#3a3a30'; ctx.fillRect(x - 66 * s, y - 120 * s, 132 * s, 20 * s); ctx.fillRect(x - 66 * s, y - 210 * s, 132 * s, 20 * s);
      }
    }
    darkness(ctx, 0.9, flashlights(t, 1, W * 0.5, H * 0.75, 0));
  };

  // --- öltözőszekrény belülről: rések
  SC.locker = (ctx, t) => {
    ctx.fillStyle = '#020202'; ctx.fillRect(0, 0, W, H);
    // a külvilág csak a réseken át
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) ctx.rect(W * 0.3, H * 0.3 + i * 34, W * 0.4, 9);
    ctx.clip();
    if (!(PHOTO.corridor_lit && drawPhoto(ctx, t, 'corridor_lit'))) SC.corridor_lit(ctx, t);
    ctx.restore();
    // fémlemez textúra
    ctx.save(); ctx.globalAlpha = 0.6; ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(TX.n1, 0, 0, W, H); ctx.restore();
    // lélegzet pára
    ctx.save(); ctx.globalAlpha = 0.08 + 0.06 * Math.sin(t * 1.5); ctx.drawImage(TX.smoke, W * 0.2, H * 0.5, W * 0.6, H * 0.5); ctx.restore();
  };

  // --- egyéb
  SC.black = (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); };
  SC.black_rain = (ctx, t) => { ctx.fillStyle = '#020203'; ctx.fillRect(0, 0, W, H); rain(ctx, t, 0.8, -0.2, 'rgba(160,170,190,0.18)'); };
  SC.tv_static = (ctx, t) => {
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
    const x = W * 0.25, y = H * 0.18, w = W * 0.5, h = H * 0.6;
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x - 30, y - 30, w + 60, h + 60);
    ctx.save(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 30) : ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(TX.fine, (t * 997) % 200, (t * 613) % 200, 120, 80, x, y, w, h);
    ctx.fillStyle = 'rgba(160,170,180,0.15)'; ctx.fillRect(x, y + ((t * 200) % h), w, 30);
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W / 2, H / 2, 600, 'rgba(160,180,200,A)', 0.15); ctx.restore();
  };
  SC.laptop_night = (ctx, t) => {
    ctx.fillStyle = '#030305'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0c0d10'; quad(ctx, [W * 0.3, H * 0.86, W * 0.7, H * 0.86, W * 0.78, H * 0.98, W * 0.22, H * 0.98]); ctx.fill();
    ctx.fillStyle = '#c8d8ff'; ctx.fillRect(W * 0.34, H * 0.42, W * 0.32, H * 0.42);
    ctx.fillStyle = '#e8eef8'; ctx.fillRect(W * 0.36, H * 0.46, W * 0.28, 16);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = '#9aa8c0'; ctx.fillRect(W * 0.36, H * 0.52 + i * 18, W * (0.12 + ((i * 37) % 13) / 100), 6); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W / 2, H * 0.6, 520, 'rgba(140,170,255,A)', 0.25); ctx.restore();
    figure(ctx, W * 0.5, H * 1.25, 640, '#020203');
  };
  SC.workshop_night = (ctx, t) => {
    ctx.fillStyle = '#040405'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0d0c0b'; ctx.fillRect(0, H * 0.62, W, H * 0.38);
    // a tárcsa a polcon
    const cx = W * 0.5, cy = H * 0.5, glowA = R.state.dialGlow || 0;
    ctx.fillStyle = '#1a1816'; ctx.fillRect(cx - 120, cy - 80, 240, 160);
    ctx.fillStyle = glowA > 0 ? `rgba(255,200,120,${0.3 + 0.6 * glowA})` : '#2a2620';
    ctx.beginPath(); ctx.arc(cx, cy, 58, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 44, cy + Math.sin(a) * 44); ctx.lineTo(cx + Math.cos(a) * 56, cy + Math.sin(a) * 56); ctx.stroke(); }
    ctx.strokeStyle = '#c03020'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(t * 0.2) * 50, cy + Math.sin(t * 0.2) * 50); ctx.stroke();
    if (glowA > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, cx, cy, 400, 'rgba(255,170,90,A)', 0.35 * glowA); ctx.restore(); }
    // kihúzott tápkábel
    ctx.strokeStyle = '#151515'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx + 120, cy + 40); ctx.bezierCurveTo(cx + 200, cy + 200, cx + 300, cy + 120, cx + 360, H * 0.8); ctx.stroke();
    ctx.fillStyle = '#222'; ctx.fillRect(cx + 350, H * 0.79, 30, 18);
  };
  SC.asylum = (ctx, t) => {
    const back = [W * 0.25, H * 0.15, W * 0.5, H * 0.6];
    roomBox(ctx, back, { floor: '#8a8e8c', ceil: '#7a7e7c', wallL: '#a0a4a0', wallR: '#a0a4a0', back: '#b4b8b4' });
    ctx.fillStyle = 'rgba(30,40,40,0.35)'; ctx.fillRect(0, 0, W, H);
    // kicsi, rácsos ablak hideg fénnyel
    ctx.fillStyle = '#dfe8f0'; ctx.fillRect(W * 0.46, H * 0.22, W * 0.08, H * 0.1);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 3; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(W * 0.46 + i * W * 0.02, H * 0.22); ctx.lineTo(W * 0.46 + i * W * 0.02, H * 0.32); ctx.stroke(); }
    lightCone(ctx, W * 0.5, H * 0.3, 300, H * 0.7, 'rgba(220,235,255,A)', 0.2);
    figure(ctx, W * 0.5, H * 0.84, 180, '#2a2e30');
    dust(ctx, t, 0.3);
  };

  // ---------------------------------------------------------------- IJESZTÉSEK
  // „Kevesebb több”: sötét, zajos, remegő formák, csak villanásnyi részletekkel.
  const JUMP = {};
  const JC = { c: null };
  function jitter(t, amp) { const k = Math.floor(t * 14); const r = rng(k * 31 + 7); return [(r() - 0.5) * amp, (r() - 0.5) * amp, (r() - 0.5) * 0.04]; }

  // Árnyéklény: megnyúlt test, térdig érő karok, oldalra billent fej
  function shadowBeing(ctx, cx, base, h, t, opts) {
    opts = opts || {};
    if (!JC.c) JC.c = mk(W, H);
    const c = JC.c, x = c.getContext('2d');
    x.clearRect(0, 0, W, H);
    const [jx, jy, jr] = jitter(t, opts.calm ? 2 : 9);
    x.save(); x.translate(cx + jx, base + jy); x.rotate(jr); const k = h / 400; x.scale(k, k);
    x.fillStyle = '#000';
    x.beginPath();
    // lábak
    x.moveTo(-26, 0); x.lineTo(-18, -150); x.lineTo(-8, -150); x.lineTo(-4, 0); x.lineTo(6, 0); x.lineTo(10, -150); x.lineTo(22, -150); x.lineTo(30, 0); x.closePath(); x.fill();
    // törzs (görnyedt, aszimmetrikus váll)
    x.beginPath(); x.moveTo(-30, -140); x.quadraticCurveTo(-46, -230, -38, -300); x.quadraticCurveTo(-10, -325, 34, -296); x.quadraticCurveTo(44, -220, 30, -140); x.closePath(); x.fill();
    // karok: túl hosszúak
    x.lineCap = 'round'; x.strokeStyle = '#000';
    x.lineWidth = 13; x.beginPath(); x.moveTo(-34, -290); x.quadraticCurveTo(-70, -200, -60, -60); x.quadraticCurveTo(-58, -20, -70, 10); x.stroke();
    x.lineWidth = 11; x.beginPath(); x.moveTo(32, -286); x.quadraticCurveTo(64, -190, 58, -80); x.quadraticCurveTo(56, -40, 66, -6); x.stroke();
    // ujjak
    x.lineWidth = 3;
    for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(-70, 10); x.lineTo(-78 + i * 5, 34 + i * 2); x.stroke(); x.beginPath(); x.moveTo(66, -6); x.lineTo(60 + i * 5, 20 + i * 3); x.stroke(); }
    // nyak és eltört szögben lógó fej
    x.lineWidth = 9; x.beginPath(); x.moveTo(4, -305); x.quadraticCurveTo(16, -330, 34, -338); x.stroke();
    x.save(); x.translate(40, -342); x.rotate(1.25 + Math.sin(t * 1.3) * 0.06);
    x.beginPath(); x.ellipse(0, -18, 15, 26, 0, 0, TAU); x.fill();
    x.restore();
    x.restore();
    // füstös perem: elmosott másolatok, aztán éles mag
    ctx.save();
    ctx.globalAlpha = 0.55; ctx.filter = 'blur(10px)'; ctx.drawImage(c, 0, 0);
    ctx.globalAlpha = 0.8; ctx.filter = 'blur(3px)'; ctx.drawImage(c, 3, 0);
    ctx.filter = 'none'; ctx.globalAlpha = 0.95; ctx.drawImage(c, 0, 0);
    ctx.restore();
    // glitch-szeletek
    if (!opts.calm && Math.floor(t * 9) % 3 === 0) {
      const r = rng(Math.floor(t * 9));
      for (let i = 0; i < 4; i++) {
        const y = base - h * r(), sh = 4 + r() * 18, dx = (r() - 0.5) * 60;
        ctx.save(); ctx.globalAlpha = 0.7; ctx.drawImage(c, 0, y, W, sh, dx, y, W, sh); ctx.restore();
      }
    }
    // szemcsillanás
    const hx = cx + jx + (40 + 22) * (h / 400), hy = base + jy - 352 * (h / 400);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, hx, hy, 10 * (h / 400), 'rgba(220,230,255,A)', 0.7); glow(ctx, hx - 12 * (h / 400), hy + 8 * (h / 400), 7 * (h / 400), 'rgba(220,230,255,A)', 0.5);
    ctx.restore();
  }

  JUMP.creature = (ctx, t) => {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
    shadowBeing(ctx, W * 0.5, H * 1.02, H * 0.98, t);
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  R.shadowBeing = shadowBeing;

  // Gázálarc közelről: fotó, ha van; különben sötét, részletes rajz
  JUMP.gasmask = (ctx, t) => {
    const im = IMG.mask_close;
    const [jx, jy] = jitter(t, 6);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (im && im._ok) {
      const z = 1.15 + t * 0.25;
      ctx.save(); ctx.translate(W / 2 + jx, H / 2 + jy); ctx.scale(z, z);
      ctx.filter = 'contrast(1.5) brightness(0.75) saturate(0.4)';
      // csak a fej: a forrás felső-középső része
      const sw = im.width * 0.62, sh = im.height * 0.56, sx = im.width * 0.17, sy = 0;
      const w = H * (sw / sh);
      ctx.drawImage(im, sx, sy, sw, sh, -w / 2, -H / 2, w, H);
      ctx.filter = 'none'; ctx.restore();
    } else {
      const cx = W / 2 + jx, cy = H * 0.55 + jy;
      const skin = ctx.createRadialGradient(cx, cy + 120, 30, cx, cy, 460);
      skin.addColorStop(0, '#2c302a'); skin.addColorStop(1, '#050605');
      ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(cx, cy, 330, 420, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, 330, 420, 0, 0, TAU); ctx.clip();
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.7; ctx.drawImage(TX.n1, cx - 400, cy - 450, 800, 900); ctx.drawImage(TX.fine, cx - 400, cy - 450, 800, 900);
      ctx.restore();
      for (const sx of [-1, 1]) {
        const ex = cx + sx * 130, ey = cy - 90;
        ctx.fillStyle = '#0c0d0c'; ctx.beginPath(); ctx.arc(ex, ey, 104, 0, TAU); ctx.fill();
        const lg = ctx.createRadialGradient(ex - 30, ey - 40, 4, ex, ey, 86);
        lg.addColorStop(0, 'rgba(190,210,200,0.5)'); lg.addColorStop(0.25, 'rgba(25,35,32,0.85)'); lg.addColorStop(1, '#020303');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(ex, ey, 86, 0, TAU); ctx.fill();
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, ex + sx * 8, ey + 10, 26, 'rgba(255,40,30,A)', 0.55); ctx.restore();
      }
      ctx.fillStyle = '#0b0b0b'; ctx.beginPath(); ctx.ellipse(cx, cy + 210, 120, 130, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(80,80,80,0.5)'; ctx.lineWidth = 3;
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(cx, cy + 210, 110 - i * 14, 118 - i * 15, 0, 0, TAU); ctx.stroke(); }
    }
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.65);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.9)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };

  const holeAt = () => (R.holePos ? R.holePos : [W * 0.5, H * 0.36, 110]);
  function holeClip(ctx) { const [hx, hy, r] = holeAt(); ctx.beginPath(); ctx.ellipse(hx, hy, r * 1.05, r * 0.95, 0, 0, TAU); ctx.clip(); return [hx, hy, r]; }

  // A hallucináló szemével: a sötétből előderengő, megnyúlt szürke arc, szemgödrök, vékony fogak
  JUMP.door_creature = (ctx, t) => {
    const [jx, jy, jr] = jitter(t, 6);
    ctx.save();
    const [hx0, hy0, r] = holeClip(ctx);
    ctx.fillStyle = '#020101'; ctx.fillRect(hx0 - r * 2, hy0 - r * 2, r * 4, r * 4);
    const hx = hx0 + jx, hy = hy0 + jy;
    ctx.translate(hx, hy); ctx.rotate(0.18 + jr); ctx.translate(-hx, -hy);
    // arc: elnyújtott, alulról vörösen megvilágítva, a szélein beleolvad a sötétbe
    ctx.save(); ctx.beginPath(); ctx.ellipse(hx, hy + r * 0.1, r * 0.62, r * 1.05, 0, 0, TAU); ctx.clip();
    const sk = ctx.createRadialGradient(hx, hy + r * 0.55, r * 0.05, hx, hy, r * 1.05);
    sk.addColorStop(0, '#8a6a62'); sk.addColorStop(0.45, '#4a4a44'); sk.addColorStop(1, 'rgba(10,10,9,0)');
    ctx.fillStyle = sk; ctx.fillRect(hx - r, hy - r * 1.1, r * 2, r * 2.4);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.9; ctx.drawImage(TX.fine, hx - r, hy - r * 1.1, r * 2, r * 2.4); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // szemgödrök
    for (const sx of [-1, 1]) {
      const ex = hx + sx * r * 0.24, ey = hy - r * 0.18;
      const g = ctx.createRadialGradient(ex, ey, 1, ex, ey + r * 0.05, r * 0.26);
      g.addColorStop(0, '#000'); g.addColorStop(0.55, 'rgba(0,0,0,0.92)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(ex, ey, r * 0.2, r * 0.3, sx * 0.3, 0, TAU); ctx.fill();
    }
    // száj: fekete, nedves rés, kevés hosszú, ferde fog
    const mo = 0.2 + 0.08 * Math.sin(t * 19);
    const mg = ctx.createRadialGradient(hx, hy + r * 0.5, 2, hx, hy + r * 0.5, r * 0.45);
    mg.addColorStop(0, '#000'); mg.addColorStop(0.7, 'rgba(5,0,0,0.95)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.ellipse(hx, hy + r * 0.52, r * 0.36, r * mo + r * 0.06, 0, 0, TAU); ctx.fill();
    const rr = rng(9);
    for (let i = 0; i < 9; i++) {
      const top = i % 2 === 0, u = (i / 8 - 0.5) * 2;
      const bx = hx + u * r * 0.3 + (rr() - 0.5) * 6, by = hy + r * 0.52 + (top ? -1 : 1) * r * mo;
      const len = r * (0.1 + rr() * 0.18);
      ctx.strokeStyle = `rgba(${190 - rr() * 40},${180 - rr() * 40},150,0.85)`; ctx.lineWidth = 1.5 + rr() * 2.5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + (rr() - 0.5) * 8, by + (top ? 1 : -1) * len); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const [ox, oy, orr] = holeAt(); glow(ctx, ox, oy + orr * 0.9, orr * 1.5, 'rgba(255,25,10,A)', 0.22); ctx.restore();
  };

  // A tiszta szemével: a párod szemei a résben – a bőr is a sötétbe olvad
  function eye(ctx, x, y, w, look) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y - w * 0.7, x + w, y); ctx.quadraticCurveTo(x, y + w * 0.5, x - w, y); ctx.closePath(); ctx.clip();
    const wg = ctx.createRadialGradient(x, y, 2, x, y, w); wg.addColorStop(0, '#d9c8c0'); wg.addColorStop(0.7, '#a07068'); wg.addColorStop(1, '#3a1c18');
    ctx.fillStyle = wg; ctx.fillRect(x - w, y - w, w * 2, w * 2);
    ctx.strokeStyle = 'rgba(150,20,20,0.5)'; ctx.lineWidth = 0.8;
    const r = rng(Math.round(x));
    for (let i = 0; i < 10; i++) { ctx.beginPath(); const a = r() * TAU; ctx.moveTo(x + Math.cos(a) * w, y + Math.sin(a) * w * 0.5); ctx.quadraticCurveTo(x + Math.cos(a) * w * 0.6 + (r() - 0.5) * 10, y + Math.sin(a) * w * 0.3, x + Math.cos(a) * w * 0.38, y + Math.sin(a) * w * 0.2); ctx.stroke(); }
    const ix = x + look * w * 0.15, ir = w * 0.4;
    const ig = ctx.createRadialGradient(ix, y, 1, ix, y, ir); ig.addColorStop(0, '#1a0f08'); ig.addColorStop(0.55, '#4a3020'); ig.addColorStop(0.9, '#150a06'); ig.addColorStop(1, '#000');
    ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(ix, y, ir, 0, TAU); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(ix, y, ir * 0.66, 0, TAU); ctx.fill();
    // felső szemhéj árnyéka
    const lid = ctx.createLinearGradient(0, y - w * 0.5, 0, y - w * 0.05); lid.addColorStop(0, 'rgba(0,0,0,0.85)'); lid.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lid; ctx.fillRect(x - w, y - w, w * 2, w);
    ctx.fillStyle = 'rgba(255,240,235,0.9)'; ctx.beginPath(); ctx.arc(ix - ir * 0.28, y - ir * 0.3, ir * 0.12, 0, TAU); ctx.fill();
    ctx.restore();
  }
  JUMP.door_face = (ctx, t) => {
    const [jx, jy] = jitter(t, 2);
    ctx.save();
    const [hx0, hy0, r] = holeClip(ctx);
    ctx.fillStyle = '#020101'; ctx.fillRect(hx0 - r * 2, hy0 - r * 2, r * 4, r * 4);
    const hx = hx0 + jx, hy = hy0 + jy;
    const sk = ctx.createRadialGradient(hx, hy + r * 0.35, r * 0.05, hx, hy, r * 0.95);
    sk.addColorStop(0, 'rgba(140,70,58,1)'); sk.addColorStop(0.55, 'rgba(60,22,18,0.9)'); sk.addColorStop(1, 'rgba(5,1,1,0)');
    ctx.fillStyle = sk; ctx.fillRect(hx - r * 1.2, hy - r * 1.2, r * 2.4, r * 2.4);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.6; ctx.drawImage(TX.fine, hx - r, hy - r, r * 2, r * 2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    eye(ctx, hx - r * 0.32, hy - r * 0.1, r * 0.22, 0.5); eye(ctx, hx + r * 0.32, hy - r * 0.1, r * 0.22, 0.3);
    ctx.restore();
  };

  // Kardos a kapuház ablakában: sötét sziluett, csak a szemüveg csillan a villámban
  JUMP.window_face = (ctx, t) => {
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, W, H);
    const wx = W * 0.27, wy = H * 0.1, ww = W * 0.46, wh = H * 0.7;
    ctx.fillStyle = '#07080a'; ctx.fillRect(wx - 24, wy - 24, ww + 48, wh + 48);
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    const flash = Math.max(0, Math.sin(t * 3.1)) ** 3;
    const bg = ctx.createRadialGradient(wx + ww * 0.7, wy + wh * 0.3, 10, wx + ww * 0.5, wy + wh * 0.5, ww);
    bg.addColorStop(0, `rgb(${22 + 40 * flash},${26 + 44 * flash},${34 + 50 * flash})`); bg.addColorStop(1, '#020304');
    ctx.fillStyle = bg; ctx.fillRect(wx, wy, ww, wh);
    // fej, fül, nyak, vállak – egyetlen sziluett
    const cx = wx + ww * 0.46, cy = wy + wh * 0.42;
    ctx.fillStyle = '#010101';
    ctx.beginPath();
    ctx.moveTo(cx - ww * 0.5, wy + wh); ctx.quadraticCurveTo(cx - ww * 0.42, cy + 120, cx - 60, cy + 104); ctx.quadraticCurveTo(cx - 44, cy + 80, cx - 40, cy + 62);
    ctx.bezierCurveTo(cx - 92, cy + 30, cx - 86, cy - 120, cx, cy - 122); ctx.bezierCurveTo(cx + 86, cy - 120, cx + 92, cy + 30, cx + 40, cy + 62);
    ctx.quadraticCurveTo(cx + 44, cy + 80, cx + 60, cy + 104); ctx.quadraticCurveTo(cx + ww * 0.42, cy + 120, cx + ww * 0.5, wy + wh); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 84, cy - 6, 12, 22, 0.2, 0, TAU); ctx.ellipse(cx + 84, cy - 6, 12, 22, -0.2, 0, TAU); ctx.fill();
    // a felemelt kéz sziluettje
    const hx = cx + ww * 0.3, hy = cy + 40 + Math.sin(t * 6) * 5;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(Math.sin(t * 6) * 0.12);
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 32, 0, 0, TAU); ctx.fill();
    [[-18, -38, 0.18], [-6, -46, 0.05], [7, -44, -0.05], [19, -36, -0.15]].forEach(([x, y, a]) => { ctx.save(); ctx.translate(x, y + 10); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, -14, 6.5, 22, 0, 0, TAU); ctx.fill(); ctx.restore(); });
    ctx.beginPath(); ctx.ellipse(-28, 6, 7, 18, 0.9, 0, TAU); ctx.fill();
    ctx.fillRect(-16, 24, 32, 90);
    ctx.restore();
    // szemüveg: csak a csillanás
    const g1 = 0.25 + 0.75 * flash;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(200,215,235,${0.25 * g1})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx - 28, cy - 18, 21, 15, 0, 0, TAU); ctx.ellipse(cx + 28, cy - 18, 21, 15, 0, 0, TAU); ctx.stroke();
    glow(ctx, cx - 34, cy - 24, 22, 'rgba(235,245,255,A)', 0.9 * g1); glow(ctx, cx + 22, cy - 24, 18, 'rgba(235,245,255,A)', 0.75 * g1);
    ctx.restore();
    // eső az üvegen + tükröződés
    ctx.strokeStyle = 'rgba(160,180,200,0.22)'; ctx.lineWidth = 1.4;
    const r = rng(12);
    for (let i = 0; i < 55; i++) { const x = wx + r() * ww, y = wy + ((r() * wh + t * 50 * (0.5 + r())) % wh); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1, y + 8 + r() * 26); ctx.stroke(); }
    const rf = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh); rf.addColorStop(0, 'rgba(120,140,170,0.08)'); rf.addColorStop(0.5, 'rgba(0,0,0,0)'); rf.addColorStop(1, 'rgba(120,140,170,0.05)');
    ctx.fillStyle = rf; ctx.fillRect(wx, wy, ww, wh);
    ctx.restore();
    ctx.strokeStyle = '#0d0f12'; ctx.lineWidth = 16; ctx.strokeRect(wx, wy, ww, wh);
  };

  JUMP.rat = (ctx, t) => {
    const p = Math.min(1, t * 1.1);
    ctx.save(); ctx.translate(lerp(W * 0.7, W * 0.05, p), lerp(H * 0.7, H * 1.08, p)); ctx.scale(4, 4); ctx.rotate(-0.25);
    ctx.filter = 'blur(1.2px)';
    ctx.fillStyle = '#030303'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 14, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(26, -8, 13, 8, 0.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(22, -16, 5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#030303'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-28, 4); ctx.quadraticCurveTo(-60, 22, -78, 6); ctx.stroke();
    ctx.fillStyle = 'rgba(255,220,200,0.9)'; ctx.beginPath(); ctx.arc(32, -11, 1.4, 0, TAU); ctx.fill();
    ctx.restore();
  };

  // ---------------------------------------------------------------- FOTÓS HELYSZÍNEK
  // Minden fotó egyszer, előre színezve kerül gyorsítótárba; képkockánként csak a kamera
  // lassú mozgása és a dinamikus rétegek (eső, köd, fények…) számolódnak.
  const PHOTO = (R.PHOTO = {});
  const IMG = {}, GRADED = {};
  R.imgBase = 'assets/img/';

  function loadImg(name) {
    if (IMG[name]) return IMG[name];
    const im = new Image();
    im.decoding = 'async';
    IMG[name] = im;
    im.onload = () => { im._ok = true; };
    im.onerror = () => { im._bad = true; };
    // beágyazott képek (file:// megnyitáskor a böngésző máshogy nem engedi a WebGL-t)
    im.src = (root.IMGDATA && root.IMGDATA[name]) || R.imgBase + name + '.jpg';
    return im;
  }
  R.loadImg = loadImg;
  R.preload = (keys) => (keys || Object.keys(PHOTO)).forEach((k) => PHOTO[k] && loadImg(PHOTO[k].img));

  // g: { b: fényerő, c: kontraszt, s: telítettség, sep: szépia, h: színárnyalat, tint: [szín, alfa, mód], night: day-for-night }
  function graded(key) {
    if (GRADED[key]) return GRADED[key];
    const P = PHOTO[key], im = IMG[P.img];
    if (!im || !im._ok) return null;
    const c = mk(W, H), x = c.getContext('2d');
    const g = P.g || {};
    // „cover” illesztés, választható fókuszponttal
    const ar = im.width / im.height, tr = W / H;
    let sw = im.width, sh = im.height, sx = 0, sy = 0;
    if (ar > tr) { sw = im.height * tr; sx = (im.width - sw) * (P.fx_ === undefined ? 0.5 : P.fx_); }
    else { sh = im.width / tr; sy = (im.height - sh) * (P.fy === undefined ? 0.5 : P.fy); }
    x.filter = `brightness(${g.b || 1}) contrast(${g.c || 1}) saturate(${g.s === undefined ? 1 : g.s}) sepia(${g.sep || 0}) hue-rotate(${g.h || 0}deg)`;
    x.drawImage(im, sx, sy, sw, sh, 0, 0, W, H);
    x.filter = 'none';
    if (g.night) {
      // day-for-night: kék szorzás, csúcsfények letörése, ég sötétítése
      x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgb(70,95,150)'; x.fillRect(0, 0, W, H);
      const sk = x.createLinearGradient(0, 0, 0, H * 0.6);
      sk.addColorStop(0, 'rgba(0,0,10,0.85)'); sk.addColorStop(1, 'rgba(0,0,10,0)');
      x.globalCompositeOperation = 'source-over'; x.fillStyle = sk; x.fillRect(0, 0, W, H * 0.6);
    }
    if (g.tint) { x.globalCompositeOperation = g.tint[2] || 'soft-light'; x.globalAlpha = g.tint[1]; x.fillStyle = g.tint[0]; x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
    // finom textúra, hogy a felnagyított fotó ne legyen „műanyag”
    x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.12; x.drawImage(TX.fine, 0, 0, W, H); x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
    GRADED[key] = c;
    return c;
  }

  function redPulse(ctx, t, a) {
    const p = 0.55 + 0.45 * Math.sin(t * 2.4);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgba(255,${70 - 40 * p | 0},${60 - 40 * p | 0},1)`; ctx.globalAlpha = 0.75 * a; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter';
    glow(ctx, W * 0.5, -40, W * 0.7, 'rgba(255,30,15,A)', 0.28 * p * a);
    ctx.restore();
  }

  // Fejszével áttört lyuk az ajtón
  function drawHole(ctx, hx, hy, r) {
    R.holePos = [hx, hy, r];
    const rr = rng(17), N = 26, pts = [];
    let q = r; for (let i = 0; i < N; i++) { const a = (i / N) * TAU + (rr() - 0.5) * 0.15; q = Math.max(r * 0.6, Math.min(r * 1.3, q * 0.6 + r * (0.55 + rr() * 0.75) * 0.4 + (rr() < 0.2 ? r * 0.25 : 0))); pts.push([hx + Math.cos(a) * q * 1.12, hy + Math.sin(a) * q]); }
    ctx.save();
    // behorpadt, kifelé hajló fémperem
    ctx.beginPath(); pts.forEach(([x, y], i) => { const dx = x - hx, dy = y - hy; ctx[i ? 'lineTo' : 'moveTo'](hx + dx * 1.22, hy + dy * 1.22); }); ctx.closePath();
    const g = ctx.createRadialGradient(hx, hy, r * 0.6, hx, hy, r * 1.5);
    g.addColorStop(0, 'rgba(150,140,120,0.55)'); g.addColorStop(1, 'rgba(40,30,25,0)');
    ctx.fillStyle = g; ctx.fill();
    // a lyuk: túloldalt vörös vészfény
    ctx.beginPath(); pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.closePath();
    const g2 = ctx.createRadialGradient(hx, hy + r * 0.3, 2, hx, hy, r * 1.2);
    g2.addColorStop(0, '#2a0503'); g2.addColorStop(1, '#030101');
    ctx.fillStyle = g2; ctx.fill();
    // szilánkok és csillogó élek
    ctx.strokeStyle = 'rgba(220,210,190,0.5)'; ctx.lineWidth = 1.2;
    pts.forEach(([x, y], i) => { if (i % 2) return; const dx = x - hx, dy = y - hy; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * 0.25 + (rr() - 0.5) * 8, y + dy * 0.25 + (rr() - 0.5) * 8); ctx.stroke(); });
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.closePath(); ctx.stroke();
    ctx.restore();
  }
  // Kardos régi Volvója, lekapcsolt lámpákkal, esőtől csillogva
  function volvo(ctx, cx, cy, s) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
    ctx.fillStyle = '#07090a';
    ctx.beginPath(); ctx.moveTo(-230, 0); ctx.lineTo(-232, -62); ctx.lineTo(-140, -74); ctx.lineTo(-96, -136); ctx.lineTo(112, -136);
    ctx.lineTo(152, -76); ctx.lineTo(236, -68); ctx.lineTo(240, 0); ctx.closePath(); ctx.fill();
    // ablakok: halvány égbolt-tükröződés
    const g = ctx.createLinearGradient(0, -130, 0, -78); g.addColorStop(0, 'rgba(90,110,140,0.35)'); g.addColorStop(1, 'rgba(20,25,35,0.6)');
    ctx.fillStyle = g; quad(ctx, [-86, -128, 104, -128, 138, -80, -122, -80]); ctx.fill();
    ctx.fillStyle = '#07090a'; ctx.fillRect(4, -130, 8, 52);
    // élfény az esőben
    ctx.strokeStyle = 'rgba(160,180,210,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-232, -62); ctx.lineTo(-140, -74); ctx.lineTo(-96, -136); ctx.lineTo(112, -136); ctx.lineTo(152, -76); ctx.lineTo(236, -68); ctx.stroke();
    ctx.fillStyle = '#010101'; ctx.beginPath(); ctx.arc(-140, 0, 34, 0, TAU); ctx.arc(150, 0, 34, 0, TAU); ctx.fill();
    // nyitott kesztyűtartó halvány fénye
    ctx.globalCompositeOperation = 'lighter'; glow(ctx, 60, -92, 60, 'rgba(255,210,150,A)', 0.22);
    ctx.restore();
  }
  // A falnak dőlve ülő alak (Dani)
  function slumped(ctx, x, y, h) {
    ctx.save(); ctx.translate(x, y); const k = h / 300; ctx.scale(k, k);
    ctx.fillStyle = '#0d0e10';
    ctx.beginPath(); ctx.moveTo(-90, 0); ctx.quadraticCurveTo(-100, -150, -50, -190); ctx.quadraticCurveTo(0, -215, 50, -185);
    ctx.quadraticCurveTo(95, -140, 110, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-10, -232, 40, 46, 0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1d14'; ctx.beginPath(); ctx.ellipse(-14, -258, 46, 20, 0.4, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#0d0e10'; ctx.beginPath(); ctx.moveTo(60, -120); ctx.quadraticCurveTo(140, -60, 160, 0); ctx.lineTo(130, 0); ctx.quadraticCurveTo(115, -50, 50, -90); ctx.fill();
    ctx.restore();
  }

  function drawPhoto(ctx, t, key) {
    const P = PHOTO[key];
    const img = graded(key);
    if (!img) return false;
    const kb = P.kb || [1.04, 1.1, 0, 0];
    const k = 0.5 - 0.5 * Math.cos(t * 0.045);
    // állandó keret-eltolás + lassú, finom kamerasodródás
    const z = lerp(kb[0], kb[1], k), ox = kb[2] * W + Math.sin(t * 0.05) * (kb[0] - 1) * 0.15 * W, oy = kb[3] * H;
    const hand = P.hand ? [Math.sin(t * 0.9) * 3 + Math.sin(t * 2.1) * 1.2, Math.cos(t * 0.7) * 2.5] : [0, 0];
    let shake = [0, 0];
    if (P.gen && S.genOn) shake = [Math.sin(t * 80) * 0.8, Math.cos(t * 97) * 0.6];
    ctx.save();
    ctx.translate(W / 2 + ox + hand[0] + shake[0], H / 2 + oy + hand[1] + shake[1]);
    ctx.scale(z, z);
    if (S.zoom) { const zz = 1 + (S.zoom.k - 1) * Math.min(1, (performance.now() - S.zoom.t0) / 2500); ctx.translate((0.5 - S.zoom.x) * W * (zz - 1), (0.5 - S.zoom.y) * H * (zz - 1)); ctx.scale(zz, zz); }
    ctx.drawImage(img, -W / 2, -H / 2);
    ctx.restore();
    const f = P.fx || {};
    if (f.window) R.windowPos = f.window;
    if (f.mastDraw) mast(ctx, f.mastDraw[0] * W, f.mastDraw[1] * H, f.mastDraw[2] * H, f.mastDraw[3], f.mastC || '#05070a', t, false);
    if (f.plate) {
      const [px, py, pw, ph, txt] = f.plate;
      ctx.save(); ctx.fillStyle = '#0f5a32'; ctx.fillRect((px - pw / 2) * W, (py - ph / 2) * H, pw * W, ph * H);
      ctx.strokeStyle = 'rgba(230,240,230,0.7)'; ctx.lineWidth = 2; ctx.strokeRect((px - pw / 2) * W + 4, (py - ph / 2) * H + 4, pw * W - 8, ph * H - 8);
      ctx.fillStyle = '#eef4ee'; ctx.font = `600 ${Math.round(ph * H * 0.5)}px "Oswald", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, px * W, py * H + 1);
      ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.drawImage(TX.n1, (px - pw / 2) * W, (py - ph / 2) * H, pw * W, ph * H);
      ctx.restore();
    }
    if (f.hole) drawHole(ctx, f.hole[0] * W, f.hole[1] * H, f.hole[2] * W);
    if (f.sign) {
      const [sx, sy, txt] = f.sign;
      ctx.save(); ctx.translate(sx * W, sy * H); ctx.rotate(-0.02);
      ctx.fillStyle = '#6b5a38'; ctx.fillRect(-150, -26, 300, 52);
      ctx.strokeStyle = '#2a2010'; ctx.lineWidth = 3; ctx.strokeRect(-150, -26, 300, 52);
      ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(TX.n1, -150, -26, 300, 52); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#1a1208'; ctx.font = 'bold 28px "Courier Prime", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 2);
      ctx.restore();
    }
    if (f.panel) {
      const px = f.panel[0] * W, py = f.panel[1] * H, blink = Math.sin(t * 4) > 0;
      ctx.fillStyle = '#141516'; ctx.fillRect(px - 32, py - 50, 64, 104);
      ctx.fillStyle = blink ? '#ff3a2a' : '#4a0a08'; ctx.fillRect(px - 9, py - 40, 18, 8);
      ctx.fillStyle = '#0a2a14'; ctx.fillRect(px - 22, py - 20, 44, 40);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, px, py - 36, 70, 'rgba(255,50,30,A)', blink ? 0.5 : 0.1); glow(ctx, px, py, 60, 'rgba(120,255,140,A)', 0.22); ctx.restore();
    }
    let bulbX = 0;
    if (f.bulb) {
      bulbX = Math.sin(t * 0.8) * 0.025;
      const bx = (f.bulb[0] + bulbX) * W, by = f.bulb[1] * H;
      ctx.strokeStyle = '#0c0c0c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.bulb[0] * W, -10); ctx.lineTo(bx, by); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, bx, by, 380, 'rgba(255,190,120,A)', 0.32); ctx.restore();
      ctx.fillStyle = '#fff3c8'; ctx.beginPath(); ctx.arc(bx, by + 8, 8, 0, TAU); ctx.fill();
    }
    if (f.slumped) slumped(ctx, f.slumped[0] * W, f.slumped[1] * H, f.slumped[2] * H);
    if (f.waves && !S.rezKi) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) { const rr = (t * 60 + i * 60) % 360; ctx.strokeStyle = `rgba(160,180,255,${0.12 * (1 - rr / 360)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.waves[0] * W, f.waves[1] * H, rr, 0, TAU); ctx.stroke(); }
      ctx.restore();
    }
    if (f.dialGlow && S.dialGlow > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, f.dialGlow[0] * W, f.dialGlow[1] * H, 420, 'rgba(255,170,90,A)', 0.45 * S.dialGlow); ctx.restore(); }
    if (f.darkIfOff && !S.genOn) darkness(ctx, f.darkIfOff, flashlights(t, 2, W * 0.5, H * 0.55, 280));
    if (f.fog) fogBand(ctx, t, f.fog[0] * H, f.fog[1] * H, f.fog[2] || 10, f.fog[3] || 0.3, f.fog[4] || '#8090a8');
    if (f.fog2) fogBand(ctx, t + 40, f.fog2[0] * H, f.fog2[1] * H, f.fog2[2] || 16, f.fog2[3] || 0.25, f.fog2[4] || '#8090a8');
    if (f.mast) {
      const on = Math.sin(t * 3.2) > 0.1 ? 1 : 0.08;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, f.mast[0] * W, f.mast[1] * H, 46, 'rgba(255,40,30,A)', 0.6 * on); glow(ctx, f.mast[0] * W, f.mast[1] * H, 7, 'rgba(255,200,180,A)', on);
      ctx.restore();
    }
    if (f.windows) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, r] of f.windows) glow(ctx, x * W, y * H, r || 40, 'rgba(255,170,90,A)', 0.35 * (0.9 + 0.1 * Math.sin(t * 30 + x * 50)));
      ctx.restore();
    }
    if (f.lamp) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, f.lamp[0] * W, f.lamp[1] * H, f.lamp[2] || 300, 'rgba(255,175,95,A)', 0.3 * (0.92 + 0.08 * Math.sin(t * 11) * Math.sin(t * 7.3))); ctx.restore(); }
    if (f.dust) dust(ctx, t, f.dust);
    if (f.smoke) smoke(ctx, t, f.smoke, -120);
    if (f.fire) {
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(255,150,90)'; ctx.fillRect(0, 0, W, H); ctx.restore();
      flames(ctx, t, -20, H * 1.02, W * 0.4, 300, 0.45 * f.fire); flames(ctx, t + 3, W * 0.62, H * 1.02, W * 0.4, 260, 0.4 * f.fire);
      embers(ctx, t, f.fire);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W * 0.25, H * 0.95, 620, 'rgba(255,90,20,A)', 0.12 * f.fire + 0.04 * Math.sin(t * 9)); ctx.restore();
    }
    if (f.red) redPulse(ctx, t, f.red);
    if (f.flicker) {
      const fl = flicker(t, f.flickerSeed || 3, f.flicker);
      if (fl < 0.9) { ctx.fillStyle = `rgba(0,0,0,${0.55 * (1 - fl)})`; ctx.fillRect(0, 0, W, H); }
    }
    if (f.dark) {
      const lights = [];
      if (f.beams) lights.push(...flashlights(t, f.beams, (f.beamAt || [0.5, 0.55])[0] * W, (f.beamAt || [0.5, 0.55])[1] * H, f.beamSpread || 280));
      if (f.lampMask) lights.push({ x: (f.lampMask[0] + bulbX) * W, y: f.lampMask[1] * H, r: f.lampMask[2] || 420, a: 1, warm: true });
      darkness(ctx, f.dark, lights);
    }
    if (f.rain) rain(ctx, t, f.rain, f.rainAngle || -0.3);
    if (f.storm && Math.random() < 0.004 && !S.reduce) R.lightning();
    if (f.creature) creature(ctx, f.creature[0] * W, f.creature[1] * H, f.creature[2] * H, t, 0.92);
    if (f.figure) {
      const walk = Math.min(1, t / 12);
      ctx.save(); ctx.filter = 'blur(1.6px)'; ctx.globalAlpha = 0.88;
      figure(ctx, f.figure[0] * W, (f.figure[1] + walk * 0.08) * H, f.figure[2] * H * (1 + walk * 0.35), f.figure[3] || '#0a0b0c', { mask: f.figure[4] });
      ctx.restore();
    }
    if (f.volvo) volvo(ctx, f.volvo[0] * W, f.volvo[1] * H, f.volvo[2]);
    return true;
  }

  // ---------------------------------------------------------------- WEBGL UTÓMUNKA
  const VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*0.5+0.5;gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;
varying vec2 uv; uniform sampler2D tex; uniform float time, hallu, vhs, flash, dark, red, calm, grain, chroma, lightning;
uniform vec3 flashCol; uniform vec2 res, shake;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
vec3 samp(vec2 q){return texture2D(tex,clamp(q,0.001,0.999)).rgb;}
void main(){
  vec2 q=uv; q.y=1.-q.y;
  q+=shake;
  vec2 c=q-.5;
  // lencse-torzítás + hallucinációs „lélegzés”
  float r2=dot(c,c);
  q=.5+c*(1.+.045*r2+hallu*.03*sin(time*.9));
  q+=hallu*vec2(sin(q.y*9.+time*1.3),cos(q.x*7.-time*1.1))*.0035;
  // VHS: sávos remegés
  if(vhs>0.){
    float band=step(.985,n(vec2(floor(q.y*60.),floor(time*12.))));
    q.x+=band*(h(vec2(time,q.y))-.5)*.03*vhs;
    q.x+=sin(q.y*300.+time*20.)*.0006*vhs;
  }
  float ca=(chroma+hallu*.6+vhs*.8)*.004*(.3+r2*2.);
  vec3 col;
  col.r=samp(q+c*ca).r; col.g=samp(q).g; col.b=samp(q-c*ca).b;
  // bloom: fényes részek gyűrűs mintavétele
  vec3 bl=vec3(0.);
  for(int i=0;i<12;i++){float a=float(i)*.5236;vec2 o=vec2(cos(a),sin(a));
    vec3 s1=samp(q+o*.008); vec3 s2=samp(q+o*.02);
    bl+=max(s1-.55,0.)*1.2+max(s2-.6,0.)*1.;}
  col+=bl/12.*1.6;
  // színkorrekció: hideg árnyék, meleg csúcsfény
  float l=dot(col,vec3(.299,.587,.114));
  col=mix(col,vec3(l),.18-calm*.1);
  col*=mix(vec3(.86,.95,1.08),vec3(1.07,1.,.9),smoothstep(.2,.8,l));
  col=pow(max(col,0.),vec3(1.06));
  col=mix(col,col*vec3(1.35,.45,.4),red);
  // vignetta + hallucinációs perem-árnyak
  float v=smoothstep(.95,.25,length(c*vec2(1.25,1.)));
  col*=mix(.55,1.,v);
  float edge=smoothstep(.25,.62,length(c*vec2(1.3,1.)));
  float sh=smoothstep(.55,.85,fbm(vec2(atan(c.y,c.x)*2.,time*.15)+c*3.));
  col*=1.-hallu*edge*sh*.85;
  // VHS: szkenvonalak, színfolyás, zajsáv
  if(vhs>0.){
    col*=1.-vhs*.12*step(.5,fract(q.y*res.y*.5));
    float roll=smoothstep(.0,.02,abs(fract(q.y-time*.07)-.5)-.47);
    col+=vec3(.08)*(1.-roll)*vhs*h(q*time);
    col=mix(col,vec3(dot(col,vec3(.3,.6,.1)))*vec3(1.05,1.,.92),.25*vhs);
  }
  // filmszemcse
  col+=(h(q*res+fract(time*7.)*100.)-.5)*grain*(.6+hallu*.8);
  // villám, villanás, elsötétülés
  col+=vec3(.75,.8,1.)*lightning;
  col=mix(col,flashCol,flash);
  col*=1.-dark;
  gl_FragColor=vec4(col,1.);
}`;

  function initGL(canvas) {
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
    if (!gl) return null;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const U = {};
    ['tex', 'time', 'hallu', 'vhs', 'flash', 'dark', 'red', 'calm', 'grain', 'chroma', 'lightning', 'flashCol', 'res', 'shake'].forEach((n) => (U[n] = gl.getUniformLocation(pr, n)));
    return { gl, U, tex };
  }

  // ---------------------------------------------------------------- ÁLLAPOT ÉS FŐCIKLUS
  R.state = {
    bg: 'black', prev: null, fade: 1, t0: 0, hallu: 0, halluTarget: 0, vhs: 0, flash: 0, flashCol: [1, 1, 1], dark: 0, darkTarget: 0,
    shake: 0, red: 0, calm: 0, lightning: 0, jump: null, jumpUntil: 0, ghostUntil: 0, genOn: false, rezKi: false, reduce: false, grain: 0.07, focus: null, dialGlow: 0,
  };
  const S = R.state;
  let scene2d, sctx, prevC, glx, out2d, outCanvas;

  R.init = function (canvas) {
    textures();
    outCanvas = canvas;
    scene2d = mk(W, H); sctx = scene2d.getContext('2d');
    prevC = mk(W, H);
    glx = initGL(canvas);
    if (!glx) out2d = canvas.getContext('2d');
    R.resize();
    root.addEventListener('resize', R.resize);
    if (!R.disabled) requestAnimationFrame(loop);
  };

  R.resize = function () {
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    const vw = root.innerWidth, vh = root.innerHeight;
    const scale = Math.min(vw / W, vh / H);
    const cw = Math.round(W * scale), ch = Math.round(H * scale);
    outCanvas.style.width = cw + 'px'; outCanvas.style.height = ch + 'px';
    outCanvas.width = Math.round(cw * dpr); outCanvas.height = Math.round(ch * dpr);
    const ui = document.getElementById('ui');
    if (ui) { ui.style.width = cw + 'px'; ui.style.height = ch + 'px'; ui.style.fontSize = (ch / 720) * 16 + 'px'; }
  };

  R.setScene = function (key, immediate) {
    if (!SC[key] && !PHOTO[key]) { console.warn('Ismeretlen helyszín:', key); key = 'black'; }
    if (PHOTO[key]) loadImg(PHOTO[key].img);
    if (key === S.bg) return;
    if (!immediate && S.bg) { prevC.getContext('2d').drawImage(scene2d, 0, 0); S.prev = true; S.fade = 0; S.fadeT0 = performance.now(); }
    S.bg = key; S.t0 = performance.now() / 1000; S.lightning = 0;
  };

  R.flash = (col, a) => { if (S.reduce) a = Math.min(a || 1, 0.25); S.flash = Math.min(col === 'red' ? 0.55 : 0.85, a || 0.85); S.flashCol = col === 'red' ? [0.7, 0.04, 0.02] : [1, 1, 1]; };
  R.shake = (a) => { S.shake = Math.max(S.shake, S.reduce ? (a || 1) * 0.3 : a || 1); };
  R.lightning = () => { S.lightning = S.reduce ? 0.2 : 0.8; S.boltSeed = (Math.random() * 1e6) | 0; S.boltX = W * (0.2 + Math.random() * 0.6); };
  R.jump = (kind, ms) => { if (!JUMP[kind]) return; S.jump = kind; S.jumpT0 = performance.now() / 1000; S.jumpUntil = performance.now() + (ms || 650); R.shake(1.4); };
  R.ghost = () => { S.ghostUntil = performance.now() + 380; S.ghostX = Math.random() > 0.5 ? W * 0.08 : W * 0.92; };
  R.setDark = (a) => { S.darkTarget = a; };
  R.setHallu = (a) => { S.halluTarget = clamp(a, 0, 1); };
  R.setVhs = (on) => { S.vhs = on ? 1 : 0; };
  R.calm = () => { S.calm = 1; S.hallu = 0; S.halluTarget = 0; };

  R.stats = { paint: 0 };
  function loop(ms) {
    const tp0 = performance.now();
    const now = ms / 1000;
    const t = Math.max(0, now - S.t0);
    // helyszín
    sctx.save();
    try {
      const drawn = PHOTO[S.bg] && !R.noPhotos ? drawPhoto(sctx, t, S.bg) : false;
      if (!drawn) (SC[S.bg] || SC.black)(sctx, t);
    } catch (e) { console.error(e); SC.black(sctx); }
    sctx.restore();
    // ghost: perifériás alak
    if (performance.now() < S.ghostUntil) { sctx.save(); sctx.globalAlpha = 0.55; shadowBeing(sctx, S.ghostX, H * 1.05, H * 0.9, now, { calm: 1 }); sctx.restore(); }
    // villám
    const outdoor = PHOTO[S.bg] ? !!(PHOTO[S.bg].fx || {}).storm : /storm|ravine|forest|gate|tower|court/.test(S.bg);
    if (S.lightning > 0.05 && S.boltSeed && outdoor) bolt(sctx, S.boltX, S.boltSeed, S.lightning);
    // ijesztés
    if (S.jump && performance.now() < S.jumpUntil) {
      sctx.save(); JUMP[S.jump](sctx, now - S.jumpT0); sctx.restore();
      if ((S.jump === 'door_creature' || S.jump === 'door_face') && R.holePos) {
        const k = 1 + 1.3 * Math.min(1, (now - S.jumpT0) / 0.18);
        const tmp = R._ztmp || (R._ztmp = mk(W, H)); const tx = tmp.getContext('2d');
        tx.clearRect(0, 0, W, H); tx.drawImage(scene2d, 0, 0);
        const [hx, hy] = R.holePos;
        sctx.save(); sctx.fillStyle = '#000'; sctx.fillRect(0, 0, W, H);
        sctx.translate(W / 2, H / 2); sctx.scale(k, k); sctx.translate(-hx, -hy); sctx.drawImage(tmp, 0, 0); sctx.restore();
      }
    } else S.jump = null;
    // áttűnés az előző helyszínről
    if (S.prev && S.fade < 1) {
      S.fade = Math.min(1, (performance.now() - S.fadeT0) / 900);
      sctx.save(); sctx.globalAlpha = 1 - smooth(S.fade); sctx.drawImage(prevC, 0, 0); sctx.restore();
    }
    R.stats.paint = R.stats.paint * 0.9 + (performance.now() - tp0) * 0.1;
    // paraméterek simítása – időalapú, hogy lassú gépen se ragadjon be egy villanás
    const dt = Math.min(0.1, Math.max(0.001, now - (S.lastNow || now))); S.lastNow = now;
    const f60 = dt * 60;
    S.hallu += (S.halluTarget - S.hallu) * (1 - Math.pow(0.98, f60));
    S.dark += (S.darkTarget - S.dark) * (1 - Math.pow(0.94, f60));
    S.flash *= Math.pow(0.88, f60); S.lightning *= Math.pow(0.86, f60); S.shake *= Math.pow(0.9, f60); S.calm *= Math.pow(0.995, f60);
    if (S.focus) S.focus.p = Math.min(1, S.focus.p + 0.01);
    const sx = (Math.random() - 0.5) * 0.012 * S.shake, sy = (Math.random() - 0.5) * 0.012 * S.shake;
    if (glx) {
      const { gl, U, tex } = glx;
      gl.viewport(0, 0, outCanvas.width, outCanvas.height);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene2d);
      gl.uniform1f(U.time, now); gl.uniform1f(U.hallu, S.hallu); gl.uniform1f(U.vhs, S.vhs);
      gl.uniform1f(U.flash, S.flash); gl.uniform3fv(U.flashCol, S.flashCol); gl.uniform1f(U.dark, S.dark);
      gl.uniform1f(U.red, S.red); gl.uniform1f(U.calm, S.calm); gl.uniform1f(U.grain, S.grain);
      gl.uniform1f(U.chroma, 0.6); gl.uniform1f(U.lightning, S.lightning * 0.35);
      gl.uniform2f(U.res, outCanvas.width, outCanvas.height); gl.uniform2f(U.shake, sx, sy);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else {
      out2d.drawImage(scene2d, sx * W, sy * H, outCanvas.width, outCanvas.height);
      if (S.flash > 0.01) { out2d.fillStyle = `rgba(255,255,255,${S.flash})`; out2d.fillRect(0, 0, outCanvas.width, outCanvas.height); }
      if (S.dark > 0.01) { out2d.fillStyle = `rgba(0,0,0,${S.dark})`; out2d.fillRect(0, 0, outCanvas.width, outCanvas.height); }
    }
    requestAnimationFrame(loop);
  }

  R.scenes = SC;
  R.jumps = JUMP;
  R.W = W; R.H = H;
})(window);
