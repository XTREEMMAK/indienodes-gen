(() => {
  const canvas = document.querySelector(".blossoms");
  const button = document.querySelector(".blossoms-toggle");
  const ctx = canvas?.getContext("2d");
  if (!ctx || !button) return;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let width,
    height,
    frame,
    last = 0,
    paused = false;
  const petals = [];
  const glowPanels = document.body.hasAttribute("data-blossom-glow")
    ? [
        ...document.querySelectorAll(
          ".hero__inner, .section, .profile-tabs, .site-footer",
        ),
      ]
    : [];
  const glowLayers = glowPanels.map((panel) => {
    const layer = document.createElement("canvas");
    layer.className = "blossom-glow-layer";
    layer.setAttribute("aria-hidden", "true");
    panel.append(layer);
    return { panel, layer, ctx: layer.getContext("2d"), width: 0, height: 0 };
  });
  function resize() {
    width = innerWidth;
    height = innerHeight;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }
  function spawn() {
    return {
      x: -20 - Math.random() * width * 0.2,
      y: height * (0.82 + Math.random() * 0.2),
      speed: 35 + Math.random() * 45,
      size: 4 + Math.random() * 5,
      angle: Math.random() * Math.PI * 2,
      phase: Math.random() * 6,
    };
  }
  function updateGlassGlow() {
    const radius = 120;
    const scale = Math.min(devicePixelRatio || 1, 2);
    glowLayers.forEach((glow) => {
      const rect = glow.panel.getBoundingClientRect();
      const panelWidth = Math.max(1, Math.round(rect.width));
      const panelHeight = Math.max(1, Math.round(rect.height));
      if (glow.width !== panelWidth || glow.height !== panelHeight) {
        glow.width = panelWidth;
        glow.height = panelHeight;
        glow.layer.width = panelWidth * scale;
        glow.layer.height = panelHeight * scale;
        glow.ctx.setTransform(scale, 0, 0, scale, 0, 0);
      }
      glow.ctx.clearRect(0, 0, panelWidth, panelHeight);
      petals.forEach((petal) => {
        const distanceX = Math.max(
          rect.left - petal.x,
          0,
          petal.x - rect.right,
        );
        const distanceY = Math.max(
          rect.top - petal.y,
          0,
          petal.y - rect.bottom,
        );
        const distance = Math.hypot(distanceX, distanceY);
        if (distance >= radius) return;
        const progress = 1 - distance / radius;
        const strength = progress * progress * (3 - 2 * progress);
        const gradient = glow.ctx.createRadialGradient(
          petal.x - rect.left,
          petal.y - rect.top,
          0,
          petal.x - rect.left,
          petal.y - rect.top,
          radius,
        );
        gradient.addColorStop(0, "rgb(255 205 228 / " + 0.22 * strength + ")");
        gradient.addColorStop(
          0.42,
          "rgb(238 157 201 / " + 0.1 * strength + ")",
        );
        gradient.addColorStop(1, "rgb(238 157 201 / 0)");
        glow.ctx.fillStyle = gradient;
        glow.ctx.fillRect(0, 0, panelWidth, panelHeight);
      });
    });
  }
  function clearGlassGlow() {
    glowLayers.forEach((glow) =>
      glow.ctx.clearRect(0, 0, glow.width, glow.height),
    );
  }
  function draw(now) {
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    ctx.clearRect(0, 0, width, height);
    const count = Math.min(18, Math.ceil(width / 70));
    if (petals.length > count) petals.length = count;
    while (petals.length < count) petals.push(spawn());
    petals.forEach((p, i) => {
      p.x += p.speed * dt;
      p.y -= (p.speed * 0.38 + Math.sin(now / 1200 + p.phase) * 12) * dt;
      p.angle += dt * 0.8;
      if (p.x > width + 30 || p.y < -30) petals[i] = spawn();
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.scale(1, 0.5 + Math.abs(Math.sin(now / 1600 + p.phase)) * 0.5);
      ctx.fillStyle = "rgba(215, 140, 169, 0.65)";
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 1.5, -p.size, p.size, p.size, 0, p.size);
      ctx.bezierCurveTo(-p.size, p.size * 0.3, -p.size, -p.size, 0, -p.size);
      ctx.fill();
      ctx.restore();
    });
    updateGlassGlow();
    frame = requestAnimationFrame(draw);
  }
  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    button.hidden = motion.matches;
    canvas.hidden = motion.matches || paused;
    if (motion.matches || paused || document.hidden) clearGlassGlow();
    button.textContent = paused ? "Resume petals" : "Pause petals";
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
