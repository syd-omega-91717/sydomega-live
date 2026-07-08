// ============================================================================
// FILE:
// /enterprise/finance/MultiCurrencyLedger.ts
// ============================================================================

import { LedgerEntry } from "./LedgerEntry";

export class MultiCurrencyLedger{

    private readonly entries:LedgerEntry[]=[];

    record(

        entry:LedgerEntry

    ){

        this.entries.push(entry);

    }

    all(){

        return this.entries;

    }

}
