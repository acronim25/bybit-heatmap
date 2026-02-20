# Ralph Wiggum Loop - Unified Index Integration

## OBIECTIV
Creează UN SINGUR index.html care conține:
1. Twisted ribbon bubbles (perfect geometry)
2. Dark theme animated background
3. Light theme animated background
4. Theme toggle switch
5. Toate animațiile funcționale

## STRUCTURA FINALĂ

### HTML Structure:
```html
<!DOCTYPE html>
<html>
<head>
  - Meta tags
  - Fonts (Orbitron, Rajdhani)
  - D3.js
  - CSS Variables pentru dark/light
</head>
<body data-theme="dark">
  - Background layer (animated, theme-aware)
  - Header cu logo + theme toggle + stats
  - Bubble container
  - Modal pentru detalii
  - Scripts inline (toate funcțiile)
</body>
</html>
```

## Task Split Ralph

### Ralph-1: CSS Variables & Theme System
Creează sistemul de variabile CSS care se schimbă între dark/light:
- `--bg-primary`, `--bg-secondary`, etc.
- `--accent-color` (green pentru ambele teme)
- `--text-primary`, `--text-secondary`
- Media queries și data-theme selector

### Ralph-2: Unified Background Component
Componentă background care:
- Primește tema ca parametru
- Afișează animațiile corespunzătoare
- Transition smooth între teme
- Performance optimized

### Ralph-3: Bubble System Integration
Integrează twisted ribbon bubbles:
- Geometry functions
- Color system (green/red)
- Animations
- Click handlers
- Modal integration

### Ralph-4: Controls & UI
Creează UI controls:
- Theme toggle button (sun/moon icon)
- Stats display (bullish/bearish)
- Loading spinner
- Responsive layout

## OUTPUT
`index.html` - Single file, complete, production-ready
