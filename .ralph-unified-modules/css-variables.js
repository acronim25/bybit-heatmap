/**
 * ═══════════════════════════════════════════════════════════════
 * RALPH-1 CSS VARIABLES GENERATOR
 * ═══════════════════════════════════════════════════════════════
 * 
 * JavaScript module for dynamic theme management.
 * Provides theme initialization, switching, and CSS variable access.
 * 
 * Usage:
 *   import { ThemeManager, generateThemeCSS } from './css-variables.js';
 *   const theme = new ThemeManager();
 *   theme.setTheme('light');
 * 
 * Generated: 2026-02-20
 * Author: Ralph-1 (CSS Theme System)
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// THEME CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const THEMES = {
  dark: {
    // Core Background Colors
    '--bg-primary': '#050a08',
    '--bg-secondary': '#0a1a0f',
    '--bg-tertiary': '#0d2418',
    '--bg-gradient-start': '#050a08',
    '--bg-gradient-end': '#0a1a0f',
    '--bg-overlay': 'rgba(0, 0, 0, 0.7)',
    '--bg-card': 'rgba(10, 26, 15, 0.8)',
    '--bg-input': 'rgba(5, 10, 8, 0.9)',
    
    // Text Colors
    '--text-primary': '#ffffff',
    '--text-secondary': 'rgba(255, 255, 255, 0.7)',
    '--text-tertiary': 'rgba(255, 255, 255, 0.5)',
    '--text-muted': 'rgba(255, 255, 255, 0.4)',
    '--text-inverse': '#050a08',
    
    // Accent Colors
    '--accent-green': '#00ff88',
    '--accent-green-light': '#4dffb3',
    '--accent-green-dark': '#00cc6a',
    '--accent-red': '#ff3366',
    '--accent-red-light': '#ff6688',
    '--accent-red-dark': '#cc2952',
    '--accent-blue': '#33ccff',
    '--accent-yellow': '#ffcc00',
    '--accent-purple': '#cc66ff',
    
    // Glow Effects
    '--glow-green': 'rgba(0, 255, 136, 0.5)',
    '--glow-green-soft': 'rgba(0, 255, 136, 0.3)',
    '--glow-green-intense': 'rgba(0, 255, 136, 0.8)',
    '--glow-red': 'rgba(255, 51, 102, 0.5)',
    '--glow-red-soft': 'rgba(255, 51, 102, 0.3)',
    '--glow-red-intense': 'rgba(255, 51, 102, 0.8)',
    '--glow-blue': 'rgba(51, 204, 255, 0.5)',
    '--glow-white': 'rgba(255, 255, 255, 0.3)',
    
    // Border Colors
    '--border-primary': 'rgba(0, 255, 136, 0.3)',
    '--border-secondary': 'rgba(255, 255, 255, 0.1)',
    '--border-tertiary': 'rgba(255, 255, 255, 0.05)',
    '--border-accent': 'rgba(0, 255, 136, 0.5)',
    '--border-error': 'rgba(255, 51, 102, 0.5)',
    
    // Background Effect Colors
    '--bg-grid-color': 'rgba(0, 255, 136, 0.03)',
    '--bg-grid-line': 'rgba(0, 255, 136, 0.08)',
    '--bg-circle-color': 'rgba(0, 255, 136, 0.05)',
    '--bg-circle-glow': 'rgba(0, 255, 136, 0.15)',
    '--bg-ripple-color': 'rgba(0, 255, 136, 0.1)',
    '--bg-particle-color': 'rgba(0, 255, 136, 0.6)',
    '--bg-scanline': 'rgba(0, 0, 0, 0.1)',
    
    // Shadow Colors
    '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
    '--shadow-md': '0 4px 16px rgba(0, 0, 0, 0.4)',
    '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  
  light: {
    // Core Background Colors
    '--bg-primary': '#f0f5f0',
    '--bg-secondary': '#e8f0e8',
    '--bg-tertiary': '#d8e8d8',
    '--bg-gradient-start': '#f0f5f0',
    '--bg-gradient-end': '#e8f0e8',
    '--bg-overlay': 'rgba(240, 245, 240, 0.9)',
    '--bg-card': 'rgba(255, 255, 255, 0.9)',
    '--bg-input': 'rgba(240, 245, 240, 0.95)',
    
    // Text Colors
    '--text-primary': '#1a3a2a',
    '--text-secondary': 'rgba(26, 58, 42, 0.7)',
    '--text-tertiary': 'rgba(26, 58, 42, 0.5)',
    '--text-muted': 'rgba(26, 58, 42, 0.4)',
    '--text-inverse': '#f0f5f0',
    
    // Accent Colors
    '--accent-green': '#2a8a4a',
    '--accent-green-light': '#3db560',
    '--accent-green-dark': '#1f6b38',
    '--accent-red': '#c54a4a',
    '--accent-red-light': '#d66868',
    '--accent-red-dark': '#a33a3a',
    '--accent-blue': '#2a7a9a',
    '--accent-yellow': '#b88a2a',
    '--accent-purple': '#8a4a9a',
    
    // Glow Effects
    '--glow-green': 'rgba(42, 138, 74, 0.3)',
    '--glow-green-soft': 'rgba(42, 138, 74, 0.15)',
    '--glow-green-intense': 'rgba(42, 138, 74, 0.5)',
    '--glow-red': 'rgba(197, 74, 74, 0.3)',
    '--glow-red-soft': 'rgba(197, 74, 74, 0.15)',
    '--glow-red-intense': 'rgba(197, 74, 74, 0.5)',
    '--glow-blue': 'rgba(42, 122, 154, 0.3)',
    '--glow-white': 'rgba(0, 0, 0, 0.1)',
    
    // Border Colors
    '--border-primary': 'rgba(42, 138, 74, 0.3)',
    '--border-secondary': 'rgba(26, 58, 42, 0.1)',
    '--border-tertiary': 'rgba(26, 58, 42, 0.05)',
    '--border-accent': 'rgba(42, 138, 74, 0.5)',
    '--border-error': 'rgba(197, 74, 74, 0.5)',
    
    // Background Effect Colors
    '--bg-grid-color': 'rgba(42, 138, 74, 0.06)',
    '--bg-grid-line': 'rgba(42, 138, 74, 0.12)',
    '--bg-circle-color': 'rgba(42, 138, 74, 0.08)',
    '--bg-circle-glow': 'rgba(42, 138, 74, 0.2)',
    '--bg-ripple-color': 'rgba(42, 138, 74, 0.15)',
    '--bg-particle-color': 'rgba(42, 138, 74, 0.5)',
    '--bg-scanline': 'rgba(0, 0, 0, 0.03)',
    
    // Shadow Colors
    '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
    '--shadow-md': '0 4px 16px rgba(0, 0, 0, 0.1)',
    '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
  }
};

// ═══════════════════════════════════════════════════════════════
// THEME MANAGER CLASS
// ═══════════════════════════════════════════════════════════════

class ThemeManager {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'theme-preference';
    this.defaultTheme = options.defaultTheme || 'dark';
    this.transitionDuration = options.transitionDuration || 300;
    this.onChange = options.onChange || null;
    
    this.currentTheme = this.getStoredTheme() || this.defaultTheme;
    this.init();
  }
  
  /**
   * Initialize theme on page load
   */
  init() {
    // Apply theme without transitions initially
    document.documentElement.classList.add('no-transitions');
    this.applyTheme(this.currentTheme, false);
    
    // Remove no-transitions class after a brief delay
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.documentElement.classList.remove('no-transitions');
      }, 50);
    });
    
    // Listen for system preference changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      mediaQuery.addEventListener('change', (e) => {
        if (!this.getStoredTheme()) {
          this.setTheme(e.matches ? 'light' : 'dark');
        }
      });
    }
  }
  
  /**
   * Get theme from localStorage
   */
  getStoredTheme() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Store theme preference
   */
  storeTheme(theme) {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (e) {
      console.warn('Unable to store theme preference');
    }
  }
  
  /**
   * Apply theme to document
   */
  applyTheme(theme, animate = true) {
    if (!THEMES[theme]) {
      console.error(`Unknown theme: ${theme}`);
      return;
    }
    
    this.currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme, previous: this.currentTheme }
    }));
    
    // Call onChange callback if provided
    if (this.onChange) {
      this.onChange(theme);
    }
  }
  
  /**
   * Set theme and store preference
   */
  setTheme(theme) {
    this.applyTheme(theme);
    this.storeTheme(theme);
  }
  
  /**
   * Toggle between dark and light
   */
  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }
  
  /**
   * Get current theme
   */
  getTheme() {
    return this.currentTheme;
  }
  
  /**
   * Check if current theme is dark
   */
  isDark() {
    return this.currentTheme === 'dark';
  }
  
  /**
   * Check if current theme is light
   */
  isLight() {
    return this.currentTheme === 'light';
  }
  
  /**
   * Get CSS variable value
   */
  getVariable(variableName) {
    return getComputedStyle(document.body).getPropertyValue(variableName).trim();
  }
  
  /**
   * Get all theme variables
   */
  getAllVariables() {
    return THEMES[this.currentTheme];
  }
  
  /**
   * Reset to system preference
   */
  reset() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {}
    
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    this.applyTheme(prefersLight ? 'light' : 'dark');
  }
}

