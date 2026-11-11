# YaRe · Portafolio de Cinthya González

Portafolio de **Cinthya González**, diseñadora UX/UI y UX Researcher.

Diseñado principalmente para la materia "Fundamentos de Elementos Multimedia" de la UDG.

## Estructura

```
├── index.html              → inicio (portada, destacados, sobre mí, contacto)
├── proyectos.html          → todos los proyectos
├── sobre-mi.html           → biografía y proceso
├── contacto.html           → correo y redes
├── cases/
│   ├── caso-estudio-1.html → Lux de Jesus
│   └── caso-estudio-2.html → Amazon Prime Video: Insights
├── css/style.css           → sistema de diseño (colores, tipografía, componentes)
├── js/main.js              → menú móvil, animaciones al hacer scroll, marcadores de imagen
├── js/contours.js          → genera las curvas de nivel en los <svg data-contours>
└── assets/img/             → imágenes del sitio
```

## Notas de Contours  
Cada `<svg class="contours" data-contours data-seed="N">` dibuja un terreno distinto.
- Cambiar `data-seed` permite obtener otra forma.
- Cambiar `data-scale` ajusta el tamaño de las "montañas". El valor predeterminado es 420; un número mayor da formas más grandes.