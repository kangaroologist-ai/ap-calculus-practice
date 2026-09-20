let stopCurrent: (() => void) | undefined;
export function stopCelebration() {
  stopCurrent?.();
  stopCurrent = undefined;
}
export function celebrateFullScreen() {
  stopCelebration();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'full-celebration';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const context = canvas.getContext('2d');
  if (!context) { canvas.remove(); return; }
  const width = innerWidth, height = innerHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * ratio; canvas.height = height * ratio;
  context.scale(ratio, ratio);
  const colors = ['#007aff', '#5ac8fa', '#34c759', '#ffcc00', '#ff9f0a'];
  const pieces = Array.from({length: 100}, (_, i) => ({
    x: i % 2 ? width * .1 : width * .9,
    y: height * .58,
    vx: (i % 2 ? 1 : -1) * (80 + Math.random() * width * .5),
    vy: -(200 + Math.random() * height * .55),
    spin: Math.random() * 12 - 6,
    rotation: Math.random() * Math.PI,
    color: colors[i % colors.length],
    size: 4 + Math.random() * 5,
  }));
  const started = performance.now();
  let frame = 0;
  const stop = () => { cancelAnimationFrame(frame); canvas.remove(); };
  stopCurrent = stop;
  const draw = (now: number) => {
    const elapsed = (now - started) / 1000;
    if (elapsed >= 1.6 || document.hidden) { stopCelebration(); return; }
    context.clearRect(0, 0, width, height);
    context.globalAlpha = Math.min(1, (1.6 - elapsed) / .45);
    for (const p of pieces) {
      context.save();
      context.translate(p.x + p.vx * elapsed, p.y + p.vy * elapsed + 420 * elapsed * elapsed);
      context.rotate(p.rotation + p.spin * elapsed);
      context.fillStyle = p.color;
      context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .55);
      context.restore();
    }
    frame = requestAnimationFrame(draw);
  };
  frame = requestAnimationFrame(draw);
}
