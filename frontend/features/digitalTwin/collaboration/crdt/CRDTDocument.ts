// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/crdt/CRDTDocument.ts
// ============================================================================

export interface CRDTOperation<T>{

    id:string;

    actor:string;

    timestamp:number;

    payload:T;

}

export class CRDTDocument<T>{

    private operations:CRDTOperation<T>[]=[];

    apply(

        operation:CRDTOperation<T>

    ){

        this.operations.push(operation);

        this.operations.sort(

            (a,b)=>a.timestamp-b.timestamp

        );

    }

    history(){

        return [...this.operations];

    }

    latest(){

        return this.operations.at(-1);

    }

}
