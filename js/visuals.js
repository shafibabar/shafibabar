/* Shared visual components, each opt-in by markup: data-iso-illustration,
   data-iso-arch, data-iso-primitive, data-tilt, data-counter, data-chart,
   data-before-after, data-annotated, figure.diagram[data-drawio].
   Static HTML is complete without JS; JS only enhances. Markup contracts
   are documented in css/styles.css and on pages/design-system.html. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVG_NS = "http://www.w3.org/2000/svg";
  var uid = 0;

  function svgEl(tag, attrs, text) {
    var node = document.createElementNS(SVG_NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }

  /* Isometric kit: the site's one projection (true isometric, 30° axes). */
  var COS30 = Math.cos(Math.PI / 6);
  var SIN30 = 0.5;
  function project(x, y, z) { return [(x - y) * COS30, (x + y) * SIN30 - z]; }
  function pointsAttr(list) {
    return list.map(function (p) { return p[0].toFixed(2) + "," + p[1].toFixed(2); }).join(" ");
  }

  function isoDefs(svg) {
    var prefix = "ik" + (++uid);
    var defs = svgEl("defs");
    [["top", "0", "0", "0.3", "1"], ["left", "0", "0", "1", "1"], ["right", "1", "0", "0", "1"]].forEach(function (g) {
      ["", "a"].forEach(function (accent) {
        var grad = svgEl("linearGradient", { id: prefix + "-" + accent + g[0], x1: g[1], y1: g[2], x2: g[3], y2: g[4] });
        grad.appendChild(svgEl("stop", { offset: "0", "class": "stop-" + accent + g[0] + "-hi" }));
        grad.appendChild(svgEl("stop", { offset: "1", "class": "stop-" + accent + g[0] + "-lo" }));
        defs.appendChild(grad);
      });
    });
    var blur = svgEl("filter", { id: prefix + "-soft", x: "-30%", y: "-40%", width: "160%", height: "180%" });
    blur.appendChild(svgEl("feGaussianBlur", { stdDeviation: "6" }));
    defs.appendChild(blur);
    svg.appendChild(defs);
    return prefix;
  }

  function isoBox(prefix, x0, y0, z0, w, d, h, accent) {
    var X = x0 + w, Y = y0 + d, Z = z0 + h;
    var a = accent ? "a" : "";
    var g = svgEl("g");
    var faces = [
      ["top", [project(x0, y0, Z), project(X, y0, Z), project(X, Y, Z), project(x0, Y, Z)]],
      ["right", [project(X, y0, z0), project(X, Y, z0), project(X, Y, Z), project(X, y0, Z)]],
      ["left", [project(x0, Y, z0), project(X, Y, z0), project(X, Y, Z), project(x0, Y, Z)]]
    ];
    faces.forEach(function (f) {
      g.appendChild(svgEl("polygon", { "class": "face", fill: "url(#" + prefix + "-" + a + f[0] + ")", points: pointsAttr(f[1]) }));
    });
    g.appendChild(svgEl("polyline", { "class": "edge-hi", points: pointsAttr([project(x0, Y, Z), project(X, Y, Z), project(X, y0, Z)]) }));
    g.appendChild(svgEl("polyline", { "class": "edge-hi", points: pointsAttr([project(X, Y, Z), project(X, Y, z0)]) }));
    return g;
  }
  function isoShadow(prefix, x0, y0, w, d) {
    var q = [project(x0, y0, 0), project(x0 + w, y0, 0), project(x0 + w, y0 + d, 0), project(x0, y0 + d, 0)]
      .map(function (p) { return [p[0], p[1] + 8]; });
    return svgEl("polygon", { "class": "iso-shadow", filter: "url(#" + prefix + "-soft)", points: pointsAttr(q) });
  }
  function isoConnector(p1, p2) {
    var a = project.apply(null, p1), b = project.apply(null, p2);
    return svgEl("line", { "class": "iso-link", x1: a[0].toFixed(2), y1: a[1].toFixed(2), x2: b[0].toFixed(2), y2: b[1].toFixed(2) });
  }
  function isoNode(p, r, core) {
    var a = project.apply(null, p);
    return svgEl("circle", { "class": core ? "iso-node iso-node--core" : "iso-node", cx: a[0].toFixed(2), cy: a[1].toFixed(2), r: String(r) });
  }
  function isoBadge(p, label) {
    var a = project.apply(null, p);
    var g = svgEl("g", { "class": "iso-badge" });
    g.appendChild(svgEl("circle", { cx: a[0].toFixed(2), cy: a[1].toFixed(2), r: "11" }));
    g.appendChild(svgEl("text", { x: a[0].toFixed(2), y: (a[1] + 4.5).toFixed(2), "text-anchor": "middle" }, label));
    return g;
  }
  function fitViewBox(svg, pad) {
    var box = svg.getBBox();
    svg.setAttribute("viewBox", [box.x - pad, box.y - pad, box.width + pad * 2, box.height + pad * 2].map(function (n) { return n.toFixed(1); }).join(" "));
  }

  function newIsoSvg(className) {
    return svgEl("svg", { "class": className, "aria-hidden": "true", focusable: "false" });
  }

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

  function initIsoArch() {
    document.querySelectorAll("[data-iso-arch]").forEach(function (figure) {
      var list = figure.querySelector(".iso-arch__layers");
      if (!list) return;
      var items = Array.prototype.slice.call(list.children);
      var n = items.length;
      if (!n) return;

      var W = 240, H = 26, GAP = 16;
      var step = n > 1 ? Math.min(48, 150 / (n - 1)) : 0;
      var explicitAccent = items.some(function (li) { return li.hasAttribute("data-accent"); });

      var holder = document.createElement("div");
      holder.className = "iso-arch__visual";
      var svg = newIsoSvg("iso-illustration");
      holder.appendChild(svg);
      list.parentNode.insertBefore(holder, list);
      var prefix = isoDefs(svg);
      svg.appendChild(isoShadow(prefix, 0, 0, W, W));

      var groups = items.map(function (li, i) {
        var s = W - i * step, off = (W - s) / 2, z = i * (H + GAP);
        var accent = explicitAccent ? li.hasAttribute("data-accent") : i === n - 1;
        var g = isoBox(prefix, off, off, z, s, s, H, accent);
        g.setAttribute("class", "iso-layer");
        g.appendChild(isoBadge([off + s / 2, off + s, z + H / 2], String(i + 1)));
        svg.appendChild(g);
        var num = document.createElement("span");
        num.className = "num";
        num.setAttribute("aria-hidden", "true");
        num.textContent = String(i + 1);
        li.insertBefore(num, li.firstChild);
        return g;
      });
      fitViewBox(svg, 14);
      figure.classList.add("is-enhanced");

      function activate(index) {
        groups.forEach(function (g, i) { g.classList.toggle("is-active", i === index); });
        items.forEach(function (li, i) { li.classList.toggle("is-active", i === index); });
        svg.classList.toggle("iso-dim", index != null);
      }
      items.forEach(function (li, i) {
        li.tabIndex = 0;
        li.addEventListener("mouseenter", function () { activate(i); });
        li.addEventListener("focus", function () { activate(i); });
        li.addEventListener("mouseleave", function () { activate(null); });
        li.addEventListener("blur", function () { activate(null); });
        groups[i].addEventListener("mouseenter", function () { activate(i); });
        groups[i].addEventListener("mouseleave", function () { activate(null); });
      });
    });
  }

  function initIsoPrimitives() {
    document.querySelectorAll("[data-iso-primitive]").forEach(function (host) {
      var kind = host.getAttribute("data-iso-primitive");
      var svg = newIsoSvg("iso-motif");
      host.appendChild(svg);
      var prefix = isoDefs(svg);
      if (kind === "cube") {
        svg.appendChild(isoShadow(prefix, 0, 0, 40, 40));
        svg.appendChild(isoBox(prefix, 0, 0, 0, 40, 40, 40, true));
      } else if (kind === "slab") {
        svg.appendChild(isoShadow(prefix, 0, 0, 60, 60));
        svg.appendChild(isoBox(prefix, 0, 0, 0, 60, 60, 10, false));
      } else if (kind === "stack") {
        svg.appendChild(isoShadow(prefix, 0, 0, 60, 60));
        svg.appendChild(isoBox(prefix, 0, 0, 0, 60, 60, 10, false));
        svg.appendChild(isoBox(prefix, 8, 8, 16, 44, 44, 10, false));
        svg.appendChild(isoBox(prefix, 16, 16, 32, 28, 28, 10, true));
      } else if (kind === "connector") {
        svg.appendChild(isoBox(prefix, 0, 0, 0, 20, 20, 20, false));
        svg.appendChild(isoConnector([20, 10, 10], [44, 10, 10]));
        svg.appendChild(isoBox(prefix, 44, 0, 0, 20, 20, 20, true));
      } else if (kind === "node") {
        svg.appendChild(isoBox(prefix, 0, 0, 0, 50, 50, 8, false));
        svg.appendChild(isoConnector([25, 25, 8], [25, 25, 40]));
        svg.appendChild(isoNode([25, 25, 40], 6, false));
        svg.appendChild(isoNode([25, 25, 8], 3.5, true));
      } else if (kind === "label") {
        var g = isoBox(prefix, 0, 0, 0, 50, 50, 12, false);
        svg.appendChild(g);
        svg.appendChild(isoBadge([25, 50, 6], "1"));
      }
      fitViewBox(svg, 10);
    });
  }

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

  function niceMax(v) {
    if (v <= 0) return 1;
    var pow = Math.pow(10, Math.floor(Math.log10(v)));
    var steps = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < steps.length; i++) if (steps[i] * pow >= v) return steps[i] * pow;
    return 10 * pow;
  }
  function fmt(n) { return n.toLocaleString("en-US", { maximumFractionDigits: 1 }); }

  function initCharts() {
    document.querySelectorAll("[data-chart]").forEach(function (figure) {
      var type = figure.getAttribute("data-chart");
      var unit = figure.getAttribute("data-unit") || "";
      var rows = Array.prototype.map.call(figure.querySelectorAll("tbody tr"), function (tr) {
        return { label: tr.cells[0].textContent.trim(), value: parseFloat(tr.cells[1].textContent.replace(/[^0-9.\-]/g, "")) };
      }).filter(function (r) { return !isNaN(r.value); });
      if (!rows.length) return;

      var spark = type === "sparkline";
      var Wd = spark ? 160 : 560, Ht = spark ? 40 : 240;
      var m = spark ? { t: 6, r: 8, b: 6, l: 4 } : { t: 18, r: 44, b: 30, l: 44 };
      var iw = Wd - m.l - m.r, ih = Ht - m.t - m.b;
      var values = rows.map(function (r) { return r.value; });
      // Bars and lines start at zero; a sparkline spans its own range to show the trend.
      var min = spark ? Math.min.apply(null, values) : 0;
      var max = spark ? Math.max.apply(null, values) : niceMax(Math.max.apply(null, values));
      if (max === min) max = min + 1;
      var y = function (v) { return m.t + ih - ((v - min) / (max - min)) * ih; };

      var title = figure.querySelector("figcaption");
      var svg = svgEl("svg", {
        "class": "chart-svg" + (spark ? " chart-svg--spark" : ""),
        viewBox: "0 0 " + Wd + " " + Ht,
        role: "img",
        tabindex: "0",
        "aria-label": (title ? title.textContent.trim() + ". " : "") + rows.length + " values; use arrow keys to read each one. Full data in the table."
      });

      if (!spark) {
        [0, 0.5, 1].forEach(function (f) {
          var v = max * f, yy = y(v);
          svg.appendChild(svgEl("line", { "class": "chart-grid", x1: m.l, x2: Wd - m.r, y1: yy, y2: yy }));
          svg.appendChild(svgEl("text", { "class": "chart-tick", x: m.l - 8, y: yy + 4, "text-anchor": "end" }, fmt(v) + unit));
        });
      }

      var xs = [];
      var marks = [];
      if (type === "bar") {
        var band = iw / rows.length;
        var bw = Math.min(24, band * 0.6);
        rows.forEach(function (r, i) {
          var cx = m.l + band * i + band / 2, top = y(r.value), base = m.t + ih, x0 = cx - bw / 2, rad = Math.min(4, base - top);
          xs.push(cx);
          var d = "M" + x0 + "," + base + "V" + (top + rad) + "Q" + x0 + "," + top + " " + (x0 + rad) + "," + top +
                  "H" + (x0 + bw - rad) + "Q" + (x0 + bw) + "," + top + " " + (x0 + bw) + "," + (top + rad) + "V" + base + "Z";
          var bar = svgEl("path", { "class": "chart-bar", d: d });
          svg.appendChild(bar);
          marks.push(bar);
          svg.appendChild(svgEl("text", { "class": "chart-tick", x: cx, y: Ht - m.b + 18, "text-anchor": "middle" }, r.label));
        });
        var last = rows.length - 1;
        svg.appendChild(svgEl("text", { "class": "chart-value", x: xs[last], y: y(rows[last].value) - 7, "text-anchor": "middle" }, fmt(rows[last].value) + unit));
      } else {
        var stepX = rows.length > 1 ? iw / (rows.length - 1) : 0;
        var pts = rows.map(function (r, i) { var px = m.l + stepX * i; xs.push(px); return [px, y(r.value)]; });
        var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1); }).join("");
        svg.appendChild(svgEl("path", { "class": "chart-area", d: line + "L" + pts[pts.length - 1][0] + "," + (m.t + ih) + "L" + pts[0][0] + "," + (m.t + ih) + "Z" }));
        svg.appendChild(svgEl("path", { "class": "chart-line", d: line }));
        var endP = pts[pts.length - 1];
        svg.appendChild(svgEl("circle", { "class": "chart-dot", cx: endP[0], cy: endP[1], r: spark ? 3 : 4 }));
        if (!spark) {
          rows.forEach(function (r, i) {
            if (i % Math.ceil(rows.length / 6) === 0 || i === rows.length - 1) {
              svg.appendChild(svgEl("text", { "class": "chart-tick", x: xs[i], y: Ht - m.b + 18, "text-anchor": "middle" }, r.label));
            }
          });
          svg.appendChild(svgEl("text", { "class": "chart-value", x: endP[0] + 8, y: endP[1] + 4 }, fmt(rows[rows.length - 1].value) + unit));
        }
      }

      var cross = svgEl("line", { "class": "chart-cross", y1: m.t, y2: m.t + ih, x1: -10, x2: -10 });
      var focusDot = svgEl("circle", { "class": "chart-dot chart-dot--focus", r: spark ? 3 : 4, cx: -10, cy: -10 });
      if (type !== "bar") { svg.appendChild(cross); svg.appendChild(focusDot); }

      var tip = document.createElement("div");
      tip.className = "chart-tooltip";
      tip.setAttribute("aria-hidden", "true");
      var tipValue = document.createElement("strong");
      var tipLabel = document.createElement("span");
      tip.appendChild(tipValue);
      tip.appendChild(tipLabel);

      var wrap = document.createElement("div");
      wrap.className = "chart-wrap";
      wrap.appendChild(svg);
      wrap.appendChild(tip);
      var details = figure.querySelector(".chart-table");
      figure.insertBefore(wrap, details);
      if (details) details.removeAttribute("open");

      var live = document.createElement("p");
      live.className = "visually-hidden";
      live.setAttribute("aria-live", "polite");
      figure.appendChild(live);

      var active = -1;
      function show(i, announce) {
        active = i;
        var r = rows[i];
        marks.forEach(function (bar, k) { bar.classList.toggle("is-active", k === i); });
        if (type !== "bar") {
          cross.setAttribute("x1", xs[i]); cross.setAttribute("x2", xs[i]);
          focusDot.setAttribute("cx", xs[i]); focusDot.setAttribute("cy", y(r.value));
          svg.classList.add("is-hovering");
        }
        tipValue.textContent = fmt(r.value) + unit;
        tipLabel.textContent = r.label;
        var box = svg.getBoundingClientRect();
        var scale = box.width / Wd;
        tip.style.left = (xs[i] * scale) + "px";
        tip.style.top = (y(r.value) * scale) + "px";
        tip.classList.add("is-visible");
        if (announce) live.textContent = r.label + ": " + fmt(r.value) + unit;
      }
      function hide() {
        active = -1;
        marks.forEach(function (bar) { bar.classList.remove("is-active"); });
        svg.classList.remove("is-hovering");
        tip.classList.remove("is-visible");
      }
      function nearest(clientX) {
        var box = svg.getBoundingClientRect();
        var vx = (clientX - box.left) * (Wd / box.width);
        var best = 0;
        xs.forEach(function (x, i) { if (Math.abs(x - vx) < Math.abs(xs[best] - vx)) best = i; });
        return best;
      }
      svg.addEventListener("pointermove", function (e) { show(nearest(e.clientX), false); });
      svg.addEventListener("pointerleave", hide);
      svg.addEventListener("blur", hide);
      svg.addEventListener("focus", function () { show(active < 0 ? rows.length - 1 : active, true); });
      svg.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          var next = (active < 0 ? rows.length - 1 : active) + (e.key === "ArrowRight" ? 1 : -1);
          show(Math.max(0, Math.min(rows.length - 1, next)), true);
        } else if (e.key === "Escape") { hide(); }
      });
    });
  }

  function initBeforeAfter() {
    document.querySelectorAll("[data-before-after]").forEach(function (box) {
      var panes = box.querySelectorAll(".ba-pane");
      if (panes.length !== 2) return;
      var stage = document.createElement("div");
      stage.className = "ba-stage";
      panes.forEach(function (p) { stage.appendChild(p); });
      var handle = document.createElement("div");
      handle.className = "ba-handle";
      handle.setAttribute("aria-hidden", "true");
      var range = document.createElement("input");
      range.type = "range";
      range.min = "0";
      range.max = "100";
      range.value = "50";
      range.className = "ba-range";
      range.setAttribute("aria-label", box.getAttribute("data-label") || "Reveal the after view");
      range.setAttribute("aria-valuetext", "50% after");
      stage.appendChild(handle);
      stage.appendChild(range);
      box.insertBefore(stage, box.firstChild);
      box.classList.add("is-enhanced");
      function update() {
        box.style.setProperty("--pos", range.value + "%");
        range.setAttribute("aria-valuetext", range.value + "% after");
      }
      range.addEventListener("input", update);
      update();
    });
  }

  function initAnnotated() {
    document.querySelectorAll("[data-annotated]").forEach(function (fig) {
      fig.querySelectorAll(".marker[href^='#']").forEach(function (marker) {
        var note = fig.querySelector(marker.getAttribute("href"));
        if (!note) return;
        function on() { marker.classList.add("is-active"); note.classList.add("is-active"); }
        function off() { marker.classList.remove("is-active"); note.classList.remove("is-active"); }
        [marker, note].forEach(function (el) {
          el.addEventListener("mouseenter", on);
          el.addEventListener("mouseleave", off);
        });
        marker.addEventListener("focus", on);
        marker.addEventListener("blur", off);
      });
    });
  }

  /* draw.io: static SVG by default; the viewer loads once, lazily, only if the page has a figure[data-drawio]. Any failure or >6s leaves the SVG. API per the draw.io docs: GraphViewer.createViewerForElement(el, cb). */
  var VIEWER_SRC = "https://viewer.diagrams.net/js/viewer-static.min.js";
  var VIEWER_TIMEOUT = 6000;
  var viewerPromise = null;

  function loadViewer() {
    if (viewerPromise) return viewerPromise;
    viewerPromise = new Promise(function (resolve, reject) {
      if (window.GraphViewer) { resolve(window.GraphViewer); return; }
      var script = document.createElement("script");
      script.src = VIEWER_SRC;
      script.async = true;
      script.onload = function () { window.GraphViewer ? resolve(window.GraphViewer) : reject(new Error("no GraphViewer")); };
      script.onerror = function () { reject(new Error("viewer blocked")); };
      setTimeout(function () { reject(new Error("viewer timeout")); }, VIEWER_TIMEOUT);
      document.head.appendChild(script);
    });
    return viewerPromise;
  }

  function upgradeDiagram(figure) {
    var canvas = figure.querySelector(".diagram-canvas");
    if (!canvas || canvas.querySelector(".drawio-viewer")) return;
    var url = new URL(figure.getAttribute("data-drawio"), document.baseURI).href;
    var host = document.createElement("div");
    host.className = "drawio-viewer";
    host.setAttribute("data-mxgraph", JSON.stringify({
      url: url,
      toolbar: "zoom layers lightbox",
      nav: true,
      resize: true,
      editable: false,
      "dark-mode": "light",
      "auto-fit": true,
      center: true
    }));
    var settled = false;
    function fail() {
      if (settled) return;
      settled = true;
      if (host.parentNode) host.parentNode.removeChild(host);
    }
    var timer = setTimeout(fail, VIEWER_TIMEOUT);
    loadViewer().then(function (GraphViewer) {
      if (settled) return;
      canvas.appendChild(host);
      GraphViewer.createViewerForElement(host, function () {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        canvas.classList.add("is-upgraded");
        canvas.style.aspectRatio = "";
      });
    }).catch(function () { clearTimeout(timer); fail(); });
  }

  function initDiagrams() {
    var figures = document.querySelectorAll("figure.diagram[data-drawio]");
    if (!figures.length) return;
    figures.forEach(function (figure) {
      var img = figure.querySelector(".diagram-static");
      var canvas = figure.querySelector(".diagram-canvas");
      if (img && canvas && img.getAttribute("width") && img.getAttribute("height")) {
        canvas.style.aspectRatio = img.getAttribute("width") + " / " + img.getAttribute("height");
      }
    });
    var connection = navigator.connection;
    if (connection && connection.saveData) return;
    if (!("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          upgradeDiagram(entry.target);
        }
      });
    }, { rootMargin: "200px 0px" });
    figures.forEach(function (figure) { observer.observe(figure); });
  }

  initIsoIllustrations();
  initIsoArch();
  initIsoPrimitives();
  initTilt();
  initCounters();
  initCharts();
  initBeforeAfter();
  initAnnotated();
  initDiagrams();
})();
