/**
 * BYBIT HEATMAP PRO - UI Controls
 * Theme management, modal handling, keyboard shortcuts
 */

// ============================================
// Theme Manager
// ============================================
class ThemeManager {
  constructor() {
    this.key = 'bybit-heatmap-theme';
    this.currentTheme = this.getStoredTheme() || this.getSystemPreference();
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.createToggleButton();
    this.bindKeyboardShortcuts();
  }

  getStoredTheme() {
    try {
      return localStorage.getItem(this.key);
    } catch (e) {
      return null;
    }
  }

  getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    try {
      localStorage.setItem(this.key, theme);
    } catch (e) {
      // Silent fail if localStorage unavailable
    }
    
    // Update toggle button icon
    this.updateToggleIcon();
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { theme } 
    }));
  }

  toggle() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  createToggleButton() {
    // Check if button already exists
    if (document.getElementById('theme-toggle')) return;

    const button = document.createElement('button');
    button.id = 'theme-toggle';
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Toggle theme');
    button.setAttribute('title', 'Toggle theme (T)');
    
    button.innerHTML = `
      <span class="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">☀️</span>
      <span class="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">🌙</span>
    `;
    
    button.addEventListener('click', () => this.toggle());
    
    document.body.appendChild(button);
    this.toggleButton = button;
  }

  updateToggleIcon() {
    // CSS handles the icon visibility based on data-theme attribute
  }

  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // 'T' key toggles theme (not when typing in input)
      if (e.key === 't' || e.key === 'T') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        this.toggle();
      }
    });
  }
}

// ============================================
// Modal Manager
// ============================================
class ModalManager {
  constructor() {
    this.modal = null;
    this.overlay = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    this.createModalStructure();
    this.bindEvents();
  }

  createModalStructure() {
    // Check if modal already exists
    if (document.getElementById('coin-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'coin-modal';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modal-title');
    
    overlay.innerHTML = `
      <div class="modal" role="document">
        <div class="modal__header">
          <h2 id="modal-title" class="modal__title">
            <span class="modal__symbol" id="modal-symbol">--</span>
          </h2>
          <button class="modal__close" id="modal-close" aria-label="Close modal">
            ✕
          </button>
        </div>
        <div class="modal__body">
          <div class="modal__stat">
            <span class="modal__stat-label">Preț</span>
            <span class="modal__stat-value" id="modal-price">--</span>
          </div>
          <div class="modal__stat">
            <span class="modal__stat-label">Schimbare 24h</span>
            <span class="modal__stat-value" id="modal-change">--</span>
          </div>
          <div class="modal__stat">
            <span class="modal__stat-label">Volum 24h</span>
            <span class="modal__stat-value" id="modal-volume">--</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.modal = overlay.querySelector('.modal');
    
    // Bind close button
    const closeBtn = document.getElementById('modal-close');
    closeBtn.addEventListener('click', () => this.close());
  }

  bindEvents() {
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Close on overlay click (but not modal click)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Trap focus within modal when open
    this.overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.trapFocus(e);
      }
    });
  }

  open(data = {}) {
    const { symbol = 'BTCUSDT', price = '0.00', change = 0, volume = '0' } = data;
    
    // Update content
    document.getElementById('modal-symbol').textContent = symbol;
    document.getElementById('modal-price').textContent = `$${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const changeEl = document.getElementById('modal-change');
    const changePercent = parseFloat(change);
    const changeFormatted = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
    changeEl.textContent = changeFormatted;
    changeEl.className = `modal__stat-value ${changePercent >= 0 ? 'modal__stat-value--positive' : 'modal__stat-value--negative'}`;
    
    document.getElementById('modal-volume').textContent = `$${parseFloat(volume).toLocaleString('en-US', { notation: 'compact', compactDisplay: 'short' })}`;

    // Show modal
    this.overlay.classList.add('modal-overlay--visible');
    this.isOpen = true;
    
    // Store last focused element
    this.lastFocusedElement = document.activeElement;
    
    // Focus close button
    setTimeout(() => {
      document.getElementById('modal-close').focus();
    }, 100);

    // Dispatch event
    window.dispatchEvent(new CustomEvent('modalopen', { detail: data }));
  }

  close() {
    this.overlay.classList.remove('modal-overlay--visible');
    this.isOpen = false;
    
    // Restore focus
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('modalclose'));
  }

  trapFocus(e) {
    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  }
}

// ============================================
// Loading State Manager
// ============================================
class LoadingManager {
  constructor() {
    this.overlay = null;
    this.init();
  }

  init() {
    this.createLoadingOverlay();
  }

  createLoadingOverlay() {
    if (document.getElementById('loading-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <p class="loading-text">Încărcare...</p>
    `;
    
    document.body.appendChild(overlay);
    this.overlay = overlay;
  }

  show() {
    if (this.overlay) {
      this.overlay.classList.remove('loading-overlay--hidden');
    }
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.add('loading-overlay--hidden');
    }
  }
}

// ============================================
// Stats Manager
// ============================================
class StatsManager {
  constructor() {
    this.bullishCount = 0;
    this.bearishCount = 0;
    this.init();
  }

  init() {
    this.createStatsDisplay();
  }

  createStatsDisplay() {
    // Stats are created in header - just need update method
  }

  update(bullish, bearish) {
    this.bullishCount = bullish;
    this.bearishCount = bearish;
    
    const bullishEl = document.getElementById('stat-bullish');
    const bearishEl = document.getElementById('stat-bearish');
    
    if (bullishEl) bullishEl.textContent = bullish;
    if (bearishEl) bearishEl.textContent = bearish;
  }

  incrementBullish() {
    this.update(this.bullishCount + 1, this.bearishCount);
  }

  incrementBearish() {
    this.update(this.bullishCount, this.bearishCount + 1);
  }
}

// ============================================
// UI Controller
// ============================================
class UIController {
  constructor() {
    this.themeManager = new ThemeManager();
    this.modalManager = new ModalManager();
    this.loadingManager = new LoadingManager();
    this.statsManager = new StatsManager();
    
    // Expose for global access
    window.ui = this;
  }

  // Public API
  toggleTheme() {
    this.themeManager.toggle();
  }

  openModal(data) {
    this.modalManager.open(data);
  }

  closeModal() {
    this.modalManager.close();
  }

  showLoading() {
    this.loadingManager.show();
  }

  hideLoading() {
    this.loadingManager.hide();
  }

  updateStats(bullish, bearish) {
    this.statsManager.update(bullish, bearish);
  }
}

// ============================================
// Initialize on DOM Ready
// ============================================
function initUI() {
  const ui = new UIController();
  
  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('uiready', { detail: { ui } }));
  
  return ui;
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI);
} else {
  initUI();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    UIController, 
    ThemeManager, 
    ModalManager, 
    LoadingManager, 
    StatsManager 
  };
}
