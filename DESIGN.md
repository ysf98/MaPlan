---
name: Vibrant Cartography System
colors:
  surface: '#fff8f7'
  surface-dim: '#efd4d2'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0ef'
  surface-container: '#ffe9e7'
  surface-container-high: '#fde2e0'
  surface-container-highest: '#f7dcdb'
  on-surface: '#261817'
  on-surface-variant: '#5a403f'
  inverse-surface: '#3d2c2c'
  inverse-on-surface: '#ffedeb'
  outline: '#8e706f'
  outline-variant: '#e2bebc'
  surface-tint: '#b52330'
  primary: '#b52330'
  on-primary: '#ffffff'
  primary-container: '#ff5a5f'
  on-primary-container: '#61000e'
  inverse-primary: '#ffb3b0'
  secondary: '#0060ac'
  on-secondary: '#ffffff'
  secondary-container: '#68abff'
  on-secondary-container: '#003e73'
  tertiary: '#006d37'
  on-tertiary: '#ffffff'
  tertiary-container: '#1fa95c'
  on-tertiary-container: '#003417'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b0'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001b'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a4c9ff'
  on-secondary-fixed: '#001c39'
  on-secondary-fixed-variant: '#004883'
  tertiary-fixed: '#7efba4'
  tertiary-fixed-dim: '#61de8a'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005228'
  background: '#fff8f7'
  on-background: '#261817'
  surface-variant: '#f7dcdb'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 12px
---

## Brand & Style

El sistema de diseño se centra en la conexión social a través de la exploración geográfica. La personalidad es vibrante, enérgica y sofisticada, diseñada para evocar una sensación de descubrimiento compartido y fiabilidad técnica.

El estilo visual es **Corporate / Modern** con influencias de **Glassmorphism** ligero para mantener la interfaz fresca y mobile-first. Se prioriza la legibilidad sobre mapas y la claridad en entornos de uso dinámico. La estética busca un equilibrio entre la utilidad de una herramienta de navegación y la calidez de una red social premium, utilizando superficies blancas puras y fondos neutros cálidos para permitir que el contenido generado por el usuario y los indicadores del mapa sean los protagonistas.

## Colors

La paleta está anclada en el **Coral Vibrante (#FF5A5F)**, un color que denota acción y calidez social, utilizado para los puntos de interacción principales. El **Azul Índigo (#4A90E2)** proporciona balance y profundidad, ideal para elementos de navegación y estados secundarios.

Para la categorización semántica en el mapa, se emplea el **Esmeralda (#27AE60)** para lugares visitados y el **Ámbar (#F2994A)** para favoritos, asegurando un contraste cromático alto. Los fondos alternan entre el blanco puro para tarjetas y elementos elevados, y un gris neutro cálido (#FAFAFA) para la base de la aplicación, reduciendo la fatiga visual sin perder la sensación de limpieza.

## Typography

Se utiliza **Plus Jakarta Sans** como fuente principal por sus terminales redondeadas y su aire contemporáneo, ideal para un producto social. Para etiquetas de datos técnicos y micro-copy que requiera máxima legibilidad en tamaños reducidos, se introduce **Inter** por su naturaleza sistemática.

La jerarquía es clara y directa. Los titulares utilizan un peso "Bold" o "ExtraBold" para transmitir confianza. En dispositivos móviles, los tamaños de los titulares se ajustan ligeramente para optimizar el espacio en pantalla sin sacrificar el impacto visual. El interlineado es generoso para facilitar la lectura rápida mientras el usuario se desplaza.

## Layout & Spacing

El sistema adopta un modelo de **Fixed Grid** adaptado a dispositivos móviles, utilizando un sistema de 4 columnas para smartphones y 8 columnas para tablets. El ritmo visual se basa en incrementos de 4px, con un margen lateral estándar de 20px para asegurar que el contenido no se pegue a los bordes curvos de los dispositivos modernos.

El espaciado entre tarjetas y elementos de lista (gutters) se mantiene en 12px para permitir una densidad de información moderada-alta, necesaria para la visualización de múltiples puntos de interés. El contenido se organiza verticalmente mediante "stacks" con espaciados definidos de 16px (md) y 24px (lg) para separar secciones lógicas.

## Elevation & Depth

La jerarquía se gestiona mediante **Sombras Profundas y Suaves**. A diferencia de las sombras estándar, este sistema utiliza sombras con un radio de desenfoque (blur) amplio y una opacidad baja (10-15%), teñidas ligeramente con el color primario en elementos activos.

1.  **Nivel 0 (Base):** Plano, fondo de la aplicación.
2.  **Nivel 1 (Tarjetas/Contenedores):** Sombra sutil para separar del fondo.
3.  **Nivel 2 (Modales/Hojas inferiores):** Sombra pronunciada para indicar interactividad y profundidad sobre el mapa.
4.  **Glassmorphism:** Se aplica en barras de navegación y cabeceras sobre el mapa utilizando un desenfoque de fondo (backdrop-blur) de 20px y una transparencia blanca al 80%, creando una sensación de ligereza.

## Shapes

El lenguaje de formas es extremadamente amigable y orgánico. Siguiendo la directriz de bordes **2xl**, todos los contenedores principales y tarjetas utilizan un radio de 1.5rem (24px).

Los elementos de menor tamaño, como botones y campos de entrada, mantienen un radio de 1rem (16px) para conservar la cohesión visual. Los avatares de amigos y los indicadores de estado en el mapa son circulares (full rounded). Esta suavidad en las formas contrasta con la precisión de los datos del mapa, humanizando la tecnología.

## Components

-   **Buttons:** Los botones principales son de gran tamaño (min-height: 56px), con rellenos sólidos en Coral. Los estados interactivos incluyen una ligera elevación mediante sombra al presionar.
-   **Bottom Sheets:** Componente clave para mostrar detalles de lugares. Utilizan un radio superior de 32px y una barra de arrastre (handle) sutil.
-   **Input Fields:** Fondos gris muy claro (#F3F4F6) con bordes que se vuelven Coral al enfocar. Iconografía siempre presente a la izquierda.
-   **Chips:** Utilizados para filtrar categorías en el mapa. Tienen un diseño de píldora (full rounded), con bordes finos de 1px en estado inactivo y fondo sólido en estado activo.
-   **Cards:** Contenedores con sombra nivel 1, bordes de 24px y padding interno de 16px. Las imágenes dentro de las tarjetas deben seguir el mismo radio de curvatura.
-   **Map Markers:** Iconos personalizados con el color de la categoría (Esmeralda o Ámbar) contenidos en un "pin" blanco con sombra profunda para destacar sobre la cartografía.
