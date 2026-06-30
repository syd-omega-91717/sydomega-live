// ============================================================================
// FILE: /backend/src/modules/identity/application/services/threat-intelligence.service.ts
// NEW FILE
// ============================================================================

export interface ThreatIntelligenceService{

    reputation(

        ipAddress:string

    ):Promise<number>;

}
