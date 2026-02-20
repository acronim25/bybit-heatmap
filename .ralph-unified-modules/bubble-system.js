/**
 * Bubble System - Twisted Ribbon Bubble Visualization
 * Ralph-3 Component - Unified Index
 */

// ============================================
// 1. RIBBON GEOMETRY FUNCTIONS
// ============================================

/**
 * Rotate a point around the Z axis
 * @param {Object} point - {x, y, z}
 * @param {number} angle - Rotation angle in radians
 * @returns {Object} Rotated point {x, y, z}
 */
function rotateZ(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: point.x * cos - point.y * sin,
        y: point.x * sin + point.y * cos,
        z: point.z
    };
}

/**
 * Project 3D point to 2D screen space
 * @param {Object} point - {x, y, z}
 * @param {number} focalLength - Camera focal length (default: 800)
 * @param {Object} center - {x, y} screen center
 * @returns {Object} Projected point {x, y, z, scale}
 */
function project3D(point, focalLength = 800, center = { x: 400, y: 300 }) {
    const scale = focalLength / (focalLength + point.z);
    return {
        x: center.x + point.x * scale,
        y: center.y + point.y * scale,
        z: point.z,
        scale: scale
    };
}

/**
 * Create a twisted ribbon geometry
 * @param {number} radius - Ribbon radius
 * @param {number} twists - Number of twists
 * @param {number} width - Ribbon width
 * @param {number} segments - Number of segments
 * @param {Object} options - Additional options
 * @returns {Array} Array of ribbon segments with front and back faces
 */
function createTwistedRibbon(radius, twists, width, segments, options = {}) {
    const ribbon = [];
    const height = options.height || 200;
    const twistAmount = twists * Math.PI * 2;
    
    for (let i = 0; i < segments; i++) {
        const t = i / segments;
        const tNext = (i + 1) / segments;
        
        const angle = t * twistAmount;
        const angleNext = tNext * twistAmount;
        
        const y = (t - 0.5) * height;
        const yNext = (tNext - 0.5) * height;
        
        // Create ribbon segment
        const segment = {
            front: [],
            back: [],
            centerZ: 0,
            index: i
        };
        
        // Front face points
        const p1 = rotateZ({ x: radius - width/2, y: y, z: 0 }, angle);
        const p2 = rotateZ({ x: radius + width/2, y: y, z: 0 }, angle);
        const p3 = rotateZ({ x: radius + width/2, y: yNext, z: 0 }, angleNext);
        const p4 = rotateZ({ x: radius - width/2, y: yNext, z: 0 }, angleNext);
        
        // Back face points (offset by PI for double-sided ribbon)
        const backAngle = angle + Math.PI;
        const backAngleNext = angleNext + Math.PI;
        
        const b1 = rotateZ({ x: radius - width/2, y: y, z: 0 }, backAngle);
        const b2 = rotateZ({ x: radius + width/2, y: y, z: 0 }, backAngle);
        const b3 = rotateZ({ x: radius + width/2, y: yNext, z: 0 }, backAngleNext);
        const b4 = rotateZ({ x: radius - width/2, y: yNext, z: 0 }, backAngleNext);
        
        segment.front = [p1, p2, p3, p4];
        segment.back = [b1, b2, b3, b4];
        segment.centerZ = (p1.z + p2.z + p3.z + p4.z) / 4;
        
        ribbon.push(segment);
    }
    
    return ribbon;
}

// ============================================
// 2. COLOR FUNCTIONS
// ============================================

/**
 * Get bubble colors based on 24h price change
 * @param {number} change24h - Percentage change
 * @param {string} theme - 'dark' or 'light'
 * @returns {Object} Color object {primary, secondary, dark, glow}
 */
