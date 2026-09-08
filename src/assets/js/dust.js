(() => {
  const canvas = document.querySelector(".dust-particles");
  const button = document.querySelector(".dust-particles-toggle");
  const ctx = canvas?.getContext("2d");
  if (!ctx || !button) return;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let width,
    height,
    frame,
    last = 0,
    paused = false;
  const motes = [];
  function resize() {
    width = innerWidth;
    height = innerHeight;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }
  // Back to the original fine dust specks (see the flare experiment noted
  // in project memory for the size/opacity/density values that were tried
  // and reverted), but denser and faster-rising than the original: density
  // divisor 22000 -> 11000 and cap 50 -> 100, rise 3-11 -> 6-22.
  function spawn(atBottom) {
    return {
      x: Math.random() * width,
      y: atBottom ? height + 10 : Math.random() * height,
      size: 0.6 + Math.random() * 1.6,
      rise: 6 + Math.random() * 16,
      wobble: 6 + Math.random() * 10,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.12 + Math.random() * 0.3,
      twinkleSpeed: 0.3 + Math.random() * 0.5,
    };
  }
  function draw(now) {
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    ctx.clearRect(0, 0, width, height);
    const count = Math.min(100, Math.ceil((width * height) / 11000));
    if (motes.length > count) motes.length = count;
    while (motes.length < count) motes.push(spawn());
    motes.forEach((m, i) => {
      m.y -= m.rise * dt;
      m.x += Math.sin(now / 1000 / m.wobble + m.phase) * 4 * dt;
      if (m.y < -10) {
        motes[i] = spawn(true);
        return;
      }
      const twinkle = 0.6 + 0.4 * Math.sin(now / 1000 * m.twinkleSpeed + m.phase);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fillStyle = "rgb(255 244 214 / " + m.opacity * twinkle + ")";
      ctx.fill();
    });
    frame = requestAnimationFrame(draw);
  }
  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    button.hidden = motion.matches;
    canvas.hidden = motion.matches || paused;
    button.textContent = paused ? "Resume dust" : "Pause dust";
    button.setAttribute("aria-pressed", String(paused));
    if (!motion.matches && !paused && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  button.addEventListener("click", () => {
    paused = !paused;
    sync();
  });
  motion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  addEventListener("resize", resize);
  resize();
  sync();
})();
