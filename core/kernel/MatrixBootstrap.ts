// ============================================================================
// FILE:
// /core/kernel/MatrixBootstrap.ts
// ============================================================================

import { MatrixRegistry } from "./MatrixRegistry";
import { MatrixRuntime } from "./MatrixRuntime";

export class MatrixBootstrap{

    constructor(

        private registry:MatrixRegistry,

        private runtime:MatrixRuntime

    ){}

    async initialize(){

        console.log(

            "Ω Foundation Kernel initialized"

        );

    }

}
