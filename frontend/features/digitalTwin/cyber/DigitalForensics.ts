// ============================================================================
// FILE:
// /frontend/features/digitalTwin/cyber/DigitalForensics.ts
// ============================================================================

export interface Evidence{

    id:string;

    source:string;

    collected:number;

}

export class DigitalForensics{

    collect(

        source:string

    ):Evidence{

        return{

            id:crypto.randomUUID(),

            source,

            collected:Date.now()

        };

    }

}
