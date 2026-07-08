// ============================================================================
// FILE:
// /core/blockchain/BlockchainAuditEngine.ts
// ============================================================================

export class BlockchainAuditEngine{

    record(

        action:string

    ){

        return{

            action,

            timestamp:Date.now()

        };

    }

}
