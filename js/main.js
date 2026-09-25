/* Site-wide behavior: theme switch, mobile nav, current-page highlight,
   scroll reveal. Each feature is an independent init function that no-ops
   when its markup isn't on the page. */
(function () {
  "use strict";

  var root = document.documentElement;
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function storedTheme() {
    try { return localStorage.getItem("theme"); } catch (e) { return null; }
  }
  function storeTheme(value) {
    try { localStorage.setItem("theme", value); } catch (e) { /* storage blocked */ }
  }

  /* Theme: the <head> script already set data-theme before first paint.
     Here we wire the switch and follow OS changes until the user picks. */
  function initTheme() {
    var toggle = document.querySelector("[data-theme-toggle]");

    function apply(theme) {
      root.setAttribute("data-theme", theme);
      if (toggle) toggle.setAttribute("aria-checked", String(theme === "dark"));
    }

    apply(root.getAttribute("data-theme") || (darkQuery.matches ? "dark" : "light"));

    darkQuery.addEventListener("change", function (event) {
      if (!storedTheme()) apply(event.matches ? "dark" : "light");
    });

    if (!toggle) return;
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      storeTheme(next);
    });
  }

  function initNavToggle() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var links = document.querySelector("[data-nav-links]");
    if (!toggle || !links) return;

    function setOpen(open) {
      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    }

    toggle.addEventListener("click", function () {
      setOpen(!links.classList.contains("is-open"));
    });
    links.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && links.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* Exact page match first; pages outside the main nav (design-system,
     case study entries) name their parent with <body data-nav-parent>. */
  function highlightCurrentNav() {
    var normalize = function (path) { return path.replace(/\/index\.html$/, "/"); };
    var here = normalize(window.location.pathname);
    var parent = document.body.getAttribute("data-nav-parent");
    var links = document.querySelectorAll("[data-nav-links] a");
    var matched = false;
    links.forEach(function (link) {
      if (normalize(new URL(link.getAttribute("href"), window.location.href).pathname) === here) {
        link.setAttribute("aria-current", "page");
        matched = true;
      }
    });
    if (matched || !parent) return;
    links.forEach(function (link) {
      if (new URL(link.getAttribute("href"), window.location.href).pathname.split("/").pop() === parent) {
        link.setAttribute("aria-current", "true");
      }
    });
  }

  function initScrollReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -60px 0px" });
    items.forEach(function (el) { observer.observe(el); });
  }

  initTheme();
  initNavToggle();
  highlightCurrentNav();
  initScrollReveal();
})();
