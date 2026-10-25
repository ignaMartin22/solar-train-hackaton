# SpaceXAI Hackathon Argentina · Design System

Guía de marca para la landing del evento. Referencia de branding: el sitio del
sponsor confirmado (`spacexai-hackathon.vercel.app`) — monocromo estricto,
Space Grotesk / Inter / JetBrains Mono, formas casi rectas. La narrativa del
Tren Solar de la Quebrada (andén, paradas, recorrido geográfico) se mantiene.

## La idea

Una hackatón a bordo del Tren Solar de la Quebrada de Humahuaca, en Jujuy,
bajo la marca del sponsor SpaceX / SpaceXAI. El paisaje real (cerros, cardones,
pueblos con campanario) convive con una noche fría de ciencia ficción:
estrellas, un planeta oscuro, un cohete que despega.

**Tierra abajo, espacio arriba. El tren es el puente.**

## Voz

- Frases cortas, español rioplatense, tono de misión/frontera.
- Eyebrow de marca: `SPACEXAI · TREN SOLAR · JUJUY`.
- Título del evento: **SpaceXAI Hackathon Argentina**.
- Datos en JetBrains Mono, mayúsculas, interletrado .18em (`01 — QUÉ ES`,
  `ESTACIÓN 1 DE 6`, `28–29 NOV 2026`).
- **No hacemos:** inventar cifras, prometer premios o fechas sin confirmar.
  Datos permitidos (sitio del sponsor): 28–29 NOV 2026 a confirmar,
  Quebrada de Humahuaca, 70 cupos, 48h.

## Color

Monocromo estricto. Sin color de acento: la señal es el blanco.

| Token | Valor | Uso |
| --- | --- | --- |
| `--ground` | `#000` | Fondo de página. |
| `--raised` / `--ink` | `#0a0a0a` | Paneles, tarjetas, texto sobre blanco. |
| `--bone` | `#fff` | Texto principal, acento único, botón primario. |
| `--muted` | `#fff9` (60%) | Texto secundario, labels. |
| `--muted2` | `#fff6` (40%) | Terciario, énfasis atenuado en títulos. |
| `--line` | `#ffffff1a` (10%) | Divisores. |
| `--line2` | `#fff3` (20%) | Bordes de tarjetas y chips. |
| `--acc` | `#fff` | Ex-`--solar`: la antigua marca naranja ahora es blanca. |

**Cielo** (degradé vertical, noche fría): `#010204` → `#060b16` → `#0d1526` → `#141d2e` → `#1c2534` → `#24303f`.

**Paisaje real (3D):** roca de quebrada, cardones, paredes encaladas y tejas
conservan sus colores naturales: son territorio, no interfaz.

## Tipografía

| Rol | Familia | Cómo se usa |
| --- | --- | --- |
| Display | **Space Grotesk** 600/700 | Títulos en mixed case, `letter-spacing:-.02em`, `line-height:1.05`. Sin itálica ni all-caps. |
| Texto | **Inter** 400/500 | Párrafos y botones. |
| Datos | **JetBrains Mono** 400/500 | Índices, eyebrows, cartel del andén, coordenadas, `uppercase`, `.18em`. |

Escala: hero `clamp(44px,7.2vw,104px)`, secciones `clamp(32px,4vw,48px)`,
cuerpo 16–19px, labels 10.5–12px.

## Formas y gráfica

- **Radios:** 0 en botones, 2 en chips/ticket, 8 en tarjetas.
- **Botones:** 56px de alto, padding 0 28px, Inter mayúsculas `.04em`.
  Primario: fondo blanco, texto negro, sin borde. Secundario: transparente,
  texto blanco, borde `#fff3`. Flecha `→` en CTAs, `↗` para externos.
- **Minimalismo primero:** la interfaz es solo tipografía mono + una línea de
  datos. Sin barras sueltas, esquirlas ni tramas de puntos: el cielo 3D ya da
  la textura (estrellas).
- **El sol/luna:** disco pálido `#f0f2f6` bajo los cerros, con halo frío.
- **El planeta:** esfera oscura casi imperceptible, lejos; solo crece con la
  noche y jamás compite con el texto del hero.
- **Viñeta:** negro fuerte en los bordes del viewport 3D — encuadre de cine.
- **Interfaz de misión:** esquinas de encuadre, mira, `CAM 03 · LATERAL BAJA`.
- **Easing:** `cubic-bezier(.16,1,.3,1)`; duraciones .16s/.32s/.9s.
- **No hacemos:** ningún color que no sea escala de grises en la interfaz,
  degradés violeta, ni nada que no exista en Jujuy.

## Componentes de la landing

- **Topbar / footer:** wordmark oficial SpaceX (PNG blanco, ~24px), sin recrear.
- **Botón principal:** blanco sobre negro, flecha `→`, radio 0.
- **Cartel del andén:** panel negro translúcido, filas clave/valor en mono.
- **Tarjeta de parada:** `Parada N · Estación`, título Grotesk con una frase atenuada.
- **Ticket:** fondo blanco, girado 4°, filas con línea punteada.
- **Franja animada:** banda blanca inclinada −2°, texto negro separado por `//`.
- **Recorrido:** mapa SVG monocromo con geografía real OSM (Volcán → Tilcara),
  card flotante de estación, chips, luz blanca recorriendo el trazado.

## Escena 3D

- **Tren:** blanco con franja grafito `#111318` en silueta de sierra, ventanas
  oscuras, paneles solares en el techo, chevrons negros en el quitanieves.
  Es lo más brillante del cuadro en todo momento.
- **Entorno:** cerros y rocas desaturadas (grises fríos), cardones, postes,
  andén y pueblito con campanario — territorio, no interfaz.
- **Cielo:** la escena empieza en hora azul y cae a noche — negro profundo,
  poca luz de relleno, sombras duras, estrellas que aparecen de a poco, planeta
  lejano, luna, cohete genérico, salto a la velocidad de la luz.
- **Hero:** plano bajo, largo y lento — el tren se recuesta a la derecha y el
  título respira a la izquierda. Sin cartel ni adornos: solo la escena.
- **Vistas:** cinco ángulos ligados al scroll + una mirada al cielo.

## Marcas de terceros

**SpaceX / SpaceXAI es sponsor confirmado.** El wordmark se usa únicamente desde
su archivo oficial (`public/brand/wordmark-white.png`): no se recolorea, no se
deforma, no se recrea en SVG ni en texto. Fuera del wordmark, no se usan otros
activos, naves ni nombres de productos de terceros.
