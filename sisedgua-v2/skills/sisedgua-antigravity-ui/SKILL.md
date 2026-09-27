---
name: sisedgua-antigravity-ui
description: Guía de ingeniería frontend táctica con glassmorphism, microinteracciones a 60fps y atmósfera espacial Antigravity.
risk: safe
source: sisedgua-internal
date_added: "2026-09-27"
---

# SISEDGUA Antigravity UI Skill

## Directivas Visuales
1. **Glassmorphism**: Paneles con `bg-slate-900/70`, `backdrop-blur-xl`, `border border-white/10`.
2. **Elevación Espacial (Weightlessness)**: Tarjetas flotantes con sombras suaves y acento perimetral bio-luminiscente en hover (`box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.15)`).
3. **Números Tabulares**: Toda métrica de asistencia o capacidad debe renderizarse con `font-mono` o `tabular-nums` para evitar saltos de layout en re-renders.
4. **Respeto a Reducción de Movimiento**: Todo efecto GSAP o CSS transition debe anularse bajo `@media (prefers-reduced-motion: reduce)`.
