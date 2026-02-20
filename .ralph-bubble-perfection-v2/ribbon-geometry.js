/**
 * Ribbon Geometry - 3D Twisted Ribbon Path Generator
 * Creates SVG paths for twisted ribbon shapes with 3D depth illusion
 */

/**
 * Convert degrees to radians
 */
function toRad(deg) {
  return deg * Math.PI / 180;
}

/**
 * Create a 3D point with x, y, z coordinates
 */
function Point3D(x, y, z = 0) {
  return { x, y, z };
}

/**
 * Rotate a point around the Z axis (for twist effect)
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
 * Project 3D point to 2D with perspective
 * @param {Object} p - 3D point {x, y, z}
 * @param {number} focalLength - Focal length for perspective (default: 800)
 * @param {Object} center - Center of projection {x, y}
 */
function project3D(p, focalLength = 800, center = { x: 0, y: 0 }) {
  const scale = focalLength / (focalLength + p.z);
  return {
    x: center.x + p.x * scale,
    y: center.y + p.y * scale,
    scale: scale
  };
}

/**
 * Generate points along a spiral path with increasing radius
 * @param {number} startRadius - Starting radius from center
 * @param {number} endRadius - Ending radius
 * @param {number} turns - Number of spiral turns
 * @param {number} segments - Number of segments to generate
 * @param {number} zSpread - How much the ribbon moves in Z direction
 */
function generateSpiralPoints(startRadius, endRadius, turns, segments, zSpread = 100) {
  const points = [];
  const totalAngle = turns * 2 * Math.PI;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * totalAngle;
    
    // Radius grows from start to end
    const radius = startRadius + (endRadius - startRadius) * t;
    
    // Base spiral position
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    // Z depth - ribbon comes toward viewer (negative Z is closer)
    // Use a curve so it doesn't just linearly approach
    const z = -zSpread * Math.sin(t * Math.PI * 0.5);
    
    // Calculate the tangent direction for width orientation
    const tangentAngle = angle + Math.PI / 2;
    
    points.push({
      center: { x, y, z },
      angle: angle,
      tangentAngle: tangentAngle,
      t: t,
      radius: radius
    });
  }
  
  return points;
}

/**
 * Generate the twisted ribbon path data
 * @param {number} x - Center X position
 * @param {number} y - Center Y position  
 * @param {number} radius - Maximum radius of the spiral
 * @param {number} twist - Number of twists along the ribbon
 * @param {number} width - Width of the ribbon strip
 * @param {Object} options - Additional options
 * @returns {Object} Path data with front and back edges
 */
function generateRibbonPath(x, y, radius, twist, width, options = {}) {
  const {
    turns = 2.5,
    segments = 60,
    startRadius = 10,
    zSpread = 150,
    perspective = 800
  } = options;
  
  // Generate base spiral points
  const spiralPoints = generateSpiralPoints(startRadius, radius, turns, segments, zSpread);
  
  const frontEdge = [];
  const backEdge = [];
  
  for (let i = 0; i < spiralPoints.length; i++) {
    const sp = spiralPoints[i];
    const t = sp.t;
    
    // Calculate twist angle at this position
    const twistAngle = t * twist * 2 * Math.PI;
    
    // Width vector perpendicular to tangent
    const halfWidth = width / 2;
    
    // Base width direction (perpendicular to spiral tangent)
    const wx = Math.cos(sp.tangentAngle) * halfWidth;
    const wy = Math.sin(sp.tangentAngle) * halfWidth;
    
    // Apply twist by rotating the width vector
    const twistedFront = rotateZ({ x: wx, y: wy, z: 0 }, twistAngle);
    const twistedBack = rotateZ({ x: -wx, y: -wy, z: 0 }, twistAngle);
    
    // Create 3D points for front and back edges of ribbon
    const front3D = {
      x: sp.center.x + twistedFront.x,
      y: sp.center.y + twistedFront.y,
      z: sp.center.z + twistedFront.z
    };
    
    const back3D = {
      x: sp.center.x + twistedBack.x,
      y: sp.center.y + twistedBack.y,
      z: sp.center.z + twistedBack.z
    };
    
    // Project to 2D with perspective
    const front2D = project3D(front3D, perspective, { x: x, y: y });
    const back2D = project3D(back3D, perspective, { x: x, y: y });
    
    frontEdge.push({
      x: front2D.x,
      y: front2D.y,
      z: front3D.z,
      scale: front2D.scale,
      original: front3D
    });
    
    backEdge.push({
      x: back2D.x,
      y: back2D.y,
      z: back3D.z,
      scale: back2D.scale,
      original: back3D
    });
  }
  
  return {
    frontEdge,
    backEdge,
    center: spiralPoints.map(sp => project3D(sp.center, perspective, { x, y }))
  };
}

