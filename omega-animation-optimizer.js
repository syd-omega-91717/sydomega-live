/* Ω Animation Optimizer - GPU-accelerated animations, frame rate control
   Purpose: Smooth animations with optimal performance, reduce jank */

(function(){
  if(window.__omegaAnimationOptimizer) return;
  window.__omegaAnimationOptimizer = true;

  window.OmegaAnimations = {
    // RAF-based animation frame budget
    frameTime: 16.67, // 60fps
    lastFrame: 0,
    animations: [],

    // Throttled requestAnimationFrame
    throttledRAF: (callback) => {
      const now = performance.now();
      const elapsed = now - this.lastFrame;
      
      if(elapsed >= this.frameTime) {
        this.lastFrame = now;
        callback(now);
      } else {
        requestAnimationFrame(() => this.throttledRAF(callback));
      }
    },

    // GPU-accelerated animation helpers
    createGPUAnimation: (element, keyframes, duration) => {
      element.style.willChange = 'transform, opacity';
      const animation = element.animate(keyframes, {
        duration,
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        fill: 'both'
      });
      
      animation.onfinish = () => {
        element.style.willChange = 'auto';
      };
      
      return animation;
    },

    // Stagger animations efficiently
    staggerAnimations: (elements, duration, delay = 50) => {
      return elements.map((el, i) => {
        return this.createGPUAnimation(el, 
          [{opacity: 0, transform: 'translateY(10px)'}, 
           {opacity: 1, transform: 'translateY(0)'}],
          duration
        );
      });
    },

    // Reduce motion support
    shouldReduceMotion: () => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    // Intersection-triggered animations
    observeForAnimation: (selector, animationFn) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting) {
            animationFn(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, {threshold: 0.1});

      document.querySelectorAll(selector).forEach(el => observer.observe(el));
    }
  };
})();
