/**
 * Ribbon Geometry - Usage Examples
 * 
 * This file demonstrates how to use the ribbon-geometry.js module
 */

// Example 1: Create a single twisted ribbon
const ribbon1 = RibbonGeometry.createTwistedRibbon(200, 2.5, 30, 60, {
    centerX: 400,
    centerY: 300,
    twist: 3,
    zSpread: 150,
    perspective: 800
});

// Get SVG path string
console.log(ribbon1.combined);  // Full ribbon path
console.log(ribbon1.front);     // Front edge only
console.log(ribbon1.back);      // Back edge only

// Create SVG element
const svgElement = ribbon1.toSVG({
    fill: '#ff69b4',
    'fill-opacity': '0.8',
    stroke: '#ffb6c1',
    'stroke-width': '2',
    filter: 'url(#glow)'
});

// Example 2: Generate raw ribbon path data
const ribbonData = RibbonGeometry.generateRibbonPath(400, 300, 200, 3, 30, {
    turns: 2.5,
    segments: 60,
    zSpread: 150,
    perspective: 800
});

// Access edge points
console.log(ribbonData.frontEdge);  // Array of {x, y, z, scale}
console.log(ribbonData.backEdge);   // Array of {x, y, z, scale}

// Example 3: Create a burst of multiple ribbons
const ribbons = RibbonGeometry.createRibbonBurst(5, {
    centerX: 400,
    centerY: 300,
    maxRadius: 200,
    turns: 2.5,
    width: 25,
    twist: 3,
    segments: 50
});

// Render all ribbons
ribbons.forEach((ribbon, i) => {
    console.log(`Ribbon ${i}:`, ribbon.combined);
});

// Example 4: Add thickness/depth effect
const thicknessLayers = RibbonGeometry.addRibbonThickness(ribbon1.combined, 5);
thicknessLayers.forEach(layer => {
    console.log(`Layer ${layer.layer}: offset(${layer.offset.x}, ${layer.offset.y}), opacity: ${layer.opacity}`);
});

// Example 5: Generate complete SVG with multiple ribbons
const fullSVG = RibbonGeometry.generateSVG(800, 600, ribbons);
console.log(fullSVG);

// Example 6: Animate ribbons (conceptual)
function animateRibbon(frame) {
    const twist = 3 + Math.sin(frame * 0.05) * 1;
    const ribbon = RibbonGeometry.createTwistedRibbon(200, 2.5, 30, 60, {
        centerX: 400,
        centerY: 300,
        twist: twist,
        zSpread: 150,
        perspective: 800
    });
    return ribbon.combined;
}

// Example 7: Custom styling for each ribbon segment
function createStyledRibbon() {
    const ribbon = RibbonGeometry.createTwistedRibbon(200, 2.5, 40, 40, {
        centerX: 400,
        centerY: 300,
        twist: 2.5,
        zSpread: 120
    });
    
    // Access individual edge points for custom rendering
    ribbon.edges.front.forEach((point, i) => {
        // Could add per-point styling here
        console.log(`Point ${i}: x=${point.x.toFixed(2)}, y=${point.y.toFixed(2)}, z=${point.z.toFixed(2)}`);
    });
    
    return ribbon;
}

// Export examples for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        example1: ribbon1,
        example2: ribbonData,
        example3: ribbons,
        animateRibbon
    };
}
