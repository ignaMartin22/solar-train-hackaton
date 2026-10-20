# Solar Train Hackathon · Landing

Landing que anuncia la llegada del Tren Solar y abre la inscripción a la Pre-Hackatón. Es un solo archivo, `index.html`, sin build ni dependencias que instalar. El 3D usa Three.js r128 desde cdnjs y las tipografías vienen de Google Fonts.

## Verlo en local

Abrí `index.html` en el navegador, o levantá un servidor estático:

```bash
npx serve .
# o
python3 -m http.server 8080
```

## Qué editar y dónde

| Qué | Dónde está en `index.html` |
| --- | --- |
| Link del formulario de inscripción | `const INSCRIPCION_URL = ""` al principio del último `<script>` |
| Textos del hero | `<header class="hero">` |
| Las 5 paradas (tarjetas) | los `<article class="chapter" data-cam="N">` |
| Ángulos de cámara de cada parada | `const SHOTS = { wide: [...], narrow: [...] }` (`wide` para compu, `narrow` para celular) |
| Nombres en el cartel del andén | `const NEXT = [...]` |
| Recorrido y altitudes | `<section class="route">` |
| Cierre y ticket | `<section class="final" id="inscripcion">` |
| Colores y tipografías | `:root { --solar, --ink, ... }` al principio del `<style>` |

Si agregás o sacás una parada, agregá o sacá también la entrada correspondiente en `SHOTS.wide`, `SHOTS.narrow` y `NEXT`: van en el mismo orden que los `chapter`.

## Publicar

- **Vercel:** importá el repo, sin framework y sin build command. Sirve `index.html` tal cual.
- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / root.

## Marca

- Naranja `#FF5A1F`, tinta `#0F1218`, noche andina `#17233A`, hueso `#F4F0EA`.
- Títulos en Saira 900 itálica, textos en Figtree, datos en JetBrains Mono.
