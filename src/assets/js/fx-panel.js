(() => {
  const toggle = document.querySelector(".fx-panel-toggle");
  const list = document.querySelector(".fx-panel__list");
  if (!toggle || !list) return;
  function setOpen(open) {
    list.classList.toggle("is-open", open);
    list.inert = !open;
    toggle.setAttribute("aria-expanded", String(open));
  }
  toggle.addEventListener("click", () =>
    setOpen(!list.classList.contains("is-open")),
  );
  document.addEventListener("click", (event) => {
    if (!list.classList.contains("is-open")) return;
    if (list.contains(event.target) || toggle.contains(event.target)) return;
    setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !list.classList.contains("is-open")) return;
    setOpen(false);
    toggle.focus();
  });
  setOpen(false);
})();
