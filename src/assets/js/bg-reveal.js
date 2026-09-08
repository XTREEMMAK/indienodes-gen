(() => {
  const toggle = document.querySelector(".bg-reveal-toggle");
  const page = document.querySelector(".page");
  if (!toggle || !page) return;
  // The backdrop's one-time entrance keyframe (fill: both) would otherwise
  // keep pinning its opacity and fight this toggle's plain CSS transition;
  // once it has played, drop it so opacity is ours to animate cleanly both
  // ways instead of replaying the entrance fade every time the attribute
  // is removed.
  const backdrop = document.querySelector(".site-backdrop");
  backdrop?.addEventListener(
    "animationend",
    () => {
      backdrop.style.animation = "none";
    },
    { once: true },
  );
  toggle.addEventListener("click", () => {
    const active = document.body.toggleAttribute("data-bg-reveal");
    page.inert = active;
    toggle.setAttribute("aria-label", active ? "Show page" : "View background");
    toggle.setAttribute("aria-pressed", String(active));
  });
})();
