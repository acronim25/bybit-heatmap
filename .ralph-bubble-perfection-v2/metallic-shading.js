/**
 * Metallic Shading System
 * Creates polished chrome/metallic ribbon effects with dynamic lighting
 * Based on reference: bubble-perfection metallic surface
 */

class MetallicShadingSystem {
  constructor() {
    this.lightPosition = { x: 0.3, y: -0.5 }; // Default light from top-left
    this.basePurple = '#b829dd';
  }

  /**
   * Generate a 5-stop metallic gradient
   * Creates the chrome-like effect with highlights and shadows
   * @param {string} baseColor - Base hex color
   * @param {number} intensity - Intensity multiplier (0.5 - 2.0)
   * @returns {Array} Array of 5 color stops [{offset, color}]
   */
  generateMetallicGradient(baseColor, intensity = 1.0) {
    const base = this.hexToRgb(baseColor);
    const highlight = this.brighten(base, 0.9 * intensity);
    const shadow = this.darken(base, 0.7 * intensity);
    const midLight = this.brighten(base, 0.3 * intensity);
    const midShadow = this.darken(base, 0.3 * intensity);

    return [
      { offset: '0%', color: this.rgbToHex(shadow) },
      { offset: '25%', color: this.rgbToHex(midShadow) },
      { offset: '50%', color: baseColor },
      { offset: '75%', color: this.rgbToHex(midLight) },
      { offset: '100%', color: this.rgbToHex(highlight) }
    ];
  }

  /**
   * Calculate surface shading based on surface angle and light position
   * Returns highlight/shadow factors for realistic metallic look
   * @param {number} angle - Surface angle in degrees (0-360)
   * @param {Object} lightPosition - {x, y} light source position (-1 to 1)
   * @returns {Object} {highlight: number, shadow: number, specular: number}
   */
  calculateSurfaceShading(angle, lightPosition = this.lightPosition) {
    const rad = (angle * Math.PI) / 180;
    
    // Surface normal vector
    const normalX = Math.cos(rad);
    const normalY = Math.sin(rad);
    
    // Light vector (normalized)
    const lightLen = Math.sqrt(lightPosition.x ** 2 + lightPosition.y ** 2) || 1;
    const lightX = lightPosition.x / lightLen;
    const lightY = lightPosition.y / lightLen;
    
    // Dot product for diffuse lighting
    const dotProduct = normalX * lightX + normalY * lightY;
    
    // Calculate highlight intensity (specular)
    const specularAngle = Math.max(0, dotProduct);
    const specular = Math.pow(specularAngle, 16) * 0.9; // Sharp specular highlight
    
    // Calculate highlight and shadow factors
    const highlight = Math.max(0, Math.min(1, 0.5 + dotProduct * 0.5));
    const shadow = Math.max(0, Math.min(1, 0.5 - dotProduct * 0.5));
    
    return {
      highlight: highlight * 0.8 + specular * 0.2,
      shadow: shadow * 0.7,
      specular: specular,
      brightness: highlight
    };
  }

  /**
   * Apply dynamic color shift based on price change
   * Shifts purple base to red (negative) or green (positive)
   * @param {string} basePurple - Base purple hex color
   * @param {number} priceChange - Price change percentage (-100 to +100)
   * @returns {string} Shifted hex color
   */
  applyDynamicColor(basePurple, priceChange) {
    const base = this.hexToRgb(basePurple);
    
    // Normalize price change (-100 to 100)
    const normalized = Math.max(-100, Math.min(100, priceChange));
    const factor = normalized / 100; // -1 to 1
    
    if (factor > 0) {
      // Positive: Shift toward green (#00ff88)
      const green = { r: 0, g: 255, b: 136 };
      return this.interpolateColor(base, green, factor * 0.7);
    } else if (factor < 0) {
      // Negative: Shift toward red (#ff4444)
      const red = { r: 255, g: 68, b: 68 };
      return this.interpolateColor(base, red, Math.abs(factor) * 0.7);
    }
    
    return basePurple;
  }

