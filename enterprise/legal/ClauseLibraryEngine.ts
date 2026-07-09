// ============================================================================
// FILE:
// /enterprise/legal/ClauseLibraryEngine.ts
// ============================================================================

import { Clause } from "./Clause";

export class ClauseLibraryEngine{

    private readonly clauses=

    new Map<string,Clause>();

    add(

        clause:Clause

    ){

        this.clauses.set(

            clause.id,

            clause

        );

    }

    list(){

        return [...this.clauses.values()];

    }

}
