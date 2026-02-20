/**
 * Layout Engine for Bybit Heatmap
 * Optimized bubble layout with esthetic spacing and mobile responsiveness
 * 
 * Features:
 * - Artistic bubble packing (close but not overlapping)
 * - Grid-based initial positioning with organic clustering
 * - Mobile-responsive with touch/pinch support
 * - Performance-tuned force simulation
 */

(function(global) {
    'use strict';

    const LayoutEngine = {
        // Configuration
        config: {
            // Base settings
            baseRadius: { min: 20, max: 60 },
            padding: { desktop: 8, mobile: 12 },
            hitAreaMin: 44, // Minimum touch target size (WCAG 2.1)
            
            // Force simulation tuning
            forces: {
                collide: { strength: 0.85, paddingRatio: 0.2 },
                charge: { strength: -15, distanceMax: 200 },
                center: { strength: 0.03 },
                x: { strengthBase: 0.12, strengthDecay: 0.05 },
                y: { strengthBase: 0.12, strengthDecay: 0.05 }
            },
            
            // Performance
            alpha: { start: 0.8, decay: 0.025, min: 0.001 },
            velocity: { decay: 0.3 },
            
            // Animation
            transitionDuration: 400,
            staggerDelay: 80,
            
            // Grid layout
            grid: {
                rows: 4,
                rowHeight: 300,
                jitter: 0.35 // Random offset within grid cell (0-1)
            }
        },

        // State
        state: {
            isMobile: false,
            isTouch: false,
            viewport: { width: 0, height: 0 },
            container: null,
            svg: null,
            simulation: null,
            zoom: null,
            bubbles: [],
            bubbleMap: new Map(),
            resizeTimer: null,
            isAnimating: false,
            touchStart: null,
            lastPinchDist: 0,
            zoomScale: 1
        },

        /**
         * Initialize the layout engine
         * @param {string|Element} container - Container element or selector
         * @param {Object} options - Override default config
         */
        init(container, options = {}) {
            // Merge options
            this.config = this._deepMerge(this.config, options);
            
            // Detect environment
            this.state.isMobile = this._detectMobile();
            this.state.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            // Get container
            this.state.container = typeof container === 'string' 
                ? document.querySelector(container) 
                : container;
            
            if (!this.state.container) {
                console.error('LayoutEngine: Container not found');
                return this;
            }

            // Initial viewport measurement
            this._updateViewport();
            
            // Setup resize handler
            this._setupResizeHandler();
            
            // Setup touch/gesture handlers if mobile
            if (this.state.isTouch) {
                this._setupTouchHandlers();
            }

            return this;
        },

        /**
         * Render bubbles with optimized layout
         * @param {Array} data - Bubble data array
         * @param {Function} radiusScale - D3 scale function for radius
         * @param {Object} callbacks - Event callbacks { onClick, onHover, onEnter }
         */
        render(data, radiusScale, callbacks = {}) {
            if (!data || data.length === 0) {
                this._showEmptyState();
                return this;
            }

            this.state.bubbles = [...data];
            this.state.bubbleMap.clear();

            // Clear existing
            d3.select(this.state.container).selectAll('svg').remove();

            // Setup dimensions
            const dimensions = this._calculateDimensions(data.length);
            this.state.container.style.height = dimensions.height + 'px';

            // Create SVG with zoom support
            const svg = d3.select(this.state.container)
                .append('svg')
                .attr('width', dimensions.width)
                .attr('height', dimensions.height)
                .attr('class', 'layout-engine-svg');

            // Add zoom behavior
            if (this.state.isTouch || window.innerWidth < 768) {
                this._setupZoom(svg, dimensions);
            }

            this.state.svg = svg;

            // Calculate initial positions using grid-based layout
            this._calculateInitialPositions(data, dimensions, radiusScale);

            // Create bubble groups
            const bubbles = svg.selectAll('.bubble-group')
                .data(data)
                .enter()
                .append('g')
                .attr('class', 'bubble-group')
                .attr('data-symbol', d => d.symbol)
                .attr('role', 'button')
                .attr('tabindex', '0')
                .attr('aria-label', d => `${d.symbol}: ${d.change24h >= 0 ? '+' : ''}${d.change24h.toFixed(2)}%`);

            // Setup interactions
            this._setupInteractions(bubbles, callbacks);

            // Initialize force simulation with optimized forces
            this._initSimulation(data, radiusScale, dimensions);

            // Animate entrance
            this._animateEntrance(bubbles, radiusScale);

            // Store references
            bubbles.each((d) => {
                const el = svg.select(`[data-symbol="${d.symbol}"]`);
                this.state.bubbleMap.set(d.symbol, {
                    element: el,
                    data: d,
                    x: d.x,
                    y: d.y
                });
            });

            return this;
        },

        /**
         * Update existing bubbles with new data
         * @param {Array} newData - Updated bubble data
         * @param {Function} radiusScale - D3 scale function
         */
        update(newData, radiusScale) {
            if (!this.state.simulation) return this;

            newData.forEach(newItem => {
                const existing = this.state.bubbles.find(b => b.symbol === newItem.symbol);
                if (existing) {
                    // Update data properties
                    Object.assign(existing, newItem);
                    
                    // Update visual if needed
                    const bubble = this.state.bubbleMap.get(newItem.symbol);
                    if (bubble && bubble.updateVisual) {
                        bubble.updateVisual(existing);
                    }
                }
            });

            // Re-heat simulation slightly for adjustments
            this.state.simulation.alpha(0.1).restart();

            return this;
        },

        /**
         * Refresh layout completely (for filter changes)
         * @param {Array} data - New bubble data
         * @param {Function} radiusScale - D3 scale function
         * @param {Object} callbacks - Event callbacks
         */
        refresh(data, radiusScale, callbacks) {
            if (this.state.simulation) {
                this.state.simulation.stop();
                this.state.simulation = null;
            }
            return this.render(data, radiusScale, callbacks);
        },

        /**
         * Get current bubble position
         * @param {string} symbol - Bubble symbol
         */
        getBubblePosition(symbol) {
            const bubble = this.state.bubbleMap.get(symbol);
            return bubble ? { x: bubble.x, y: bubble.y } : null;
        },

        /**
         * Scroll to a specific bubble
         * @param {string} symbol - Bubble symbol to scroll to
         * @param {Object} options - Scroll options
         */
        scrollToBubble(symbol, options = {}) {
            const bubble = this.state.bubbleMap.get(symbol);
            if (!bubble || !this.state.container) return false;

            const containerRect = this.state.container.getBoundingClientRect();
            const scrollContainer = this.state.container.closest('#scroll-container') || window;
            
            const targetY = bubble.y - containerRect.height / 2;
            
            if (scrollContainer.scrollTo) {
                scrollContainer.scrollTo({
                    top: targetY,
                    behavior: options.smooth !== false ? 'smooth' : 'auto'
                });
            }

            return true;
        },

        /**
         * Destroy and cleanup
         */
        destroy() {
            if (this.state.simulation) {
                this.state.simulation.stop();
            }
            
            if (this.state.resizeTimer) {
                clearTimeout(this.state.resizeTimer);
            }

            d3.select(this.state.container).selectAll('svg').remove();
            
            this.state.bubbleMap.clear();
            this.state.bubbles = [];
            this.state.simulation = null;
            
            window.removeEventListener('resize', this._handleResize);
        },

        // ==================== PRIVATE METHODS ====================

        /**
         * Detect mobile device
         */
        _detectMobile() {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
            const isMobileDevice = mobileRegex.test(userAgent);
            const isNarrowViewport = window.innerWidth < 768;
            
            return isMobileDevice || isNarrowViewport;
        },

        /**
         * Update viewport dimensions
         */
        _updateViewport() {
            this.state.viewport = {
                width: window.innerWidth,
                height: window.innerHeight,
                containerWidth: this.state.container?.clientWidth || window.innerWidth
            };
        },

        /**
         * Calculate layout dimensions
         */
        _calculateDimensions(bubbleCount) {
            const containerWidth = this.state.viewport.containerWidth - 60;
            const isMobile = this.state.isMobile;
            
            // Adjust rows based on bubble count and viewport
            let rows = this.config.grid.rows;
            if (bubbleCount < 30) rows = 2;
            else if (bubbleCount > 100) rows = 5;
            
            // Adjust row height for mobile
            const rowHeight = isMobile ? 220 : this.config.grid.rowHeight;
            const minHeight = isMobile ? 600 : 800;
            const height = Math.max(rows * rowHeight + 200, minHeight);

            return { width: containerWidth, height, rows, rowHeight };
        },

        /**
         * Calculate initial positions using esthetic grid-based layout
         */
        _calculateInitialPositions(data, dimensions, radiusScale) {
            const { width, height, rows, rowHeight } = dimensions;
            const bubblesPerRow = Math.ceil(data.length / rows);
            const jitter = this.config.grid.jitter;

            // Sort by performance for visual flow
            const sortedData = [...data].sort((a, b) => b.change24h - a.change24h);

            sortedData.forEach((d, i) => {
                const row = Math.floor(i / bubblesPerRow);
                const indexInRow = i % bubblesPerRow;
                
                // Calculate grid position with organic offsets
                const baseY = 100 + row * rowHeight;
                const colsInRow = Math.ceil(bubblesPerRow / (rows > 2 ? 1.5 : 1));
                const col = indexInRow % colsInRow;
                const subRow = Math.floor(indexInRow / colsInRow);
                
                const sectionWidth = width / colsInRow;
                const gridX = col * sectionWidth + sectionWidth / 2;
                const gridY = baseY + subRow * (rowHeight / 3);

                // Add organic jitter (random offset within cell)
                const jitterX = (Math.random() - 0.5) * sectionWidth * jitter;
                const jitterY = (Math.random() - 0.5) * (rowHeight / 3) * jitter;

                // Ensure minimum distance from edges
                const radius = radiusScale(d.volume24h);
                d.x = Math.max(radius + 20, Math.min(width - radius - 20, gridX + jitterX));
                d.y = Math.max(radius + 50, Math.min(height - radius - 50, gridY + jitterY));
                
                // Store grid target for force attraction
                d.gridX = gridX;
                d.gridY = gridY;
            });

            return sortedData;
        },

        /**
         * Initialize optimized force simulation
         */
        _initSimulation(data, radiusScale, dimensions) {
            const { forces, alpha, velocity } = this.config;
            const isMobile = this.state.isMobile;

            // Adjust forces for mobile
            const collidePadding = isMobile ? 
                d => radiusScale(d.volume24h) * forces.collide.paddingRatio + 10 :
                d => radiusScale(d.volume24h) * forces.collide.paddingRatio + 6;

            const simulation = d3.forceSimulation(data)
                // Charge: weak repulsion for organic feel
                .force('charge', d3.forceManyBody()
                    .strength(isMobile ? forces.charge.strength * 0.5 : forces.charge.strength)
                    .distanceMax(forces.charge.distanceMax))
                
                // Collide: tight but non-overlapping
                .force('collide', d3.forceCollide()
                    .radius(collidePadding)
                    .strength(forces.collide.strength)
                    .iterations(isMobile ? 2 : 3))
                
                // X force: attract to grid column with strength gradient
                .force('x', d3.forceX(d => d.gridX || dimensions.width / 2)
                    .strength((d, i) => {
                        // Stronger attraction for larger bubbles (more important)
                        const sizeWeight = radiusScale(d.volume24h) / this.config.baseRadius.max;
                        return forces.x.strengthBase + (sizeWeight * forces.x.strengthDecay);
                    }))
                
                // Y force: attract to grid row with strength gradient  
                .force('y', d3.forceY(d => d.gridY || dimensions.height / 2)
                    .strength((d, i) => {
                        const sizeWeight = radiusScale(d.volume24h) / this.config.baseRadius.max;
                        return forces.y.strengthBase + (sizeWeight * forces.y.strengthDecay);
                    }))
                
                // Center: gentle centering force
                .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2)
                    .strength(forces.center.strength));

            // Performance tuning
            simulation
                .alpha(alpha.start)
                .alphaDecay(alpha.decay)
                .alphaMin(alpha.min)
                .velocityDecay(velocity.decay);

            // Update loop
            const bubbles = this.state.svg.selectAll('.bubble-group');
            simulation.on('tick', () => {
                bubbles.attr('transform', d => `translate(${d.x.toFixed(1)},${d.y.toFixed(1)})`);
            });

            // Stop after settling (for performance)
            simulation.on('end', () => {
                this.state.isAnimating = false;
            });

            this.state.simulation = simulation;
            this.state.isAnimating = true;

            return simulation;
        },

        /**
         * Setup zoom behavior for mobile/pinch
         */
        _setupZoom(svg, dimensions) {
            const zoom = d3.zoom()
                .scaleExtent([0.5, 3])
                .extent([[0, 0], [dimensions.width, dimensions.height]])
                .on('zoom', (event) => {
                    this.state.zoomScale = event.transform.k;
                    svg.selectAll('.bubble-group')
                        .attr('transform', d => {
                            // Apply zoom transform to position
                            const x = d.x * event.transform.k + event.transform.x;
                            const y = d.y * event.transform.k + event.transform.y;
                            return `translate(${x},${y}) scale(${event.transform.k})`;
                        });
                });

            svg.call(zoom);
            this.state.zoom = zoom;
        },

        /**
         * Setup interactions with accessibility and touch support
         */
        _setupInteractions(bubbles, callbacks) {
            const isTouch = this.state.isTouch;
            const hitAreaMin = this.config.hitAreaMin;

            bubbles
                .on('click', function(event, d) {
                    event.stopPropagation();
                    if (callbacks.onClick) {
                        // Visual feedback
                        d3.select(this).select('.bubble-core')
                            .transition()
                            .duration(150)
                            .attr('transform', 'scale(0.95)')
                            .transition()
                            .duration(150)
                            .attr('transform', 'scale(1)');
                        
                        callbacks.onClick(d, this);
                    }
                })
                .on('mouseenter', function(event, d) {
                    if (!isTouch && callbacks.onHover) {
                        callbacks.onHover(d, this, true);
                    }
                })
                .on('mouseleave', function(event, d) {
                    if (!isTouch && callbacks.onHover) {
                        callbacks.onHover(d, this, false);
                    }
                })
                .on('keydown', function(event, d) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        if (callbacks.onClick) callbacks.onClick(d, this);
                    }
                });

            // Ensure minimum touch target size
            if (isTouch) {
                bubbles.each(function(d) {
                    const el = d3.select(this);
                    const bbox = this.getBBox();
                    const minSize = hitAreaMin;
                    
                    if (bbox.width < minSize || bbox.height < minSize) {
                        el.insert('rect', ':first-child')
                            .attr('class', 'touch-target')
                            .attr('x', -minSize / 2)
                            .attr('y', -minSize / 2)
                            .attr('width', minSize)
                            .attr('height', minSize)
                            .attr('fill', 'transparent')
                            .attr('rx', minSize / 2);
                    }
                });
            }
        },

        /**
         * Animate bubble entrance with staggered timing
         */
        _animateEntrance(bubbles, radiusScale) {
            const duration = this.config.transitionDuration;
            const stagger = this.config.staggerDelay;

            // Initial state: invisible, scaled down
            bubbles.attr('opacity', 0)
                .attr('transform', d => `translate(${d.x},${d.y}) scale(0)`);

            // Animate in with stagger
            bubbles.transition()
                .duration(duration)
                .delay((d, i) => i * stagger * 0.5 + Math.random() * stagger)
                .ease(d3.easeBackOut.overshoot(1.2))
                .attr('opacity', 1)
                .attr('transform', d => `translate(${d.x},${d.y}) scale(1)`);
        },

        /**
         * Setup debounced resize handler
         */
        _setupResizeHandler() {
            this._handleResize = this._debounce(() => {
                this._updateViewport();
                
                // Check if mobile state changed
                const wasMobile = this.state.isMobile;
                this.state.isMobile = this._detectMobile();
                
                // Only refresh if significant size change
                if (this.state.bubbles.length > 0) {
                    this._onResize();
                }
            }, 250);

            window.addEventListener('resize', this._handleResize);
        },

        /**
         * Handle resize event
         */
        _onResize() {
            if (!this.state.simulation) return;

            const dimensions = this._calculateDimensions(this.state.bubbles.length);
            this.state.container.style.height = dimensions.height + 'px';

            // Update SVG dimensions
            this.state.svg
                .attr('width', dimensions.width)
                .attr('height', dimensions.height);

            // Recalculate positions with new dimensions
            this._calculateInitialPositions(this.state.bubbles, dimensions, 
                d3.scaleSqrt().domain([0, 1]).range([
                    this.config.baseRadius.min, 
                    this.config.baseRadius.max
                ]));

            // Update center force
            this.state.simulation
                .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
                .alpha(0.3)
                .restart();
        },

        /**
         * Setup touch handlers for swipe and pinch
         */
        _setupTouchHandlers() {
            const container = this.state.container;
            if (!container) return;

            let touchStartY = 0;
            let touchStartX = 0;
            let initialPinchDist = 0;

            container.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    touchStartY = e.touches[0].clientY;
                    touchStartX = e.touches[0].clientX;
                } else if (e.touches.length === 2) {
                    initialPinchDist = this._getPinchDistance(e.touches);
                }
            }, { passive: true });

            container.addEventListener('touchmove', (e) => {
                if (e.touches.length === 2 && this.state.zoom) {
                    // Pinch zoom
                    e.preventDefault();
                    const currentDist = this._getPinchDistance(e.touches);
                    const scale = Math.min(Math.max(currentDist / initialPinchDist * this.state.zoomScale, 0.5), 3);
                    
                    const center = this._getPinchCenter(e.touches);
                    this.state.svg.call(this.state.zoom.transform, 
                        d3.zoomIdentity.translate(center.x, center.y).scale(scale));
                }
            }, { passive: false });

            // Enable momentum scrolling via CSS
            container.style.touchAction = 'pan-y pinch-zoom';
        },

        /**
         * Get distance between two touch points
         */
        _getPinchDistance(touches) {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        },

        /**
         * Get center point between two touches
         */
        _getPinchCenter(touches) {
            return {
                x: (touches[0].clientX + touches[1].clientX) / 2,
                y: (touches[0].clientY + touches[1].clientY) / 2
            };
        },

        /**
         * Show empty state message
         */
        _showEmptyState() {
            this.state.container.innerHTML = `
                <div style="text-align:center;padding:50px;color:var(--text-secondary);font-family:Orbitron;">
                    <div style="font-size:3rem;margin-bottom:1rem;">🔍</div>
                    <div>Nicio monedă găsită</div>
                </div>
            `;
        },

        /**
         * Debounce utility
         */
        _debounce(fn, delay) {
            let timer = null;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        },

        /**
         * Deep merge utility
         */
        _deepMerge(target, source) {
            const output = Object.assign({}, target);
            if (this._isObject(target) && this._isObject(source)) {
                Object.keys(source).forEach(key => {
                    if (this._isObject(source[key])) {
                        if (!(key in target)) {
                            Object.assign(output, { [key]: source[key] });
                        } else {
                            output[key] = this._deepMerge(target[key], source[key]);
                        }
                    } else {
                        Object.assign(output, { [key]: source[key] });
                    }
                });
            }
            return output;
        },

        _isObject(item) {
            return item && typeof item === 'object' && !Array.isArray(item);
        }
    };

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = LayoutEngine;
    } else {
        global.LayoutEngine = LayoutEngine;
    }

})(typeof window !== 'undefined' ? window : this);


