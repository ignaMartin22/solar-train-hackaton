# Solar Train Hackathon — notas de trabajo

Landing Astro + Three.js 0.128 del Tren Solar de la Quebrada. Diseño: `DESIGN.md`.

## Comandos

- Dev: `pnpm dev` (http://localhost:4321) — Node 24 (`.nvmrc`), pnpm 12.
- Build: `pnpm build` — debe pasar limpio; el warning de chunk >500 kB es esperado (three.js).

## Estructura

- `src/scripts/main.js` — escena 3D completa: tren articulado de 2 coches (`car()` con cabina
  en extremos externos, fuelle entre extremos internos), cielo día→noche (`SKY`), cámaras por
  capítulo (`SHOTS`), cartel del andén y snap-scroll por paradas (wheel notches gliden;
  trackpad scrollea nativo).
- `src/styles/global.css` — todo el CSS. Tokens de `DESIGN.md` en `:root`.
- `src/components/` — Hero, Chapter, Scene (canvas + board + HUD), Route, Hosts, Join, Signup (waitlist +
  Ticket), Faq, Marquee, Footer. Contenido tomado de spacexai-hackathon.vercel.app.
- `src/components/Ticket.astro` + `src/scripts/ticket.js` + `ticket-holo.wgsl` — boleto holográfico: tilt 3D por
  CSS vars (`--mx/--my/--hv`), foil por shader vgpu; sin WebGPU queda el foil CSS (`.tk-foil`). Arte en `public/ticket-art.jpg`.
- `WAITLIST_URL` (main.js) vacío → el form muestra toast; `INSCRIPCION_URL` ahora es el link del Pre-Hackatón.
- `src/scripts/route-*` — fondo WebGPU/WebGL2 del recorrido; shaders wgsl y gl deben quedar sincronizados.

## Validación visual en WSL

Playwright local NO arranca (faltan libnspr4/libnss3/libasound, sin sudo). Alternativa que funciona:
Chrome headless de Windows (`chrome.exe`) con `--remote-debugging-port=9222`, más un driver CDP
en el Node de Windows (`node` v24, WebSocket nativo) que captura screenshots, scrollea a
`scrollY` arbitrarios, emula `prefers-reduced-motion` y reporta errores de consola.
Las capturas van a `C:\Users\riosm\AppData\Local\Temp\solar\` (accesibles por `/mnt/c/...`).

## Reglas del proyecto

- No inventar datos del evento ni links de inscripción (`INSCRIPCION_URL` vacío → toast).
- Three.js queda en 0.128.x — nada de APIs posteriores.
- No actualizar dependencias ni configuración global.
