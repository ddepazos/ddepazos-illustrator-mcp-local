export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function organicPoints({
  points = 24,
  radius = 160,
  irregularity = 0.25,
  lobes = 6,
  lobeStrength = 0.16,
  seed = 1
} = {}) {
  const rand = mulberry32(seed);
  const phase = rand() * Math.PI * 2;
  const result = [];

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const harmonic = lobes > 0
      ? 1 + lobeStrength * Math.sin(lobes * angle + phase)
      : 1;
    const jitter = 1 + irregularity * (rand() * 2 - 1);
    const r = radius * harmonic * jitter;

    result.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    });
  }

  return result;
}

export function closedCatmullRomPath(points, smoothness = 0.82) {
  if (!points || points.length < 3) {
    throw new Error("Se requieren al menos 3 puntos.");
  }

  const n = points.length;
  const s = Math.max(0, Math.min(1, smoothness)) / 6;
  const p = (i) => points[(i + n) % n];

  let d = `M ${p(0).x.toFixed(3)} ${p(0).y.toFixed(3)}`;

  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);

    const c1x = p1.x + (p2.x - p0.x) * s;
    const c1y = p1.y + (p2.y - p0.y) * s;
    const c2x = p2.x - (p3.x - p1.x) * s;
    const c2y = p2.y - (p3.y - p1.y) * s;

    d += ` C ${c1x.toFixed(3)} ${c1y.toFixed(3)}, ${c2x.toFixed(3)} ${c2y.toFixed(3)}, ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`;
  }

  return d + " Z";
}

export function project3DMatrix({
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  scale = 1
} = {}) {
  const rad = (deg) => deg * Math.PI / 180;
  const x = rad(rotateX);
  const y = rad(rotateY);
  const z = rad(rotateZ);

  const cx = Math.cos(x), sx = Math.sin(x);
  const cy = Math.cos(y), sy = Math.sin(y);
  const cz = Math.cos(z), sz = Math.sin(z);

  return {
    a: (cz * cy) * scale,
    b: (sz * cy) * scale,
    c: ((cz * sy * sx) - (sz * cx)) * scale,
    d: ((sz * sy * sx) + (cz * cx)) * scale,
    tx: 0,
    ty: 0
  };
}

export function organicSvg({
  pathData,
  radius = 160,
  fill = "#111111",
  stroke = "none",
  strokeWidth = 1,
  copies = 1,
  rotationStep = 0,
  scaleStep = 0
}) {
  const pad = radius * 1.8;
  const size = pad * 2;
  const cx = pad;
  const cy = pad;

  const groups = [];

  for (let i = 0; i < copies; i++) {
    const rot = i * rotationStep;
    const s = Math.max(0.05, 1 + i * scaleStep);

    groups.push(
      `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})"><path d="${pathData}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" /></g>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${groups.join("\n  ")}
</svg>`;
}