function getBubbleColor(change24h, theme = 'dark') {
    const isPositive = change24h >= 0;
    const intensity = Math.min(Math.abs(change24h) / 20, 1); // Cap at 20%
    
    if (theme === 'dark') {
        // Dark theme: Bright neon colors
        if (isPositive) {
            // Bullish - Neon Cyan/Green
            return {
                primary: `hsl(${160 + intensity * 40}, 100%, ${50 + intensity * 10}%)`,
                secondary: `hsl(${180 + intensity * 30}, 100%, ${60 + intensity * 10}%)`,
                dark: `hsl(${160}, 100%, 20%)`,
                glow: `rgba(0, 255, 200, ${0.3 + intensity * 0.4})`,
                text: '#00ffc8'
            };
        } else {
            // Bearish - Neon Pink/Red
            return {
                primary: `hsl(${340 - intensity * 20}, 100%, ${55 + intensity * 10}%)`,
                secondary: `hsl(${0}, 100%, ${60 + intensity * 10}%)`,
                dark: `hsl(${340}, 100%, 25%)`,
                glow: `rgba(255, 50, 100, ${0.3 + intensity * 0.4})`,
                text: '#ff3264'
            };
        }
    } else {
        // Light theme: Muted/darker colors
        if (isPositive) {
            // Bullish - Muted Teal
            return {
                primary: `hsl(${160 + intensity * 30}, 70%, ${35 + intensity * 15}%)`,
                secondary: `hsl(${170}, 60%, ${45}%)`,
                dark: `hsl(${160}, 80%, 25%)`,
                glow: `rgba(0, 180, 140, ${0.15 + intensity * 0.25})`,
                text: '#008060'
            };
        } else {
            // Bearish - Muted Red
            return {
                primary: `hsl(${350 - intensity * 10}, 70%, ${40 + intensity * 10}%)`,
                secondary: `hsl(${0}, 60%, ${45}%)`,
                dark: `hsl(${350}, 80%, 30%)`,
                glow: `rgba(200, 40, 60, ${0.15 + intensity * 0.25})`,
                text: '#a02030'
            };
        }
    }
}

/**
 * Get background color for bubble based on theme
 * @param {string} theme - 'dark' or 'light'
 * @returns {string} Background color
 */
function getBubbleBackground(theme) {
    return theme === 'dark' ? '#0a0a0f' : '#f5f5f7';
}

// ============================================
// 3. DATA FETCHING
// ============================================

const BYBIT_API_URL = 'https://api.bybit.com/v5/market/tickers';
const UPDATE_INTERVAL = 30000; // 30 seconds

let dataCache = [];
let updateTimer = null;

/**
 * Fetch data from Bybit API
 * @returns {Promise<Array>} Raw ticker data
 */
