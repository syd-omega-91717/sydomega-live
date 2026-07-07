// ============================================================================
// FILE:
// /core/kernel/MatrixRuntime.ts
// ============================================================================

import { MatrixContext } from "./MatrixContext";

export class MatrixRuntime{

    private context?:MatrixContext;

    activate(

        context:MatrixContext

    ){

        this.context=context;

    }

    current(){

        return this.context;

    }

}
