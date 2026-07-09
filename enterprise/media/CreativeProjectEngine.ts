// ============================================================================
// FILE:
// /enterprise/media/CreativeProjectEngine.ts
// ============================================================================

import { CreativeProject } from "./CreativeProject";

export class CreativeProjectEngine{

    manage(

        project:CreativeProject

    ){

        return{

            project,

            managed:true

        };

    }

}
