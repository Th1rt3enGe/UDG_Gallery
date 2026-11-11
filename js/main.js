// YaRe — interacciones del sitio: menú móvil, aparición al hacer scroll,
(function () {
  "use strict";

  // Menú móvil
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 761px)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  // Aparición al hacer scroll
  var revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // Si una imagen todavía no existe en /assets/img, muestra el marcador punteado.
  document.querySelectorAll(".media img").forEach(function (img) {
    var markEmpty = function () { img.closest(".media").classList.add("is-empty"); };
    if (img.complete && img.naturalWidth === 0) markEmpty();
    else img.addEventListener("error", markEmpty);
  });

  // Año actual
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Reproductor de música
  const music = document.getElementById('bgMusic');
  const music_toggle = document.getElementById('musicToggle');
  const icon = music_toggle.querySelector('.music-toggle__icon');
  music.volume = 0.3;

  music_toggle.addEventListener('click', async () => {
    if (music.paused) {
      try {
        await music.play();
        icon.textContent = '❚❚';
        toggle.setAttribute('aria-pressed', 'true');
        toggle.setAttribute('aria-label', 'Pause music');
      } catch (err) {
        console.error('Could not play audio:', err);
      }
    } else {
      music.pause();
      icon.textContent = '▶';
      music_toggle.setAttribute('aria-pressed', 'false');
      music_toggle.setAttribute('aria-label', 'Play music');
    }
  });
})();