async function fetchBybitData() {
    try {
        const params = new URLSearchParams({
            category: 'spot'
        });
        
        const response = await fetch(`${BYBIT_API_URL}?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.retCode !== 0) {
            throw new Error(`API error: ${data.retMsg}`);
        }
        
        return data.result.list || [];
    } catch (error) {
        console.error('Error fetching Bybit data:', error);
        // Return cached data if available
        return dataCache.length > 0 ? dataCache : generateFallbackData();
    }
}

/**
 * Process raw API data into bubble format
 * @param {Array} rawData - Raw ticker data
 * @returns {Array} Processed coin data
 */
function processData(rawData) {
    const processed = rawData
        .filter(item => item.symbol.endsWith('USDT'))
        .map(item => ({
            symbol: item.symbol.replace('USDT', ''),
            fullSymbol: item.symbol,
            price: parseFloat(item.lastPrice) || 0,
            change24h: parseFloat(item.price24hPcnt) * 100 || 0,
            volume24h: parseFloat(item.volume24h) || 0,
            turnover24h: parseFloat(item.turnover24h) || 0,
            high24h: parseFloat(item.highPrice24h) || 0,
            low24h: parseFloat(item.lowPrice24h) || 0,
            marketCap: parseFloat(item.turnover24h) || 0, // Approximation
            // Bubble sizing based on volume
            size: calculateBubbleSize(parseFloat(item.volume24h) || 0),
            // Ribbon parameters
            radius: 80 + Math.random() * 40,
            twists: 1.5 + Math.random() * 2,
            width: 25 + Math.random() * 20,
            segments: 24,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02
        }))
        .filter(item => item.price > 0 && !isNaN(item.change24h))
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, 50); // Top 50 by volume
    
    return processed;
}

/**
 * Calculate bubble size based on volume
 * @param {number} volume - 24h volume
 * @returns {number} Bubble scale factor
 */
function calculateBubbleSize(volume) {
    // Logarithmic scale for better distribution
    const logVol = Math.log10(volume + 1);
    const minSize = 0.6;
    const maxSize = 1.4;
    const normalized = Math.min(logVol / 9, 1); // Cap at log(1B) ~ 9
    return minSize + normalized * (maxSize - minSize);
}

/**
 * Generate fallback data when API fails
 * @returns {Array} Synthetic data
 */
function generateFallbackData() {
    const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'LINK', 'MATIC'];
    return symbols.map(symbol => ({
        symbol,
        fullSymbol: `${symbol}USDT`,
        price: Math.random() * 50000 + 10,
        change24h: (Math.random() - 0.5) * 20,
        volume24h: Math.random() * 1000000000,
        turnover24h: Math.random() * 50000000,
        high24h: 0,
        low24h: 0,
        marketCap: 0,
        size: 0.8 + Math.random() * 0.4,
        radius: 80 + Math.random() * 40,
        twists: 1.5 + Math.random() * 2,
        width: 25 + Math.random() * 20,
        segments: 24,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02
    }));
}

/**
 * Start data update interval
 * @param {Function} onUpdate - Callback when data updates
 */
function startDataUpdates(onUpdate) {
    async function update() {
        const rawData = await fetchBybitData();
        dataCache = processData(rawData);
        if (onUpdate) {
            onUpdate(dataCache);
        }
        updateStats(dataCache);
    }
    
    update(); // Initial fetch
    updateTimer = setInterval(update, UPDATE_INTERVAL);
}

/**
 * Stop data updates
 */
function stopDataUpdates() {
    if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
    }
}

// ============================================
// 4. RENDERING
// ============================================

let svgElement = null;
let bubbleGroup = null;
let defsElement = null;
let currentTheme = 'dark';
let bubbleData = [];
let animationId = null;
let hoveredBubble = null;

/**
 * Create SVG definitions (gradients and filters)
 * @returns {SVGElement} defs element
 */
function createSVGDefs() {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Glow filter
    const glowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    glowFilter.setAttribute('id', 'bubble-glow');
    glowFilter.setAttribute('x', '-50%');
    glowFilter.setAttribute('y', '-50%');
    glowFilter.setAttribute('width', '200%');
    glowFilter.setAttribute('height', '200%');
    
    const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '8');
    feGaussianBlur.setAttribute('result', 'coloredBlur');
    
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode1.setAttribute('in', 'coloredBlur');
    const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    glowFilter.appendChild(feGaussianBlur);
    glowFilter.appendChild(feMerge);
    defs.appendChild(glowFilter);
    
    // Hover glow filter
    const hoverFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    hoverFilter.setAttribute('id', 'bubble-glow-hover');
    hoverFilter.setAttribute('x', '-50%');
    hoverFilter.setAttribute('y', '-50%');
    hoverFilter.setAttribute('width', '200%');
    hoverFilter.setAttribute('height', '200%');
    
    const feGaussianBlurHover = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussianBlurHover.setAttribute('stdDeviation', '15');
    feGaussianBlurHover.setAttribute('result', 'coloredBlur');
    
    const feMergeHover = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const feMergeNode1Hover = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode1Hover.setAttribute('in', 'coloredBlur');
    const feMergeNode2Hover = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    feMergeNode2Hover.setAttribute('in', 'SourceGraphic');
    
    feMergeHover.appendChild(feMergeNode1Hover);
    feMergeHover.appendChild(feMergeNode2Hover);
    hoverFilter.appendChild(feGaussianBlurHover);
    hoverFilter.appendChild(feMergeHover);
    defs.appendChild(hoverFilter);
    
    // Dynamic gradients will be created per bubble
    return defs;
}

/**
 * Create gradient for a specific bubble
 * @param {string} id - Gradient ID
 * @param {Object} colors - Color object
 * @returns {SVGElement} Linear gradient element
 */
function createBubbleGradient(id, colors) {
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', id);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', colors.primary);
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '50%');
    stop2.setAttribute('stop-color', colors.secondary);
    
    const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop3.setAttribute('offset', '100%');
    stop3.setAttribute('stop-color', colors.dark);
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);
    
    return gradient;
}

/**
 * Render ribbon segment as SVG path
 * @param {Object} segment - Ribbon segment
 * @param {Object} colors - Color object
 * @param {string} gradientId - Gradient ID
 * @param {number} offsetX - X offset
 * @param {number} offsetY - Y offset
 * @returns {SVGPathElement} Path element
 */
function renderRibbonSegment(segment, colors, gradientId, offsetX, offsetY) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    // Project all points
    const center = { x: offsetX, y: offsetY };
    const p1 = project3D(segment.front[0], 600, center);
    const p2 = project3D(segment.front[1], 600, center);
    const p3 = project3D(segment.front[2], 600, center);
    const p4 = project3D(segment.front[3], 600, center);
    
    // Create path string
    const d = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`;
    path.setAttribute('d', d);
    path.setAttribute('fill', `url(#${gradientId})`);
    path.setAttribute('stroke', colors.dark);
    path.setAttribute('stroke-width', '0.5');
    path.setAttribute('opacity', '0.9');
    
    return path;
}

/**
 * Render a single bubble
 * @param {Object} coin - Coin data
 * @param {number} index - Bubble index
 * @param {string} theme - Theme name
 * @param {Object} position - {x, y} position
 * @returns {SVGGElement} Bubble group element
 */
function renderBubble(coin, index, theme, position) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'bubble');
    group.setAttribute('data-symbol', coin.symbol);
    group.style.cursor = 'pointer';
    
    const colors = getBubbleColor(coin.change24h, theme);
    const gradientId = `gradient-${coin.symbol}-${index}`;
    
    // Create gradient
    const gradient = createBubbleGradient(gradientId, colors);
    defsElement.appendChild(gradient);
    
    // Create ribbon geometry
    const ribbon = createTwistedRibbon(
        coin.radius * coin.size,
        coin.twists,
        coin.width * coin.size,
        coin.segments,
        { height: 150 * coin.size }
    );
    
    // Sort segments by Z for proper depth
    ribbon.sort((a, b) => a.centerZ - b.centerZ);
    
    // Render ribbon segments
    ribbon.forEach(segment => {
        const segmentPath = renderRibbonSegment(segment, colors, gradientId, position.x, position.y);
        group.appendChild(segmentPath);
    });
    
    // Add center circle (bubble core)
    const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    core.setAttribute('cx', position.x);
    core.setAttribute('cy', position.y);
    core.setAttribute('r', 25 * coin.size);
    core.setAttribute('fill', colors.dark);
    core.setAttribute('stroke', colors.primary);
    core.setAttribute('stroke-width', '2');
    core.setAttribute('filter', 'url(#bubble-glow)');
    group.appendChild(core);
    
    // Add symbol text
    const symbolText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    symbolText.setAttribute('x', position.x);
    symbolText.setAttribute('y', position.y - 5);
    symbolText.setAttribute('text-anchor', 'middle');
    symbolText.setAttribute('dominant-baseline', 'middle');
    symbolText.setAttribute('fill', '#ffffff');
    symbolText.setAttribute('font-size', `${12 * coin.size}px`);
    symbolText.setAttribute('font-weight', 'bold');
    symbolText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    symbolText.textContent = coin.symbol;
    group.appendChild(symbolText);
    
    // Add change percentage
    const changeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    changeText.setAttribute('x', position.x);
    changeText.setAttribute('y', position.y + 12);
    changeText.setAttribute('text-anchor', 'middle');
    changeText.setAttribute('dominant-baseline', 'middle');
    changeText.setAttribute('fill', '#ffffff');
    changeText.setAttribute('font-size', `${10 * coin.size}px`);
    changeText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    changeText.textContent = `${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%`;
    group.appendChild(changeText);
    
    // Store references for animation
    group._coin = coin;
    group._position = position;
    group._colors = colors;
    group._gradientId = gradientId;
    group._ribbon = ribbon;
    group._rotation = coin.rotation;
    
    // Event listeners
    group.addEventListener('click', (e) => {
        e.stopPropagation();
        showModal(coin);
    });
    
    group.addEventListener('mouseenter', () => {
        hoveredBubble = group;
        group.style.filter = 'url(#bubble-glow-hover)';
        group.style.transform = 'scale(1.05)';
        group.style.transformOrigin = `${position.x}px ${position.y}px`;
        group.style.transition = 'transform 0.2s ease';
    });
    
    group.addEventListener('mouseleave', () => {
        hoveredBubble = null;
        group.style.filter = 'none';
        group.style.transform = 'scale(1)';
    });
    
    return group;
}

