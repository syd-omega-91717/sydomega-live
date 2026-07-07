// ============================================================================
// FILE:
// /core/security/IntegrityVerificationEngine.ts
// ============================================================================

export class IntegrityVerificationEngine{

    verify(

        hash:string,

        expected:string

    ){

        return hash===expected;

    }

}
