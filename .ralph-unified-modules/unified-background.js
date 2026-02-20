/**
 * UnifiedBackground - Animated background component for Dark/Light themes
 * 
 * Usage:
 *   const bg = new UnifiedBackground(containerElement);
 *   bg.setTheme('dark'); // or 'light'
 *   bg.destroy(); // cleanup
 */

class UnifiedBackground {
  /**
   * Creates a new UnifiedBackground instance
   * @param {HTMLElement} container - The container element to append background to
   * @param {Object} options - Configuration options
   * @param {string} options.initialTheme - Initial theme ('dark' | 'light')
   * @param {boolean} options.pauseOnHidden - Pause animations when tab is hidden
   */
  constructor(container, options = {}) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('UnifiedBackground: A valid container element is required');
    }

    this.container = container;
    this.options = {
      initialTheme: options.initialTheme || 'dark',
      pauseOnHidden: options.pauseOnHidden !== false
    };

    this.currentTheme = null;
    this.elements = {};
    this.visibilityHandler = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._init();
  }

  /**
   * Initialize the background component
   * @private
   */
  _init() {
    this._createStructure();
    this._setupVisibilityHandling();
    this.setTheme(this.options.initialTheme);
  }

  /**
   * Create the DOM structure for both themes
   * @private
   */
  _createStructure() {
    // Main container
    this.elements.root = document.createElement('div');
    this.elements.root.className = 'unified-background';

    // Dark theme layer
    this.elements.darkLayer = this._createDarkLayer();
    this.elements.root.appendChild(this.elements.darkLayer);

    // Light theme layer
    this.elements.lightLayer = this._createLightLayer();
    this.elements.root.appendChild(this.elements.lightLayer);

    // Append to container
    this.container.appendChild(this.elements.root);
  }

  /**
   * Create the dark theme layer
   * @returns {HTMLElement}
   * @private
   */
  _createDarkLayer() {
    const layer = document.createElement('div');
    layer.className = 'unified-background__layer unified-background__dark-base';
    layer.setAttribute('data-theme', 'dark');

    // Moving grid
    const grid = document.createElement('div');
    grid.className = 'unified-background__grid';
    layer.appendChild(grid);

    // Concentric circles
    const circlesContainer = document.createElement('div');
    circlesContainer.className = 'unified-background__circles-dark';
    for (let i = 0; i < 6; i++) {
      const circle = document.createElement('div');
      circle.className = 'unified-background__circle-dark';
      circlesContainer.appendChild(circle);
    }
    layer.appendChild(circlesContainer);

    // Rotating arc segments (SVG)
    const arcsContainer = document.createElement('div');
    arcsContainer.className = 'unified-background__arcs';
    
    // Arc 1
    const arc1 = this._createArcSVG(150, 0, 90);
    arc1.className = 'unified-background__arc';
    arcsContainer.appendChild(arc1);
    
    // Arc 2
    const arc2 = this._createArcSVG(220, 120, 240);
    arc2.className = 'unified-background__arc';
    arcsContainer.appendChild(arc2);
    
    // Arc 3
    const arc3 = this._createArcSVG(180, 200, 320);
    arc3.className = 'unified-background__arc';
    arcsContainer.appendChild(arc3);
    
    layer.appendChild(arcsContainer);

    // Floating particles
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'unified-background__particles-dark';
    for (let i = 0; i < 6; i++) {
      const particle = document.createElement('div');
      particle.className = 'unified-background__particle-dark';
      particlesContainer.appendChild(particle);
    }
    layer.appendChild(particlesContainer);

    // Scan lines
    const scanlines = document.createElement('div');
    scanlines.className = 'unified-background__scanlines';
    layer.appendChild(scanlines);

    return layer;
  }

  /**
   * Create an SVG arc element
   * @param {number} radius - Arc radius
   * @param {number} startAngle - Start angle in degrees
   * @param {number} endAngle - End angle in degrees
   * @returns {HTMLElement}
   * @private
   */
  _createArcSVG(radius, startAngle, endAngle) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 600 600');
    svg.className = 'unified-background__arc-svg';

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = 300 + radius * Math.cos(startRad);
    const y1 = 300 + radius * Math.sin(startRad);
    const x2 = 300 + radius * Math.cos(endRad);
    const y2 = 300 + radius * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`);
    path.className = 'unified-background__arc-path';

    svg.appendChild(path);
    return svg;
  }

  /**
   * Create the light theme layer
   * @returns {HTMLElement}
   * @private
   */
  _createLightLayer() {
    const layer = document.createElement('div');
    layer.className = 'unified-background__layer unified-background__light-base';
    layer.setAttribute('data-theme', 'light');

    // Concentric circles (different positions)
    const circlesContainer = document.createElement('div');
    circlesContainer.className = 'unified-background__circles-light';
    for (let i = 0; i < 6; i++) {
      const circle = document.createElement('div');
      circle.className = 'unified-background__circle-light';
      circlesContainer.appendChild(circle);
    }
    layer.appendChild(circlesContainer);

    // Diagonal sliding lines
    const diagonalLines = document.createElement('div');
    diagonalLines.className = 'unified-background__diagonal-lines';
    layer.appendChild(diagonalLines);

    // Ripple effects
    const ripplesContainer = document.createElement('div');
    ripplesContainer.className = 'unified-background__ripples';
    for (let i = 0; i < 4; i++) {
      const ripple = document.createElement('div');
      ripple.className = 'unified-background__ripple';
      ripplesContainer.appendChild(ripple);
    }
    layer.appendChild(ripplesContainer);

    // Floating orbs
    const orbsContainer = document.createElement('div');
    orbsContainer.className = 'unified-background__orbs';
    for (let i = 0; i < 4; i++) {
      const orb = document.createElement('div');
      orb.className = 'unified-background__orb';
      orbsContainer.appendChild(orb);
    }
    layer.appendChild(orbsContainer);

    return layer;
  }

  /**
   * Setup visibility change handling to pause animations
   * @private
   */
  _setupVisibilityHandling() {
    if (!this.options.pauseOnHidden) return;

    this.visibilityHandler = () => {
      if (document.hidden) {
        this.elements.root.classList.add('unified-background--paused');
      } else {
        this.elements.root.classList.remove('unified-background--paused');
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  /**
   * Set the active theme
   * @param {string} theme - Theme to activate ('dark' | 'light')
   */
  setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') {
      console.warn('UnifiedBackground: Invalid theme "' + theme + '", expected "dark" or "light"');
      return;
    }

    if (this.currentTheme === theme) return;

    this.currentTheme = theme;

    // Update layer visibility with CSS transition
    if (theme === 'dark') {
      this.elements.darkLayer.classList.add('unified-background__layer--active');
      this.elements.lightLayer.classList.remove('unified-background__layer--active');
    } else {
      this.elements.darkLayer.classList.remove('unified-background__layer--active');
      this.elements.lightLayer.classList.add('unified-background__layer--active');
    }

    // Dispatch custom event
    this.elements.root.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme: theme }
    }));
  }

  /**
   * Get the current active theme
   * @returns {string} Current theme ('dark' | 'light')
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Toggle between dark and light themes
   * @returns {string} The new active theme
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Check if reduced motion is preferred
   * @returns {boolean}
   */
  isReducedMotion() {
    return this.reducedMotion;
  }

  /**
   * Pause all animations
   */
  pause() {
    this.elements.root.classList.add('unified-background--paused');
  }

  /**
   * Resume animations
   */
  resume() {
    if (!document.hidden) {
      this.elements.root.classList.remove('unified-background--paused');
    }
  }

  /**
   * Add event listener for theme changes
   * @param {Function} callback - Callback function
   */
  onThemeChange(callback) {
    this.elements.root.addEventListener('themechange', (e) => {
      callback(e.detail.theme);
    });
  }

  /**
   * Clean up and remove the background
   */
  destroy() {
    // Remove visibility handler
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    // Remove from DOM
    if (this.elements.root && this.elements.root.parentNode) {
      this.elements.root.parentNode.removeChild(this.elements.root);
    }

    // Clear references
    this.elements = {};
    this.currentTheme = null;
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedBackground;
}

if (typeof window !== 'undefined') {
  window.UnifiedBackground = UnifiedBackground;
}
