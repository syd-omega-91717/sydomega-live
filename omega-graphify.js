// Graphify AI: Client-Side Knowledge Graph Visualization Engine
// Force-directed layout + canvas rendering for entity/relationship graph exploration

window.OmegaGraphify = (function() {
  const CONFIG = {
    nodeRadius: 8,
    nodeColor: 'rgba(201, 168, 76, 0.8)',
    nodeHoverColor: 'rgba(201, 168, 76, 1.0)',
    nodeStrokeColor: 'rgba(201, 168, 76, 0.6)',
    edgeColor: 'rgba(0, 229, 255, 0.3)',
    edgeHoverColor: 'rgba(0, 229, 255, 0.8)',
    labelFont: '10px Rajdhani, sans-serif',
    labelColor: '#E0D5B7',
    selectedNodeColor: 'rgba(139, 0, 0, 0.9)',
    forces: {
      repulsion: 150,
      attraction: 0.05,
      dampening: 0.85,
      maxVelocity: 3
    }
  };

  let canvas, ctx, viewport, nodes = [], edges = [], animationId;
  let selectedNode = null, hoveredNode = null, isDragging = false, dragNode = null;

  const Viewport = {
    x: 0,
    y: 0,
    scale: 1,
    minScale: 0.1,
    maxScale: 5,

    toCanvas: (worldX, worldY) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (worldX - Viewport.x) * Viewport.scale + rect.left,
        y: (worldY - Viewport.y) * Viewport.scale + rect.top
      };
    },

    toWorld: (canvasX, canvasY) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (canvasX - rect.left) / Viewport.scale + Viewport.x,
        y: (canvasY - rect.top) / Viewport.scale + Viewport.y
      };
    },

    pan: (dx, dy) => {
      Viewport.x -= dx / Viewport.scale;
      Viewport.y -= dy / Viewport.scale;
    },

    zoom: (factor, centerX, centerY) => {
      const oldScale = Viewport.scale;
      Viewport.scale = Math.max(CONFIG.forces.minScale || 0.1, Math.min(CONFIG.forces.maxScale || 5, Viewport.scale * factor));

      const scaleDiff = 1 - oldScale / Viewport.scale;
      Viewport.x += centerX * scaleDiff;
      Viewport.y += centerY * scaleDiff;
    }
  };

  // Physics simulation for force-directed layout
  const Physics = {
    step: () => {
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

      // Attractive forces (connected nodes pull toward each other)
      edges.forEach(edge => {
        const n1 = nodes.find(n => n.id === edge.source_entity_id);
        const n2 = nodes.find(n => n.id === edge.target_entity_id);
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

  // Canvas rendering
  const Render = {
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
        const n1 = nodes.find(n => n.id === edge.source_entity_id);
        const n2 = nodes.find(n => n.id === edge.target_entity_id);
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

  // Interaction handlers
  const Interaction = {
    getNodeAtPoint: (canvasX, canvasY) => {
      const world = Viewport.toWorld(canvasX, canvasY);
      for (let node of nodes) {
        const dx = node.x - world.x;
        const dy = node.y - world.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.nodeRadius * 1.5) return node;
      }
      return null;
    },

    onMouseDown: (e) => {
      const node = Interaction.getNodeAtPoint(e.clientX, e.clientY);
      if (node) {
        isDragging = true;
        dragNode = node;
        selectedNode = node;
      }
    },

    onMouseMove: (e) => {
      const node = Interaction.getNodeAtPoint(e.clientX, e.clientY);
      hoveredNode = node;

      if (isDragging && dragNode) {
        const world = Viewport.toWorld(e.clientX, e.clientY);
        dragNode.x = world.x;
        dragNode.y = world.y;
        dragNode.vx = 0;
        dragNode.vy = 0;
      } else if (!isDragging && e.buttons === 1) {
        // Pan when middle-dragging or alt-dragging
        const dx = e.movementX || 0;
        const dy = e.movementY || 0;
        Viewport.pan(dx, dy);
      }
    },

    onMouseUp: () => {
      isDragging = false;
      dragNode = null;
    },

    onWheel: (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      Viewport.zoom(factor, e.clientX, e.clientY);
    },

    onTouchStart: (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const node = Interaction.getNodeAtPoint(touch.clientX, touch.clientY);
        if (node) {
          isDragging = true;
          dragNode = node;
          selectedNode = node;
        }
      }
    },

    onTouchMove: (e) => {
      if (e.touches.length === 1 && isDragging && dragNode) {
        const touch = e.touches[0];
        const world = Viewport.toWorld(touch.clientX, touch.clientY);
        dragNode.x = world.x;
        dragNode.y = world.y;
        dragNode.vx = 0;
        dragNode.vy = 0;
      }
    },

    onTouchEnd: () => {
      isDragging = false;
      dragNode = null;
    }
  };

  return {
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

      await this.loadGraph();
      Render.frame();
    },

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

    getSelectedNode: () => selectedNode,
    setSelectedNode: (node) => { selectedNode = node; },
    getNodes: () => nodes,
    getEdges: () => edges,

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
})();
