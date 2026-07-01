// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/federated-identity.ts
// NEW FILE
// ============================================================================

export class FederatedIdentity{

    constructor(

        readonly principalId:string,

        readonly providerId:string,

        readonly externalSubject:string,

        readonly linkedAt:Date

    ){}

}
