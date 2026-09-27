# Design System: SISEDGUA Sala Situacional
**Project ID:** SISEDGUA-GUARICO-2026

## 1. Visual Theme & Atmosphere
Atmósfera táctica de centro de comando educativo ("Tactical Command Center & Spatial Clarity"). La interfaz proyecta autoridad institucional, ligereza espacial (weightlessness) y alta densidad de información sin saturación visual. Utiliza superficies en capas Z-axis con cristal esmerilado translúcido (glassmorphism con `backdrop-filter: blur(16px)`), sombras profundas whisper-soft y un contraste equilibrado entre fondos azul pizarra profundo y acentos bio-luminiscentes que guían inmediatamente el foco de atención hacia los estados de alerta, asistencia y régimen alimentario CNAE.

## 2. Color Palette & Roles
* **Deep Zonal Navy (`#0B132B`):** Fondo principal del sistema; provee profundidad espacial y descanso visual para operadores de guardia prolongada.
* **Cyber Slate Surface (`#1C2541`):** Color de superficie para paneles, cards tácticas y contenedores elevados.
* **Frosted Glass Overlay (`rgba(28, 37, 65, 0.70)`):** Capa translúcida para navegación fija superior y modales de confirmación con efecto difuminado.
* **Guárico Solar Gold (`#F59E0B`):** Acento primario institucional; utilizado para indicadores clave (KPI), botones de acción de alta prioridad y selección de turnos.
* **Bioluminescent Emerald (`#10B981`):** Estado de salud óptimo; empleado para reportes a tiempo, porcentaje de asistencia superior al 85% y operatividad completa de comedores escolares.
* **Infrared Crimson (`#EF4444`):** Alerta crítica; reservado para incidencias no resueltas, planteles sin reporte y bloqueos de horario.
* **Electric Cyan (`#06B6D4`):** Telemetría secundaria; utilizado en gráficos de tendencia temporal y desgloses por municipio.
* **Pure Clean White (`#F8FAFC`):** Texto principal y tipografía de lectura rápida.
* **Muted Horizon Slate (`#94A3B8`):** Textos secundarios, etiquetas de campos y metadatos complementarios.

## 3. Typography Rules
* **Familia Tipográfica:** Inter / System UI sans-serif con soporte tabular numérico (`font-variant-numeric: tabular-nums`) para evitar oscilaciones en métricas en vivo.
* **Headers & Métricas (Títulos):** Pesos semibold (600) y bold (700), `tracking-tight` (-0.025em), jerarquía nítida desde 2rem (32px) para totales hasta 1.125rem (18px) para títulos de módulos.
* **Body & Data Grid:** Peso regular (400) y medium (500), altura de línea cómoda (`leading-relaxed`), contraste AAA sobre fondos oscuros.

## 4. Component Stylings
* **Buttons:**
  - *Primario:* Botón de pastilla rectangular con esquinas suavemente redondeadas (`rounded-xl`), fondo `Guárico Solar Gold` con texto oscuro de alto contraste, efecto de elevación suave en hover (`translate-y-[-2px]`), y halo perimetral suave.
  - *Secundario / Filtros:* Superficie translúcida `Cyber Slate` con borde sutil de un píxel (`border border-slate-700/60`), transición de 0.25s ease-out.
* **Cards & Containers:**
  - Esquinas suavemente contorneadas (`rounded-2xl`), fondo de cristal semi-translúcido con borde perimetral reflectante (`border border-white/10`).
  - Sombra difusa de profundidad (`box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5)`).
  - Efecto *Antigravity Hover*: Ligera inclinación espacial sutil y realce de borde al foco del usuario.
* **Inputs & Forms:**
  - Superficie oscura de fondo plano (`#0F172A`), borde tenue que transmuta a `Guárico Solar Gold` o `Electric Cyan` al recibir foco, sin saltos bruscos. Iconografía SVG interna alineada para indicar validación reactiva con Zod.

## 5. Layout Principles
* **Estructura Grid:** Grilla táctica responsiva de 12 columnas con gutters de 1.5rem (24px).
* **Ritmo Espacial:** Espaciado consistente basado en múltiplos de 8px (p-4, p-6, p-8).
* **Z-Axis Hierarchy:**
  - Capa 0: Fondo profundo con gradientes radiales oscuros estáticos.
  - Capa 1: Tablero de métricas y cards estadísticas.
  - Capa 2: Barras de navegación sticky flotantes y filtros de fecha/municipio.
  - Capa 3: Modales de confirmación, diálogos de bloqueo de horario y toasts de notificación espacial.
