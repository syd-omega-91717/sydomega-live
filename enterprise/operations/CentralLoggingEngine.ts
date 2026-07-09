// ============================================================================
// FILE:
// /enterprise/operations/CentralLoggingEngine.ts
// ============================================================================

import { LogEntry } from "./LogEntry";

export class CentralLoggingEngine{

    ingest(

        entry:LogEntry

    ){

        return{

            entry,

            indexed:true

        };

    }

}
