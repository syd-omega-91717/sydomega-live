// ============================================================================
// FILE: /backend/src/modules/authorization/application/commands/checkout-secret.command.ts
// NEW FILE
// ============================================================================

export class CheckoutSecretCommand{

    constructor(

        readonly secretId:string,

        readonly principalId:string,

        readonly leaseSeconds:number

    ){}

}
