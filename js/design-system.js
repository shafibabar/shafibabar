/* Design System page only: renders color swatches for both themes and
   computes WCAG contrast ratios live from the tokens in styles.css. Each
   theme panel sets its own color-scheme, so light-dark() resolves per panel. */
(function () {
  "use strict";

  var SWATCHES = [
    ["--color-bg", "Page background"],
    ["--color-surface", "Surface"],
    ["--color-surface-2", "Surface, lower"],
    ["--color-surface-sunken", "Sunken"],
    ["--color-text", "Text"],
    ["--color-text-muted", "Text, muted"],
    ["--color-text-faint", "Text, faint"],
    ["--color-accent", "Accent"],
    ["--color-accent-hover", "Accent, hover"],
    ["--color-accent-2", "Accent 2 (teal)"],
    ["--color-accent-3", "Accent 3 (violet)"],
    ["--color-focus", "Focus ring"]
  ];
  var PAIRS = [
    ["--color-text", "--color-surface", "Text on surface"],
    ["--color-text-muted", "--color-surface", "Muted text on surface"],
    ["--color-text-muted", "--color-bg", "Muted text on page"],
    ["--color-text-faint", "--color-surface", "Faint text on surface"],
    ["--color-text-faint", "--color-surface-sunken", "Faint text on sunken"],
    ["--color-accent", "--color-surface", "Accent on surface"],
    ["--color-accent", "--color-bg", "Accent on page"],
    ["--btn-primary-text", "--btn-primary-bottom", "Button text on primary"],
    ["--color-accent-2", "--color-surface", "Accent 2 on surface (decorative)"]
  ];

  function parseRgb(str) {
    var m = str.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  }
  function luminance(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  }
  function ratio(a, b) {
    var la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function hex(c) {
    return "#" + [c.r, c.g, c.b].map(function (v) { return Math.round(v).toString(16).padStart(2, "0"); }).join("");
  }

  /* Resolve a color token inside a given panel by applying it to a probe. */
  function resolve(panel, token) {
    var probe = document.createElement("span");
    probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;background-color:var(" + token + ")";
    panel.appendChild(probe);
    var value = parseRgb(getComputedStyle(probe).backgroundColor);
    panel.removeChild(probe);
    return value;
  }

  document.querySelectorAll("[data-palette] .theme-panel").forEach(function (panel) {
    var grid = panel.querySelector("[data-swatches]");
    SWATCHES.forEach(function (s) {
      var c = resolve(panel, s[0]);
      var sw = document.createElement("div");
      sw.className = "swatch";
      var chip = document.createElement("div");
      chip.className = "swatch-chip";
      chip.style.background = "var(" + s[0] + ")";
      var meta = document.createElement("div");
      meta.className = "swatch-meta";
      var name = document.createElement("strong");
      name.textContent = s[1];
      var code = document.createElement("code");
      code.textContent = s[0];
      var val = document.createElement("span");
      val.className = "val";
      val.textContent = c ? hex(c) : "";
      meta.appendChild(name);
      meta.appendChild(document.createElement("br"));
      meta.appendChild(code);
      meta.appendChild(val);
      sw.appendChild(chip);
      sw.appendChild(meta);
      grid.appendChild(sw);
    });

    var body = panel.querySelector("[data-contrast] tbody");
    PAIRS.forEach(function (p) {
      var fg = resolve(panel, p[0]), bg = resolve(panel, p[1]);
      if (!fg || !bg) return;
      var r = ratio(fg, bg);
      var tr = document.createElement("tr");
      var th = document.createElement("th");
      th.scope = "row";
      th.textContent = p[2];
      var td1 = document.createElement("td");
      td1.textContent = r.toFixed(2) + ":1";
      var td2 = document.createElement("td");
      td2.className = "pass";
      td2.textContent = r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA large text only" : "Fail";
      tr.appendChild(th);
      tr.appendChild(td1);
      tr.appendChild(td2);
      body.appendChild(tr);
    });
  });

  /* Show the computed px value next to each type and spacing token. */
  document.querySelectorAll("[data-type-scale] code[data-token], [data-space-scale] code[data-token]").forEach(function (code) {
    var token = code.getAttribute("data-token");
    var raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    var px = raw.endsWith("rem") ? parseFloat(raw) * parseFloat(getComputedStyle(document.documentElement).fontSize) : parseFloat(raw);
    code.textContent = token + " · " + (isNaN(px) ? raw : Math.round(px * 10) / 10 + "px");
  });
})();
