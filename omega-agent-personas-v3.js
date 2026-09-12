/**
 * Ω-AGENT PERSONAS v3 — Per-Agent Motion & Behavioral Personalities
 * Each of the 12 agents has a distinct motion signature, greeting cadence, and UI personality.
 * Drives constellation diagrams, agent interactions, and agent-specific entrance animations.
 *
 * Exposed as window.OmegaAgentPersonas: { say(agent), motion(agent), tint(agent) }
 */

(function() {
  'use strict';

  // Per-agent motion personality — timing, easing, entrance behavior
  const AGENT_MOTION = {
    sentinel: {
      entrance: 'shield-drop',      // Fast, protective entrance
      duration: 320,
      easing: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
      pulse: 'alert-sharp',
      greeting_delay: 240,
    },
    merchant: {
      entrance: 'coin-flip',         // Spinning, valuable reveal
      duration: 480,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      pulse: 'wealth-slow',
      greeting_delay: 380,
    },
    scout: {
      entrance: 'arrow-swift',       // Quick directional sweep
      duration: 280,
      easing: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
      pulse: 'dash-continuous',
      greeting_delay: 200,
    },
    warden: {
      entrance: 'veil-lift',         // Protective, careful reveal
      duration: 440,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      pulse: 'watch-steady',
      greeting_delay: 320,
    },
    sovereign: {
      entrance: 'throne-ascend',     // Commanding, regal rise
      duration: 560,
      easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
      pulse: 'reign-majestic',
      greeting_delay: 400,
    },
    auditor: {
      entrance: 'ledger-unfold',     // Methodical, precise reveal
      duration: 400,
      easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      pulse: 'count-precise',
      greeting_delay: 340,
    },
    proxy: {
      entrance: 'scale-balance',     // Balanced, diplomatic entrance
      duration: 420,
      easing: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
      pulse: 'weigh-diplomatic',
      greeting_delay: 300,
    },
    oracle: {
      entrance: 'mist-part',         // Mysterious, gradual appearance
      duration: 680,
      easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
      pulse: 'shimmer-mystic',
      greeting_delay: 480,
    },
    beacon: {
      entrance: 'light-kindle',      // Bright, welcoming burst
      duration: 360,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      pulse: 'glow-warm',
      greeting_delay: 280,
    },
    analyst: {
      entrance: 'graph-build',       // Data-driven, incremental reveal
      duration: 520,
      easing: 'cubic-bezier(0.19, 1, 0.22, 1)',
      pulse: 'tick-steady',
      greeting_delay: 380,
    },
    tutor: {
      entrance: 'lamp-light',        // Illuminating, gradual brightening
      duration: 440,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      pulse: 'learn-patient',
      greeting_delay: 320,
    },
    historian: {
      entrance: 'scroll-unroll',     // Archival, time-bound reveal
      duration: 640,
      easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
      pulse: 'memory-eternal',
      greeting_delay: 420,
    },
  };

  // Element symbols for each agent (visual glyph inside emblem)
  const AGENT_SYMBOLS = {
    sentinel: '⚔',     // Crossed swords / shield
    merchant: '⚖',     // Balance / scales
    scout: '🗺',       // Map
    warden: '🔱',      // Trident (Artemis)
    sovereign: '☀',    // Sun (Apollo)
    auditor: '✓',      // Check mark / verification
    proxy: '↔',        // Bidirectional arrow
    oracle: '◐',       // Moon crescent
    beacon: '⚡',      // Lightning (Zeus / vision)
    analyst: '📊',     // Chart
    tutor: '✎',        // Quill (knowledge)
    historian: '📜',   // Scroll
  };

  /**
   * Get per-agent color tokens
   */
  function getAgentColorTokens(agentName) {
    const normalized = (agentName || 'sentinel').toLowerCase();
    return {
      primary: `var(--agent-${normalized}-primary)`,
      accent: `var(--agent-${normalized}-accent)`,
      glow: `var(--agent-${normalized}-glow)`,
    };
  }

  /**
   * Trigger agent entrance animation on an element
   */
  function agentEntrance(el, agentName) {
    if (!el) return;
    const personality = AGENT_MOTION[agentName] || AGENT_MOTION.sentinel;
    const symbol = AGENT_SYMBOLS[agentName] || '✦';

    el.setAttribute('data-agent', agentName);
    el.setAttribute('data-agent-context', agentName);
    el.style.setProperty('--agent-entrance-duration', `${personality.duration}ms`);
    el.style.setProperty('--agent-entrance-easing', personality.easing);

    // Add animation class
    el.classList.add('agent-motion', `agent-motion-${personality.entrance}`);

    // Emit emblem if not already present
    if (!el.querySelector('.agent-emblem')) {
      const emblem = document.createElement('span');
      emblem.className = 'agent-emblem';
      emblem.textContent = symbol;
      emblem.setAttribute('data-agent', agentName);
      el.insertAdjacentElement('afterbegin', emblem);
    }
  }

  /**
   * Speak agent greeting with personality-specific timing
   */
  function agentGreeting(agentName, text) {
    const personality = AGENT_MOTION[agentName] || AGENT_MOTION.sentinel;
    const greeting = {
      agent: agentName,
      text: text || '',
      delay: personality.greeting_delay,
      entrance: personality.entrance,
    };
    return greeting;
  }

  /**
   * Apply agent color context to an element tree
   */
  function tintAgent(el, agentName) {
    if (!el) return;
    el.setAttribute('data-agent-context', agentName);
    const colors = getAgentColorTokens(agentName);
    el.style.setProperty('--agent-context-color', colors.primary);
  }

  /**
   * Create agent constellation SVG — ring of 12 agents around a center point
   * Returns SVG element positioned at radius, with click handlers
   */
  function createConstellation(onNodeClick) {
    const agents = [
      'sentinel', 'merchant', 'scout', 'warden', 'sovereign', 'auditor',
      'proxy', 'oracle', 'beacon', 'analyst', 'tutor', 'historian'
    ];

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 360 360');
    svg.setAttribute('class', 'constellation-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Agent constellation');

    const centerX = 180;
    const centerY = 180;
    const radius = 140;

    // Draw connection lines between agents (very faint)
    const lines = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    lines.setAttribute('class', 'constellation-lines');
    lines.setAttribute('stroke', 'rgba(255, 255, 255, 0.08)');
    lines.setAttribute('stroke-width', '1');

    agents.forEach((agent, i) => {
      const nextAgent = agents[(i + 1) % agents.length];
      const angle1 = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
      const angle2 = ((i + 1) / agents.length) * Math.PI * 2 - Math.PI / 2;

      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      lines.appendChild(line);
    });
    svg.appendChild(lines);

    // Draw center point
    const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    center.setAttribute('cx', centerX);
    center.setAttribute('cy', centerY);
    center.setAttribute('r', '6');
    center.setAttribute('fill', 'var(--gold)');
    center.setAttribute('opacity', '0.6');
    svg.appendChild(center);

    // Place agent nodes around the ring
    const nodes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodes.setAttribute('class', 'constellation-nodes');

    agents.forEach((agent, i) => {
      const angle = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'agent-node-group');
      group.setAttribute('data-agent', agent);

      // Clickable circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '14');
      circle.setAttribute('class', 'agent-node-clickable');
      circle.setAttribute('fill', 'rgba(0, 0, 0, 0.4)');
      circle.setAttribute('stroke', `var(--agent-${agent}-primary)`);
      circle.setAttribute('stroke-width', '2');
      circle.style.cursor = 'pointer';

      // Text label (agent name abbreviation)
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('class', 'agent-node-label');
      text.setAttribute('fill', `var(--agent-${agent}-primary)`);
      text.setAttribute('font-size', '10');
      text.setAttribute('font-weight', '700');
      text.setAttribute('pointer-events', 'none');
      text.textContent = agent.substring(0, 1).toUpperCase();

      group.appendChild(circle);
      group.appendChild(text);

      // Click handler
      group.addEventListener('click', function() {
        if (onNodeClick) onNodeClick(agent);
      });

      nodes.appendChild(group);
    });
    svg.appendChild(nodes);

    return svg;
  }

  /**
   * Animate a value change with agent personality — pulse effect
   * Used for KPI/stat updates
   */
  function agentPulse(el, agentName, duration = 320) {
    if (!el) return;
    const personality = AGENT_MOTION[agentName] || AGENT_MOTION.sentinel;

    const anim = el.animate([
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.08)', opacity: 1 },
      { transform: 'scale(1)', opacity: 1 }
    ], {
      duration: duration || personality.duration,
      easing: personality.easing,
      fill: 'none'
    });

    return anim;
  }

  /**
   * Public API — exposed as window.OmegaAgentPersonas
   */
  window.OmegaAgentPersonas = {
    AGENTS: Object.keys(AGENT_MOTION),
    SYMBOLS: AGENT_SYMBOLS,
    MOTION: AGENT_MOTION,

    entrance: agentEntrance,
    greeting: agentGreeting,
    tint: tintAgent,
    pulse: agentPulse,
    constellation: createConstellation,
    colors: getAgentColorTokens,
  };

})();
