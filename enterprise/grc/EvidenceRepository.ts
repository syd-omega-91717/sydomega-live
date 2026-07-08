// ============================================================================
// FILE:
// /enterprise/grc/EvidenceRepository.ts
// ============================================================================

export class EvidenceRepository{

    private readonly evidence=

    new Map<string,string>();

    store(

        id:string,

        uri:string

    ){

        this.evidence.set(

            id,

            uri

        );

    }

    get(

        id:string

    ){

        return this.evidence.get(id);

    }

}
