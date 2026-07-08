// ============================================================================
// FILE:
// /enterprise/education/ResearchRepository.ts
// ============================================================================

import { ResearchPublication } from "./ResearchPublication";

export class ResearchRepository{

    private readonly publications=

    new Map<string,ResearchPublication>();

    store(

        publication:ResearchPublication

    ){

        this.publications.set(

            publication.id,

            publication

        );

    }

}
