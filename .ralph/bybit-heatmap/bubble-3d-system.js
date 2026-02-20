/**
 * 3D METALLIC BUBBLE SYSTEM - JavaScript
 * Ralph-1: Bubbles Visual System
 * 
 * Creates flowing 3D metallic ribbons that respond to crypto price changes
 * Uses SVG paths with gradient fills to achieve the metallic spiral effect
 */

class MetallicBubbleSystem {
  constructor(options = {}) {
    this.options = {
      baseSize: options.baseSize || 60,
      glowIntensity: options.glowIntensity || 1,
      metalShine: options.metalShine || 0.8,
      ...options
    };
    
    // Color configurations for different price change states
    this.colors = {
      up: {
        primary: '#00ff41',
        secondary: '#39ff14',
        glow: 'rgba(0, 255, 65, 0.6)',
        glowSecondary: 'rgba(57, 255, 20, 0.4)'
      },
      down: {
        primary: '#ff0040',
        secondary: '#ff1744',
        glow: 'rgba(255, 0, 64, 0.6)',
        glowSecondary: 'rgba(255, 23, 68, 0.4)'
      },
      neutral: {
        primary: '#ffd700',
        secondary: '#ffa500',
        glow: 'rgba(255, 215, 0, 0.5)',
        glowSecondary: 'rgba(255, 165, 0, 0.3)'
      }
    };
    
    this.bubbles = new Map();
    this.init();
  }
  
  init() {
    this.createSVGDefs();
  }
  
  /**
   * Create global SVG definitions for filters and gradients
   */
  createSVGDefs() {
    // Check if defs already exist
    if (document.getElementById('bubble-global-defs')) return;
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    defs.setAttribute('class', 'filter-defs');
    defs.setAttribute('id', 'bubble-global-defs');
    defs.innerHTML = `
      <defs>
        <!-- Neon Glow Filter -->
        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur1"/>
          <feGaussianBlur stdDeviation="6" result="blur2"/>
          <feGaussianBlur stdDeviation="12" result="blur3"/>
          <feMerge>
            <feMergeNode in="blur3"/>
            <feMergeNode in="blur2"/>
            <feMergeNode in="blur1"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <!-- Metallic Glow Filter -->
        <filter id="metallicGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" 
                             specularExponent="20" lighting-color="#ffffff" result="specular">
            <fePointLight x="-500" y="-500" z="500"/>
          </feSpecularLighting>
          <feComposite in="specular" in2="SourceAlpha" operator="in" result="specular"/>
          <feComposite in="SourceGraphic" in2="specular" operator="arithmetic" 
                      k1="0" k2="1" k3="1" k4="0"/>
        </filter>
        
        <!-- 3D Bevel Filter for metallic effect -->
        <filter id="metallicBevel" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
          <feOffset in="blur" dx="2" dy="2" result="offsetBlur"/>
          <feSpecularLighting in="blur" surfaceScale="3" specularConstant="0.8" 
                             specularExponent="15" lighting-color="white" result="specOut">
            <fePointLight x="-500" y="-500" z="200"/>
          </feSpecularLighting>
          <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
          <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" 
                      k1="0" k2="1" k3="1" k4="0" result="litPaint"/>
          <feMerge>
            <feMergeNode in="offsetBlur"/>
            <feMergeNode in="litPaint"/>
          </feMerge>
        </filter>
        
        <!-- Dynamic gradients will be added per bubble -->
      </defs>
    `;
    document.body.appendChild(defs);
  }
  
