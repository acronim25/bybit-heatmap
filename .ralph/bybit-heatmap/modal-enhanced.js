/**
 * Enhanced Modal Functionality for Bybit Heatmap
 * Premium UX with animations, gestures, and interactions
 * Ralph-4: Modal Enhancement
 */

class EnhancedCoinModal {
    constructor() {
        this.currentData = null;
        this.allCoins = [];
        this.currentIndex = -1;
        this.isOpen = false;
        this.touchStartY = 0;
        this.touchCurrentY = 0;
        this.swipeThreshold = 100;
        this.priceHistory = {}; // Cache for sparkline data
        
        this.init();
    }

    init() {
        this.createModalDOM();
        this.attachEventListeners();
    }

    /**
     * Create the modal DOM structure
     */
    createModalDOM() {
        // Remove existing enhanced modal if present
        const existing = document.getElementById('enhanced-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'enhanced-modal';
        modal.className = 'enhanced-modal';
        modal.innerHTML = `
            <div class="enhanced-modal-content">
                <div class="modal-swipe-handle"></div>
                <div class="modal-scrollable">
                    <div class="modal-header">
                        <button class="modal-nav prev" title="Previous coin (←)">‹</button>
                        <button class="modal-nav next" title="Next coin (→)">›</button>
                        <button class="modal-close-btn" title="Close (Esc)">×</button>
                        <div class="coin-symbol-large" id="modal-coin-symbol">BTC</div>
                        <div class="coin-full-name" id="modal-coin-name">Bitcoin</div>
                    </div>
                    
                    <div class="price-section">
                        <div class="price-display" id="modal-coin-price">$0.00</div>
                        <div class="price-change-pill" id="modal-coin-change">+0.00%</div>
                    </div>
                    
                    <div class="sparkline-container">
                        <div class="sparkline-wrapper">
                            <svg class="sparkline-svg" id="modal-sparkline" viewBox="0 0 300 60" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" style="stop-color:currentColor;stop-opacity:0.3" />
                                        <stop offset="100%" style="stop-color:currentColor;stop-opacity:0" />
                                    </linearGradient>
                                </defs>
                                <path class="sparkline-area" id="sparkline-area" d=""></path>
                                <path class="sparkline-path" id="sparkline-path" d=""></path>
                                <circle class="sparkline-dot" id="sparkline-dot" cx="0" cy="0" r="0"></circle>
                            </svg>
                        </div>
                    </div>
                    
                    <div class="modal-stats-grid">
                        <div class="stat-card volume">
                            <div class="stat-card-label">📊 Volume 24h</div>
                            <div class="stat-card-value highlight" id="modal-stat-volume">-</div>
                            <div class="volume-bars" id="modal-volume-bars"></div>
                        </div>
                        
                        <div class="stat-card oi">
                            <div class="stat-card-label">📈 Open Interest</div>
                            <div class="stat-card-value highlight" id="modal-stat-oi">-</div>
                        </div>
                        
                        <div class="stat-card high">
                            <div class="stat-card-label">⬆️ High 24h</div>
                            <div class="stat-card-value" id="modal-stat-high">-</div>
                        </div>
                        
                        <div class="stat-card low">
                            <div class="stat-card-label">⬇️ Low 24h</div>
                            <div class="stat-card-value" id="modal-stat-low">-</div>
                        </div>
                        
                        <div class="stat-card" style="grid-column: span 2;">
                            <div class="stat-card-label">📍 Price Range</div>
                            <div class="hl-progress">
                                <div class="hl-progress-bar" id="modal-hl-progress" style="width: 50%"></div>
                            </div>
                            <div class="hl-labels">
                                <span id="modal-hl-low-label">Low</span>
                                <span id="modal-hl-current">Current</span>
                                <span id="modal-hl-high-label">High</span>
                            </div>
                        </div>
                        
                        <div class="stat-card funding">
                            <div class="stat-card-label">💰 Funding Rate</div>
                            <div class="stat-card-value" id="modal-stat-funding">-</div>
                        </div>
                        
                        <div class="stat-card marketcap">
                            <div class="stat-card-label">🎯 Turnover</div>
                            <div class="stat-card-value" id="modal-stat-turnover">-</div>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="action-btn primary" id="btn-trade" title="Open on Bybit">
                            <span class="action-icon">🚀</span>
                            <span class="action-label">Trade</span>
                        </button>
                        <button class="action-btn" id="btn-copy" title="Copy price">
                            <span class="action-icon">📋</span>
                            <span class="action-label">Copy</span>
                        </button>
                        <button class="action-btn" id="btn-share" title="Share coin">
                            <span class="action-icon">🔗</span>
                            <span class="action-label">Share</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-toast" id="modal-toast">
                <span id="modal-toast-icon">✓</span>
                <span id="modal-toast-message">Copied!</span>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Cache DOM elements
        this.elements = {
            modal: modal,
            content: modal.querySelector('.enhanced-modal-content'),
            scrollable: modal.querySelector('.modal-scrollable'),
            symbol: modal.querySelector('#modal-coin-symbol'),
            name: modal.querySelector('#modal-coin-name'),
            price: modal.querySelector('#modal-coin-price'),
            change: modal.querySelector('#modal-coin-change'),
            sparklinePath: modal.querySelector('#sparkline-path'),
            sparklineArea: modal.querySelector('#sparkline-area'),
            sparklineDot: modal.querySelector('#sparkline-dot'),
            volume: modal.querySelector('#modal-stat-volume'),
            volumeBars: modal.querySelector('#modal-volume-bars'),
            high: modal.querySelector('#modal-stat-high'),
            low: modal.querySelector('#modal-stat-low'),
            oi: modal.querySelector('#modal-stat-oi'),
            funding: modal.querySelector('#modal-stat-funding'),
            turnover: modal.querySelector('#modal-stat-turnover'),
            hlProgress: modal.querySelector('#modal-hl-progress'),
            hlCurrent: modal.querySelector('#modal-hl-current'),
            hlLowLabel: modal.querySelector('#modal-hl-low-label'),
            hlHighLabel: modal.querySelector('#modal-hl-high-label'),
            toast: modal.querySelector('#modal-toast'),
            toastIcon: modal.querySelector('#modal-toast-icon'),
            toastMessage: modal.querySelector('#modal-toast-message'),
            prevBtn: modal.querySelector('.modal-nav.prev'),
            nextBtn: modal.querySelector('.modal-nav.next'),
            closeBtn: modal.querySelector('.modal-close-btn'),
            tradeBtn: modal.querySelector('#btn-trade'),
            copyBtn: modal.querySelector('#btn-copy'),
            shareBtn: modal.querySelector('#btn-share'),
            swipeHandle: modal.querySelector('.modal-swipe-handle')
        };
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        const { modal, content, prevBtn, nextBtn, closeBtn, tradeBtn, copyBtn, shareBtn, swipeHandle } = this.elements;

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });

        // Close button
        closeBtn.addEventListener('click', () => this.close());

        // Navigation
        prevBtn.addEventListener('click', () => this.navigate(-1));
        nextBtn.addEventListener('click', () => this.navigate(1));

        // Action buttons
        tradeBtn.addEventListener('click', () => this.openBybit());
        copyBtn.addEventListener('click', () => this.copyToClipboard());
        shareBtn.addEventListener('click', () => this.shareCoin());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Touch/swipe handling for mobile
        this.attachSwipeHandlers(swipeHandle, content);

        // Prevent body scroll when modal is open
        content.addEventListener('wheel', (e) => {
            const isScrollingUp = e.deltaY < 0;
            const isScrollingDown = e.deltaY > 0;
            const isAtTop = content.scrollTop === 0;
            const isAtBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 1;

            if ((isScrollingUp && isAtTop) || (isScrollingDown && isAtBottom)) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Attach swipe handlers for mobile
     */
    attachSwipeHandlers(handle, content) {
        // Swipe handle (top of modal)
        handle.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
            content.classList.add('swiping');
        }, { passive: true });

        handle.addEventListener('touchmove', (e) => {
            this.touchCurrentY = e.touches[0].clientY;
            const deltaY = this.touchCurrentY - this.touchStartY;
            
            if (deltaY > 0) {
                content.style.transform = `translateY(${deltaY * 0.5}px)`;
            }
        }, { passive: true });

        handle.addEventListener('touchend', () => {
            content.classList.remove('swiping');
            const deltaY = this.touchCurrentY - this.touchStartY;
            
            if (deltaY > this.swipeThreshold) {
                this.close();
            } else {
                content.style.transform = '';
            }
            
            this.touchStartY = 0;
            this.touchCurrentY = 0;
        });

        // Also allow swipe on the whole content area when at top
        content.addEventListener('touchstart', (e) => {
            if (content.scrollTop === 0) {
                this.touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        content.addEventListener('touchmove', (e) => {
            if (content.scrollTop === 0 && this.touchStartY > 0) {
                this.touchCurrentY = e.touches[0].clientY;
                const deltaY = this.touchCurrentY - this.touchStartY;
                
                if (deltaY > 0) {
                    content.style.transform = `translateY(${deltaY * 0.3}px)`;
                    e.preventDefault();
                }
            }
        }, { passive: false });

        content.addEventListener('touchend', () => {
            if (this.touchStartY > 0) {
                const deltaY = this.touchCurrentY - this.touchStartY;
                
                if (deltaY > this.swipeThreshold) {
                    this.close();
                } else {
                    content.style.transform = '';
                }
                
                this.touchStartY = 0;
                this.touchCurrentY = 0;
            }
        });
    }

    /**
     * Handle keyboard events
     */
    handleKeydown(e) {
        if (!this.isOpen) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.navigate(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.navigate(1);
                break;
        }
    }

    /**
     * Show modal with coin data
     */
    show(data, allCoins = []) {
        this.currentData = data;
        this.allCoins = allCoins.length > 0 ? allCoins : [data];
        this.currentIndex = this.allCoins.findIndex(c => c.symbol === data.symbol);
        this.isOpen = true;

        // Update modal colors based on change
        const isPositive = data.change24h >= 0;
        const color = isPositive ? 'var(--neon-green)' : 'var(--neon-red)';
        
        this.elements.modal.style.setProperty('--modal-glow-color', 
            isPositive ? 'rgba(0, 255, 65, 0.15)' : 'rgba(255, 0, 64, 0.15)');
        this.elements.modal.style.setProperty('--modal-shadow-color', 
            isPositive ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 0, 64, 0.1)');
        this.elements.modal.style.setProperty('--modal-border-start', color);
        this.elements.modal.style.setProperty('--modal-border-end', 
            isPositive ? 'var(--accent-blue)' : 'var(--neon-red-bright)');

        // Update content
        this.updateContent(data);

        // Generate sparkline
        this.generateSparkline(data);

        // Update navigation buttons
        this.updateNavButtons();

        // Show modal
        this.elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Fetch additional data if needed
        this.fetchAdditionalData(data.symbol);
    }

    /**
     * Update modal content
     */
    updateContent(data) {
        const isPositive = data.change24h >= 0;
        const changeSymbol = isPositive ? '+' : '';

        this.elements.symbol.textContent = data.symbol;
        this.elements.name.textContent = data.fullSymbol || data.symbol;
        this.elements.price.textContent = '$' + this.formatPrice(data.price);
        
        this.elements.change.textContent = `${changeSymbol}${data.change24h.toFixed(2)}%`;
        this.elements.change.className = 'price-change-pill ' + (isPositive ? 'positive' : 'negative');

        this.elements.volume.textContent = '$' + this.formatNumber(data.volume24h);
        this.elements.high.textContent = '$' + this.formatPrice(data.high24h);
        this.elements.low.textContent = '$' + this.formatPrice(data.low24h);
        this.elements.oi.textContent = data.openInterest > 0 
            ? '$' + this.formatNumber(data.openInterest) 
            : 'N/A';
        this.elements.funding.textContent = data.fundingRate !== 0 
            ? (data.fundingRate > 0 ? '+' : '') + data.fundingRate.toFixed(4) + '%'
            : 'N/A';
        this.elements.turnover.textContent = data.turnover24h > 0 
            ? '$' + this.formatNumber(data.turnover24h)
            : 'N/A';

        // Update high/low progress bar
        if (data.high24h > data.low24h) {
            const range = data.high24h - data.low24h;
            const position = ((data.price - data.low24h) / range) * 100;
            this.elements.hlProgress.style.width = Math.max(5, Math.min(95, position)) + '%';
            this.elements.hlLowLabel.textContent = '$' + this.formatCompact(data.low24h);
            this.elements.hlHighLabel.textContent = '$' + this.formatCompact(data.high24h);
            this.elements.hlCurrent.textContent = this.formatCompact(data.price);
        }

        // Generate volume bars
        this.generateVolumeBars(data);

        // Update sparkline color
        this.elements.sparklinePath.style.color = color;
        this.elements.sparklineArea.style.color = color;
        this.elements.sparklineDot.setAttribute('fill', color);
    }

    /**
     * Generate sparkline chart
     */
    generateSparkline(data) {
        // Use cached data or generate synthetic data based on 24h change
        let prices = this.priceHistory[data.symbol];
        
        if (!prices || prices.length < 10) {
            // Generate synthetic 24h price data based on current price and change
            prices = this.generateSyntheticPrices(data);
            this.priceHistory[data.symbol] = prices;
        }

        const svg = this.elements.sparklinePath.parentElement;
        const width = 300;
        const height = 60;
        const padding = 5;

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice || 1;

        // Generate points
        const points = prices.map((price, i) => {
            const x = (i / (prices.length - 1)) * width;
            const y = height - padding - ((price - minPrice) / priceRange) * (height - 2 * padding);
            return [x, y];
        });

        // Create path
        const pathD = points.map((p, i) => 
            (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]
        ).join(' ');

        // Create area path
        const areaD = pathD + ` L${width},${height} L0,${height} Z`;

        this.elements.sparklinePath.setAttribute('d', pathD);
        this.elements.sparklineArea.setAttribute('d', areaD);

        // Set stroke color and animation
        const isPositive = data.change24h >= 0;
        const color = isPositive ? '#00ff41' : '#ff0040';
        this.elements.sparklinePath.setAttribute('stroke', color);
        this.elements.sparklineArea.setAttribute('fill', `url(#sparklineGradient)`);
        this.elements.sparklinePath.parentElement.querySelector('linearGradient stop').style.stopColor = color;

        // Set dasharray for animation
        const pathLength = this.elements.sparklinePath.getTotalLength?.() || 1000;
        this.elements.sparklinePath.style.strokeDasharray = pathLength;
        this.elements.sparklinePath.style.strokeDashoffset = pathLength;

        // Position dot at end
        const lastPoint = points[points.length - 1];
        this.elements.sparklineDot.setAttribute('cx', lastPoint[0]);
        this.elements.sparklineDot.setAttribute('cy', lastPoint[1]);
        this.elements.sparklineDot.setAttribute('r', 3);

        // Trigger animation
        requestAnimationFrame(() => {
            this.elements.sparklinePath.style.animation = 'none';
            this.elements.sparklinePath.offsetHeight; // Force reflow
            this.elements.sparklinePath.style.animation = 'drawLine 1s ease-out forwards';
        });
    }

    /**
     * Generate synthetic price history for sparkline
     */
    generateSyntheticPrices(data) {
        const points = 48; // One point per 30 minutes
        const prices = [];
        const change = data.change24h / 100;
        const volatility = 0.02; // 2% volatility

        // Work backwards from current price
        let currentPrice = data.price;
        prices.unshift(currentPrice);

        for (let i = 1; i < points; i++) {
            const randomMove = (Math.random() - 0.5) * volatility;
            const trend = -change / points; // Trend toward start price
            currentPrice = currentPrice * (1 + randomMove + trend);
            prices.unshift(currentPrice);
        }

        return prices;
    }

    /**
     * Generate mini volume bars
     */
    generateVolumeBars(data) {
        const container = this.elements.volumeBars;
        container.innerHTML = '';

        // Generate synthetic volume pattern (higher in recent hours)
        const bars = 12;
        const baseVolume = data.volume24h / bars;

        for (let i = 0; i < bars; i++) {
            const bar = document.createElement('div');
            bar.className = 'volume-bar-mini';
            
            // Create a pattern - more recent = generally higher volume
            const recencyFactor = 0.5 + (i / bars) * 1.5;
            const randomFactor = 0.7 + Math.random() * 0.6;
            const height = Math.min(100, recencyFactor * randomFactor * 50);
            
            bar.style.height = height + '%';
            bar.style.opacity = 0.4 + (i / bars) * 0.6;
            
            container.appendChild(bar);
        }
    }

    /**
     * Fetch additional data for the coin
     */
    async fetchAdditionalData(symbol) {
        // This can be extended to fetch real historical data
        // For now, we use the synthetic data
        try {
            // Simulated API call placeholder
            // const response = await fetch(`/api/coins/${symbol}/history`);
            // const data = await response.json();
            // this.priceHistory[symbol] = data.prices;
        } catch (err) {
            console.warn('Could not fetch additional data:', err);
        }
    }

    /**
     * Navigate to previous/next coin
     */
    navigate(direction) {
        const newIndex = this.currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.allCoins.length) {
            // Add slide animation
            const content = this.elements.content;
            content.style.transform = `translateX(${-direction * 30}px)`;
            content.style.opacity = '0.7';

            setTimeout(() => {
                this.currentIndex = newIndex;
                this.currentData = this.allCoins[newIndex];
                this.updateContent(this.currentData);
                this.generateSparkline(this.currentData);
                this.updateNavButtons();

                content.style.transform = `translateX(${direction * 30}px)`;
                
                requestAnimationFrame(() => {
                    content.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                    content.style.transform = 'translateX(0)';
                    content.style.opacity = '1';
                    
                    setTimeout(() => {
                        content.style.transition = '';
                    }, 300);
                });
            }, 150);
        }
    }

    /**
     * Update navigation button states
     */
    updateNavButtons() {
        this.elements.prevBtn.disabled = this.currentIndex <= 0;
        this.elements.nextBtn.disabled = this.currentIndex >= this.allCoins.length - 1;
    }

    /**
     * Close modal
     */
    close() {
        this.isOpen = false;
        this.elements.modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset transform
        this.elements.content.style.transform = '';
        
        // Clear current data after animation
        setTimeout(() => {
            if (!this.isOpen) {
                this.currentData = null;
            }
        }, 400);
    }

    /**
     * Open Bybit trading page
     */
    openBybit() {
        if (!this.currentData) return;
        
        const symbol = this.currentData.symbol.replace('USDT', '');
        const url = `https://www.bybit.com/trade/usdt/${symbol}USDT`;
        window.open(url, '_blank');
        
        this.showToast('Opening Bybit...', 'success');
    }

    /**
     * Copy price to clipboard
     */
    async copyToClipboard() {
        if (!this.currentData) return;

        const text = `${this.currentData.symbol}: $${this.formatPrice(this.currentData.price)} (${this.currentData.change24h >= 0 ? '+' : ''}${this.currentData.change24h.toFixed(2)}%)`;

        try {
            await navigator.clipboard.writeText(text);
            this.elements.copyBtn.classList.add('copied');
            this.showToast('Price copied!', 'success');
            
            setTimeout(() => {
                this.elements.copyBtn.classList.remove('copied');
            }, 500);
        } catch (err) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showToast('Price copied!', 'success');
        }
    }

