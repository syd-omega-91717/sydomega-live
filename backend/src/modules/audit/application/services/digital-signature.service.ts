// ============================================================================
// FILE: /backend/src/modules/audit/application/services/digital-signature.service.ts
// NEW FILE
// ============================================================================

import { DigitalSignature }
from "../../domain/entities/digital-signature";

export interface DigitalSignatureService{

    sign(

        documentHash:string

    ):Promise<DigitalSignature>;

    verify(

        signatureId:string

    ):Promise<boolean>;

}
