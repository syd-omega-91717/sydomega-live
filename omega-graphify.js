/**
 * Graphify AI: Client-Side Knowledge Graph Visualization Engine
 * Force-directed layout + canvas rendering for entity/relationship graph exploration
 *
 * @module OmegaGraphify
 * @exports {Object} OmegaGraphify - Public API for graph visualization
 */

window.OmegaGraphify = (function() {
  /** @type {{nodeRadius: number, nodeColor: string, nodeHoverColor: string, nodeStrokeColor: string, edgeColor: string, edgeHoverColor: string, labelFont: string, labelColor: string, selectedNodeColor: string, forces: {repulsion: number, attraction: number, dampening: number, maxVelocity: number}}} */
  const CONFIG = {
    // Node rendering (pixels)
    nodeRadius: 8,
    nodeColor: 'rgba(201, 168, 76, 0.8)',
    nodeHoverColor: 'rgba(201, 168, 76, 1.0)',
    nodeStrokeColor: 'rgba(201, 168, 76, 0.6)',

    // Edge rendering
    edgeColor: 'rgba(0, 229, 255, 0.3)',
    edgeHoverColor: 'rgba(0, 229, 255, 0.8)',

    // Text rendering
    labelFont: '10px Rajdhani, sans-serif',
    labelColor: '#E0D5B7',

    // Selection state
    selectedNodeColor: 'rgba(139, 0, 0, 0.9)',

    // Physics simulation parameters (unitless ratios and scalar forces)
    forces: {
      repulsion: 150,        // repulsive force magnitude
      attraction: 0.05,      // spring force coefficient
      dampening: 0.85,       // velocity decay per frame
      maxVelocity: 3         // pixels per frame cap
    }
  };

  /** @type {HTMLCanvasElement|null} */
  let canvas = null;
  /** @type {CanvasRenderingContext2D|null} */
  let ctx = null;
  /** @type {Object} viewport - Camera position and zoom */
  let viewport = null;
  /** @type {Array<Object>} nodes - Graph entity nodes with position/velocity */
  let nodes = [];
  /** @type {Array<Object>} edges - Relationship edges between nodes */
  let edges = [];
  /** @type {number|null} animationId - requestAnimationFrame handle */
  let animationId = null;

  /** @type {Object|null} selectedNode - Currently selected node for inspection */
  let selectedNode = null;
  /** @type {Object|null} hoveredNode - Currently hovered node for highlight */
  let hoveredNode = null;
  /** @type {boolean} isDragging - Mouse/touch drag active flag */
  let isDragging = false;
  /** @type {Object|null} dragNode - Node currently being dragged */
  let dragNode = null;

  /**
   * Camera viewport: world-space position and zoom level
   * @type {{x: number, y: number, scale: number, minScale: number, maxScale: number, toCanvas: Function, toWorld: Function, pan: Function, zoom: Function}}
   */
  const Viewport = {
    x: 0,
    y: 0,
    scale: 1,
    minScale: 0.1,
    maxScale: 5,

    /**
     * Convert world coordinates to canvas screen coordinates
     * @param {number} worldX - World-space X
     * @param {number} worldY - World-space Y
     * @returns {{x: number, y: number}} Screen-space coordinates
     */
    toCanvas: (worldX, worldY) => {
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (worldX - Viewport.x) * Viewport.scale + rect.left,
        y: (worldY - Viewport.y) * Viewport.scale + rect.top
      };
    },

    /**
     * Convert canvas screen coordinates to world coordinates
     * @param {number} canvasX - Screen-space X
     * @param {number} canvasY - Screen-space Y
     * @returns {{x: number, y: number}} World-space coordinates
     */
    toWorld: (canvasX, canvasY) => {
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (canvasX - rect.left) / Viewport.scale + Viewport.x,
        y: (canvasY - rect.top) / Viewport.scale + Viewport.y
      };
    },

    /**
     * Pan viewport by delta (in screen pixels)
     * @param {number} dx - Screen-space X delta
     * @param {number} dy - Screen-space Y delta
     */
    pan: (dx, dy) => {
      Viewport.x -= dx / Viewport.scale;
      Viewport.y -= dy / Viewport.scale;
    },

    /**
     * Zoom viewport with center preservation
     * @param {number} factor - Zoom multiplier (>1 zoom in, <1 zoom out)
     * @param {number} centerX - Screen-space zoom center X
     * @param {number} centerY - Screen-space zoom center Y
     */
    zoom: (factor, centerX, centerY) => {
      const oldScale = Viewport.scale;
      Viewport.scale = Math.max(
        Viewport.minScale,
        Math.min(Viewport.maxScale, Viewport.scale * factor)
      );

      const scaleDiff = 1 - oldScale / Viewport.scale;
      Viewport.x += centerX * scaleDiff;
      Viewport.y += centerY * scaleDiff;
    }
  };

  /**
   * Physics simulation: force-directed layout with repulsion and attraction
   * @type {{step: Function}}
   */
  const Physics = {
    /**
     * Single physics simulation step: repulsive forces, attractive forces, velocity dampening, position update
     * @returns {void}
     */
    step: () => {
      if (nodes.length === 0) return;

      // Repulsive forces (nodes push each other apart)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = CONFIG.forces.repulsion / (dist * dist);

          nodes[i].vx -= (dx / dist) * force;
          nodes[i].vy -= (dy / dist) * force;
          nodes[j].vx += (dx / dist) * force;
          nodes[j].vy += (dy / dist) * force;
        }
      }

      // Attractive forces (connected nodes pull toward each other, spring-like)
      edges.forEach(edge => {
        if (!edge) return;
        const n1 = nodes.find(n => n?.id === edge.source_entity_id);
        const n2 = nodes.find(n => n?.id === edge.target_entity_id);
        if (!n1 || !n2) return;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = CONFIG.forces.attraction * dist;

        n1.vx += (dx / dist) * force;
        n1.vy += (dy / dist) * force;
        n2.vx -= (dx / dist) * force;
        n2.vy -= (dy / dist) * force;
      });

      // Update positions with dampening
      nodes.forEach(node => {
        if (node === dragNode) return; // Don't move dragged nodes

        node.vx *= CONFIG.forces.dampening;
        node.vy *= CONFIG.forces.dampening;

        const vel = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (vel > CONFIG.forces.maxVelocity) {
          const scale = CONFIG.forces.maxVelocity / vel;
          node.vx *= scale;
          node.vy *= scale;
        }

        node.x += node.vx;
        node.y += node.vy;
      });
    }
  };

  /**
   * Canvas rendering engine with viewport transformation and physics integration
   * @type {{frame: Function}}
   */
  const Render = {
    /**
     * Render a single animation frame: clear canvas, transform viewport, draw edges, draw nodes, update physics
     * Calls Physics.step() and requestAnimationFrame recursively
     * @returns {void}
     */
    frame: () => {
      if (!canvas || !ctx) return;

      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = 'rgba(10, 10, 15, 0.5)';
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.save();
      ctx.translate(-Viewport.x * Viewport.scale, -Viewport.y * Viewport.scale);
      ctx.scale(Viewport.scale, Viewport.scale);

      // Render edges first (so they appear behind nodes)
      edges.forEach(edge => {
        if (!edge) return;
        const n1 = nodes.find(n => n?.id === edge.source_entity_id);
        const n2 = nodes.find(n => n?.id === edge.target_entity_id);
        if (!n1 || !n2) return;

        const isHovered = hoveredNode === n1 || hoveredNode === n2;
        ctx.strokeStyle = isHovered ? CONFIG.edgeHoverColor : CONFIG.edgeColor;
        ctx.lineWidth = isHovered ? 2 : 1;

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();

        // Draw arrowhead for directed edges
        const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
        const headlen = 15;
        const arrowX = n2.x - headlen * Math.cos(angle);
        const arrowY = n2.y - headlen * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(arrowX - 6 * Math.cos(angle - Math.PI / 6), arrowY - 6 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 6 * Math.cos(angle + Math.PI / 6), arrowY - 6 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      });

      // Render nodes
      nodes.forEach(node => {
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoveredNode && hoveredNode.id === node.id;

        const color = isSelected ? CONFIG.selectedNodeColor : (isHovered ? CONFIG.nodeHoverColor : CONFIG.nodeColor);
        ctx.fillStyle = color;
        ctx.strokeStyle = CONFIG.nodeStrokeColor;
        ctx.lineWidth = isSelected ? 3 : 2;

        ctx.beginPath();
        ctx.arc(node.x, node.y, CONFIG.nodeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Render label
        ctx.fillStyle = CONFIG.labelColor;
        ctx.font = CONFIG.labelFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.display_name || node.canonical_name, node.x, node.y + CONFIG.nodeRadius + 4);
      });

      ctx.restore();

      Physics.step();
      animationId = requestAnimationFrame(Render.frame);
    }
  };

  /**
   * Mouse and touch event handlers for graph interaction (selection, dragging, panning, zooming)
   * @type {{getNodeAtPoint: Function, onMouseDown: Function, onMouseMove: Function, onMouseUp: Function, onWheel: Function, onTouchStart: Function, onTouchMove: Function, onTouchEnd: Function}}
   */
  const Interaction = {
    /**
     * Find node at screen coordinates (with hit-area radius = nodeRadius * 1.5)
     * @param {number} canvasX - Screen-space X coordinate
     * @param {number} canvasY - Screen-space Y coordinate
     * @returns {Object|null} Node if found, null otherwise
     */
    getNodeAtPoint: (canvasX, canvasY) => {
      if (!nodes || nodes.length === 0) return null;
      const world = Viewport.toWorld(canvasX, canvasY);
      for (let node of nodes) {
        if (!node) continue;
        const dx = node.x - world.x;
        const dy = node.y - world.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.nodeRadius * 1.5) return node;
      }
      return null;
    },

    /**
     * Mouse down: select and start dragging a node
     * @param {MouseEvent} e
     * @returns {void}
     */
    onMouseDown: (e) => {
      const node = Interaction.getNodeAtPoint(e?.clientX, e?.clientY);
      if (node) {
        isDragging = true;
        dragNode = node;
        selectedNode = node;
      }
    },

    /**
     * Mouse move: update hover, drag selected node, or pan viewport
     * @param {MouseEvent} e
     * @returns {void}
     */
    onMouseMove: (e) => {
      if (!e) return;
      const node = Interaction.getNodeAtPoint(e.clientX, e.clientY);
      hoveredNode = node;

      if (isDragging && dragNode) {
        const world = Viewport.toWorld(e.clientX, e.clientY);
        dragNode.x = world.x;
        dragNode.y = world.y;
        dragNode.vx = 0;
        dragNode.vy = 0;
      } else if (!isDragging && e.buttons === 1) {
        // Pan when left-button-drag without a node selected
        const dx = e.movementX || 0;
        const dy = e.movementY || 0;
        Viewport.pan(dx, dy);
      }
    },

    /**
     * Mouse up: stop dragging
     * @returns {void}
     */
    onMouseUp: () => {
      isDragging = false;
      dragNode = null;
    },

    /**
     * Mouse wheel: zoom viewport with center preservation
     * @param {WheelEvent} e
     * @returns {void}
     */
    onWheel: (e) => {
      if (!e) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      Viewport.zoom(factor, e.clientX, e.clientY);
    },

    /**
     * Touch start: select and start dragging a node (single-touch only)
     * @param {TouchEvent} e
     * @returns {void}
     */
    onTouchStart: (e) => {
      if (!e || !e.touches || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const node = Interaction.getNodeAtPoint(touch?.clientX, touch?.clientY);
      if (node) {
        isDragging = true;
        dragNode = node;
        selectedNode = node;
      }
    },

    /**
     * Touch move: drag selected node (single-touch only)
     * @param {TouchEvent} e
     * @returns {void}
     */
    onTouchMove: (e) => {
      if (!e || !e.touches || e.touches.length !== 1 || !isDragging || !dragNode) return;
      const touch = e.touches[0];
      const world = Viewport.toWorld(touch?.clientX, touch?.clientY);
      dragNode.x = world.x;
      dragNode.y = world.y;
      dragNode.vx = 0;
      dragNode.vy = 0;
    },

    /**
     * Touch end: stop dragging
     * @returns {void}
     */
    onTouchEnd: () => {
      isDragging = false;
      dragNode = null;
    }
  };

  /* Named so the public methods can call each other. Every method here is an
     ARROW function, so `this` is not the object literal -- it is the enclosing
     IIFE's `this`, i.e. window in a classic script. init() called
     `this.loadGraph()`, which resolved to window.loadGraph (undefined) and
     threw "this.loadGraph is not a function" on every graphify.html load,
     aborting init() before Render.frame() and leaving the graph canvas blank. */
  const API = {
    /**
     * Initialize graph visualization: attach canvas, setup event listeners, load data, start animation loop
     * @param {HTMLCanvasElement} canvasEl - Canvas element for rendering
     * @returns {Promise<void>}
     */
    init: async (canvasEl) => {
      canvas = canvasEl;
      if (!canvas) return;

      ctx = canvas.getContext('2d');
      canvas.addEventListener('mousedown', Interaction.onMouseDown);
      canvas.addEventListener('mousemove', Interaction.onMouseMove);
      canvas.addEventListener('mouseup', Interaction.onMouseUp);
      canvas.addEventListener('wheel', Interaction.onWheel, { passive: false });
      canvas.addEventListener('touchstart', Interaction.onTouchStart);
      canvas.addEventListener('touchmove', Interaction.onTouchMove);
      canvas.addEventListener('touchend', Interaction.onTouchEnd);

      await API.loadGraph();
      Render.frame();
    },

    /**
     * Load graph data from Supabase: graph_entities and graph_relationships tables
     * Initializes node positions randomly, edges from relationship data
     * @returns {Promise<void>}
     */
    loadGraph: async () => {
      try {
        const sb = window.OmegaSupabase?.sb;
        if (!sb) {
          console.warn('Supabase client not ready');
          return;
        }

        const [entitiesRes, relationshipsRes] = await Promise.all([
          sb.from('graph_entities').select('*'),
          sb.from('graph_relationships').select('*')
        ]);

        if (entitiesRes.error) throw entitiesRes.error;
        if (relationshipsRes.error) throw relationshipsRes.error;

        nodes = (entitiesRes.data || []).map((e, i) => ({
          ...e,
          x: (Math.random() - 0.5) * 400,
          y: (Math.random() - 0.5) * 400,
          vx: 0,
          vy: 0
        }));

        edges = relationshipsRes.data || [];
      } catch (err) {
        console.error('Failed to load graph:', err);
      }
    },

    /**
     * Get currently selected node
     * @returns {Object|null}
     */
    getSelectedNode: () => selectedNode,

    /**
     * Set selected node
     * @param {Object|null} node
     * @returns {void}
     */
    setSelectedNode: (node) => { selectedNode = node; },

    /**
     * Get all nodes in the graph
     * @returns {Array<Object>}
     */
    getNodes: () => nodes,

    /**
     * Get all edges (relationships) in the graph
     * @returns {Array<Object>}
     */
    getEdges: () => edges,

    /**
     * Cleanup: cancel animation, remove event listeners
     * @returns {void}
     */
    destroy: () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (canvas) {
        canvas.removeEventListener('mousedown', Interaction.onMouseDown);
        canvas.removeEventListener('mousemove', Interaction.onMouseMove);
        canvas.removeEventListener('mouseup', Interaction.onMouseUp);
        canvas.removeEventListener('wheel', Interaction.onWheel);
        canvas.removeEventListener('touchstart', Interaction.onTouchStart);
        canvas.removeEventListener('touchmove', Interaction.onTouchMove);
        canvas.removeEventListener('touchend', Interaction.onTouchEnd);
      }
    }
  };

  return API;
})();
