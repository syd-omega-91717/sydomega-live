(function (global) {
  'use strict';

  var TRUTH = Object.freeze({
    CALCULATED: 'CALCULATED',
    UNKNOWN: 'UNKNOWN',
    BLOCKED: 'BLOCKED'
  });

  function text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function unique(values) {
    return Array.from(new Set((values || []).filter(Boolean)));
  }

  function node(id, type, label, state, meta) {
    return {
      id: text(id),
      type: type,
      label: text(label) || type,
      truthState: state || TRUTH.CALCULATED,
      meta: meta || {}
    };
  }

  function edge(from, to, type) {
    return { from: text(from), to: text(to), type: type };
  }

  function build(input) {
    input = input || {};
    var intentId = text(input.intentId) || 'intent';
    var intent = text(input.intent);
    var authorization = input.authorization || {};
    var capabilities = Array.isArray(input.capabilities) ? input.capabilities : [];
    var services = Array.isArray(input.services) ? input.services : [];
    var tasks = Array.isArray(input.tasks) ? input.tasks : [];
    var evidenceIds = unique(input.evidenceIds || []);
    var risks = Array.isArray(input.risks) ? input.risks : [];
    var costs = Array.isArray(input.costs) ? input.costs : [];
    var outcome = text(input.outcome);

    if (!intent) {
      return {
        truthState: TRUTH.UNKNOWN,
        status: 'INVALID',
        nodes: [],
        edges: [],
        blockers: ['An explicit intent is required.']
      };
    }

    var nodes = [node(intentId, 'INTENT', intent, TRUTH.CALCULATED, {authorizationRequired:true})];
    var edges = [];
    var blockers = [];

    capabilities.forEach(function (cap, index) {
      var id = text(cap.id) || 'capability-' + index;
      nodes.push(node(id, 'CAPABILITY', cap.name || id, cap.enabled === false ? TRUTH.BLOCKED : TRUTH.CALCULATED, cap));
      edges.push(edge(intentId, id, 'REQUIRES'));
      if (cap.enabled === false) blockers.push('Capability disabled: ' + id);
    });

    services.forEach(function (service, index) {
      var id = text(service.id) || 'service-' + index;
      nodes.push(node(id, 'SERVICE', service.name || id, service.state === 'LIVE' ? TRUTH.CALCULATED : TRUTH.UNKNOWN, service));
      edges.push(edge(intentId, id, 'ROUTES_TO'));
    });

    tasks.forEach(function (task, index) {
      var id = text(task.id) || 'task-' + index;
      nodes.push(node(id, 'TASK', task.name || id, task.authorized === false ? TRUTH.BLOCKED : TRUTH.CALCULATED, task));
      edges.push(edge(intentId, id, 'REQUIRES'));
      if (task.authorized === false) blockers.push('Task not authorized: ' + id);
    });

    risks.forEach(function (risk, index) {
      var id = text(risk.id) || 'risk-' + index;
      nodes.push(node(id, 'RISK', risk.name || id, TRUTH.CALCULATED, risk));
      edges.push(edge(intentId, id, 'RISKS'));
    });

    costs.forEach(function (cost, index) {
      var id = text(cost.id) || 'cost-' + index;
      nodes.push(node(id, 'COST', cost.name || id, TRUTH.CALCULATED, cost));
      edges.push(edge(intentId, id, 'COSTS'));
    });

    evidenceIds.forEach(function (id) {
      nodes.push(node(id, 'EVIDENCE', id, TRUTH.CALCULATED, {authoritativeReference:true}));
      edges.push(edge(intentId, id, 'PROVES'));
    });

    if (outcome) {
      nodes.push(node('outcome', 'OUTCOME', outcome, evidenceIds.length ? TRUTH.CALCULATED : TRUTH.UNKNOWN, {
        verified: evidenceIds.length > 0
      }));
      edges.push(edge(intentId, 'outcome', 'PRODUCES'));
      if (!evidenceIds.length) blockers.push('Outcome lacks evidence.');
    }

    if (authorization.canExecute !== true) {
      blockers.push('Execution authority has not been explicitly granted.');
    }

    var blocked = blockers.length > 0;
    return {
      truthState: blocked ? TRUTH.BLOCKED : TRUTH.CALCULATED,
      status: blocked ? 'BLOCKED' : 'READY_FOR_GOVERNED_EXECUTION',
      nodes: nodes,
      edges: edges,
      blockers: unique(blockers),
      canonical: {
        eventRequired: true,
        evidenceRequired: true,
        serverAuthorityRequired: true
      }
    };
  }

  function validate(graph) {
    var problems = [];
    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
      return {valid:false, problems:['Graph structure is invalid.']};
    }

    var ids = new Set();
    graph.nodes.forEach(function (item) {
      if (!item.id) problems.push('Node id is missing.');
      if (ids.has(item.id)) problems.push('Duplicate node id: ' + item.id);
      ids.add(item.id);
    });

    graph.edges.forEach(function (item) {
      if (!ids.has(item.from)) problems.push('Edge source missing: ' + item.from);
      if (!ids.has(item.to)) problems.push('Edge target missing: ' + item.to);
    });

    return {valid: problems.length === 0, problems: problems};
  }

  global.OmegaExecutionGraph = Object.freeze({
    TRUTH: TRUTH,
    build: build,
    validate: validate
  });
})(typeof window !== 'undefined' ? window : globalThis);