  /**
   * Generate a unique gradient ID for a bubble
   */
  generateGradientId(symbol) {
    return `gradient-${symbol.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
  }
  
  /**
   * Create metallic gradient based on price change
   */
  createMetallicGradient(symbol, change24h) {
    const gradientId = this.generateGradientId(symbol);
    const colors = this.interpolateColors(change24h);
    
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');
    
    // Create metallic ribbon gradient stops
    const stops = [
      { offset: '0%', color: colors.shadow, opacity: '1' },
      { offset: '25%', color: colors.primary, opacity: '0.9' },
      { offset: '45%', color: colors.highlight, opacity: '1' },
      { offset: '55%', color: colors.highlight, opacity: '1' },
      { offset: '75%', color: colors.secondary, opacity: '0.9' },
      { offset: '100%', color: colors.shadow, opacity: '1' }
    ];
    
    stops.forEach(stop => {
      const stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stopEl.setAttribute('offset', stop.offset);
      stopEl.setAttribute('stop-color', stop.color);
      stopEl.setAttribute('stop-opacity', stop.opacity);
      gradient.appendChild(stopEl);
    });
    
    // Add to global defs
    const defs = document.querySelector('#bubble-global-defs defs');
    if (defs) defs.appendChild(gradient);
    
    return gradientId;
  }
  
  /**
   * Interpolate colors based on price change percentage
   * Returns color set for the metallic ribbon
   */
  interpolateColors(change24h) {
    const change = parseFloat(change24h);
    
    if (change > 0) {
      // Green for positive - interpolate intensity based on magnitude
      const intensity = Math.min(Math.abs(change) / 10, 1);
      return {
        primary: this.colors.up.primary,
        secondary: this.colors.up.secondary,
        glow: this.colors.up.glow,
        glowSecondary: this.colors.up.glowSecondary,
        highlight: '#ffffff',
        shadow: this.darkenColor(this.colors.up.primary, 50)
      };
    } else if (change < 0) {
      // Red for negative
      const intensity = Math.min(Math.abs(change) / 10, 1);
      return {
        primary: this.colors.down.primary,
        secondary: this.colors.down.secondary,
        glow: this.colors.down.glow,
        glowSecondary: this.colors.down.glowSecondary,
        highlight: '#ffffff',
        shadow: this.darkenColor(this.colors.down.primary, 50)
      };
    } else {
      // Gold for neutral
      return {
        primary: this.colors.neutral.primary,
        secondary: this.colors.neutral.secondary,
        glow: this.colors.neutral.glow,
        glowSecondary: this.colors.neutral.glowSecondary,
        highlight: '#ffffff',
        shadow: this.darkenColor(this.colors.neutral.primary, 40)
      };
    }
  }
  
  /**
   * Darken a hex color by percentage
   */
  darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }
  
  /**
   * Generate 3D twisted ribbon path data
   * Creates flowing metallic ribbons like the reference image
   */
  generateRibbonPath(centerX, centerY, radius, turns, complexity = 3) {
    const points = [];
    const segments = 100;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * turns;
      
      // Create 3D twisted ribbon effect
      const r = radius * (0.3 + 0.7 * t);
      const twist = Math.sin(t * Math.PI * complexity) * 8;
      const wave = Math.cos(t * Math.PI * 4) * 3;
      
      // 3D projection effect
      const depth = Math.sin(angle * 2) * 0.3 + 0.7;
      
      const x = centerX + Math.cos(angle) * (r + twist) * depth + wave;
      const y = centerY + Math.sin(angle) * (r + twist) * depth + Math.sin(t * Math.PI) * 5;
      
      points.push({ x, y, depth });
    }
    
    // Convert to SVG path
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      // Use quadratic curves for smooth ribbon flow
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      const cpY = (prev.y + curr.y) / 2;
      path += ` Q ${prev.x} ${prev.y} ${cpX} ${cpY}`;
    }
    
    return path;
  }
  
  /**
   * Generate multiple ribbon paths for layered effect
   */
  generateRibbonLayers(centerX, centerY, baseRadius, colors) {
    const layers = [];
    
    // Outer ribbon - main flowing curve
    layers.push({
      path: this.generateRibbonPath(centerX, centerY, baseRadius, 2.5, 3),
      width: 12,
      opacity: 0.9,
      class: 'outer'
    });
    
    // Middle ribbon - tighter twist
    layers.push({
      path: this.generateRibbonPath(centerX, centerY, baseRadius * 0.75, 3, 4),
      width: 7,
      opacity: 0.95,
      class: 'middle'
    });
    
    // Inner ribbon - core spiral
    layers.push({
      path: this.generateRibbonPath(centerX, centerY, baseRadius * 0.5, 4, 5),
      width: 4,
      opacity: 1,
      class: 'inner'
    });
    
    // Highlight ribbon - glowing edge
    layers.push({
      path: this.generateRibbonPath(centerX, centerY, baseRadius * 0.85, 2.5, 3),
      width: 2,
      opacity: 0.6,
      class: 'highlight',
      stroke: colors.highlight
    });
    
    return layers;
  }
  
  /**
   * Create a complete metallic bubble element
   */
  createBubble(data) {
    const { symbol, name, change24h, volume, marketCap, size = 'md' } = data;
    const sizePx = this.getSizePixels(size);
    const colors = this.interpolateColors(change24h);
    const gradientId = this.createMetallicGradient(symbol, change24h);
    
    // Container
    const container = document.createElement('div');
    container.className = `metallic-bubble bubble-size-${size}`;
    container.style.setProperty('--bubble-size', `${sizePx}px`);
    container.style.setProperty('--ribbon-glow', colors.glow);
    container.style.setProperty('--ribbon-glow-secondary', colors.glowSecondary);
    container.dataset.symbol = symbol;
    
    // Glow background
    const glowBg = document.createElement('div');
    glowBg.className = 'bubble-glow-container';
    container.appendChild(glowBg);
    
    // SVG with ribbons
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'bubble-ribbon-svg');
    svg.setAttribute('viewBox', `0 0 ${sizePx} ${sizePx}`);
    
    const centerX = sizePx / 2;
    const centerY = sizePx / 2;
    const radius = sizePx * 0.35;
    
    // Generate ribbon layers
    const layers = this.generateRibbonLayers(centerX, centerY, radius, colors);
    
    layers.forEach(layer => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', layer.path);
      path.setAttribute('class', `ribbon-path ${layer.class}`);
      path.setAttribute('stroke', layer.stroke || `url(#${gradientId})`);
      path.setAttribute('stroke-width', layer.width);
      path.setAttribute('opacity', layer.opacity);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      
      if (layer.class === 'highlight') {
        path.setAttribute('filter', 'url(#neonGlow)');
      }
      
      svg.appendChild(path);
    });
    
