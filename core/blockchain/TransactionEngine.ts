// ============================================================================
// FILE:
// /core/blockchain/TransactionEngine.ts
// ============================================================================

import { Transaction } from "./Transaction";

export class TransactionEngine{

    submit(

        transaction:Transaction

    ){

        return{

            ...transaction,

            status:"PENDING"

        };

    }

}
