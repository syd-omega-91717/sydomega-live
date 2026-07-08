// ============================================================================
// FILE:
// /enterprise/healthcare/PACSEngine.ts
// ============================================================================

import { DICOMStudy } from "./DICOMStudy";

export class PACSEngine{

    archive(

        study:DICOMStudy

    ){

        return{

            archived:true,

            study

        };

    }

}
