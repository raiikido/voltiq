# VoltIQ — Plataforma de Telemetría Energética Industrial

Proyecto web académico: HTML5 semántico, CSS3 (Grid, Flexbox, Custom Properties), Bootstrap 5.3, `<canvas>` a 60 FPS, `<video>` con subtítulos WebVTT y formulario validado con `<datalist>`, siguiendo WCAG 2.2 AA.

## Estructura
```
voltiq/
├── index.html
├── css/styles.css
├── js/app.js
├── media/subtitulos-es.vtt
└── img/ (favicon.svg, poster.svg, og-voltiq.png)
```
Demo publicada: https://raiikido.github.io/voltiq/

## Ejecutar localmente
Los subtítulos (`<track>`) no cargan con `file://`. Use un servidor local:
```bash
python -m http.server 8000   # luego abra http://localhost:8000
```
o la extensión *Live Server* de VS Code.

## Publicar en GitHub Pages
1. Cree el repositorio `voltiq` y suba estos archivos.
2. Settings → Pages → Source: `main` / `root`.

## Checklist de cumplimiento
| Requisito | Dónde |
|---|---|
| Etiquetas semánticas (header, nav, main, article, section, aside, footer) | `index.html` |
| OpenGraph, viewport, charset, fuentes optimizadas | `<head>` |
| ARIA: aria-label, aria-live, aria-pressed, aria-describedby, role="img" | navbar, canvas, formulario |
| Custom Properties en `:root` | `styles.css` §1 |
| CSS Grid (layout global) / Flexbox (componentes) | `.page-layout`, `.hero` / `.hero__stats`, `.kpi`, cards |
| Rejilla Bootstrap `.col-12 .col-md-6 .col-lg-4` | sección Servicios |
| Navbar colapsable sin jQuery | `bootstrap.bundle` + `app.js` §3 |
| Validación nativa (required, type=email, pattern, minlength, maxlength) + `.was-validated/.is-valid/.is-invalid` | formulario + `app.js` §2 |
| `<datalist>` | campo Sector |
| `<video>` con varios `<source>` + `<track>` | sección Demo |
| `<canvas>` animado con `requestAnimationFrame` | `app.js` §1 |
| Rendimiento: `defer`, `preconnect`, `display=swap`, `preload="metadata"`, dimensiones fijas (CLS) | `index.html` |
| `prefers-reduced-motion`, skip link, foco visible | `styles.css` |
