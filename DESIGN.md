# Solar Train Hackathon · Design System

Guía de marca para todo lo que hagamos del evento: landing, flyers, posteos, credenciales y slides. Si algo no está acá, mirá cómo lo resuelve `index.html`, porque es la referencia viva.

## La idea

Una hackatón a bordo del Tren Solar de la Quebrada de Humahuaca, en Jujuy. La marca junta paisaje real (cerros de colores, vías, cardones, pueblos con campanario, atardecer) con una capa gráfica dura y rápida en naranja y tinta, y un cielo de ciencia ficción encima: estrellas, un planeta oscuro con anillos, un cohete que despega.

**Tierra abajo, espacio arriba. El tren es el puente.**

## Voz

- Frases cortas, imperativas, de a tres: *Build. Innovate. Travel further.* / *Real problems. Real places. Real impact.*
- Bilingüe: español para lo local (*Ideas que viajan lejos*, *Inscribite*, *Subite antes de que salga*) e inglés para el kicker de marca (*A travelling experience*).
- Los datos se dicen planos y con ícono: fecha, lugar, energía.
- Vocabulario de viaje y de misión: andén, parada, tramo, pasajero, órbita, ventana de lanzamiento.
- **No hacemos:** inventar cifras, prometer premios o fechas sin confirmar, o nombrar sponsors sin su permiso.

## Color

| Token | Hex | Uso |
| --- | --- | --- |
| `--solar` | `#FF5A1F` | Naranja de marca: botones, barras `//`, franja del tren, palabras destacadas. Nunca para texto corrido sobre fondo claro. |
| `--sunset` | `#FF8A4C` | Hover del naranja, avisos, el sol. |
| `--ink` | `#0F1218` | Tinta: superficies oscuras, texto sobre hueso. |
| `--night` | `#17233A` | Noche andina: cielos y fondos de sección. |
| `--ground` | `#0B0E13` | Fondo de página. |
| `--raised` | `#151A23` | Paneles y tarjetas sobre el fondo. |
| `--bone` | `#F4F0EA` | Hueso: texto principal sobre oscuro, fondo de pósters y del ticket. |
| `--muted` | `#A9A49C` | Texto secundario y labels. |
| `--line` | `#2A2F3A` | Divisores finos entre datos. |

**Cielo** (degradé vertical, de arriba hacia abajo): `#03050B` → `#0A1122` → `#17233A` → `#5A2C2A` → `#C9502A` → `#FF8A4C`.

**Paisaje:** roca de quebrada `#6B3A2C`, cerro medio `#3B2A27`, cardón `#40573A`, pared de adobe encalada `#EFE6D8`, teja `#B4553A`.

**Proporción:** dominan el oscuro y el hueso; el naranja es la señal y ocupa poco espacio.

## Tipografía

| Rol | Familia | Cómo se usa |
| --- | --- | --- |
| Display | **Saira** 900 itálica | Wordmark *HACKATHON* y títulos de sección, en mayúsculas, interletrado −0.02 a −0.035em, interlineado 0.86–0.92. |
| Texto | **Figtree** 400–800 | Párrafos. Los kickers (*SOLAR TRAIN*, *A TRAVELLING EXPERIENCE*) van en 700–800, mayúsculas, interletrado 0.3–0.42em. |
| Datos | **JetBrains Mono** 500–700 | Cartel del andén, coordenadas, altitudes, numeración (TS·01) y etiquetas de cámara. |

Todas salen de Google Fonts. Escala de la landing: wordmark 46–124px, título de sección 36–72px, titular 26–42px, cuerpo 16–19px, label 11–13px.

## Formas y gráfica

- **Barras `///`:** el gesto de la marca. En naranja y en diagonal, sueltas o en grupos de tres.
- **Esquirlas:** paralelogramos naranjas inclinados unos 24° que se salen del borde (ver la tarjeta de cierre).
- **El sol:** disco naranja bajo, apenas sobre los cerros.
- **El planeta:** esfera oscura con creciente iluminado, anillo hueso y un fino anillo naranja.
- **Puntillado (halftone):** trama de puntos sutil en el cielo, al estilo póster serigrafiado.
- **Interfaz de misión:** esquinas de encuadre, una mira, etiquetas tipo `CAM 03 · LATERAL BAJA`.
- **Bordes:** casi rectos. Radio de 4px en botones (como un boleto) y 10px en tarjetas, carteles y ticket.
- **Espaciado:** múltiplos de 8, con 8, 16, 32 y 64px como pasos principales.
- **No hacemos:** degradés violeta y azul, emojis como íconos, tarjetas con borde de color a un costado, ni nada que no exista en Jujuy (pirámides, palmeras, desiertos de dunas).

## Iconografía

Íconos de línea de 1.5px en `--solar`: rayo (energía solar), cerros (lugares reales), personas (construir juntos), calendario, pin de ubicación.

## Componentes de la landing

- **Botón principal:** fondo `--solar`, texto `--ink` en Figtree 800 en mayúsculas con interletrado 0.16em, flecha `→`, pulso suave y un brillo al pasar el mouse.
- **Cartel del andén:** panel oscuro translúcido con filas clave/valor en mono. Muestra el estado en vivo: llegando, en andén, en viaje, salto a la órbita.
- **Tarjeta de parada:** `Parada N · Estación`, título en display con una palabra en naranja, un párrafo y una lista de datos en mono.
- **Ticket:** fondo hueso, girado 4°, filas con línea punteada (pasajero, tramo, tracción).
- **Franja animada:** banda naranja inclinada −2° con frases en display separadas por `//`.
- **Recorrido:** línea de vías con las estaciones Volcán → Tumbaya → Purmamarca → Maimará → Tilcara → Uquía → Humahuaca, con sus altitudes aproximadas.

## Escena 3D

- **Tren:** blanco, con franja y esquirla naranjas, ventanas oscuras y paneles solares en el techo.
- **Entorno:** cerros low-poly, cardones, rocas, postes kilométricos, un andén y un pueblito con campanario.
- **Cielo:** estrellas, planeta con anillos, luna, un cohete genérico con su estela y, al final, el salto a la velocidad de la luz.
- **Vistas:** cinco ángulos de cámara ligados al scroll (andén, cenital, lateral baja, frontal y aérea) y una sexta que mira al cielo.

## Marcas de terceros

El estilo espacial es épico y genérico. No usamos elementos propios de franquicias, como logos, personajes, naves o el texto inclinado de apertura. Los logos de sponsors van solo con su confirmación y en el archivo oficial que nos manden.
