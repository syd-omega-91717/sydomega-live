// ============================================================================
// FILE: /backend/src/modules/authorization/domain/entities/secret-checkout.ts
// NEW FILE
// ============================================================================

export class SecretCheckout{

    constructor(

        readonly secretId:string,

        readonly principalId:string,

        readonly checkedOutAt:Date,

        readonly returnedAt:Date|null,

        readonly leaseSeconds:number

    ){}

}
