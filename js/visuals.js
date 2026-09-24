/* Shared visual components. Each is opt-in by markup:
     [data-iso-illustration]  interactive isometric layers + legend
     [data-tilt]              pointer-tracked 3D tilt with parallax + sheen
     [data-counter]           count-up to the value already in the HTML
   Every component leaves the static HTML fully readable if JS is off or
   motion is reduced. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Isometric layers ------------------------------------------------------
     The legend buttons are the keyboard targets; hovering a shape in the SVG
     does the same thing for mouse users. */
  function initIsoIllustrations() {
    document.querySelectorAll("[data-iso-illustration]").forEach(function (figure) {
      var svg = figure.querySelector("svg");
      var caption = figure.querySelector(".iso-caption");
      var buttons = figure.querySelectorAll(".iso-legend button[data-layer]");
      var layers = figure.querySelectorAll(".iso-layer[data-layer]");

      function activate(key) {
        var desc = "";
        buttons.forEach(function (btn) {
          var on = btn.getAttribute("data-layer") === key;
          btn.setAttribute("aria-pressed", String(on));
          if (on) desc = btn.getAttribute("data-desc") || "";
        });
        layers.forEach(function (layer) {
          layer.classList.toggle("is-active", layer.getAttribute("data-layer") === key);
        });
        if (svg) svg.classList.toggle("iso-dim", Boolean(key));
        if (caption) caption.textContent = desc;
      }

      buttons.forEach(function (btn) {
        var key = btn.getAttribute("data-layer");
        btn.setAttribute("aria-pressed", "false");
        btn.addEventListener("click", function () {
          activate(btn.getAttribute("aria-pressed") === "true" ? null : key);
        });
        btn.addEventListener("mouseenter", function () { activate(key); });
        btn.addEventListener("focus", function () { activate(key); });
      });
      layers.forEach(function (layer) {
        layer.addEventListener("mouseenter", function () { activate(layer.getAttribute("data-layer")); });
      });
      figure.addEventListener("mouseleave", function () {
        if (!figure.contains(document.activeElement)) activate(null);
      });
      figure.addEventListener("focusout", function (event) {
        if (!figure.contains(event.relatedTarget)) activate(null);
      });
    });
  }

  /* Tilt ------------------------------------------------------------------
     Writes --rx/--ry/--mx/--my on the element; CSS does the rest. Mouse and
     pen only (no hover on touch), and never under reduced motion. */
  function initTilt() {
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduceMotion || !fine) return;
    var MAX_DEG = 7;

    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      var frame = 0;
      var last = null;

      function render() {
        frame = 0;
        if (!last) return;
        var rect = el.getBoundingClientRect();
        var px = Math.min(Math.max((last.clientX - rect.left) / rect.width, 0), 1);
        var py = Math.min(Math.max((last.clientY - rect.top) / rect.height, 0), 1);
        el.style.setProperty("--ry", ((px - 0.5) * 2 * MAX_DEG).toFixed(2) + "deg");
        el.style.setProperty("--rx", ((0.5 - py) * 2 * MAX_DEG).toFixed(2) + "deg");
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      }

      el.addEventListener("pointermove", function (event) {
        if (event.pointerType === "touch") return;
        last = event;
        el.classList.add("is-tilting");
        if (!frame) frame = requestAnimationFrame(render);
      });
      el.addEventListener("pointerleave", function () {
        last = null;
        el.classList.remove("is-tilting");
        ["--rx", "--ry", "--mx", "--my"].forEach(function (prop) { el.style.removeProperty(prop); });
      });
    });
  }

  /* Counters --------------------------------------------------------------
     The element's text is already the final value. On first view we animate
     0 → data-target and land exactly on the original text. */
  function initCounters() {
    var counters = document.querySelectorAll("[data-counter]");
    if (!counters.length || reduceMotion || !("IntersectionObserver" in window)) return;
    var DURATION = 1400;

    function run(el) {
      var finalText = el.textContent;
      var target = parseFloat(el.getAttribute("data-target"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      var start = null;

      function step(now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / DURATION, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        if (t < 1) {
          el.textContent = prefix + (target * eased).toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          }) + suffix;
          requestAnimationFrame(step);
        } else {
          el.textContent = finalText;
        }
      }
      requestAnimationFrame(step);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          run(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { observer.observe(el); });
  }

  initIsoIllustrations();
  initTilt();
  initCounters();
})();
