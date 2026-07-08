// ============================================================================
// FILE:
// /core/identity/MFAEngine.ts
// ============================================================================

export class MFAEngine{

    verify(

        code:string

    ){

        return code.length===6;

    }

}
