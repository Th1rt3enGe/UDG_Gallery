// YaRe — generador de curvas de nivel (topografía) sin dependencias.
// Uso: <svg class="contours" data-contours data-seed="7" aria-hidden="true"></svg>
// Crea un "terreno" con ruido de valor, lo corta en niveles con
// marching squares, une los segmentos y los suaviza en <path>s.
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var CELL = 12;          // tamaño de celda en px (menor = más detalle)
  var LEVELS = 13;        // número de curvas
  var MAJOR_EVERY = 4;    // cada N curvas, una más gruesa (curva maestra)

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeNoise(seed) {
    var rand = mulberry32(seed);
    var perm = new Uint8Array(512);
    var vals = new Float32Array(256);
    var i;
    for (i = 0; i < 256; i++) { vals[i] = rand(); perm[i] = i; }
    for (i = 255; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp;
    }
    for (i = 0; i < 256; i++) perm[i + 256] = perm[i];

    function lattice(ix, iy) { return vals[perm[(ix & 255) + perm[iy & 255]]]; }
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

    function noise(x, y) {
      var x0 = Math.floor(x), y0 = Math.floor(y);
      var fx = fade(x - x0), fy = fade(y - y0);
      var a = lattice(x0, y0), b = lattice(x0 + 1, y0);
      var c = lattice(x0, y0 + 1), d = lattice(x0 + 1, y0 + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    }

    // fBm con un poco de "domain warping" para formas más orgánicas.
    return function (x, y) {
      var wx = x + noise(x * 0.5 + 11.3, y * 0.5 + 4.7) * 1.6;
      var wy = y + noise(x * 0.5 + 2.1, y * 0.5 + 17.9) * 1.6;
      var sum = 0, amp = 1, freq = 1, norm = 0;
      for (var o = 0; o < 4; o++) {
        sum += noise(wx * freq, wy * freq) * amp;
        norm += amp; amp *= 0.5; freq *= 2;
      }
      return sum / norm;
    };
  }

  // Segmentos por caso de marching squares. Aristas: 0 arriba, 1 derecha, 2 abajo, 3 izquierda.
  var CASES = [
    [], [[3, 2]], [[2, 1]], [[3, 1]],
    [[0, 1]], [[3, 0], [2, 1]], [[0, 2]], [[3, 0]],
    [[3, 0]], [[0, 2]], [[0, 1], [3, 2]], [[0, 1]],
    [[3, 1]], [[2, 1]], [[3, 2]], []
  ];

  function edgePoint(e, i, j, t, tl, tr, br, bl) {
    var x, y;
    if (e === 0) { x = i + (t - tl) / (tr - tl); y = j; }
    else if (e === 1) { x = i + 1; y = j + (t - tr) / (br - tr); }
    else if (e === 2) { x = i + (t - bl) / (br - bl); y = j + 1; }
    else { x = i; y = j + (t - tl) / (bl - tl); }
    return [Math.round(x * CELL * 10) / 10, Math.round(y * CELL * 10) / 10];
  }

  function segmentsFor(field, cols, rows, t) {
    var segs = [];
    for (var j = 0; j < rows - 1; j++) {
      for (var i = 0; i < cols - 1; i++) {
        var tl = field[j * cols + i], tr = field[j * cols + i + 1];
        var bl = field[(j + 1) * cols + i], br = field[(j + 1) * cols + i + 1];
        var idx = (tl > t ? 8 : 0) | (tr > t ? 4 : 0) | (br > t ? 2 : 0) | (bl > t ? 1 : 0);
        var list = CASES[idx];
        for (var k = 0; k < list.length; k++) {
          segs.push([
            edgePoint(list[k][0], i, j, t, tl, tr, br, bl),
            edgePoint(list[k][1], i, j, t, tl, tr, br, bl)
          ]);
        }
      }
    }
    return segs;
  }

  // Une segmentos que comparten extremos en polilíneas continuas.
  function joinSegments(segs) {
    var byPoint = Object.create(null);
    var used = new Uint8Array(segs.length);
    function key(p) { return p[0] + "," + p[1]; }
    function add(k, idx) { (byPoint[k] || (byPoint[k] = [])).push(idx); }
    segs.forEach(function (s, idx) { add(key(s[0]), idx); add(key(s[1]), idx); });

    function nextFrom(p) {
      var list = byPoint[key(p)];
      if (!list) return null;
      for (var n = 0; n < list.length; n++) {
        var idx = list[n];
        if (!used[idx]) {
          used[idx] = 1;
          var s = segs[idx];
          return (s[0][0] === p[0] && s[0][1] === p[1]) ? s[1] : s[0];
        }
      }
      return null;
    }

    var lines = [];
    for (var s = 0; s < segs.length; s++) {
      if (used[s]) continue;
      used[s] = 1;
      var line = [segs[s][0], segs[s][1]];
      var p;
      while ((p = nextFrom(line[line.length - 1]))) line.push(p);
      while ((p = nextFrom(line[0]))) line.unshift(p);
      if (line.length > 3) lines.push(line);
    }
    return lines;
  }

  // Suavizado por puntos medios con curvas cuadráticas.
  function toPath(line) {
    var d = "M" + line[0][0] + " " + line[0][1];
    for (var i = 1; i < line.length - 1; i++) {
      var mx = Math.round((line[i][0] + line[i + 1][0]) * 5) / 10;
      var my = Math.round((line[i][1] + line[i + 1][1]) * 5) / 10;
      d += "Q" + line[i][0] + " " + line[i][1] + " " + mx + " " + my;
    }
    var last = line[line.length - 1];
    return d + "L" + last[0] + " " + last[1];
  }

  function draw(svg) {
    var rect = svg.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    var seed = parseInt(svg.getAttribute("data-seed"), 10) || 1;
    var noise = makeNoise(seed);
    var scale = 1 / (parseFloat(svg.getAttribute("data-scale")) || 420);

    var cols = Math.ceil(w / CELL) + 2;
    var rows = Math.ceil(h / CELL) + 2;
    var field = new Float32Array(cols * rows);
    var min = Infinity, max = -Infinity;
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var v = noise(i * CELL * scale, j * CELL * scale);
        field[j * cols + i] = v;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }

    var frag = document.createDocumentFragment();
    for (var l = 1; l <= LEVELS; l++) {
      var t = min + (max - min) * (l / (LEVELS + 1));
      var lines = joinSegments(segmentsFor(field, cols, rows, t));
      if (!lines.length) continue;
      var path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", lines.map(toPath).join(""));
      if (l % MAJOR_EVERY === 0) path.setAttribute("class", "major");
      frag.appendChild(path);
    }

    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("focusable", "false");
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.appendChild(frag);
    svg.classList.add("is-drawn");
    svg._drawnWidth = w;
  }

  var svgs = Array.prototype.slice.call(document.querySelectorAll("svg[data-contours]"));
  if (!svgs.length) return;
  svgs.forEach(draw);

  // Redibuja sólo si el ancho cambia de forma notable (evita saltos al hacer scroll en móvil).
  var timer;
  window.addEventListener("resize", function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      svgs.forEach(function (svg) {
        var w = svg.getBoundingClientRect().width;
        if (Math.abs(w - (svg._drawnWidth || 0)) > 40) draw(svg);
      });
    }, 220);
  });
})();
