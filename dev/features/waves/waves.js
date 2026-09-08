(() => {
  const waves = document.querySelector(".waves-background");
  const button = document.querySelector(".waves-toggle");
  if (!waves || !button) return;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false;
  function sync() {
    waves.classList.toggle("is-paused", paused || motion.matches || document.hidden);
    button.hidden = motion.matches;
    button.textContent = paused ? "Resume waves" : "Pause waves";
    button.setAttribute("aria-pressed", String(paused));
  }
  button.addEventListener("click", () => {
    paused = !paused;
    sync();
  });
  motion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  sync();
})();