  /**
   * Create SVG linearGradient element for ribbon
   * @param {Array} colors - Array of color stops [{offset, color}]
   * @param {Array} stops - Optional custom stop positions (0-1)
   * @param {string} id - Gradient ID
   * @param {Object} transform - Gradient transform {angle, x1, y1, x2, y2}
   * @returns {string} SVG gradient element as string
   */
  createRibbonGradient(colors, stops = null, id = 'metallic-ribbon', transform = {}) {
    const defaultStops = ['0%', '25%', '50%', '75%', '100%'];
    const stopPositions = stops || defaultStops;
    
    // Build color stops
    let stopsHtml = '';
    colors.forEach((stop, i) => {
      const offset = stopPositions[i] || stop.offset || `${(i / (colors.length - 1)) * 100}%`;
      const color = stop.color || stop;
      stopsHtml += `      <stop offset="${offset}" stop-color="${color}" />\n`;
    });
    
    // Calculate gradient vector for 3D effect
    const angle = transform.angle || 45;
    const rad = (angle * Math.PI) / 180;
    const x1 = transform.x1 || (0.5 - Math.cos(rad) * 0.5).toFixed(3);
    const y1 = transform.y1 || (0.5 - Math.sin(rad) * 0.5).toFixed(3);
    const x2 = transform.x2 || (0.5 + Math.cos(rad) * 0.5).toFixed(3);
    const y2 = transform.y2 || (0.5 + Math.sin(rad) * 0.5).toFixed(3);
    
    return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="objectBoundingBox">
${stopsHtml}    </linearGradient>`;
  }

  /**
   * Create a complete metallic ribbon SVG with animated light source
   * @param {number} width - SVG width
   * @param {number} height - SVG height
   * @param {string} baseColor - Base ribbon color
   * @param {number} priceChange - Current price change for color shift
   * @returns {string} Complete SVG string
   */
  createMetallicRibbon(width = 400, height = 60, baseColor = null, priceChange = 0) {
    const color = baseColor || this.basePurple;
    const shiftedColor = this.applyDynamicColor(color, priceChange);
    const gradient = this.generateMetallicGradient(shiftedColor, 1.2);
    
    const gradientDef = this.createRibbonGradient(gradient, null, 'ribbon-metal', {
      angle: 90
    });
    
    const specularGradient = this.createRibbonGradient([
      { offset: '0%', color: 'rgba(255,255,255,0)' },
      { offset: '40%', color: 'rgba(255,255,255,0.1)' },
      { offset: '50%', color: 'rgba(255,255,255,0.6)' },
      { offset: '60%', color: 'rgba(255,255,255,0.1)' },
      { offset: '100%', color: 'rgba(255,255,255,0)' }
    ], null, 'ribbon-specular', { angle: 75 });
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${gradientDef}
    ${specularGradient}
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <!-- Base metallic ribbon -->
  <rect x="2" y="2" width="${width-4}" height="${height-4}" rx="8" 
        fill="url(#ribbon-metal)" filter="url(#glow)" />
  
  <!-- Specular highlight overlay -->
  <rect x="2" y="2" width="${width-4}" height="${height-4}" rx="8" 
        fill="url(#ribbon-specular)" style="mix-blend-mode: overlay;" />
  
  <!-- Edge highlight for chrome effect -->
  <rect x="3" y="3" width="${width-6}" height="${height-6}" rx="7" 
        fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
</svg>`;
  }

  /**
   * Animate light source position for dynamic shading
   * @param {Function} callback - Called with new light position {x, y}
   * @param {number} speed - Animation speed (0.001 - 0.1)
   */
  animateLightSource(callback, speed = 0.02) {
    let time = 0;
    
    const animate = () => {
      time += speed;
      
      // Orbital light movement
      const x = Math.cos(time) * 0.6;
      const y = Math.sin(time * 0.7) * 0.4 - 0.3;
      
      this.lightPosition = { x, y };
      
      if (callback) {
        callback({ x, y, time });
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  // Utility functions
  hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  rgbToHex(rgb) {
    const toHex = (c) => {
      const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  brighten(rgb, factor) {
    return {
      r: rgb.r + (255 - rgb.r) * factor,
      g: rgb.g + (255 - rgb.g) * factor,
      b: rgb.b + (255 - rgb.b) * factor
    };
  }

  darken(rgb, factor) {
    return {
      r: rgb.r * (1 - factor),
      g: rgb.g * (1 - factor),
      b: rgb.b * (1 - factor)
    };
  }

  interpolateColor(color1, color2, factor) {
    const r = Math.round(color1.r + (color2.r - color1.r) * factor);
    const g = Math.round(color1.g + (color2.g - color1.g) * factor);
    const b = Math.round(color1.b + (color2.b - color1.b) * factor);
    return this.rgbToHex({ r, g, b });
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetallicShadingSystem;
}

// Global instance for browser use
window.MetallicShading = new MetallicShadingSystem();
