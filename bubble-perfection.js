// ==========================================
// BUBBLE PERFECTION - Ralph-1
// Enhanced animations, grid optimization, and interactions
// Compatible with VirtualScroller architecture
// ==========================================

/**
 * Calculate optimal honeycomb grid layout for 100+ tokens
 * Ensures minimum 120px between bubble centers with collision detection
 * @param {number} count - Number of bubbles to display
 * @param {object} viewport - Viewport dimensions {width, height}
 * @returns {object} Grid configuration {cols, rows, spacing, bubbleRadius}
 */
function calculateOptimalGrid(count, viewport) {
    const minSpacing = 120; // Minimum 120px between bubble centers
    const padding = 40; // Padding from edges
    
    const availableWidth = viewport.width - (padding * 2);
    const availableHeight = viewport.height - (padding * 2) - 100; // Account for header
    
    // Calculate optimal columns based on honeycomb packing
    // Honeycomb: each row is offset by half spacing, rows are sqrt(3)/2 * spacing apart
    const hexHeightRatio = Math.sqrt(3) / 2;
    
    // Estimate columns needed
    let bestCols = Math.max(1, Math.floor(availableWidth / minSpacing));
    let bestSpacing = minSpacing;
    
    // Try to find better spacing by adjusting columns
    for (let cols = 1; cols <= Math.ceil(count / 2); cols++) {
        const spacing = availableWidth / cols;
        if (spacing >= minSpacing && spacing <= availableWidth / 2) {
            const rows = Math.ceil(count / cols);
            const rowHeight = spacing * hexHeightRatio;
            const totalHeight = rows * rowHeight + (rows > 1 ? rowHeight / 2 : 0);
            
            if (totalHeight <= availableHeight || cols === 1) {
                bestCols = cols;
                bestSpacing = spacing;
            }
        }
    }
    
    const rows = Math.ceil(count / bestCols);
    const rowHeight = bestSpacing * hexHeightRatio;
    
    // Calculate optimal bubble radius based on spacing
    const bubbleRadius = Math.min(55, (bestSpacing - 20) / 2);
    
    return {
        cols: bestCols,
        rows: rows,
        spacing: bestSpacing,
        bubbleRadius: bubbleRadius,
        rowHeight: rowHeight,
        padding: padding,
        totalWidth: bestCols * bestSpacing + bestSpacing / 2,
        totalHeight: rows * rowHeight + rowHeight / 2
    };
}

/**
 * Check for bubble collisions and adjust positions
 * @param {array} bubbles - Array of bubble objects with x, y, radius
 * @param {number} minDistance - Minimum distance between bubble edges
 * @returns {array} Adjusted bubble positions
 */
function resolveCollisions(bubbles, minDistance = 10) {
    const resolved = [...bubbles];
    const maxIterations = 50;
    let iteration = 0;
    let hasCollisions = true;
    
    while (hasCollisions && iteration < maxIterations) {
        hasCollisions = false;
        iteration++;
        
        for (let i = 0; i < resolved.length; i++) {
            for (let j = i + 1; j < resolved.length; j++) {
                const b1 = resolved[i];
                const b2 = resolved[j];
                
                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minSeparation = b1.radius + b2.radius + minDistance;
                
                if (distance < minSeparation && distance > 0) {
                    hasCollisions = true;
                    
                    // Push bubbles apart
                    const overlap = minSeparation - distance;
                    const pushX = (dx / distance) * overlap * 0.5;
                    const pushY = (dy / distance) * overlap * 0.5;
                    
                    b1.x -= pushX;
                    b1.y -= pushY;
                    b2.x += pushX;
                    b2.y += pushY;
                }
            }
        }
    }
    
    return resolved;
}

/**
 * Easing function using cubic-bezier(0.34, 1.56, 0.64, 1)
 * Creates an elastic overshoot effect
 * @param {number} t - Time value (0-1)
 * @returns {number} Eased value
 */
function elasticEase(t) {
    // Approximation of cubic-bezier(0.34, 1.56, 0.64, 1)
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 0.34, y: 1.56 };
    const p2 = { x: 0.64, y: 1 };
    const p3 = { x: 1, y: 1 };
    
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    
    return mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;
}

/**
 * Smooth step function for gentler easing
 * @param {number} t - Time value (0-1)
 * @returns {number} Smoothed value
 */
function smoothStep(t) {
    return t * t * (3 - 2 * t);
}

/**
 * Create ripple effect at click point
 * @param {HTMLElement} container - Container element
 * @param {number} x - Click X coordinate (clientX)
 * @param {number} y - Click Y coordinate (clientY)
 * @param {string} color - Ripple color
 */