// ═══════════════════════════════════════════════════════════════
// CSS GENERATOR FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate complete CSS for a theme
 */
function generateThemeCSS(themeName, indent = '  ') {
  const theme = THEMES[themeName];
  if (!theme) {
    throw new Error(`Unknown theme: ${themeName}`);
  }
  
  const lines = Object.entries(theme).map(([key, value]) => {
    return `${indent}${key}: ${value};`;
  });
  
  return lines.join('\n');
}

/**
 * Generate CSS custom properties block
 */
function generateCSSBlock(themeName, selector = ':root') {
  const css = generateThemeCSS(themeName);
  return `${selector} {\n${css}\n}`;
}

/**
 * Generate complete theme stylesheet
 */
function generateCompleteStylesheet() {
  const darkCSS = generateThemeCSS('dark');
  const lightCSS = generateThemeCSS('light');
  
  return `/* Auto-generated Theme Stylesheet */

:root {
${darkCSS}
}

[data-theme="light"] {
${lightCSS}
}
`;
}

/**
 * Get a specific color value
 */
function getColor(theme, variable) {
  return THEMES[theme]?.[variable] || null;
}

/**
 * Generate RGB values from hex for calculations
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Generate rgba from hex with alpha
 */
function hexToRgba(hex, alpha) {
  const rgb = hexToRgb(hex);
  return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})` : null;
}

// ═══════════════════════════════════════════════════════════════
// REACTIVE THEME HOOK (for frameworks)
// ═══════════════════════════════════════════════════════════════

/**
 * Create a reactive theme subscription
 * Usage with vanilla JS or frameworks
 */
function createThemeSubscription(callback) {
  const handler = (e) => callback(e.detail.theme);
  window.addEventListener('themechange', handler);
  
  // Return unsubscribe function
  return () => window.removeEventListener('themechange', handler);
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Apply dynamic CSS variable override
 */
function setCSSVariable(variable, value, element = document.documentElement) {
  element.style.setProperty(variable, value);
}

/**
 * Remove CSS variable override
 */
function removeCSSVariable(variable, element = document.documentElement) {
  element.style.removeProperty(variable);
}

/**
 * Get all available themes
 */
function getAvailableThemes() {
  return Object.keys(THEMES);
}

/**
 * Create theme-aware canvas color
 */
function getCanvasColor(variable, theme = null) {
  const currentTheme = theme || document.body.getAttribute('data-theme') || 'dark';
  const hex = THEMES[currentTheme][variable];
  
  if (!hex) return null;
  
  // Handle rgba format
  if (hex.startsWith('rgba')) {
    const match = hex.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] ? parseFloat(match[4]) : 1
      };
    }
  }
  
  // Handle hex
  const rgb = hexToRgb(hex);
  return rgb ? { ...rgb, a: 1 } : null;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

// ES Module exports
export {
  ThemeManager,
  THEMES,
  generateThemeCSS,
  generateCSSBlock,
  generateCompleteStylesheet,
  getColor,
  hexToRgb,
  hexToRgba,
  createThemeSubscription,
  setCSSVariable,
  removeCSSVariable,
  getAvailableThemes,
  getCanvasColor
};

// Default export
export default ThemeManager;

// Global assignment for non-module usage
if (typeof window !== 'undefined') {
  window.ThemeManager = ThemeManager;
  window.RalphTheme = {
    ThemeManager,
    THEMES,
    generateThemeCSS,
    generateCSSBlock,
    generateCompleteStylesheet,
    getColor,
    hexToRgb,
    hexToRgba,
    createThemeSubscription,
    setCSSVariable,
    removeCSSVariable,
    getAvailableThemes,
    getCanvasColor
  };
}
