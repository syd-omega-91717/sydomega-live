(function (global) {
  'use strict';

  var TRUTH = Object.freeze({
    SOURCE:'SOURCE',
    LIVE:'LIVE',
    CALCULATED:'CALCULATED',
    SIMULATED:'SIMULATED',
    USER_CREATED:'USER-CREATED',
    LORE:'LORE',
    UNAVAILABLE:'UNAVAILABLE',
    DESIGN_PROPOSAL:'DESIGN_PROPOSAL',
    IMPLEMENTED:'IMPLEMENTED',
    PARTIAL:'PARTIAL',
    BLOCKED:'BLOCKED',
    UNVERIFIED:'UNVERIFIED'
  });

  var SEVERITY = Object.freeze({
    CRITICAL:'CRITICAL',
    HIGH:'HIGH',
    MEDIUM:'MEDIUM',
    INFO:'INFO'
  });

  function clean(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function finding(severity, code, message, target) {
    return {severity:severity, code:code, message:message, target:clean(target)};
  }

  function audit(snapshot) {
    snapshot = snapshot || {};
    var findings = [];
    var canonical = snapshot.canonicalSystems || {};
    var required = [
      'identity','events','evidence','missions','capabilities',
      'lineage','atlas','objectModel','progression'
    ];

    required.forEach(function (name) {
      if (!canonical[name]) {
        findings.push(finding(SEVERITY.CRITICAL, 'MISSING_CANONICAL_SYSTEM',
          'Canonical system is missing: ' + name, name));
      }
    });

    var truthValues = new Set(Object.keys(TRUTH).map(function (key) {
      return TRUTH[key];
    }));
    (snapshot.objects || []).forEach(function (item) {
      if (!truthValues.has(item.truthState)) {
        findings.push(finding(SEVERITY.HIGH, 'INVALID_TRUTH_STATE',
          'Unknown truth state: ' + item.truthState, item.id));
      }
      if (item.state === 'LIVE' && item.evidenceRequired === true && item.evidencePresent !== true) {
        findings.push(finding(SEVERITY.CRITICAL, 'LIVE_WITHOUT_EVIDENCE',
          'LIVE object requires evidence but has none.', item.id));
      }
      if (['SIMULATED','LORE','DESIGN_PROPOSAL'].indexOf(item.state) !== -1 &&
          item.advertisedAsLive === true) {
        findings.push(finding(SEVERITY.CRITICAL, 'TRUTH_UPGRADE_VIOLATION',
          'Non-production state is advertised as LIVE.', item.id));
      }
      if (item.authority === 'CLIENT_ONLY' && item.protectedAction === true) {
        findings.push(finding(SEVERITY.CRITICAL, 'CLIENT_AUTHORITY_VIOLATION',
          'Protected action is controlled by client-only authority.', item.id));
      }
    });

    var rendererCount = Number(snapshot.webglRendererCount);
    if (Number.isFinite(rendererCount) && rendererCount > 1) {
      findings.push(finding(SEVERITY.CRITICAL, 'MULTIPLE_WEBGL_OWNERS',
        'More than one WebGL renderer is registered.', 'webgl'));
    }

    (snapshot.routes || []).forEach(function (route) {
      if (route.required && route.reachable !== true) {
        findings.push(finding(SEVERITY.HIGH, 'ROUTE_UNREACHABLE',
          'Required route is not verified reachable.', route.path));
      }
      if (route.protected && route.authorizationVerified !== true) {
        findings.push(finding(SEVERITY.CRITICAL, 'AUTHORIZATION_UNVERIFIED',
          'Protected route lacks verified authorization.', route.path));
      }
    });

    (snapshot.capabilities || []).forEach(function (capability) {
      if (capability.enabled === true && capability.authoritativeSystemMissing === true) {
        findings.push(finding(SEVERITY.HIGH, 'ORPHAN_CAPABILITY',
          'Enabled capability has no authoritative backing system.', capability.id));
      }
    });

    (snapshot.providers || []).forEach(function (provider) {
      if (provider.required && provider.healthy !== true) {
        findings.push(finding(SEVERITY.HIGH, 'PROVIDER_UNHEALTHY',
          'Required external provider is unhealthy or unverified.', provider.id));
      }
    });

    return {
      truthState: TRUTH.CALCULATED,
      status: findings.some(function (item) { return item.severity === SEVERITY.CRITICAL; })
        ? 'PROMOTION_BLOCKED'
        : findings.length ? 'REMEDIATION_REQUIRED' : 'ARCHITECTURE_HEALTHY',
      findings: findings,
      summary: {
        critical: findings.filter(function (x) { return x.severity === SEVERITY.CRITICAL; }).length,
        high: findings.filter(function (x) { return x.severity === SEVERITY.HIGH; }).length,
        medium: findings.filter(function (x) { return x.severity === SEVERITY.MEDIUM; }).length,
        info: findings.filter(function (x) { return x.severity === SEVERITY.INFO; }).length
      }
    };
  }

  global.OmegaArchitecturalImmuneSystem = Object.freeze({
    TRUTH: TRUTH,
    SEVERITY: SEVERITY,
    audit: audit
  });
})(typeof window !== 'undefined' ? window : globalThis);
