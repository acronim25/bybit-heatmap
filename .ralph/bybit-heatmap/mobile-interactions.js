/**
 * BYBIT HEATMAP PRO - Mobile Interactions
 * Ralph-3 Mobile UI JavaScript
 * Handles hamburger menu, bottom sheet, swipe gestures, pull-to-refresh
 */

(function() {
  'use strict';

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const state = {
    isBottomSheetOpen: false,
    isHeaderCompact: false,
    touchStartY: 0,
    touchStartX: 0,
    lastScrollY: 0,
    isPulling: false,
    pullThreshold: 80
  };

  // ============================================
  // DOM ELEMENTS
  // ============================================
  const elements = {
    header: null,
    hamburgerBtn: null,
    bottomSheet: null,
    bottomSheetOverlay: null,
    scrollContainer: null,
    pullToRefresh: null,
    bottomNav: null
  };

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }
  }

  function setup() {
    cacheElements();
    createMobileUI();
    bindEvents();
    setupSwipeGestures();
    setupPullToRefresh();
    setupScrollBehavior();
  }

  function cacheElements() {
    elements.header = document.querySelector('.header');
    elements.scrollContainer = document.getElementById('scroll-container');
  }

  // ============================================
  // CREATE MOBILE UI ELEMENTS
  // ============================================
  function createMobileUI() {
    // Only create mobile UI if screen is mobile-sized
    if (window.innerWidth >= 768) return;

    createHamburgerButton();
    createBottomSheet();
    createBottomNav();
    createPullToRefresh();
    modifyHeaderForMobile();
  }

  function createHamburgerButton() {
    // Check if already exists
    if (document.querySelector('.hamburger-btn')) return;

    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'hamburger-btn';
    hamburgerBtn.setAttribute('aria-label', 'Open menu');
    hamburgerBtn.innerHTML = `
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    `;

    elements.header.appendChild(hamburgerBtn);
    elements.hamburgerBtn = hamburgerBtn;
  }

  function createBottomSheet() {
    // Check if already exists
    if (document.querySelector('.bottom-sheet')) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'bottom-sheet-overlay';
    overlay.addEventListener('click', closeBottomSheet);

    // Create bottom sheet
    const bottomSheet = document.createElement('div');
    bottomSheet.className = 'bottom-sheet';
    bottomSheet.innerHTML = `
      <div class="bottom-sheet-handle"></div>
      <div class="bottom-sheet-title">⚙️ Controls</div>
      <div class="controls-grid">
        <div class="control-group">
          <label class="control-label">Search</label>
          <input type="text" class="control-input" id="mobile-search" placeholder="Search coin...">
        </div>
        
        <div class="control-group">
          <label class="control-label">Filter</label>
          <select class="control-select" id="mobile-filter">
            <option value="all">All Coins</option>
            <option value="major">Major (BTC, ETH)</option>
            <option value="gainers">Gainers >5%</option>
            <option value="losers">Losers <-5%</option>
            <option value="volume">High Volume</option>
          </select>
        </div>
        
        <div class="control-group">
          <label class="control-label">Sort By</label>
          <select class="control-select" id="mobile-sort">
            <option value="volume">Volume</option>
            <option value="change">Change %</option>
            <option value="gainers">Gainers</option>
            <option value="losers">Losers</option>
          </select>
        </div>
        
        <div class="control-group">
          <label class="control-label">Volume Alert Threshold</label>
          <input type="number" class="control-input" id="mobile-threshold" value="3" min="1.5" max="10" step="0.5">
        </div>
        
        <button class="control-btn primary" id="mobile-export">
          📥 Export CSV
        </button>
        
        <div class="control-stats">
          <div class="stat-card">
            <div class="stat-card-label">Bullish</div>
            <div class="stat-card-value positive" id="mobile-bullish">-</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-label">Bearish</div>
            <div class="stat-card-value negative" id="mobile-bearish">-</div>
          </div>
        </div>
      </div>
    `;

    // Add touch swipe to close
    let touchStartY = 0;
    bottomSheet.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    bottomSheet.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const diff = touchY - touchStartY;
      if (diff > 0) {
        bottomSheet.style.transform = `translateY(${diff}px)`;
      }
    }, { passive: true });

    bottomSheet.addEventListener('touchend', (e) => {
      const touchY = e.changedTouches[0].clientY;
      const diff = touchY - touchStartY;
      if (diff > 100) {
        closeBottomSheet();
      } else {
        bottomSheet.style.transform = '';
      }
    }, { passive: true });

    document.body.appendChild(overlay);
    document.body.appendChild(bottomSheet);

    elements.bottomSheet = bottomSheet;
    elements.bottomSheetOverlay = overlay;

    // Bind control events
    bindBottomSheetControls();
  }

  function bindBottomSheetControls() {
    // Sync with existing controls
    const mobileSearch = document.getElementById('mobile-search');
    const mobileFilter = document.getElementById('mobile-filter');
    const mobileSort = document.getElementById('mobile-sort');
    const mobileThreshold = document.getElementById('mobile-threshold');
    const mobileExport = document.getElementById('mobile-export');

    if (mobileSearch) {
      mobileSearch.addEventListener('input', (e) => {
        const desktopSearch = document.getElementById('search-input');
        if (desktopSearch) {
          desktopSearch.value = e.target.value;
          desktopSearch.dispatchEvent(new Event('keyup'));
        }
      });
    }

    if (mobileFilter) {
      mobileFilter.addEventListener('change', (e) => {
        const desktopFilter = document.getElementById('filter-select');
        if (desktopFilter) {
          desktopFilter.value = e.target.value;
          desktopFilter.dispatchEvent(new Event('change'));
        }
      });
    }

    if (mobileSort) {
      mobileSort.addEventListener('change', (e) => {
        const desktopSort = document.getElementById('sort-select');
        if (desktopSort) {
          desktopSort.value = e.target.value;
          desktopSort.dispatchEvent(new Event('change'));
        }
      });
    }

    if (mobileThreshold) {
      mobileThreshold.addEventListener('change', (e) => {
        const desktopThreshold = document.getElementById('threshold-input');
        if (desktopThreshold) {
          desktopThreshold.value = e.target.value;
          desktopThreshold.dispatchEvent(new Event('change'));
        }
      });
    }

    if (mobileExport) {
      mobileExport.addEventListener('click', () => {
        const desktopExport = document.querySelector('.export-btn');
        if (desktopExport) {
          desktopExport.click();
        }
        closeBottomSheet();
      });
    }

    // Sync stats updates
    window.updateMobileStats = function(bullish, bearish) {
      const mobileBullish = document.getElementById('mobile-bullish');
      const mobileBearish = document.getElementById('mobile-bearish');
      if (mobileBullish) mobileBullish.textContent = bullish;
      if (mobileBearish) mobileBearish.textContent = bearish;
    };
  }

  function createBottomNav() {
    // Check if already exists
    if (document.querySelector('.bottom-nav')) return;

    const bottomNav = document.createElement('nav');
    bottomNav.className = 'bottom-nav';
    bottomNav.innerHTML = `
      <button class="bottom-nav-item active" data-view="heatmap" aria-label="Heatmap view">
        <span class="bottom-nav-icon">🌡️</span>
        <span>Heatmap</span>
      </button>
      <button class="bottom-nav-item" data-view="gainers" aria-label="Top gainers">
        <span class="bottom-nav-icon">📈</span>
        <span>Gainers</span>
      </button>
      <button class="bottom-nav-item" data-view="losers" aria-label="Top losers">
        <span class="bottom-nav-icon">📉</span>
        <span>Losers</span>
      </button>
      <button class="bottom-nav-item" data-view="filters" aria-label="Filters" id="bottom-nav-filters">
        <span class="bottom-nav-icon">⚙️</span>
        <span>Filters</span>
      </button>
    `;

    document.body.appendChild(bottomNav);
    elements.bottomNav = bottomNav;

    // Bind navigation events
    bottomNav.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.addEventListener('click', handleBottomNavClick);
    });
  }

  function createPullToRefresh() {
    // Check if already exists
    if (document.querySelector('.pull-to-refresh')) return;

    const ptr = document.createElement('div');
    ptr.className = 'pull-to-refresh';
    ptr.innerHTML = `
      <div class="pull-to-refresh-spinner"></div>
      <span>Refreshing...</span>
    `;

    document.body.appendChild(ptr);
    elements.pullToRefresh = ptr;
  }

  function modifyHeaderForMobile() {
    // Hide original header-center and header-right on mobile
    const headerCenter = document.querySelector('.header-center');
    const headerRight = document.querySelector('.header-right');

    if (headerCenter) {
      headerCenter.style.display = 'none';
    }
    if (headerRight) {
      headerRight.style.display = 'none';
    }
  }

  // ============================================
  // EVENT BINDINGS
  // ============================================
  function bindEvents() {
    // Hamburger menu
    if (elements.hamburgerBtn) {
      elements.hamburgerBtn.addEventListener('click', toggleBottomSheet);
    }

    // Window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 250);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeydown);
  }

  function handleKeydown(e) {
    // ESC to close bottom sheet
    if (e.key === 'Escape' && state.isBottomSheetOpen) {
      closeBottomSheet();
    }
  }

  function handleResize() {
    const isMobile = window.innerWidth < 768;

    if (!isMobile) {
      // Restore desktop layout
      closeBottomSheet();
      const headerCenter = document.querySelector('.header-center');
      const headerRight = document.querySelector('.header-right');
      if (headerCenter) headerCenter.style.display = '';
      if (headerRight) headerRight.style.display = '';
    } else {
      // Ensure mobile UI exists
      createMobileUI();
      const headerCenter = document.querySelector('.header-center');
      const headerRight = document.querySelector('.header-right');
      if (headerCenter) headerCenter.style.display = 'none';
      if (headerRight) headerRight.style.display = 'none';
    }
  }

  // ============================================
  // BOTTOM SHEET CONTROLS
  // ============================================
  function toggleBottomSheet() {
    if (state.isBottomSheetOpen) {
      closeBottomSheet();
    } else {
      openBottomSheet();
    }
  }

  function openBottomSheet() {
    if (!elements.bottomSheet || !elements.bottomSheetOverlay) return;

    elements.bottomSheet.classList.add('active');
    elements.bottomSheetOverlay.classList.add('active');
    elements.hamburgerBtn?.classList.add('active');
    state.isBottomSheetOpen = true;

    // Update hamburger ARIA
    elements.hamburgerBtn?.setAttribute('aria-label', 'Close menu');

    // Sync values with desktop controls
    syncBottomSheetValues();
  }

  function closeBottomSheet() {
    if (!elements.bottomSheet || !elements.bottomSheetOverlay) return;

    elements.bottomSheet.classList.remove('active');
    elements.bottomSheetOverlay.classList.remove('active');
    elements.hamburgerBtn?.classList.remove('active');
    state.isBottomSheetOpen = false;

    // Update hamburger ARIA
    elements.hamburgerBtn?.setAttribute('aria-label', 'Open menu');

    // Reset transform
    elements.bottomSheet.style.transform = '';
  }

  function syncBottomSheetValues() {
    // Sync from desktop to mobile
    const desktopSearch = document.getElementById('search-input');
    const desktopFilter = document.getElementById('filter-select');
    const desktopSort = document.getElementById('sort-select');
    const desktopThreshold = document.getElementById('threshold-input');

    const mobileSearch = document.getElementById('mobile-search');
    const mobileFilter = document.getElementById('mobile-filter');
    const mobileSort = document.getElementById('mobile-sort');
    const mobileThreshold = document.getElementById('mobile-threshold');

    if (desktopSearch && mobileSearch) mobileSearch.value = desktopSearch.value;
    if (desktopFilter && mobileFilter) mobileFilter.value = desktopFilter.value;
    if (desktopSort && mobileSort) mobileSort.value = desktopSort.value;
    if (desktopThreshold && mobileThreshold) mobileThreshold.value = desktopThreshold.value;
  }

  // ============================================
  // BOTTOM NAVIGATION
  // ============================================
  function handleBottomNavClick(e) {
    const item = e.currentTarget;
    const view = item.dataset.view;

    // Update active state
    elements.bottomNav.querySelectorAll('.bottom-nav-item').forEach(nav => {
      nav.classList.remove('active');
    });
    item.classList.add('active');

    // Handle view change
    switch (view) {
      case 'heatmap':
        // Reset filters
        const filterSelect = document.getElementById('filter-select');
        if (filterSelect) {
          filterSelect.value = 'all';
          filterSelect.dispatchEvent(new Event('change'));
        }
        break;

      case 'gainers':
        const gainersFilter = document.getElementById('filter-select');
        if (gainersFilter) {
          gainersFilter.value = 'gainers';
          gainersFilter.dispatchEvent(new Event('change'));
        }
        break;

      case 'losers':
        const losersFilter = document.getElementById('filter-select');
        if (losersFilter) {
          losersFilter.value = 'losers';
          losersFilter.dispatchEvent(new Event('change'));
        }
        break;

      case 'filters':
        toggleBottomSheet();
        // Don't keep filters active
        setTimeout(() => item.classList.remove('active'), 300);
        break;
    }
  }

  // ============================================
  // SWIPE GESTURES
  // ============================================
  function setupSwipeGestures() {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isSwiping = false;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwiping = true;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      currentX = e.touches[0].clientX;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      isSwiping = false;

      const diffX = currentX - startX;
      const diffY = e.changedTouches[0].clientY - startY;

      // Minimum swipe distance
      const minSwipe = 80;

      // Only handle horizontal swipes if not scrolling vertically
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipe) {
        if (diffX > 0) {
          // Swipe right - go to previous filter
          handleSwipeRight();
        } else {
          // Swipe left - go to next filter
          handleSwipeLeft();
        }
      }
    }, { passive: true });
  }

  function handleSwipeRight() {
    const filterSelect = document.getElementById('filter-select');
    if (!filterSelect) return;

    const options = Array.from(filterSelect.options);
    const currentIndex = filterSelect.selectedIndex;
    const newIndex = Math.max(0, currentIndex - 1);

    if (newIndex !== currentIndex) {
      filterSelect.selectedIndex = newIndex;
      filterSelect.dispatchEvent(new Event('change'));
      showSwipeHint('← ' + options[newIndex].text);
    }
  }

  function handleSwipeLeft() {
    const filterSelect = document.getElementById('filter-select');
    if (!filterSelect) return;

    const options = Array.from(filterSelect.options);
    const currentIndex = filterSelect.selectedIndex;
    const newIndex = Math.min(options.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      filterSelect.selectedIndex = newIndex;
      filterSelect.dispatchEvent(new Event('change'));
      showSwipeHint(options[newIndex].text + ' →');
    }
  }

  function showSwipeHint(text) {
    // Remove existing hint
    const existingHint = document.querySelector('.swipe-hint');
    if (existingHint) existingHint.remove();

    // Create new hint
    const hint = document.createElement('div');
    hint.className = 'swipe-hint top visible';
    hint.textContent = text;
    document.body.appendChild(hint);

    // Remove after delay
    setTimeout(() => {
      hint.classList.remove('visible');
      setTimeout(() => hint.remove(), 300);
    }, 1500);
  }

  // ============================================
  // PULL TO REFRESH
  // ============================================
  function setupPullToRefresh() {
    if (!elements.scrollContainer || !elements.pullToRefresh) return;

    let startY = 0;
    let pullDistance = 0;
    let isPulling = false;
    let isRefreshing = false;

    elements.scrollContainer.addEventListener('touchstart', (e) => {
      if (elements.scrollContainer.scrollTop === 0 && !isRefreshing) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });

    elements.scrollContainer.addEventListener('touchmove', (e) => {
      if (!isPulling || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      pullDistance = currentY - startY;

      if (pullDistance > 0) {
        // Prevent default only if we're pulling down
        if (pullDistance < state.pullThreshold) {
          elements.pullToRefresh.style.transform = `translateX(-50%) translateY(${Math.min(pullDistance * 0.5, 50)}px)`;
        }
      }
    }, { passive: true });

    elements.scrollContainer.addEventListener('touchend', () => {
      if (!isPulling || isRefreshing) return;
      isPulling = false;

      if (pullDistance > state.pullThreshold) {
        triggerRefresh();
      } else {
        // Reset position
        elements.pullToRefresh.style.transform = '';
      }

      pullDistance = 0;
    }, { passive: true });
  }

  function triggerRefresh() {
    if (!elements.pullToRefresh) return;

    elements.pullToRefresh.classList.add('visible');

    // Trigger data reload
    if (typeof loadData === 'function') {
      loadData().then(() => {
        // Hide after refresh
        setTimeout(() => {
          elements.pullToRefresh.classList.remove('visible');
          elements.pullToRefresh.style.transform = '';
        }, 500);
      });
    }
  }

  // ============================================
  // SCROLL BEHAVIOR (Compact Header)
  // ============================================
  function setupScrollBehavior() {
    if (!elements.scrollContainer || !elements.header) return;

    let ticking = false;

    elements.scrollContainer.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateHeaderState();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  function updateHeaderState() {
    const scrollY = elements.scrollContainer.scrollTop;
    const threshold = 100;

    if (scrollY > threshold && !state.isHeaderCompact) {
      elements.header.classList.add('compact');
      state.isHeaderCompact = true;
    } else if (scrollY <= threshold && state.isHeaderCompact) {
      elements.header.classList.remove('compact');
      state.isHeaderCompact = false;
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================
  window.MobileUI = {
    openBottomSheet,
    closeBottomSheet,
    updateStats: (bullish, bearish) => {
      if (window.updateMobileStats) {
        window.updateMobileStats(bullish, bearish);
      }
    },
    isMobile: () => window.innerWidth < 768
  };

  // Initialize
  init();
})();
