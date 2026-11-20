import * as THREE from 'three';

export function createPitchTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const w = 2048;
  const h = 1360;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Base deep lush stadium grass with alternating mowed stripes
  const stripeCount = 16;
  const stripeW = w / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1b6b3a' : '#217d45';
    ctx.fillRect(i * stripeW, 0, stripeW + 1, h);
  }

  // Subtle turf grain noise
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let i = 0; i < 6500; i++) {
    const gx = (i * 73) % w;
    const gy = (i * 137) % h;
    ctx.fillRect(gx, gy, 2, 2);
  }

  // Pitch markings inset (margin around playfield)
  const padX = 96;
  const padY = 72;
  const pw = w - padX * 2;
  const ph = h - padY * 2;
  const midX = w / 2;
  const midY = h / 2;

  ctx.strokeStyle = 'rgba(248, 250, 252, 0.92)';
  ctx.fillStyle = 'rgba(248, 250, 252, 0.92)';
  ctx.lineWidth = 7;

  // Outer touchlines & goal lines
  ctx.strokeRect(padX, padY, pw, ph);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(midX, padY);
  ctx.lineTo(midX, padY + ph);
  ctx.stroke();

  // Center circle + spot
  const circleR = ph * 0.145;
  ctx.beginPath();
  ctx.arc(midX, midY, circleR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(midX, midY, 10, 0, Math.PI * 2);
  ctx.fill();

  // Penalty boxes & 6-yard boxes (left and right along X; note pitch length mapped to Z or X)
  // Wait: texture maps U along field length (Z) or X. Let's draw standard horizontal field where length = W (2048), width = H (1360)
  const penW = pw * 0.155;
  const penH = ph * 0.56;
  const sixW = pw * 0.055;
  const sixH = ph * 0.28;
  const penSpotOffset = pw * 0.108;

  // Left penalty box
  ctx.strokeRect(padX, midY - penH / 2, penW, penH);
  ctx.strokeRect(padX, midY - sixH / 2, sixW, sixH);
  ctx.beginPath();
  ctx.arc(padX + penSpotOffset, midY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(padX + penSpotOffset, midY, circleR * 0.85, -0.68, 0.68);
  ctx.stroke();

  // Right penalty box
  ctx.strokeRect(padX + pw - penW, midY - penH / 2, penW, penH);
  ctx.strokeRect(padX + pw - sixW, midY - sixH / 2, sixW, sixH);
  ctx.beginPath();
  ctx.arc(padX + pw - penSpotOffset, midY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(padX + pw - penSpotOffset, midY, circleR * 0.85, Math.PI - 0.68, Math.PI + 0.68);
  ctx.stroke();

  // Corner arcs
  const cR = 26;
  const corners: [number, number, number, number][] = [
    [padX, padY, 0, Math.PI / 2],
    [padX + pw, padY, Math.PI / 2, Math.PI],
    [padX + pw, padY + ph, Math.PI, Math.PI * 1.5],
    [padX, padY + ph, Math.PI * 1.5, Math.PI * 2],
  ];
  for (const [cx, cy, a0, a1] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, cR, a0, a1);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  tex.needsUpdate = true;
  return tex;
}

export function createSoccerBallTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, size, size);

  // Draw crisp soccer panel patches
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 4;
  ctx.fillStyle = '#0f172a';

  const centers = [
    [128, 128],
    [384, 128],
    [256, 256],
    [128, 384],
    [384, 384],
    [0, 256],
    [512, 256],
    [256, 0],
    [256, 512],
  ];

  for (const [cx, cy] of centers) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const r = 46;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createAdBoardTexture(homeShort: string, awayShort: string): THREE.CanvasTexture {
  const w = 1024;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090f1a';
  ctx.fillRect(0, 0, w, h);

  const panels = [
    { bg: '#064e3b', fg: '#34d399', text: 'FOOTBALL MTAANI 3D' },
    { bg: '#1e293b', fg: '#f8fafc', text: `${homeShort} VS ${awayShort}` },
    { bg: '#78350f', fg: '#fbbf24', text: 'SHENG BOOTH LIVE' },
    { bg: '#0f172a', fg: '#38bdf8', text: 'MPIRA NI DAKIKA 90' },
  ];

  const pw = w / panels.length;
  panels.forEach((p, idx) => {
    ctx.fillStyle = p.bg;
    ctx.fillRect(idx * pw + 4, 8, pw - 8, h - 16);
    ctx.fillStyle = p.fg;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.text, idx * pw + pw / 2, h / 2);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  tex.needsUpdate = true;
  return tex;
}

export function createCrowdTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#141c2b';
  ctx.fillRect(0, 0, w, h);

  const colors = ['#34d399', '#f59e0b', '#e2e8f0', '#38bdf8', '#fb7185', '#64748b'];
  for (let row = 0; row < 16; row++) {
    ctx.fillStyle = row % 2 === 0 ? '#1a2335' : '#111827';
    ctx.fillRect(0, row * 16, w, 16);
    for (let col = 0; col < 64; col++) {
      const seed = (row * 31 + col * 17) % colors.length;
      ctx.fillStyle = colors[seed];
      ctx.fillRect(col * 8 + 1, row * 16 + 3, 5, 8);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 2);
  tex.needsUpdate = true;
  return tex;
}
