// ============================================================================
// FILE: /backend/src/modules/compliance/application/services/compliance-monitor.service.ts
// NEW FILE
// ============================================================================

export interface ComplianceMonitorService{

    monitor():Promise<void>;

    detectDrift():Promise<void>;

    refreshEvidence():Promise<void>;

}