/**
 * Create SVG path string from edge points using quadratic bezier curves
 * @param {Array} points - Array of {x, y} points
 * @param {boolean} reverse - Whether to reverse the order
 * @param {boolean} closed - Whether to close the path
 */
function createSmoothPath(points, reverse = false, closed = false) {
  if (points.length < 2) return '';
  
  const pts = reverse ? [...points].reverse() : points;
  
  // Start at first point
  let path = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  
  // Use quadratic bezier for smooth curves
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    
    // Calculate control point for smooth curve
    const cpx = (prev.x + curr.x) / 2;
    const cpy = (prev.y + curr.y) / 2;
    
    if (i === 1) {
      // First segment - simple line to control point
      path += ` Q ${cpx.toFixed(2)} ${cpy.toFixed(2)} ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
    } else {
      // Subsequent segments - continue curve
      path += ` T ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
    }
  }
  
  if (closed) {
    path += ' Z';
  }
  
  return path;
}

/**
 * Create a complete twisted ribbon as SVG path
 * @param {number} radius - Maximum radius of the spiral
 * @param {number} turns - Number of spiral turns
 * @param {number} width - Width of the ribbon
 * @param {number} segments - Number of segments for smoothness
 * @param {Object} options - Additional configuration
 * @returns {Object} SVG path strings for different ribbon parts
 */
