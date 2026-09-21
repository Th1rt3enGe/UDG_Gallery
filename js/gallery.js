// Bitácora de vuelo — visor de imágenes (lightbox) sin dependencias externas.
(function () {
  "use strict";

  var frames = Array.prototype.slice.call(document.querySelectorAll(".frame[data-src]"));
  var viewer = document.getElementById("viewer");
  var viewerImg = document.getElementById("viewer-img");
  var viewerTag = document.getElementById("viewer-tag");
  var viewerCap = document.getElementById("viewer-cap");
  var btnClose = document.getElementById("viewer-close");
  var btnPrev = document.getElementById("viewer-prev");
  var btnNext = document.getElementById("viewer-next");

  var currentIndex = -1;

  function openViewer(index) {
    currentIndex = index;
    var frame = frames[index];
    viewerImg.src = frame.getAttribute("data-src");
    viewerImg.alt = frame.getAttribute("data-alt") || "";
    viewerTag.textContent = frame.getAttribute("data-tag") || "";
    viewerCap.textContent = frame.getAttribute("data-caption") || "";
    viewer.classList.add("open");
    document.body.style.overflow = "hidden";
    btnClose.focus();
  }

  function closeViewer() {
    viewer.classList.remove("open");
    document.body.style.overflow = "";
    viewerImg.src = "";
  }

  function show(delta) {
    if (currentIndex === -1) return;
    var next = (currentIndex + delta + frames.length) % frames.length;
    openViewer(next);
  }

  frames.forEach(function (frame, i) {
    // Las fotos que aún no tienes (placeholder) no abren el visor.
    if (frame.classList.contains("is-empty")) return;
    frame.addEventListener("click", function () { openViewer(i); });
    frame.setAttribute("tabindex", "0");
    frame.setAttribute("role", "button");
    frame.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openViewer(i);
      }
    });
  });

  btnClose.addEventListener("click", closeViewer);
  btnPrev.addEventListener("click", function () { show(-1); });
  btnNext.addEventListener("click", function () { show(1); });

  viewer.addEventListener("click", function (e) {
    if (e.target === viewer) closeViewer();
  });

  document.addEventListener("keydown", function (e) {
    if (!viewer.classList.contains("open")) return;
    if (e.key === "Escape") closeViewer();
    if (e.key === "ArrowLeft") show(-1);
    if (e.key === "ArrowRight") show(1);
  });

  // Si una imagen todavía no existe en /images, muestra el marcador
  // en vez de un ícono de imagen rota.
  document.querySelectorAll(".frame img[data-src]").forEach(function (img) {
    img.addEventListener("error", function () {
      img.closest(".frame").classList.add("is-empty");
    });
  });
})();
