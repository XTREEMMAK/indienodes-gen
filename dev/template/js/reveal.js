// Intro reveal for each section: fade-rise by default, with an optional
// sequenced fade-rise for grouped content. Plain IIFE, no modules, loaded
// with <script defer> — same convention as indienodes-web's drifty-stars.js.
//
// Progressive enhancement, not a dependency: elements are only ever hidden
// under the `.has-js` class, and that class is the first thing this file
// does. If this script never loads or throws before that line, the page
// never adds `.has-js` and every section is plainly visible via base.css's
// default (non-hidden) state. A creator page that went dark because of a
// blocked or failing script would be a much worse failure than one that
// never animates.
(function () {
  document.documentElement.classList.add("has-js");

  var targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) return;

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    // Reduced motion (or no observer support): show everything immediately
    // rather than trying to animate or leaving it stuck hidden.
    targets.forEach(function (el) {
      el.classList.add("is-visible");
    });
    return;
  }

  // Anything already inside the viewport when this script runs — the hero,
  // above all, since it's the first thing on the page — reveals on its own
  // rather than waiting on the scroll observer below. An IntersectionObserver
  // reports elements *entering* view; something that starts in view has no
  // "entering" to report, and depending on how tall it is relative to the
  // viewport can simply never cross whatever ratio the observer is tuned to.
  // Left to that path alone, it stays clipped at zero height forever — which
  // is exactly the "hero never appears" bug this block exists to fix.
  //
  // The double rAF, not a single one, is what makes the transition actually
  // play: the browser needs one committed frame at the CSS's default hidden
  // state before the next frame flips it to visible, or the two class
  // changes collapse into a single paint and no transition ever renders.
  var toObserve = [];
  targets.forEach(function (el) {
    var rect = el.getBoundingClientRect();
    var alreadyInView = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyInView) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.classList.add("is-visible");
        });
      });
    } else {
      toObserve.push(el);
    }
  });

  if (!toObserve.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
  );

  toObserve.forEach(function (el) {
    observer.observe(el);
  });
})();