function createTwistedRibbon(radius, turns, width, segments, options = {}) {
  const {
    centerX = 0,
    centerY = 0,
    twist = 3,           // Number of twists around its axis
    zSpread = 150,       // Depth spread
    perspective = 800,   // Perspective focal length
    thickness = 0        // Thickness for 3D edge
  } = options;
  
  // Generate the ribbon path data
  const ribbon = generateRibbonPath(centerX, centerY, radius, twist, width, {
    turns,
    segments,
    zSpread,
    perspective
  });
  
  // Create the main ribbon surface path (front face visible parts)
  const frontPath = createSmoothPath(ribbon.frontEdge, false, false);
  const backPath = createSmoothPath(ribbon.backEdge, true, false);
  
  // Combine for a filled ribbon shape
  // We need to determine which parts of front/back are visible based on Z
  const ribbonPath = combineRibbonFaces(ribbon.frontEdge, ribbon.backEdge);
  
  return {
    front: frontPath,
    back: backPath,
    combined: ribbonPath,
    edges: {
      front: ribbon.frontEdge,
      back: ribbon.backEdge
    },
    toSVG: function(attrs = {}) {
      const defaultAttrs = 'fill="none" stroke="#ff69b4" stroke-width="2"';
      const attrString = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<path d="${ribbonPath}" ${attrString || defaultAttrs} />`;
    }
  };
}

/**
 * Combine front and back edges to create a proper ribbon shape
 * that accounts for 3D visibility
 */
function combineRibbonFaces(frontEdge, backEdge) {
  if (frontEdge.length === 0 || backEdge.length === 0) return '';
  
  // Start with front edge going outward
  let path = `M ${frontEdge[0].x.toFixed(2)} ${frontEdge[0].y.toFixed(2)}`;
  
  // Follow front edge
  for (let i = 1; i < frontEdge.length; i++) {
    const prev = frontEdge[i - 1];
    const curr = frontEdge[i];
    const cpx = (prev.x + curr.x) / 2;
    const cpy = (prev.y + curr.y) / 2;
    
    if (i === 1) {
      path += ` Q ${cpx.toFixed(2)} ${cpy.toFixed(2)} ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
    } else {
      path += ` T ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
    }
  }
  
  // Connect to back edge at outer end
  path += ` L ${backEdge[backEdge.length - 1].x.toFixed(2)} ${backEdge[backEdge.length - 1].y.toFixed(2)}`;
  
  // Follow back edge inward (reverse)
  for (let i = backEdge.length - 2; i >= 0; i--) {
    const next = backEdge[i + 1];
    const curr = backEdge[i];
    const cpx = (next.x + curr.x) / 2;
    const cpy = (next.y + curr.y) / 2;
    
    if (i === backEdge.length - 2) {
      path += ` Q ${cpx.toFixed(2)} ${cpy.toFixed(2)} ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
    } else {
      path += ` T ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
    }
  }
  
  // Close the path
  path += ' Z';
  
  return path;
}

/**
 * Add thickness/depth illusion to a ribbon path
 * Creates multiple offset paths to simulate 3D thickness
 * @param {string} path - Original SVG path
 * @param {number} thickness - Thickness amount
 * @returns {Array} Array of path strings for layered depth effect
 */
function addRibbonThickness(path, thickness) {
  const layers = [];
  const steps = 3; // Number of depth layers
  
  for (let i = 0; i < steps; i++) {
    const offset = (i / (steps - 1)) * thickness;
    const opacity = 1 - (i * 0.3);
    
    // Create offset by translating the path slightly
    // This is a simplified approach - true offset paths are complex
    layers.push({
      path: path,
      offset: { x: offset, y: offset },
      opacity: opacity,
      layer: i
    });
  }
  
  return layers;
}

/**
 * Create multiple twisted ribbons radiating from center (like the reference image)
 * @param {number} count - Number of ribbons
 * @param {Object} options - Configuration options
 * @returns {Array} Array of ribbon path objects
 */
function createRibbonBurst(count, options = {}) {
  const {
    centerX = 0,
    centerY = 0,
    maxRadius = 200,
    turns = 2.5,
    width = 30,
    twist = 3,
    segments = 50
  } = options;
  
  const ribbons = [];
  const angleStep = (2 * Math.PI) / count;
  
  for (let i = 0; i < count; i++) {
    const rotationOffset = i * angleStep;
    
    // Each ribbon has slightly different parameters for variety
    const ribbon = createTwistedRibbon(maxRadius, turns, width, segments, {
      centerX,
      centerY,
      twist: twist + (i * 0.5), // Varying twist per ribbon
      zSpread: 100 + (i * 20),
      perspective: 800
    });
    
    // Store rotation info for rendering
    ribbon.rotation = rotationOffset;
    ribbon.index = i;
    
    ribbons.push(ribbon);
  }
  
  return ribbons;
}

/**
 * Generate complete SVG with multiple ribbons and styling
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @param {Array} ribbons - Array of ribbon objects
 * @returns {string} Complete SVG markup
 */
function generateSVG(width, height, ribbons) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">\n`;
  svg += `  <defs>\n`;
  svg += `    <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">\n`;
  svg += `      <stop offset="0%" style="stop-color:#ff69b4;stop-opacity:1" />\n`;
  svg += `      <stop offset="50%" style="stop-color:#da70d6;stop-opacity:1" />\n`;
  svg += `      <stop offset="100%" style="stop-color:#ff1493;stop-opacity:1" />\n`;
  svg += `    </linearGradient>\n`;
  svg += `    <filter id="glow">\n`;
  svg += `      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>\n`;
  svg += `      <feMerge>\n`;
  svg += `        <feMergeNode in="coloredBlur"/>\n`;
  svg += `        <feMergeNode in="SourceGraphic"/>\n`;
  svg += `      </feMerge>\n`;
  svg += `    </filter>\n`;
  svg += `  </defs>\n`;
  svg += `  <rect width="100%" height="100%" fill="#0a0a0a" />\n`;
  
  // Render ribbons
  ribbons.forEach((ribbon, i) => {
    const color = i % 2 === 0 ? 'url(#ribbonGrad)' : '#ff69b4';
    svg += `  <path d="${ribbon.combined}" fill="${color}" fill-opacity="0.8" stroke="#ffb6c1" stroke-width="1" filter="url(#glow)" />\n`;
  });
  
  svg += `</svg>`;
  
  return svg;
}

// Export functions for use in modules or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createTwistedRibbon,
    generateRibbonPath,
    addRibbonThickness,
    createRibbonBurst,
    generateSVG,
    // Internal helpers (exported for advanced use)
    generateSpiralPoints,
    project3D,
    rotateZ,
    createSmoothPath,
    combineRibbonFaces
  };
}

// Browser global
if (typeof window !== 'undefined') {
  window.RibbonGeometry = {
    createTwistedRibbon,
    generateRibbonPath,
    addRibbonThickness,
    createRibbonBurst,
    generateSVG
  };
}