/**
 * Calculate bubble positions in a grid/spiral layout
 * @param {number} count - Number of bubbles
 * @param {number} containerWidth - Container width
 * @param {number} containerHeight - Container height
 * @returns {Array} Array of {x, y} positions
 */
function calculateBubblePositions(count, containerWidth, containerHeight) {
    const positions = [];
    const cols = Math.ceil(Math.sqrt(count * 1.5));
    const cellWidth = containerWidth / cols;
    const cellHeight = containerHeight / Math.ceil(count / cols);
    
    for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        // Add some randomness for organic feel
        const jitterX = (Math.random() - 0.5) * cellWidth * 0.3;
        const jitterY = (Math.random() - 0.5) * cellHeight * 0.3;
        
        positions.push({
            x: col * cellWidth + cellWidth / 2 + jitterX,
            y: row * cellHeight + cellHeight / 2 + jitterY
        });
    }
    
    return positions;
}

/**
 * Render all bubbles
 * @param {Array} data - Coin data array
 * @param {string} theme - Theme name
 */
function renderBubbles(data, theme = 'dark') {
    currentTheme = theme;
    bubbleData = data;
    
    // Clear existing
    if (bubbleGroup) {
        bubbleGroup.innerHTML = '';
    }
    
    // Clear old gradients
    const oldGradients = defsElement.querySelectorAll('linearGradient[id^="gradient-"]');
    oldGradients.forEach(g => g.remove());
    
    // Calculate positions
    const containerWidth = svgElement.clientWidth || 1200;
    const containerHeight = svgElement.clientHeight || 800;
    const positions = calculateBubblePositions(data.length, containerWidth, containerHeight);
    
    // Render each bubble
    data.forEach((coin, index) => {
        const bubble = renderBubble(coin, index, theme, positions[index]);
        bubbleGroup.appendChild(bubble);
    });
}