    /**
     * Share coin using Web Share API
     */
    async shareCoin() {
        if (!this.currentData) return;

        const shareData = {
            title: `${this.currentData.symbol} on Bybit Heatmap`,
            text: `${this.currentData.symbol}: $${this.formatPrice(this.currentData.price)} (${this.currentData.change24h >= 0 ? '+' : ''}${this.currentData.change24h.toFixed(2)}%)`,
            url: `https://www.bybit.com/trade/usdt/${this.currentData.symbol}`
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                this.showToast('Shared!', 'success');
            } else {
                // Fallback to copy
                await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
                this.showToast('Link copied to clipboard!', 'success');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                this.showToast('Could not share', 'error');
            }
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const { toast, toastIcon, toastMessage } = this.elements;
        
        toastMessage.textContent = message;
        toastIcon.textContent = type === 'success' ? '✓' : '✕';
        toast.className = 'modal-toast show ' + type;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    /**
     * Utility: Format price
     */
    formatPrice(price) {
        if (price >= 1000) {
            return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (price >= 1) {
            return price.toFixed(4);
        } else if (price >= 0.01) {
            return price.toFixed(6);
        } else {
            return price.toFixed(8);
        }
    }

    /**
     * Utility: Format number (K, M, B)
     */
    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
        return num.toFixed(2);
    }

    /**
     * Utility: Format compact number
     */
    formatCompact(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toFixed(num < 1 ? 4 : 2);
    }
}

// Initialize modal
coinModal = new EnhancedCoinModal();

// Export for use in main script
window.EnhancedCoinModal = EnhancedCoinModal;
