// ============================================================================
// FILE:
// /enterprise/finance/TreasuryEngine.ts
// ============================================================================

import { TreasuryAccount } from "./TreasuryAccount";

export class TreasuryEngine{

    private readonly accounts=

    new Map<string,TreasuryAccount>();

    register(

        account:TreasuryAccount

    ){

        this.accounts.set(

            account.id,

            account

        );

    }

    list(){

        return [...this.accounts.values()];

    }

}
