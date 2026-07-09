// ============================================================================
// FILE:
// /enterprise/api/DeveloperWorkspaceEngine.ts
// ============================================================================

import { DeveloperApplication } from "./DeveloperApplication";

export class DeveloperWorkspaceEngine{

    provision(

        app:DeveloperApplication

    ){

        return{

            app,

            ready:true

        };

    }

}
