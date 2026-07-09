// ============================================================================
// FILE:
// /enterprise/finance/CoreBankingEngine.ts
// ============================================================================

import { BankAccount } from "./BankAccount";

export class CoreBankingEngine{

    open(

        account:BankAccount

    ){

        return{

            account,

            opened:true

        };

    }

}