function createRipple(container, x, y, color = '#00ff88') {
    const ripple = document.createElement('div');
    ripple.className = 'bubble-ripple';
    ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        border: 2px solid ${color};
        opacity: 0.8;
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 1000;
    `;
    
    container.appendChild(ripple);
    
    const startTime = performance.now();
    const duration = 600;
    
    function animateRipple(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        const size = easeProgress * 120;
        const opacity = 0.8 * (1 - easeProgress);
        const borderWidth = 2 * (1 - easeProgress * 0.5);
        
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.opacity = opacity;
        ripple.style.borderWidth = `${borderWidth}px`;
        
        if (progress < 1) {
            requestAnimationFrame(animateRipple);
        } else {
            ripple.remove();
        }
    }
    
    requestAnimationFrame(animateRipple);
}

/**
 * Animate bubble click feedback (scale up then down)
 * @param {HTMLElement} element - Bubble element
 * @param {number} duration - Animation duration in ms
 */
function animateClickFeedback(element, duration = 300) {
    const startTime = performance.now();
    
    function animateClick(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Scale up then down using sine wave
        const scale = 1 + Math.sin(progress * Math.PI) * 0.15;
        
        element.style.transform = `scale(${scale.toFixed(3)})`;
        
        if (progress < 1) {
            requestAnimationFrame(animateClick);
        } else {
            element.style.transform = 'scale(1)';
        }
    }
    
    requestAnimationFrame(animateClick);
}

/**
 * Add hover effects to bubble elements
 * @param {HTMLElement} element - Bubble element
 * @param {object} options - Hover effect options
 */
function addHoverEffectsToElement(element, options = {}) {
    const {
        scaleFactor = 1.15,
        glowSpread = 40,
        transitionDuration = 250
    } = options;
    
    const svg = element.querySelector('.bubble-svg');
    if (!svg) return;
    
    let isHovered = false;
    let animationId = null;
    
    element.style.cursor = 'pointer';
    element.style.transition = `filter ${transitionDuration}ms ease`;
    
    element.addEventListener('mouseenter', function() {
        isHovered = true;
        
        // Pause parent animation if exists
        if (window.bubbleAnimationController) {
            window.bubbleAnimationController.pause();
        }
        
        const startTime = performance.now();
        
        function scaleUp(currentTime) {
            if (!isHovered) return;
            
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / transitionDuration, 1);
            const eased = elasticEase(progress);
            const scale = 1 + (scaleFactor - 1) * eased;
            
            element.style.transform = `scale(${scale.toFixed(3)})`;
            element.style.zIndex = '10';
            
            // Intensify glow
            const glowOpacity = 0.5 + eased * 0.4;
            element.style.filter = `drop-shadow(0 0 ${glowSpread}px rgba(0, 255, 100, ${glowOpacity}))`;
            
            if (progress < 1 && isHovered) {
                animationId = requestAnimationFrame(scaleUp);
            }
        }
        
        cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(scaleUp);
    });
    
    element.addEventListener('mouseleave', function() {
        isHovered = false;
        
        // Resume parent animation
        if (window.bubbleAnimationController) {
            window.bubbleAnimationController.resume();
        }
        
        const startTime = performance.now();
        const startScale = scaleFactor;
        
        function scaleDown(currentTime) {
            if (isHovered) return;
            
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / transitionDuration, 1);
            const eased = smoothStep(progress);
            const scale = startScale - (startScale - 1) * eased;
            
            element.style.transform = `scale(${scale.toFixed(3)})`;
            
            // Reduce glow
            const glowOpacity = 0.9 - eased * 0.4;
            element.style.filter = `drop-shadow(0 0 ${glowSpread - (glowSpread - 20) * eased}px rgba(0, 255, 100, ${glowOpacity}))`;
            
            if (progress < 1 && !isHovered) {
                animationId = requestAnimationFrame(scaleDown);
            } else {
                element.style.zIndex = '';
                element.style.filter = '';
                element.style.transform = '';
            }
        }
        
        cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(scaleDown);
    });
}

/**
 * Enhanced animation controller with elastic easing and Y-axis floating
 * Manages rotation animation with pause/resume capability
 */
class BubbleAnimationController {
    constructor(options = {}) {
        this.isPaused = false;
        this.isDestroyed = false;
        this.animationFrame = null;
        this.startTime = performance.now();
        this.pauseTime = 0;
        this.lastPauseStart = 0;
        
        this.options = {
            baseSpeed: 0.025,
            floatAmplitude: 8,
            floatSpeed: 0.0015,
            ribbonSpeeds: [1, 1.3, 1.6],
            ribbonPhase: [0, Math.PI / 3, Math.PI * 2 / 3],
            ...options
        };
        
        this.init();
    }
    
    init() {
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }
    
    animate(currentTime) {
        if (this.isDestroyed) return;
        
        if (!this.isPaused) {
            const elapsed = currentTime - this.startTime - this.pauseTime;
            
            // Animate all ribbon groups
            const ribbons = document.querySelectorAll('.bubble-ribbons');
            ribbons.forEach((g, gIdx) => {
                const idx = parseInt(g.dataset.index) || gIdx;
                
                // Each ribbon layer has different speed
                [0, 1, 2].forEach(rIdx => {
                    const ribbon = g.querySelector(`.ribbon-${rIdx}`);
                    if (!ribbon) return;
                    
                    const speed = this.options.ribbonSpeeds[rIdx] || 1;
                    const phase = this.options.ribbonPhase[rIdx] || 0;
                    const baseRot = [0, 45, 90][rIdx] + idx * 15;
                    
                    // Rotation with elastic easing component
                    const timeNorm = (elapsed * this.options.baseSpeed * speed + phase) % (Math.PI * 2);
                    const rotation = baseRot + Math.sin(timeNorm) * 8;
                    
                    // Y-axis floating with sine wave
                    const floatTime = elapsed * this.options.floatSpeed + idx * 0.5;
                    const floatNorm = (Math.sin(floatTime) + 1) / 2;
                    const elasticFloat = elasticEase(floatNorm) * 2 - 1;
                    const floatY = elasticFloat * this.options.floatAmplitude;
                    
                    ribbon.style.transform = `rotate(${rotation.toFixed(2)}deg) translateY(${floatY.toFixed(2)}px)`;
                });
            });
        } else if (this.lastPauseStart > 0) {
            // Accumulate paused time
            this.pauseTime += 16;
        }
        
        this.animationFrame = requestAnimationFrame(this.animate);
    }
    
    pause() {
        if (!this.isPaused) {
            this.isPaused = true;
            this.lastPauseStart = performance.now();
        }
    }
    
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            if (this.lastPauseStart > 0) {
                this.pauseTime += performance.now() - this.lastPauseStart;
            }
            this.lastPauseStart = 0;
        }
    }
    
    toggle() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }
    
    destroy() {
        this.isDestroyed = true;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

/**
 * Enhance existing bubble elements with perfection features
 * Call this after VirtualScroller creates elements
 */
function enhanceBubbleElements() {
    const bubbles = document.querySelectorAll('.bubble-item');
    
    bubbles.forEach(bubble => {
        // Skip if already enhanced
        if (bubble.dataset.enhanced === 'true') return;
        bubble.dataset.enhanced = 'true';
        
        // Add hover effects
        addHoverEffectsToElement(bubble, {
            scaleFactor: 1.15,
            glowSpread: 40,
            transitionDuration: 250
        });
        
        // Add click feedback
        bubble.addEventListener('click', function(e) {
            const rect = bubble.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Get color from bubble
            const isPositive = !bubble.innerHTML.includes('#ff3366') && !bubble.innerHTML.includes('#c54a4a');
            const color = isPositive ? '#00ff88' : '#ff3366';
            
            // Create ripple
            createRipple(bubble, x, y, color);
            
            // Animate feedback
            animateClickFeedback(bubble);
        });
    });
}

/**
 * Patch VirtualScroller to enhance new elements
 */
function patchVirtualScroller() {
    // Wait for VirtualScroller to be initialized
    const checkInterval = setInterval(() => {
        if (window.virtualScroller) {
            clearInterval(checkInterval);
            
            // Store original updateVisibleItems
            const originalUpdate = window.virtualScroller.updateVisibleItems.bind(window.virtualScroller);
            
            // Override to enhance new elements
            window.virtualScroller.updateVisibleItems = function() {
                originalUpdate();
                
                // Enhance newly created elements
                setTimeout(enhanceBubbleElements, 0);
            };
            
            // Initial enhancement
            enhanceBubbleElements();
        }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
}

/**
 * Initialize all bubble perfection features
 */
function initBubblePerfection() {
    // Start enhanced animation controller
    window.bubbleAnimationController = new BubbleAnimationController({
        baseSpeed: 0.025,
        floatAmplitude: 8,
        floatSpeed: 0.0015,
        ribbonSpeeds: [1, 1.3, 1.6],
        ribbonPhase: [0, Math.PI / 3, Math.PI * 2 / 3]
    });
    
    // Patch VirtualScroller
    patchVirtualScroller();
    
    console.log('[BubblePerfection] Initialized with elastic easing and hover effects');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBubblePerfection);
} else {
    initBubblePerfection();
}

// Export for global access
window.BubblePerfection = {
    calculateOptimalGrid,
    resolveCollisions,
    elasticEase,
    smoothStep,
    createRipple,
    animateClickFeedback,
    addHoverEffectsToElement,
    BubbleAnimationController,
    enhanceBubbleElements,
    init: initBubblePerfection
};
