(function (global) {
  'use strict';

  var TRUTH = Object.freeze({
    CALCULATED: 'CALCULATED',
    LIVE: 'LIVE',
    UNKNOWN: 'UNKNOWN',
    BLOCKED: 'BLOCKED'
  });

  var ACTIONS = Object.freeze({
    SEARCH: 'search',
    REVIEW: 'review',
    EXECUTE: 'execute',
    VERIFY: 'verify',
    PUBLISH: 'publish'
  });

  function clean(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function unique(values) {
    return Array.from(new Set((values || []).filter(Boolean)));
  }

  function compileIntent(input) {
    input = input || {};
    var goal = clean(input.goal);
    var capabilities = Array.isArray(input.capabilities) ? input.capabilities : [];
    var authorization = input.authorization || {};
    var constraints = Array.isArray(input.constraints) ? input.constraints : [];

    if (!goal) {
      return {
        truthState: TRUTH.UNKNOWN,
        status: 'INVALID',
        plan: [],
        risk: 'HIGH',
        blockedReasons: ['A non-empty goal is required.']
      };
    }

    var protectedWords = /payment|transfer|purchase|delete|admin|permission|identity|mint|ownership|legal|publish/i;
    var protectedGoal = protectedWords.test(goal);
    var canExecute = authorization.canExecute === true;
    var executableCapability = capabilities.some(function (capability) {
      return capability && capability.action === ACTIONS.EXECUTE && capability.enabled === true;
    });

    var plan = [
      { step: 1, action: ACTIONS.SEARCH, truthState: TRUTH.CALCULATED },
      { step: 2, action: ACTIONS.REVIEW, truthState: TRUTH.CALCULATED },
      { step: 3, action: ACTIONS.VERIFY, truthState: TRUTH.CALCULATED }
    ];

    var blockedReasons = [];
    if (protectedGoal && !canExecute) {
      blockedReasons.push('Protected intent requires explicit authorization.');
    }
    if (protectedGoal && !executableCapability) {
      blockedReasons.push('No enabled execution capability is present.');
    }

    if (blockedReasons.length === 0) {
      plan.push({
        step: 4,
        action: ACTIONS.EXECUTE,
        truthState: TRUTH.CALCULATED,
        requiresServerAuthority: protectedGoal
      });
      plan.push({ step: 5, action: ACTIONS.VERIFY, truthState: TRUTH.CALCULATED });
    }

    return {
      truthState: TRUTH.CALCULATED,
      status: blockedReasons.length ? 'BLOCKED' : 'READY_FOR_AUTHORIZED_RUNTIME',
      goal: goal,
      constraints: constraints,
      plan: plan,
      risk: protectedGoal ? 'HIGH' : 'STANDARD',
      blockedReasons: blockedReasons
    };
  }

  function deriveCityState(cityId, events, services, missions) {
    var city = clean(cityId);
    var cityEvents = (events || []).filter(function (event) {
      return event && event.cityId === city;
    });
    var serviceList = (services || []).filter(function (service) {
      return service && service.cityId === city;
    });
    var missionList = (missions || []).filter(function (mission) {
      return mission && mission.cityId === city;
    });

    var completed = cityEvents.filter(function (event) {
      return event.type === 'action_completed';
    }).length;
    var failed = cityEvents.filter(function (event) {
      return event.type === 'action_failed';
    }).length;

    return {
      cityId: city,
      truthState: city ? TRUTH.CALCULATED : TRUTH.UNKNOWN,
      eventDensity: cityEvents.length,
      serviceHealth: serviceList.map(function (service) {
        var relevant = cityEvents.filter(function (event) {
          return event.serviceId === service.id;
        });
        var failures = relevant.filter(function (event) {
          return event.type === 'action_failed';
        }).length;
        return {
          serviceId: service.id,
          state: failures ? 'DEGRADED' : 'OBSERVED',
          evidenceEventCount: relevant.length
        };
      }),
      missionFlow: {
        total: missionList.length,
        completedEvents: completed,
        failedEvents: failed
      },
      note: 'No population, revenue, occupancy or other unobserved city statistic is inferred.'
    };
  }

  function createLearningRecord(attempt, failure, evidence) {
    var reason = clean(failure && failure.reason);
    return {
      type: 'workflow_learning',
      truthState: TRUTH.CALCULATED,
      attemptId: clean(attempt && attempt.id),
      failureReason: reason || 'UNSPECIFIED',
      evidenceIds: unique(evidence || []),
      missingCapability: clean(failure && failure.missingCapability) || null,
      retryPolicy: reason ? 'REVIEW_BEFORE_RETRY' : 'NO_AUTOMATIC_RETRY',
      requiresHumanReview: true
    };
  }

  async function createContinuityCheckpoint(sequence, stateDigest, eventIds) {
    var payload = JSON.stringify({
      sequence: Number(sequence) || 0,
      stateDigest: clean(stateDigest),
      eventIds: unique(eventIds)
    });

    if (!global.crypto || !global.crypto.subtle || typeof TextEncoder === 'undefined') {
      return {
        truthState: TRUTH.UNKNOWN,
        status: 'UNAVAILABLE',
        reason: 'Web Crypto API unavailable.'
      };
    }

    var bytes = new TextEncoder().encode(payload);
    var hash = await global.crypto.subtle.digest('SHA-256', bytes);
    var hex = Array.from(new Uint8Array(hash)).map(function (byte) {
      return byte.toString(16).padStart(2, '0');
    }).join('');

    return {
      truthState: TRUTH.CALCULATED,
      status: 'CHECKPOINT_CREATED',
      sequence: Number(sequence) || 0,
      stateDigest: clean(stateDigest),
      eventIds: unique(eventIds),
      checkpointHash: hex
    };
  }

  function rankOpportunities(signals, constraints) {
    var blocked = (constraints || []).map(clean).filter(Boolean);
    return (signals || [])
      .filter(function (signal) { return signal && clean(signal.id); })
      .map(function (signal) {
        var evidence = Array.isArray(signal.evidenceIds) ? signal.evidenceIds : [];
        var score = Number(signal.score);
        if (!Number.isFinite(score)) score = 0;
        var blockedByConstraint = blocked.some(function (constraint) {
          return clean(signal.category).toLowerCase() === constraint.toLowerCase();
        });
        return {
          id: clean(signal.id),
          category: clean(signal.category) || 'unknown',
          score: blockedByConstraint ? 0 : Math.max(0, Math.min(100, score)),
          confidence: evidence.length ? 'EVIDENCE_BACKED' : 'LOW_EVIDENCE',
          evidenceIds: unique(evidence),
          truthState: evidence.length ? TRUTH.CALCULATED : TRUTH.UNKNOWN,
          blocked: blockedByConstraint
        };
      })
      .sort(function (a, b) { return b.score - a.score; });
  }

  global.OmegaExecutionOS = Object.freeze({
    TRUTH: TRUTH,
    ACTIONS: ACTIONS,
    compileIntent: compileIntent,
    deriveCityState: deriveCityState,
    createLearningRecord: createLearningRecord,
    createContinuityCheckpoint: createContinuityCheckpoint,
    rankOpportunities: rankOpportunities
  });
})(typeof window !== 'undefined' ? window : globalThis);
