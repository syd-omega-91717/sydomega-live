(function (root) {
  "use strict";
  var TRUTH_STATES = new Set(["LIVE","CALCULATED","SIMULATED","USER_CREATED","LORE","UNAVAILABLE","UNVERIFIED","BLOCKED"]);
  var REQUIRED_DATASET = ["datasetId","providerId","license","attribution","schemaVersion","retrievedAt","expiresAt","contentHash","truthState"];
  var REQUIRED_RECORD = ["recordId","datasetId","observedAt","sourceUri","contentHash"];
  function nonEmpty(v) { return typeof v === "string" && v.trim().length > 0; }
  function validTime(v) { return nonEmpty(v) && Number.isFinite(Date.parse(v)); }
  function validateDataset(dataset, now) {
    var errors = [];
    var currentTime = now instanceof Date ? now.getTime() : (Number.isFinite(now) ? now : Date.now());
    if (!dataset || typeof dataset !== "object" || Array.isArray(dataset)) return {ok:false,state:"BLOCKED",errors:["dataset_not_object"]};
    REQUIRED_DATASET.forEach(function (k) { if (!nonEmpty(dataset[k])) errors.push("missing_" + k); });
    if (dataset.truthState && !TRUTH_STATES.has(dataset.truthState)) errors.push("invalid_truth_state");
    if (dataset.retrievedAt && !validTime(dataset.retrievedAt)) errors.push("invalid_retrieved_at");
    if (dataset.expiresAt && !validTime(dataset.expiresAt)) errors.push("invalid_expires_at");
    if (validTime(dataset.retrievedAt) && validTime(dataset.expiresAt) && Date.parse(dataset.expiresAt) <= Date.parse(dataset.retrievedAt)) errors.push("expiry_not_after_retrieval");
    if (errors.length) return {ok:false,state:"BLOCKED",errors:errors};
    if (Date.parse(dataset.expiresAt) <= currentTime) return {ok:false,state:"UNAVAILABLE",errors:["dataset_stale"]};
    if (dataset.truthState !== "LIVE" && dataset.truthState !== "CALCULATED") return {ok:false,state:dataset.truthState,errors:["truth_state_not_publishable_as_live"]};
    return {ok:true,state:dataset.truthState,errors:[]};
  }
  function validateRecord(record, dataset, now) {
    var errors = [];
    if (!record || typeof record !== "object" || Array.isArray(record)) return {ok:false,state:"BLOCKED",errors:["record_not_object"]};
    REQUIRED_RECORD.forEach(function (k) { if (!nonEmpty(record[k])) errors.push("missing_" + k); });
    if (dataset && record.datasetId !== dataset.datasetId) errors.push("dataset_id_mismatch");
    if (record.observedAt && !validTime(record.observedAt)) errors.push("invalid_observed_at");
    if (record.sourceUri && !/^https:\/\//i.test(record.sourceUri)) errors.push("source_uri_must_be_https");
    var result = validateDataset(dataset, now);
    if (!result.ok) errors.push.apply(errors, result.errors);
    return {ok:errors.length===0,state:errors.length ? (result.state==="UNAVAILABLE" ? "UNAVAILABLE" : "BLOCKED") : result.state,errors:errors};
  }
  function idempotencyKey(datasetId, recordId, contentHash) {
    if (![datasetId,recordId,contentHash].every(nonEmpty)) return null;
    return [datasetId.trim(),recordId.trim(),contentHash.trim()].join(":");
  }
  var api = Object.freeze({TRUTH_STATES:TRUTH_STATES,validateDataset:validateDataset,validateRecord:validateRecord,idempotencyKey:idempotencyKey});
  root.OmegaDataIngestionContract = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
