/**
 * Ω ORBITAL RING — Interactive Navigation Ring
 *
 * SVG-based orbital ring with interactive nodes for:
 * - Agent hub navigation
 * - Domain showcase
 * - Section overview
 * - Interactive navigation depth cues
 *
 * Usage:
 *   <div data-omega-orbital data-orbital-nodes="agents,sentinels,scouts"
 *        data-orbital-links="agents.html,sentinels.html,scouts.html">
 *   </div>
 *
 * Attributes:
 *   data-omega-orbital            — Enable orbital ring
 *   data-orbital-nodes            — Comma-separated node labels
 *   data-orbital-links            — Comma-separated URLs
 *   data-orbital-radius           — Ring radius (default: 120)
 *   data-orbital-size             — SVG size (default: 300)
 *   data-orbital-animated         — Add slow rotation (default: false)
 *
 * Performance: Lightweight SVG, no JavaScript animation loops
 * Accessibility: Links are semantic <a> tags inside SVG
 */

(function() {
  'use strict';

  class OrbitalRing {
    constructor(selector = '[data-omega-orbital]') {
      this.containers = document.querySelectorAll(selector);
      this.containers.forEach((container) => {
        this.render(container);
      });
    }

    render(container) {
      // Parse attributes
      const radius = parseInt(container.dataset.orbitalRadius || '120', 10);
      const size = parseInt(container.dataset.orbitalSize || '300', 10);
      const animated = container.dataset.orbitalAnimated === 'true';

      const nodesStr = container.dataset.orbitalNodes || '';
      const linksStr = container.dataset.orbitalLinks || '';

      const nodes = nodesStr.split(',').map((n) => n.trim()).filter(Boolean);
      const links = linksStr.split(',').map((l) => l.trim()).filter(Boolean);

      if (nodes.length === 0) {
        console.warn('OrbitalRing: no nodes specified', container);
        return;
      }

      // Create SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `-${size / 2} -${size / 2} ${size} ${size}`);
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
      svg.setAttribute('class', 'orbital-ring-svg');
      svg.style.cssText = `
        filter: drop-shadow(0 0 20px rgba(204, 169, 106, 0.2));
        ${animated ? 'animation: orbit-slow 60s linear infinite;' : ''}
      `;

      // Background ring
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('r', radius);
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', 'var(--gold, #ccaa6a)');
      ring.setAttribute('stroke-width', '1');
      ring.setAttribute('opacity', '0.3');
      svg.appendChild(ring);

      // Inner and outer accent rings
      const innerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      innerRing.setAttribute('r', radius - 6);
      innerRing.setAttribute('fill', 'none');
      innerRing.setAttribute('stroke', 'var(--cyan, #00ffff)');
      innerRing.setAttribute('stroke-width', '0.5');
      innerRing.setAttribute('opacity', '0.2');
      svg.appendChild(innerRing);

      const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      outerRing.setAttribute('r', radius + 6);
      outerRing.setAttribute('fill', 'none');
      outerRing.setAttribute('stroke', 'var(--gold, #ccaa6a)');
      outerRing.setAttribute('stroke-width', '0.5');
      outerRing.setAttribute('opacity', '0.15');
      svg.appendChild(outerRing);

      // Center orb
      const orb = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      orb.setAttribute('r', '4');
      orb.setAttribute('fill', 'var(--cyan, #00ffff)');
      orb.setAttribute('opacity', '0.8');
      orb.style.cssText = 'filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.6));';
      svg.appendChild(orb);

      // Node groups on the ring
      nodes.forEach((label, index) => {
        const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2; // Start at top
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const link = links[index] || '#';
        const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'a');
        nodeGroup.setAttribute('href', link);
        nodeGroup.setAttribute('class', 'orbital-node');
        nodeGroup.setAttribute('data-node-label', label);
        nodeGroup.style.cssText = 'cursor: pointer; text-decoration: none;';

        // Node circle
        const nodeCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        nodeCircle.setAttribute('cx', x);
        nodeCircle.setAttribute('cy', y);
        nodeCircle.setAttribute('r', '6');
        nodeCircle.setAttribute('fill', 'var(--gold, #ccaa6a)');
        nodeCircle.setAttribute('opacity', '0.6');
        nodeCircle.setAttribute('class', 'orbital-node-circle');
        nodeGroup.appendChild(nodeCircle);

        // Node label (small text)
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('x', x);
        labelText.setAttribute('y', y + 16);
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('class', 'orbital-node-label');
        labelText.setAttribute('font-size', '11');
        labelText.setAttribute('font-family', 'var(--M, Courier Prime)');
        labelText.setAttribute('fill', 'var(--ink, #ccc)');
        labelText.setAttribute('opacity', '0.6');
        labelText.style.cssText = 'pointer-events: none;';
        labelText.textContent = label.slice(0, 8); // Truncate long labels
        nodeGroup.appendChild(labelText);

        // Hover effect setup
        nodeGroup.addEventListener('mouseenter', () => {
          nodeCircle.setAttribute('opacity', '1');
          nodeCircle.setAttribute('r', '8');
          labelText.setAttribute('opacity', '1');
          labelText.setAttribute('font-size', '12');
          labelText.setAttribute('font-weight', '600');
        });

        nodeGroup.addEventListener('mouseleave', () => {
          nodeCircle.setAttribute('opacity', '0.6');
          nodeCircle.setAttribute('r', '6');
          labelText.setAttribute('opacity', '0.6');
          labelText.setAttribute('font-size', '11');
          labelText.setAttribute('font-weight', 'normal');
        });

        svg.appendChild(nodeGroup);
      });

      // Connection lines from center to nodes
      nodes.forEach((label, index) => {
        const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', '0');
        line.setAttribute('x2', x);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', 'var(--cyan, #00ffff)');
        line.setAttribute('stroke-width', '0.5');
        line.setAttribute('opacity', '0.15');
        line.setAttribute('class', 'orbital-spoke');
        svg.appendChild(line);
      });

      // Add animation keyframes if needed
      if (animated) {
        this.ensureAnimationKeyframes();
      }

      container.appendChild(svg);
    }

    ensureAnimationKeyframes() {
      if (document.getElementById('omega-orbital-keyframes')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'omega-orbital-keyframes';
      style.textContent = `
        @keyframes orbit-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes orbit-slow {
            0%, 100% { transform: rotate(0deg); }
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Expose to window
  window.OrbitalRing = OrbitalRing;

  // Initialize on DOM ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        new OrbitalRing();
      });
    } else {
      new OrbitalRing();
    }
  }

  init();
})();
