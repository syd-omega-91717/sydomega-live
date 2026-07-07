// ============================================================================
// FILE:
// /core/security/TrafficProtectionShield.ts
// ============================================================================

export class TrafficProtectionShield{

    private requests=0;

    register(){

        this.requests++;

    }

    currentLoad(){

        return this.requests;

    }

}
