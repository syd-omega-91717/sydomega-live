// ============================================================================
// FILE:
// /enterprise/knowledge/OntologyEngine.ts
// ============================================================================

import { Ontology } from "./Ontology";

export class OntologyEngine{

    register(

        ontology:Ontology

    ){

        return{

            ontology,

            loaded:true

        };

    }

}
