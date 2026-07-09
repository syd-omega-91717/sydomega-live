// ============================================================================
// FILE:
// /enterprise/education/ResearchManagementEngine.ts
// ============================================================================

import { ResearchProject } from "./ResearchProject";

export class ResearchManagementEngine{

    register(

        project:ResearchProject

    ){

        return{

            project,

            registered:true

        };

    }

}
