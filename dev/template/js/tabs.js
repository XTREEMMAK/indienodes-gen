// Progressive enhancement: both sections remain readable without JavaScript.
(() => {
  const nav = document.querySelector("[data-tabs]");
  if (!nav) return;
  const tabs = [...nav.querySelectorAll("a")];
  const panels = tabs.map((tab) => document.querySelector(tab.hash));
  if (panels.some((panel) => !panel)) return;
  nav.setAttribute("role", "tablist");
  nav.setAttribute("aria-label", "Creator interests");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const container = document.createElement("div");
  container.className = "tab-panels";
  container.style.display = "flow-root";
  panels[0].before(container);
  panels.forEach((panel) => container.append(panel));
  let activeIndex = -1;
  let animations = [];
  motion.addEventListener("change", () => {
    if (motion.matches) animations.forEach((animation) => animation.cancel());
  });
  function activate(index, focus = false) {
    if (index === activeIndex) {
      if (focus) tabs[index].focus();
      return;
    }
    // Measure before cancelling so rapid switches continue from the visible height.
    const previousHeight = container.getBoundingClientRect().height;
    const switching = activeIndex !== -1;
    activeIndex = index;
    animations.forEach((animation) => animation.cancel());
    animations = [];
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (!motion.matches) {
      if (switching) {
        const nextHeight = container.getBoundingClientRect().height;
        animations.push(
          container.animate(
            [
              { height: previousHeight + "px", overflow: "clip" },
              { height: nextHeight + "px", overflow: "clip" },
            ],
            { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          ),
        );
        animations.push(
          panels[index].animate(
            [
              { opacity: 0, transform: "translateY(10px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 300, easing: "ease-out" },
          ),
        );
      }
      panels[index].querySelectorAll(".cosplay-group").forEach((group, i) => {
        animations.push(
          group.animate(
            [
              { opacity: 0, transform: "translateY(1.35rem)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 650,
              delay: i * 90,
              easing: "ease-out",
              fill: "backwards",
            },
          ),
        );
      });
    }
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, i) => {
    tab.id = "tab-" + panels[i].id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[i].id);
    panels[i].setAttribute("role", "tabpanel");
    panels[i].setAttribute("aria-labelledby", tab.id);
    panels[i].tabIndex = 0;
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      activate(i);
      history.replaceState(null, "", tab.hash);
    });
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (i + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (i + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activate(next, true);
      history.replaceState(null, "", tabs[next].hash);
    });
  });
  const sync = () =>
    activate(
      Math.max(
        0,
        tabs.findIndex((tab) => tab.hash === location.hash),
      ),
    );
  addEventListener("hashchange", sync);
  sync();
})();
