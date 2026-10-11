(function (global) {
  "use strict";

  var TRUTH = Object.freeze({
    PROTOCOL_CAPABILITY: "PROTOCOL_CAPABILITY",
    STANDARDS_BASED_DESIGN: "STANDARDS_BASED_DESIGN",
    CALCULATED: "CALCULATED",
    BLOCKED: "BLOCKED"
  });

  function text(value, fallback) {
    return value === undefined || value === null ? fallback : String(value);
  }

  function validateAdapterRequest(input) {
    input = input || {};
    var blockers = [];
    if (input.identityVerified !== true) blockers.push("identity not verified");
    if (input.authorizationVerified !== true) blockers.push("authorization not verified");
    if (input.scopeGranted !== true) blockers.push("scope not granted");
    if (input.capabilityRegistered !== true) blockers.push("capability not registered");
    return {
      truth: TRUTH.CALCULATED,
      state: blockers.length === 0 ? "READY" : TRUTH.BLOCKED,
      allowed: blockers.length === 0,
      protocol: text(input.protocol, "unknown"),
      blockers: blockers
    };
  }

  function validateCredential(input) {
    input = input || {};
    var blockers = [];
    if (input.issuerVerified !== true) blockers.push("issuer not verified");
    if (input.subjectVerified !== true) blockers.push("subject not verified");
    if (input.signatureVerified !== true) blockers.push("signature not verified");
    if (input.purposeAllowed !== true) blockers.push("credential purpose not authorized");
    if (input.revocationChecked !== true) blockers.push("credential status not checked");
    return {
      truth: TRUTH.CALCULATED,
      state: blockers.length === 0 ? "VERIFIED" : TRUTH.BLOCKED,
      allowed: blockers.length === 0,
      blockers: blockers
    };
  }

  function validateTelemetry(input) {
    input = input || {};
    var blockers = [];
    if (input.deviceIdentityVerified !== true) blockers.push("device identity not verified");
    if (input.channelAuthorized !== true) blockers.push("telemetry channel not authorized");
    if (input.encrypted !== true) blockers.push("secure transport not verified");
    if (input.freshnessVerified !== true) blockers.push("telemetry freshness not verified");
    return {
      truth: TRUTH.CALCULATED,
      state: blockers.length === 0 ? "OBSERVED" : TRUTH.BLOCKED,
      allowed: blockers.length === 0,
      blockers: blockers
    };
  }

  function validateSpatialState(input) {
    input = input || {};
    var blockers = [];
    if (input.sourceVerified !== true) blockers.push("spatial source not verified");
    if (input.timestampVerified !== true) blockers.push("timestamp not verified");
    if (input.coordinateReferenceVerified !== true) blockers.push("coordinate reference not verified");
    if (input.simulation === true && input.simulationLabel !== true) blockers.push("simulation is not visibly labelled");
    return {
      truth: TRUTH.CALCULATED,
      state: blockers.length === 0 ? (input.simulation === true ? "SIMULATED" : "OBSERVED") : TRUTH.BLOCKED,
      allowed: blockers.length === 0,
      blockers: blockers
    };
  }

  global.OmegaInteroperabilityFabric = Object.freeze({
    TRUTH: TRUTH,
    validateAdapterRequest: validateAdapterRequest,
    validateCredential: validateCredential,
    validateTelemetry: validateTelemetry,
    validateSpatialState: validateSpatialState
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