/**
 * Animate bubbles (idle rotation)
 */
function animateBubbles() {
    if (!bubbleGroup) return;
    
    const bubbles = bubbleGroup.querySelectorAll('.bubble');
    
    bubbles.forEach(bubble => {
        const coin = bubble._coin;
        if (!coin) return;
        
        // Update rotation
        bubble._rotation += coin.rotationSpeed;
        
        // Recreate ribbon with new rotation
        const ribbon = createTwistedRibbon(
            coin.radius * coin.size,
            coin.twists,
            coin.width * coin.size,
            coin.segments,
            { height: 150 * coin.size }
        );
        
        // Apply rotation to ribbon
        ribbon.forEach(segment => {
            segment.front = segment.front.map(p => rotateZ(p, bubble._rotation));
            segment.back = segment.back.map(p => rotateZ(p, bubble._rotation));
        });
        
        // Sort by Z
        ribbon.sort((a, b) => a.centerZ - b.centerZ);
        
        // Update paths
        const paths = bubble.querySelectorAll('path');
        paths.forEach((path, i) => {
            if (ribbon[i]) {
                const center = bubble._position;
                const p1 = project3D(ribbon[i].front[0], 600, center);
                const p2 = project3D(ribbon[i].front[1], 600, center);
                const p3 = project3D(ribbon[i].front[2], 600, center);
                const p4 = project3D(ribbon[i].front[3], 600, center);
                
                const d = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`;
                path.setAttribute('d', d);
            }
        });
    });
    
    animationId = requestAnimationFrame(animateBubbles);
}

/**
 * Start animation loop
 */
function startAnimation() {
    if (!animationId) {
        animateBubbles();
    }
}

/**
 * Stop animation loop
 */
function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// ============================================
// 5. INTERACTIONS & STATS
// ============================================

/**
 * Update statistics display
 * @param {Array} data - Coin data
 */
function updateStats(data) {
    const bullish = data.filter(c => c.change24h > 0).length;
    const bearish = data.filter(c => c.change24h < 0).length;
    const neutral = data.filter(c => c.change24h === 0).length;
    
    const statsElement = document.getElementById('bubble-stats');
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="stat-item bullish">
                <span class="stat-value">${bullish}</span>
                <span class="stat-label">Bullish</span>
            </div>
            <div class="stat-item bearish">
                <span class="stat-value">${bearish}</span>
                <span class="stat-label">Bearish</span>
            </div>
            <div class="stat-item neutral">
                <span class="stat-value">${neutral}</span>
                <span class="stat-label">Neutral</span>
            </div>
        `;
    }
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('bubbleStatsUpdate', {
        detail: { bullish, bearish, neutral, total: data.length }
    }));
}

/**
 * Handle bubble click
 * @param {Object} coin - Coin data
 */
function handleBubbleClick(coin) {
    showModal(coin);
}

// ============================================
// 6. MODAL
// ============================================

let modalElement = null;
let modalOverlay = null;

/**
 * Create modal structure
 */
function createModalStructure() {
    // Overlay
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'bubble-modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
    `;
    
    // Modal
    modalElement = document.createElement('div');
    modalElement.id = 'bubble-modal';
    modalElement.style.cssText = `
        background: ${currentTheme === 'dark' ? '#1a1a2e' : '#ffffff'};
        border-radius: 16px;
        padding: 24px;
        min-width: 320px;
        max-width: 400px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        border: 1px solid ${currentTheme === 'dark' ? '#333' : '#e0e0e0'};
        color: ${currentTheme === 'dark' ? '#fff' : '#1a1a1a'};
        font-family: system-ui, -apple-system, sans-serif;
    `;
    
    modalOverlay.appendChild(modalElement);
    document.body.appendChild(modalOverlay);
    
    // Close on overlay click
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            hideModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
            hideModal();
        }
    });
}

/**
 * Show modal with coin data
 * @param {Object} coin - Coin data
 */
function showModal(coin) {
    if (!modalOverlay) {
        createModalStructure();
    }
    
    const colors = getBubbleColor(coin.change24h, currentTheme);
    const isPositive = coin.change24h >= 0;
    
    modalElement.style.background = currentTheme === 'dark' ? '#1a1a2e' : '#ffffff';
    modalElement.style.color = currentTheme === 'dark' ? '#fff' : '#1a1a1a';
    modalElement.style.borderColor = currentTheme === 'dark' ? '#333' : '#e0e0e0';
    
    modalElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 18px;
                    color: white;
                    box-shadow: 0 0 20px ${colors.glow};
                ">${coin.symbol.slice(0, 2)}</div>
                <div>
                    <h2 style="margin: 0; font-size: 24px; font-weight: 700;">${coin.symbol}</h2>
                    <span style="font-size: 12px; opacity: 0.7;">${coin.fullSymbol}</span>
                </div>
            </div>
            <button onclick="hideModal()" style="
                background: none;
                border: none;
                color: ${currentTheme === 'dark' ? '#888' : '#666'};
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s;
            " onmouseover="this.style.background='${currentTheme === 'dark' ? '#333' : '#f0f0f0'}'" 
            onmouseout="this.style.background='none'">&times;</button>
        </div>
        
        <div style="margin-bottom: 24px;">
            <div style="font-size: 36px; font-weight: 700; margin-bottom: 8px;">
                $${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
            </div>
            <div style="
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                border-radius: 20px;
                background: ${isPositive ? 'rgba(0, 255, 150, 0.15)' : 'rgba(255, 50, 100, 0.15)'};
                color: ${colors.text};
                font-weight: 600;
                font-size: 14px;
            ">
                <span>${isPositive ? '▲' : '▼'}</span>
                ${Math.abs(coin.change24h).toFixed(2)}% (24h)
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="
                background: ${currentTheme === 'dark' ? '#0f0f1a' : '#f5f5f7'};
                padding: 12px;
                border-radius: 10px;
            ">
                <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">24h Volume</div>
                <div style="font-size: 14px; font-weight: 600;">$${(coin.volume24h / 1e6).toFixed(2)}M</div>
            </div>
            <div style="
                background: ${currentTheme === 'dark' ? '#0f0f1a' : '#f5f5f7'};
                padding: 12px;
                border-radius: 10px;
            ">
                <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">24h Turnover</div>
                <div style="font-size: 14px; font-weight: 600;">$${(coin.turnover24h / 1e6).toFixed(2)}M</div>
            </div>
            <div style="
                background: ${currentTheme === 'dark' ? '#0f0f1a' : '#f5f5f7'};
                padding: 12px;
                border-radius: 10px;
            ">
                <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">24h High</div>
                <div style="font-size: 14px; font-weight: 600; color: #00c853;">$${coin.high24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
            </div>
            <div style="
                background: ${currentTheme === 'dark' ? '#0f0f1a' : '#f5f5f7'};
                padding: 12px;
                border-radius: 10px;
            ">
                <div style="font-size: 11px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">24h Low</div>
                <div style="font-size: 14px; font-weight: 600; color: #ff5252;">$${coin.low24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
            </div>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid ${currentTheme === 'dark' ? '#333' : '#e0e0e0'};">
            <a href="https://www.bybit.com/trade/usdt/${coin.symbol}" target="_blank" style="
                display: block;
                text-align: center;
                padding: 12px;
                background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
                color: white;
                text-decoration: none;
                border-radius: 10px;
                font-weight: 600;
                font-size: 14px;
                transition: transform 0.2s, box-shadow 0.2s;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px ${colors.glow}'"
            onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
                Trade on Bybit →
            </a>
        </div>
    `;
    
    modalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Hide modal
 */
function hideModal() {
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ============================================
// 7. INITIALIZATION
// ============================================

/**
 * Initialize the bubble system
 * @param {string} containerId - ID of container element
 * @param {Object} options - Configuration options
 */
function initBubbleSystem(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container #${containerId} not found`);
        return;
    }
    
    // Create SVG element
    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('width', '100%');
    svgElement.setAttribute('height', '100%');
    svgElement.style.display = 'block';
    
    // Create defs
    defsElement = createSVGDefs();
    svgElement.appendChild(defsElement);
    
    // Create bubble group
    bubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    bubbleGroup.setAttribute('id', 'bubble-container');
    svgElement.appendChild(bubbleGroup);
    
    container.appendChild(svgElement);
    
    // Set theme
    currentTheme = options.theme || 'dark';
    
    // Start data updates
    startDataUpdates((data) => {
        renderBubbles(data, currentTheme);
    });
    
    // Start animation
    startAnimation();
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (bubbleData.length > 0) {
            renderBubbles(bubbleData, currentTheme);
        }
    });
    
    console.log('🫧 Bubble System initialized');
}

/**
 * Set theme
 * @param {string} theme - 'dark' or 'light'
 */
function setBubbleTheme(theme) {
    currentTheme = theme;
    if (bubbleData.length > 0) {
        renderBubbles(bubbleData, theme);
    }
}

/**
 * Destroy bubble system
 */
function destroyBubbleSystem() {
    stopAnimation();
    stopDataUpdates();
    
    if (modalOverlay) {
        modalOverlay.remove();
        modalOverlay = null;
        modalElement = null;
    }
    
    if (svgElement && svgElement.parentNode) {
        svgElement.parentNode.removeChild(svgElement);
    }
    
    svgElement = null;
    bubbleGroup = null;
    defsElement = null;
    bubbleData = [];
}

// ============================================
// 8. EXPORTS
// ============================================

// ES Module exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initBubbleSystem,
        destroyBubbleSystem,
        setBubbleTheme,
        renderBubbles,
        startAnimation,
        stopAnimation,
        showModal,
        hideModal,
        // Geometry functions
        rotateZ,
        project3D,
        createTwistedRibbon,
        // Color functions
        getBubbleColor,
        // Data functions
        fetchBybitData,
        processData,
        startDataUpdates,
        stopDataUpdates
    };
}

// Browser globals
if (typeof window !== 'undefined') {
    window.BubbleSystem = {
        init: initBubbleSystem,
        destroy: destroyBubbleSystem,
        setTheme: setBubbleTheme,
        render: renderBubbles,
        startAnimation,
        stopAnimation,
        showModal,
        hideModal,
        // Utilities
        geometry: {
            rotateZ,
            project3D,
            createTwistedRibbon
        },
        colors: {
            getBubbleColor,
            getBubbleBackground
        },
        data: {
            fetch: fetchBybitData,
            process: processData,
            startUpdates: startDataUpdates,
            stopUpdates: stopDataUpdates
        }
    };
}
