(function () {
  "use strict";

  function initIsoLayers() {
    var layers = document.querySelectorAll(".iso-layer");
    if (!layers.length) return;

    layers.forEach(function (layer) {
      var group = layer.closest("[data-iso-illustration]") || layer.parentElement;
      var caption = group ? group.querySelector(".iso-caption") : null;
      var desc = layer.getAttribute("data-desc") || "";

      function activate() {
        layers.forEach(function (l) { l.classList.remove("is-active"); });
        layer.classList.add("is-active");
        if (caption) caption.textContent = desc;
      }
      function reset() {
        layer.classList.remove("is-active");
        if (caption) caption.textContent = "";
      }

      layer.addEventListener("mouseenter", activate);
      layer.addEventListener("mouseleave", reset);
      layer.addEventListener("focus", activate);
      layer.addEventListener("blur", reset);
      layer.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initIsoLayers();
  });
})();
