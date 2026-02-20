/**
 * Bubble Animations - Ralph-4 Animation Polish
 * Premium 3D bubble animations that feel ALIVE
 * 
 * The image suggests: flowing, glowing, alive motion
 * Purple neon edges, metallic sheen, twisting depth
 */

class BubbleAnimations {
  constructor(element) {
    this.element = element;
    this.isAnimating = false;
    this.currentAnimation = null;
    
    // Ensure element has 3D context
    this.element.style.transformStyle = 'preserve-3d';
    this.element.style.perspective = '1000px';
    this.element.style.willChange = 'transform, filter';
  }

  /**
   * 1. idleGlow - Subtle pulse of neon edges (breathing effect)
   * Like the bubble is alive, gently breathing
   */
  idleGlow(duration = 3000) {
    this.stopCurrent();
    this.currentAnimation = 'idleGlow';
    
    this.element.style.animation = `metallicPulse ${duration}ms ease-in-out infinite`;
    
    return {
      name: 'idleGlow',
      duration,
      description: 'Subtle breathing pulse on neon edges'
    };
  }

  /**
   * 2. spin3D - True 3D rotation with perspective change
   * Not just flat 2D spin - this has depth and axis rotation
   */
  spin3D(duration = 4000, direction = 'clockwise') {
    this.stopCurrent();
    this.currentAnimation = 'spin3D';
    
    const rotation = direction === 'clockwise' ? '360deg' : '-360deg';
    this.element.style.animation = `twistSpin ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1) infinite`;
    this.element.style.setProperty('--spin-direction', rotation);
    
    return {
      name: 'spin3D',
      duration,
      direction,
      description: '3D rotation with perspective depth'
    };
  }

  /**
   * 3. expandOpen - Elastic scale up with glow intensification
   * Like the bubble is bursting into existence
   */
  expandOpen(duration = 800) {
    this.stopCurrent();
    this.isAnimating = true;
    this.currentAnimation = 'expandOpen';
    
    // One-shot animation with elastic ease
    this.element.style.animation = `expandPop ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`;
    
    // Reset after animation completes
    setTimeout(() => {
      this.isAnimating = false;
    }, duration);
    
    return {
      name: 'expandOpen',
      duration,
      description: 'Elastic expansion with intensified glow'
    };
  }

  /**
   * 4. hoverLift - Slight rise with increased glow
 * Interaction response - the bubble responds to presence
   */
  hoverLift(enable = true) {
    if (!enable) {
      this.element.classList.remove('bubble-hover-lift');
      return { name: 'hoverLift', enabled: false };
    }
    
    this.element.classList.add('bubble-hover-lift');
    
    return {
      name: 'hoverLift',
      enabled: true,
      description: 'Slight rise with intensified glow on hover'
    };
  }

  /**
   * 5. colorFlow - Gradient position shift for metallic shimmer
   * The surface moves like liquid metal
   */
  colorFlow(duration = 6000) {
    this.stopCurrent();
    this.currentAnimation = 'colorFlow';
    
    this.element.style.animation = `shimmer ${duration}ms linear infinite`;
    
    return {
      name: 'colorFlow',
      duration,
      description: 'Flowing metallic shimmer across surface'
    };
  }

  /**
   * Premium combo: All animations layered
   * For maximum "alive and premium" feel
   */
  awaken() {
    this.stopCurrent();
    this.currentAnimation = 'awaken';
    
    // Layer multiple animations
    this.element.style.animation = `
      metallicPulse 3000ms ease-in-out infinite,
      twistSpin 8000ms cubic-bezier(0.34, 1.56, 0.64, 1) infinite,
      shimmer 5000ms linear infinite
    `;
    
    return {
      name: 'awaken',
      description: 'Full premium combo - pulse, spin, and shimmer'
    };
  }

  /**
   * Entrance animation sequence
   * expandOpen → transition to idleGlow
   */
  entrance() {
    this.expandOpen(800);
    
    setTimeout(() => {
      this.idleGlow(3000);
    }, 800);
    
    return {
      name: 'entrance',
      description: 'Expand then settle into gentle breathing'
    };
  }

  /**
   * Stop all current animations
   */
  stopCurrent() {
    this.element.style.animation = '';
    this.isAnimating = false;
  }

  /**
   * Reset to default state
   */
  reset() {
    this.stopCurrent();
    this.element.classList.remove('bubble-hover-lift');
    this.currentAnimation = null;
    this.element.style.transform = '';
    this.element.style.filter = '';
  }
}

// Auto-initialize if data attribute present
document.addEventListener('DOMContentLoaded', () => {
  const bubbles = document.querySelectorAll('[data-bubble-animate]');
  
  bubbles.forEach(bubble => {
    const anim = new BubbleAnimations(bubble);
    const animationType = bubble.dataset.bubbleAnimate;
    
    switch(animationType) {
      case 'idle':
        anim.idleGlow();
        break;
      case 'spin':
        anim.spin3D();
        break;
      case 'flow':
        anim.colorFlow();
        break;
      case 'awaken':
        anim.awaken();
        break;
      case 'entrance':
        anim.entrance();
        break;
    }
    
    // Auto-enable hover lift unless disabled
    if (bubble.dataset.bubbleHover !== 'false') {
      anim.hoverLift(true);
    }
    
    // Store reference for external control
    bubble._bubbleAnimator = anim;
  });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BubbleAnimations;
}
