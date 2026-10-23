# Solar Train Hackathon · Landing

Landing que anuncia la llegada del Tren Solar y abre la inscripción a la Pre-Hackatón. Hecha con **Astro** (sitio estático), escena 3D con Three.js y fondo del recorrido en WebGPU/WebGL2 vía `vgpu`.

## Verlo en local

```bash
pnpm install
pnpm dev      # http://localhost:4321
```

Otros comandos: `pnpm build` (genera `dist/`) y `pnpm preview` (sirve el build).

## Estructura

| Qué | Dónde |
| --- | --- |
| Página principal | `src/pages/index.astro` |
| Layout (head, fuentes, meta) | `src/layouts/Base.astro` |
| Hero | `src/components/Hero.astro` |
| Las 5 paradas (tarjetas) | `src/components/Chapter.astro` + su uso en `index.astro` |
| Escena 3D / cartel del andén / HUD | `src/components/Scene.astro` + `src/scripts/main.js` |
| Recorrido y altitudes | `src/components/Route.astro` (paradas = array `stops` al inicio) |
| Cierre y ticket | `src/components/Signup.astro` |
| Botón de inscripción compartido | `src/components/SignupButton.astro` |
| Estilos | `src/styles/global.css` |
| Lógica 3D, reloj, reveals | `src/scripts/main.js` (punto de entrada) |
| Fondo WebGPU/WebGL2 del recorrido | `src/scripts/route-bg.js` + `route-bg.wgsl` / `route-gl.js` |

## Qué editar y dónde

- **Link del formulario de inscripción:** `const INSCRIPCION_URL = ""` al principio de `src/scripts/main.js`
- **Ángulos de cámara de cada parada:** `const SHOTS = { wide: [...], narrow: [...] }` en `src/scripts/main.js` (`wide` para compu, `narrow` para celular)
- **Nombres en el cartel del andén:** `const NEXT = [...]` en `src/scripts/main.js`
- **Paradas del recorrido:** array `stops` en `src/components/Route.astro`
- **Colores y tipografías:** `:root { --solar, --ink, ... }` al principio de `src/styles/global.css`

Si agregás o sacás una parada (`<Chapter>`), agregá o sacá también la entrada correspondiente en `SHOTS.wide`, `SHOTS.narrow` y `NEXT`: van en el mismo orden.

## Publicar

Generá el sitio con `pnpm build` y serví `dist/`. En **Vercel**/**Netlify** detecta Astro automáticamente; en **GitHub Pages** hay que subir el contenido de `dist/` (o usar una action de build).

## Marca

- Naranja `#FF5A1F`, tinta `#0F1218`, noche andina `#17233A`, hueso `#F4F0EA`.
- Títulos en Saira 900 itálica, textos en Figtree, datos en JetBrains Mono.