    container.appendChild(svg);
    
    // Label container
    const labelContainer = document.createElement('div');
    labelContainer.className = 'bubble-label-container';
    
    const symbolEl = document.createElement('span');
    symbolEl.className = 'bubble-symbol';
    symbolEl.textContent = symbol;
    
    const changeEl = document.createElement('span');
    changeEl.className = 'bubble-change-text';
    changeEl.textContent = `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    
    labelContainer.appendChild(symbolEl);
    labelContainer.appendChild(changeEl);
    container.appendChild(labelContainer);
    
    // Store bubble data
    this.bubbles.set(symbol, {
      element: container,
      data: data,
      gradientId: gradientId,
      colors: colors
    });
    
    // Add interactions
    this.attachInteractions(container, symbol);
    
    return container;
  }
  
  /**
   * Get pixel size based on size class
   */
  getSizePixels(size) {
    const sizes = {
      xs: 40,
      sm: 50,
      md: 70,
      lg: 90,
      xl: 120
    };
    return sizes[size] || sizes.md;
  }
  
  /**
   * Attach hover and click interactions
   */
  attachInteractions(element, symbol) {
    // Hover - spinner effect
    element.addEventListener('mouseenter', () => {
      element.classList.add('spinning');
      this.onBubbleHover(symbol);
    });
    
    element.addEventListener('mouseleave', () => {
      element.classList.remove('spinning');
    });
    
    // Click - expand animation
    element.addEventListener('click', (e) => {
      e.stopPropagation();
      this.expandBubble(symbol);
    });
    
    // Touch support
    element.addEventListener('touchstart', () => {
      element.classList.add('spinning');
    });
    
    element.addEventListener('touchend', () => {
      element.classList.remove('spinning');
    });
  }
  
  /**
   * Handle bubble hover
   */
  onBubbleHover(symbol) {
    const bubble = this.bubbles.get(symbol);
    if (bubble && this.options.onHover) {
      this.options.onHover(bubble.data);
    }
  }
  
  /**
   * Expand bubble with animation
   */
  expandBubble(symbol) {
    const bubble = this.bubbles.get(symbol);
    if (!bubble) return;
    
    // Remove expanded class from all bubbles
    this.bubbles.forEach(b => b.element.classList.remove('expanded'));
    
    // Add expanded to clicked bubble
    bubble.element.classList.add('expanded');
    
    // Trigger callback
    if (this.options.onClick) {
      this.options.onClick(bubble.data);
    }
    
    // Remove expanded class after animation
    setTimeout(() => {
      bubble.element.classList.remove('expanded');
    }, 800);
  }
  
  /**
   * Update bubble with new data
   */
  updateBubble(symbol, newData) {
    const bubble = this.bubbles.get(symbol);
    if (!bubble) return;
    
    // Update data
    bubble.data = { ...bubble.data, ...newData };
    
    // Update colors if change24h changed
    if (newData.change24h !== undefined) {
      const colors = this.interpolateColors(newData.change24h);
      bubble.colors = colors;
      
      // Update CSS variables
      bubble.element.style.setProperty('--ribbon-glow', colors.glow);
      bubble.element.style.setProperty('--ribbon-glow-secondary', colors.glowSecondary);
      
      // Update gradient
      this.updateGradient(bubble.gradientId, colors);
      
      // Update text
      const changeEl = bubble.element.querySelector('.bubble-change-text');
      if (changeEl) {
        const change = parseFloat(newData.change24h);
        changeEl.textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
      }
    }
    
    // Add pulse animation for significant changes
    if (newData.alert) {
      bubble.element.classList.add('bubble-pulse');
      setTimeout(() => {
        bubble.element.classList.remove('bubble-pulse');
      }, 3000);
    }
  }
  
  /**
   * Update gradient colors
   */
  updateGradient(gradientId, colors) {
    const gradient = document.getElementById(gradientId);
    if (!gradient) return;
    
    const stops = gradient.querySelectorAll('stop');
    const newColors = [
      colors.shadow,
      colors.primary,
      colors.highlight,
      colors.highlight,
      colors.secondary,
      colors.shadow
    ];
    
    stops.forEach((stop, i) => {
      if (newColors[i]) {
        stop.setAttribute('stop-color', newColors[i]);
      }
    });
  }
  
  /**
   * Set alert state on bubble
   */
  setAlert(symbol, level = 'medium') {
    const bubble = this.bubbles.get(symbol);
    if (!bubble) return;
    
    bubble.element.classList.remove('bubble-alert-high', 'bubble-alert-medium', 'bubble-pulse');
    
    if (level === 'high') {
      bubble.element.classList.add('bubble-alert-high');
    } else if (level === 'medium') {
      bubble.element.classList.add('bubble-alert-medium');
    }
  }
  
  /**
   * Clear alert state
   */
  clearAlert(symbol) {
    const bubble = this.bubbles.get(symbol);
    if (!bubble) return;
    
    bubble.element.classList.remove('bubble-alert-high', 'bubble-alert-medium', 'bubble-pulse');
  }
  
  /**
   * Remove a bubble
   */
  removeBubble(symbol) {
    const bubble = this.bubbles.get(symbol);
    if (!bubble) return;
    
    // Remove gradient
    const gradient = document.getElementById(bubble.gradientId);
    if (gradient) gradient.remove();
    
    // Remove element
    bubble.element.remove();
    this.bubbles.delete(symbol);
  }
  
  /**
   * Get all bubbles
   */
  getAllBubbles() {
    return Array.from(this.bubbles.values());
  }
  
  /**
   * Get bubble by symbol
   */
  getBubble(symbol) {
    return this.bubbles.get(symbol);
  }
  
  /**
   * Destroy the system
   */
  destroy() {
    // Remove all bubbles
    this.bubbles.forEach((bubble, symbol) => {
      this.removeBubble(symbol);
    });
    
    // Remove global defs
    const defs = document.getElementById('bubble-global-defs');
    if (defs) defs.remove();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetallicBubbleSystem;
}

// Auto-initialize if DOM is ready
if (typeof window !== 'undefined') {
  window.MetallicBubbleSystem = MetallicBubbleSystem;
  
  // Helper function to quickly create bubbles
  window.createMetallicBubble = (data, options) => {
    const system = new MetallicBubbleSystem(options);
    return system.createBubble(data);
  };
}