// ==================== CSS HELPER ====================
// Add these styles to your CSS for optimal layout engine performance:

const layoutEngineStyles = `
/* Layout Engine Optimizations */
.layout-engine-svg {
    display: block;
    overflow: visible;
    touch-action: pan-y pinch-zoom;
    -webkit-user-select: none;
    user-select: none;
}

.bubble-group {
    cursor: pointer;
    will-change: transform;
    transition: opacity 0.2s ease;
}

.bubble-group:hover {
    opacity: 0.9;
}

.bubble-group:focus {
    outline: 2px solid var(--accent-color, #00ff41);
    outline-offset: 4px;
    border-radius: 50%;
}

.bubble-group .touch-target {
    pointer-events: all;
}

/* Mobile optimizations */
@media (max-width: 768px) {
    .layout-engine-svg {
        touch-action: pan-y pinch-zoom;
    }
    
    .bubble-group {
        /* Larger hit area on mobile */
        min-width: 44px;
        min-height: 44px;
    }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
    .bubble-group {
        transition: none !important;
        will-change: auto;
    }
    
    .layout-engine-svg * {
        animation: none !important;
    }
}
`;

// Inject styles if in browser
if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.textContent = layoutEngineStyles;
    styleEl.id = 'layout-engine-styles';
    if (!document.getElementById('layout-engine-styles')) {
        document.head.appendChild(styleEl);
    }
}
