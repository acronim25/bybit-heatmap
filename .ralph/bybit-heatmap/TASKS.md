# Bybit Heatmap - Ralph Wiggum Loop Tasks

## Reference Image
- bubble-reference.png - 3D metallic spiral with neon glow effect
- Dark background with purple/pink metallic ribbons
- Glowing edges, flowing spiral motion

## Goals
1. Transform bubbles to match reference image aesthetic
2. Red (losers) / Green (winners) dynamic colors
3. Spinner effects on hover/load
4. Open/expand animation on click
5. Mobile responsive
6. Better spacing - esthetic but not overlapping
7. Show coin details on click (modal already exists, enhance it)

## Task Split

### Task 1: 3D Bubble Visual System
**Agent:** ralph-1-bubbles
**Focus:** CSS/SVG 3D metallic spiral bubbles
- Transform current D3 spirals into 3D metallic ribbons like reference
- Red/green glow based on price change
- Spinner animation on load and hover
- Open/expand click animation
- Export as: `bubble-3d-system.css` + `bubble-3d-system.js`

### Task 2: Layout & Spacing Engine  
**Agent:** ralph-2-layout
**Focus:** Force simulation, mobile responsive
- Optimize D3 force simulation for tighter but non-overlapping bubbles
- Mobile responsive grid layout
- Touch-friendly interactions
- Export as: `layout-engine.js`

### Task 3: Mobile Responsive UI
**Agent:** ralph-3-mobile
**Focus:** CSS media queries, touch UX
- Redesign header for mobile (hamburger menu, collapsible controls)
- Touch-optimized bubble interactions
- Mobile-first modal design
- Export as: `mobile-responsive.css`

### Task 4: Modal Enhancement & Details
**Agent:** ralph-4-modal
**Focus:** Coin details display, animations
- Enhanced modal with more coin metrics
- Smooth open/close animations
- Price chart sparkline
- Better typography and layout
- Export as: `modal-enhanced.js` + `modal-styles.css`

### Task 5: Integration & Polish
**Agent:** ralph-5-integrate (runs last)
**Focus:** Combine all components, final polish
- Merge all components into final bybit-heatmap-v2.html
- Ensure all animations work together
- Performance optimization
- Final mobile testing

## Output Location
All files in: `/home/claw/.openclaw/workspace/.ralph/bybit-heatmap/`
